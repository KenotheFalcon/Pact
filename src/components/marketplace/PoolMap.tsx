'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Pool } from '@/types/database';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Fix for default markers in Leaflet with Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface PoolMapProps {
    pools: Pool[];
    userLocation?: { latitude: number; longitude: number } | null;
}

function MapController({ pools, userLocation }: PoolMapProps) {
    const map = useMap();

    useEffect(() => {
        if (pools.length > 0) {
            const bounds = L.latLngBounds(pools.map(p => [
                p.latitude || p.listing?.latitude || 0,
                p.longitude || p.listing?.longitude || 0
            ]));

            if (userLocation) {
                bounds.extend([userLocation.latitude, userLocation.longitude]);
            }

            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (userLocation) {
            map.setView([userLocation.latitude, userLocation.longitude], 13);
        }
    }, [pools, userLocation, map]);

    return null;
}

export default function PoolMap({ pools, userLocation }: PoolMapProps) {
    // Default center (Lagos, Nigeria) if no location
    const defaultCenter: [number, number] = [6.5244, 3.3792];
    const center: [number, number] = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : defaultCenter;

    return (
        <div className="h-[350px] md:h-[600px] w-full rounded-xl overflow-hidden border-2 border-border z-0 relative z-0">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController pools={pools} userLocation={userLocation} />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker
                        position={[userLocation.latitude, userLocation.longitude]}
                        icon={new L.Icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })}
                    >
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                {/* Pool Markers */}
                {pools.map((pool) => {
                    const lat = pool.latitude || pool.listing?.latitude;
                    const lng = pool.longitude || pool.listing?.longitude;

                    if (!lat || !lng) return null;

                    return (
                        <Marker
                            key={pool.id}
                            position={[lat, lng]}
                            icon={customIcon}
                        >
                            <Popup className="min-w-[250px] sm:min-w-[300px]">
                                <div className="p-2">
                                    <h3 className="font-bold text-lg mb-1">{pool.listing?.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {pool.current_quantity} / {pool.min_quantity} {pool.listing?.unit} pledged
                                    </p>
                                    <Link href={`/marketplace/pools/${pool.id}`}>
                                        <Button size="sm" className="w-full">View Pool</Button>
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
