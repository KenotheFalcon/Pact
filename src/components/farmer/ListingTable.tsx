'use client'

import { useState } from 'react'
import Image from 'next/image'

import { getListingStatusColor } from '@/lib/utils/status-colors'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

import { Edit, Trash2, Package } from 'lucide-react'

import type { Listing } from '@/types/database'

interface ListingTableProps {
  listings: Listing[]
  loading: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function ListingTable({ listings, loading, onEdit, onDelete }: ListingTableProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = (listingId: string) => {
    setImageErrors(prev => ({ ...prev, [listingId]: true }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="animate-pulse">
          <div className="px-6 py-4 border-b border-border">
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-border flex items-center">
              <div className="h-12 w-12 bg-muted rounded mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <EmptyState
          icon={Package}
          title="No listings found"
          description="Get started by creating your first produce listing."
          action={{
            label: "Create Listing",
            onClick: () => window.location.href = '/farmer/listings/create'
          }}
          className="py-12"
        />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Inventory
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 mr-4">
                      {!imageErrors[listing.id] && listing.images?.[0] ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                          onError={() => handleImageError(listing.id)}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {listing.name}
                        </h3>
                        {listing.organic && (
                          <Badge variant="outline" className="ml-2 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            Organic
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{listing.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    ₦{listing.price_per_unit}/{listing.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">
                    <div className="flex items-center justify-between mb-1">
                      <span>{listing.quantity} {listing.unit}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={`${getListingStatusColor(listing.status)} text-xs`}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1).replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(listing.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(listing.id)}
                      className="text-muted-foreground hover:text-foreground h-9 w-9 p-0"
                      aria-label={`Edit ${listing.name}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(listing.id)}
                      className="text-muted-foreground hover:text-destructive h-9 w-9 p-0"
                      aria-label={`Delete ${listing.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
