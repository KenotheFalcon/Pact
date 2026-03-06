import { TourStep } from './types'

export const STORAGE_PREFIX = 'pact_tour_completed_'

/**
 * Predefined tour steps for different roles
 */
export const BUYER_TOUR_STEPS: TourStep[] = [
  {
    id: 'browse',
    target: '[data-tour="marketplace"]',
    title: 'Browse Fresh Produce',
    content: 'Explore listings from local farmers. Find fresh vegetables, fruits, and more at competitive prices.',
    placement: 'bottom'
  },
  {
    id: 'pools',
    target: '[data-tour="pools"]',
    title: 'Join Buying Pools',
    content: 'Pool your order with others to unlock bulk pricing. The more people join, the better the price!',
    placement: 'bottom'
  },
  {
    id: 'orders',
    target: '[data-tour="orders"]',
    title: 'Track Your Orders',
    content: 'Monitor your pool status, payment, and delivery right from your dashboard.',
    placement: 'left'
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Stay Updated',
    content: 'Get notified when pools fill up, prices drop, or new produce becomes available.',
    placement: 'left'
  }
]

export const FARMER_TOUR_STEPS: TourStep[] = [
  {
    id: 'listings',
    target: '[data-tour="listings"]',
    title: 'Create Listings',
    content: 'Add your produce with photos, pricing, and quantity. Buyers will see these in the marketplace.',
    placement: 'bottom'
  },
  {
    id: 'pools',
    target: '[data-tour="pools"]',
    title: 'Manage Pools',
    content: 'Create buying pools for your listings. Set minimum quantities and deadlines for bulk orders.',
    placement: 'bottom'
  },
  {
    id: 'analytics',
    target: '[data-tour="analytics"]',
    title: 'View Analytics',
    content: 'Track your sales, popular items, and buyer trends to optimize your offerings.',
    placement: 'left'
  },
  {
    id: 'payouts',
    target: '[data-tour="payouts"]',
    title: 'Receive Payouts',
    content: 'Get paid directly to your bank account when pools complete. Track all your earnings here.',
    placement: 'left'
  }
]
