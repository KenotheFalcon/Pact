'use client';

import { Search, MapPin, Filter } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import type { ListingFilters } from '@/types/database';

interface ListingFiltersProps {
    onFilterChange: (filters: ListingFilters) => void;
    userLocation?: { latitude: number; longitude: number } | null;
}

const categories = [
    'vegetables',
    'fruits',
    'grains',
    'dairy',
    'poultry',
    'livestock',
    'other',
];

export function ListingFilters({ onFilterChange, userLocation }: ListingFiltersProps) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [priceRange, setPriceRange] = useState([0, 100]);
    const [radius, setRadius] = useState(50);
    const [organicOnly, setOrganicOnly] = useState(false);
    const [sortBy, setSortBy] = useState<ListingFilters['sortBy']>('created_at');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [, startTransition] = useTransition();

    const handleApplyFilters = () => {
        const filters: ListingFilters = {
            search: search || undefined,
            category: category || undefined,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            organic: organicOnly || undefined,
            sortBy,
            sortOrder: 'desc',
            ...(userLocation && {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                radius,
            }),
        };

        onFilterChange(filters);
        setShowMobileFilters(false);
    };

    const handleReset = () => {
        startTransition(() => {
            setSearch('');
            setCategory(null);
            setPriceRange([0, 100]);
            setRadius(50);
            setOrganicOnly(false);
            setSortBy('created_at');
            onFilterChange({});
        });
    };

    const activeFilterCount = [
        search,
        category,
        organicOnly,
        priceRange[0] > 0 || priceRange[1] < 100,
    ].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Search Bar - Always Visible */}
            <div className="flex gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-pact-green transition-colors" />
                    <Input
                        type="text"
                        placeholder="Search listings…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                        className="pl-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-pact-green focus:border-pact-green transition-all shadow-sm rounded-xl"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="md:hidden h-12 px-4 border-zinc-200 dark:border-zinc-800 rounded-xl"
                >
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                        <Badge className="ml-2 bg-pact-green h-5 px-1.5">{activeFilterCount}</Badge>
                    )}
                </Button>
                <Button
                    onClick={handleApplyFilters}
                    className="hidden md:flex h-12 px-6 bg-pact-green hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-pact-green/20 transition-all hover:scale-105"
                >
                    Search
                </Button>
            </div>

            {/* Desktop Sidebar / Mobile Drawer */}
            <div className={cn(
                "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all",
                showMobileFilters ? "block" : "hidden md:block"
            )}>
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Filter className="w-4 h-4 text-pact-green" />
                        Filters
                    </h3>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-8">
                            Reset
                        </Button>
                    )}
                </div>

                <div className="p-4 space-y-6">
                    {/* Categories - Tags */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Categories</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => setCategory(null)}
                                size="sm"
                                variant={!category ? 'default' : 'outline'}
                                className={cn("rounded-full text-xs", !category ? 'bg-pact-green border-pact-green' : '')}
                            >
                                All
                            </Button>
                            {categories.map((cat) => (
                                <Button
                                    key={cat}
                                    onClick={() => setCategory(category === cat ? null : cat)}
                                    size="sm"
                                    variant={category === cat ? 'default' : 'outline'}
                                    className={cn("rounded-full text-xs capitalize", category === cat ? 'bg-pact-green border-pact-green' : '')}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Price Range</Label>
                            <span className="text-xs font-medium text-pact-green bg-pact-green/10 px-2 py-1 rounded-md">
                                ₦{priceRange[0]} - ₦{priceRange[1]}
                            </span>
                        </div>
                        <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            className="py-2"
                        />
                    </div>

                    {/* Location Radius */}
                    {userLocation && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Radius
                                </Label>
                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{radius} km</span>
                            </div>
                            <Slider
                                min={1}
                                max={100}
                                step={1}
                                value={[radius]}
                                onValueChange={(value) => setRadius(value[0])}
                                className="py-2"
                            />
                        </div>
                    )}

                    {/* Organic Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800">
                        <Label htmlFor="organic-only" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Organic Only
                        </Label>
                        <Switch id="organic-only" checked={organicOnly} onCheckedChange={setOrganicOnly} />
                    </div>

                    {/* Sort By */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sort By</Label>
                        <Select value={sortBy ?? undefined} onValueChange={(v) => setSortBy(v as ListingFilters['sortBy'])}>
                            <SelectTrigger className="h-10 border-zinc-200 dark:border-zinc-800 rounded-lg">
                                <SelectValue placeholder="Select sort order..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at">Newest First</SelectItem>
                                <SelectItem value="price">Price: Low to High</SelectItem>
                                {userLocation && <SelectItem value="distance">Distance: Nearest</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleApplyFilters} className="w-full md:hidden bg-pact-green hover:bg-emerald-600 text-white font-bold h-12 rounded-xl shadow-lg">
                        Apply Filters
                    </Button>
                </div>
            </div>
        </div>
    );
}
