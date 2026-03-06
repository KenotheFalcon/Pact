'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPool } from '@/app/actions/pool';

interface CreatePoolFormState {
  listingId: string;
  title: string;
  description: string;
  minQuantity: number;
  minParticipants: number;
  unitPrice: number;
  discountedPrice: number;
  expiresAt: string;
  images: string[];
  category: string;
}

export default function CreatePoolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePoolFormState>({
    listingId: '',
    title: '',
    description: '',
    minQuantity: 100,
    minParticipants: 5,
    unitPrice: 0,
    discountedPrice: 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    images: [],
    category: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('listingId', formData.listingId);
      formDataToSend.append('minQuantity', String(formData.minQuantity));
      formDataToSend.append('expiresAt', new Date(formData.expiresAt).toISOString());

      // Optional fields if supported by createPool, otherwise they are ignored
      // formDataToSend.append('latitude', ...); 
      // formDataToSend.append('longitude', ...);

      const result = await createPool(formDataToSend);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create pool');
      }

      // Redirect to success page or pool list
      router.push('/farmer/pools');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create pool. Please try again.'
      alert(message)
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-card rounded-lg shadow-md p-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Create Pool</h1>
        <p className="text-muted-foreground mb-8">
          Set up a pool to offer bulk discounts and attract more buyers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Selection */}
          <div>
            <label htmlFor="listingId" className="block text-sm font-medium text-foreground mb-2">
              Select Product Listing
            </label>
            <select
              id="listingId"
              name="listingId"
              value={formData.listingId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
            >
              <option value="">Choose a product listing...</option>
              <option value="listing1">Organic Tomatoes - $3.50/lb</option>
              <option value="listing2">Fresh Lettuce - $2.00/head</option>
              <option value="listing3">Carrots - $1.80/lb</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Campaign Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Bulk Organic Tomato Pool"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
              placeholder="Describe your pool campaign, quality, delivery details…"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
            />
          </div>

          {/* Target Quantity */}
          <div>
            <label htmlFor="minQuantity" className="block text-sm font-medium text-foreground mb-2">
              Target Quantity (lbs)
            </label>
            <input
              type="number"
              id="minQuantity"
              name="minQuantity"
              value={formData.minQuantity}
              onChange={handleInputChange}
              min="10"
              required
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
            />
            <p className="text-sm text-muted-foreground mt-1">Minimum 10 lbs required</p>
          </div>

          {/* Minimum Participants */}
          <div>
            <label htmlFor="minParticipants" className="block text-sm font-medium text-foreground mb-2">
              Minimum Participants
            </label>
            <input
              type="number"
              id="minParticipants"
              name="minParticipants"
              value={formData.minParticipants}
              onChange={handleInputChange}
              min="2"
              required
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
            />
            <p className="text-sm text-muted-foreground mt-1">Minimum buyers needed for the pool</p>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-foreground mb-2">
                Regular Unit Price ($)
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
              />
            </div>
            <div>
              <label htmlFor="discountedPrice" className="block text-sm font-medium text-foreground mb-2">
                Pool Price ($)
              </label>
              <input
                type="number"
                id="discountedPrice"
                name="discountedPrice"
                value={formData.discountedPrice}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="expiresAt" className="block text-sm font-medium text-foreground mb-2">
              Campaign Deadline
            </label>
            <input
              type="datetime-local"
              id="expiresAt"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
            />
            <p className="text-sm text-muted-foreground mt-1">Campaign must end in the future</p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
            >
              <option value="">Select category...</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains">Grains</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat & Poultry</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-pact-green text-white rounded-md hover:bg-pact-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}