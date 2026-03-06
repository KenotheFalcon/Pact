'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

export function EmptyState() {
    const router = useRouter();

    const handleClearFilters = () => {
        router.refresh();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-muted/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 backdrop-blur-sm"
        >
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <SearchX className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No active pools found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
                We couldn&apos;t find any pools matching your criteria. Try adjusting your search area or filters.
            </p>
            <Button
                variant="outline"
                className="mt-8 rounded-full"
                onClick={handleClearFilters}
            >
                Clear all filters
            </Button>
        </motion.div>
    );
}
