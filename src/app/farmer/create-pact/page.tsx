'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreatePactPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([{ name: '', quantity: 1, unit: 'kg' }]);

    const handleAddItem = () => {
        setItems(curr => [...curr, { name: '', quantity: 1, unit: 'kg' }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(curr => curr.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        router.push('/farmer/pools');
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="font-heading text-3xl font-bold text-zinc-900 dark:text-white">Create New Pact</h1>
                <p className="text-zinc-500 mt-2">Build a custom unit (basket, bag, crate) for buyers to pool on.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Unit Details</CardTitle>
                    <CardDescription>Define what goes into this pact.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="pactName">Pact Name</Label>
                                <Input id="pactName" placeholder="e.g. Weekend Veggie Basket" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pactPrice">Price per Unit (₦)</Label>
                                <Input id="pactPrice" type="number" placeholder="5000" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" placeholder="Describe the contents and quality…" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Items in Unit</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Item Name</Label>
                                        <Input
                                            value={item.name}
                                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            placeholder="e.g. Tomatoes"
                                            required
                                        />
                                    </div>
                                    <div className="w-full sm:w-24 space-y-2">
                                        <Label className="text-xs">Qty</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="w-full sm:w-24 space-y-2">
                                        <Label className="text-xs">Unit</Label>
                                        <Select
                                            value={item.unit}
                                            onValueChange={(value) => handleItemChange(index, 'unit', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">kg</SelectItem>
                                                <SelectItem value="pcs">pcs</SelectItem>
                                                <SelectItem value="bunch">bunch</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
<Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => handleRemoveItem(index)}
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6">
                            <Button type="submit" className="w-full bg-pact-green hover:bg-emerald-600 text-white" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Launch Pact
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
