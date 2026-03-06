import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/api/responses'

export const dynamic = 'force-dynamic'

interface FallbackPool {
  id: string
  produceName: string
  pricePerUnit: number
  unitQuantity: string
  farmerName: string
  farmerLocation: string
  overallQuantity: number
  unitQuantityValue: number
  unitsCommitted: number
  image: string
}

const fallbackPools: FallbackPool[] = [
  { 
    id: "fallback-1", 
    produceName: "Fresh Tomatoes",
    pricePerUnit: 50000,
    unitQuantity: "50kg basket",
    farmerName: "Example Farm",
    farmerLocation: "Oyo State",
    overallQuantity: 1000,
    unitQuantityValue: 50,
    unitsCommitted: 10,
    image: "/images/benue-yams.jpg" 
  },
  { 
    id: "fallback-2", 
    produceName: "Palm Oil",
    pricePerUnit: 25000,
    unitQuantity: "5L jerican",
    farmerName: "Example Farm",
    farmerLocation: "Lagos State",
    overallQuantity: 500,
    unitQuantityValue: 5,
    unitsCommitted: 8,
    image: "/images/palm-oil.jpg" 
  },
  { 
    id: "fallback-3", 
    produceName: "Local Rice",
    pricePerUnit: 18000,
    unitQuantity: "50kg bag",
    farmerName: "Example Farm",
    farmerLocation: "Kaduna State",
    overallQuantity: 5000,
    unitQuantityValue: 50,
    unitsCommitted: 45,
    image: "/images/ofada-rice.jpg" 
  },
]

export async function GET(request: NextRequest) {
  return apiSuccess({ pools: fallbackPools })
}
