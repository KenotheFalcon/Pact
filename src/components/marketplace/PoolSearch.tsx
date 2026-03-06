'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function PoolSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
    const [category, setCategory] = useState(searchParams.get('category') || '')

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('q', searchTerm)
        if (category) params.set('category', category)

        router.push(`/marketplace?${params.toString()}`)
    }

    return (
        <div className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-lg shadow-zinc-200/50 dark:shadow-black/20 border border-zinc-100 dark:border-zinc-800 mb-8">
            <div className="flex flex-col md:flex-row gap-4">

                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400" />
                    <Input
                        placeholder="Search for pools…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 text-base bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                </div>

                <div className="w-full md:w-48">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-12 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Fruits">Fruits</SelectItem>
                            <SelectItem value="Vegetables">Vegetables</SelectItem>
                            <SelectItem value="Grains">Grains</SelectItem>
                            <SelectItem value="Poultry">Poultry</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={handleSearch}
                    className="h-12 px-8 bg-pact-green hover:bg-pact-green/90 text-white font-bold rounded-xl shadow-md shadow-pact-green/20"
                >
                    Find Pools
                </Button>
            </div>
        </div>
    )
}
