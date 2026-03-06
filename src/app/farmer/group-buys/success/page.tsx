'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function PoolSuccessPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-card rounded-lg shadow-md p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
          Pool Created!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your pool has been successfully created and is now live. 
          Buyers can now join and help reach the target quantity for bulk discounts.
        </p>

        {/* Campaign Details Card */}
        <div className="bg-muted rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-foreground mb-4">Pool Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-pact-green">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Participants:</span>
              <span className="font-medium">0 / 5 minimum</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">0% complete</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deadline:</span>
              <span className="font-medium">7 days remaining</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-foreground mb-3">Next Steps</h3>
          <ul className="space-y-2 text-foreground/80">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">-</span>
              Share your campaign with potential buyers
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">-</span>
              Monitor participation and progress
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">-</span>
              Communicate with participants about delivery details
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">-</span>
              Prepare for fulfillment when target is reached
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/farmer/pools')}
            className="px-6 py-2 bg-pact-green text-white rounded-md hover:bg-pact-green/90 transition-colors"
          >
            View My Pools
          </button>
          <button
            onClick={() => router.push('/farmer/pools/create')}
            className="px-6 py-2 border border-pact-green text-pact-green rounded-md hover:bg-pact-green/10 transition-colors"
          >
            Create Another Pool
          </button>
        </div>
      </div>
    </div>
  );
}