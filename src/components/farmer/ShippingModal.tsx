'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { shipItem } from '@/app/farmer/actions';

interface ShippingModalProps {
    isOpen: boolean;
    onClose: () => void;
    poolId: string;
    onSuccess: () => void;
}

export function ShippingModal({ isOpen, onClose, poolId, onSuccess }: ShippingModalProps) {
    const [loading, setLoading] = useState(false);
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [waybill, setWaybill] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await shipItem({ poolId, driverName, driverPhone, waybill });
            onSuccess();
            onClose();
} catch {
            // Silent fail - shipment action failed
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ship Pacts</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="driverName">Driver Name</Label>
                        <Input
                            id="driverName"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            placeholder="e.g. John Doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="driverPhone">Driver Phone</Label>
                        <Input
                            id="driverPhone"
                            value={driverPhone}
                            onChange={(e) => setDriverPhone(e.target.value)}
                            placeholder="+234…"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="waybill">Waybill Number</Label>
                        <Input
                            id="waybill"
                            value={waybill}
                            onChange={(e) => setWaybill(e.target.value)}
                            placeholder="WB-123456"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-pact-green hover:bg-emerald-600">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Shipment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
