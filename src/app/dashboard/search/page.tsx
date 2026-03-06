'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';

export default function SearchPage() {
    const [location, setLocation] = useState('');
    const [query, setQuery] = useState('');

const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Redirect to marketplace with search params
        window.location.href = `/marketplace?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="font-heading text-3xl font-bold mb-8">Find Pools Near You</h1>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                        <Input
                            placeholder="Search products…"
                            className="pl-10 h-12"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                        <Input
                            placeholder="Location (e.g. Lagos, Ikeja)"
                            className="pl-10 h-12"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg">
                    Search Pacts
                </Button>
            </form>
        </div>
    );
}
