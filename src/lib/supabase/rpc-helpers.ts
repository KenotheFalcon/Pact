/**
 * Typed RPC call helpers for Supabase
 * 
 * These wrappers provide type safety for RPC calls without
 * requiring the full Database generic to be threaded through.
 */

import { createClient } from '@/lib/supabase/server'

// RPC Function Argument Types
interface ProcessPoolLockArgs {
  pool_id_param: string
}

interface CreateOrdersForPoolArgs {
  pool_id_param: string
}

interface DeductPoolInventoryArgs {
  pool_id_param: string
}

interface IncrementPoolQuantityArgs {
  pool_id_param: string
  quantity_param: number
}

interface ReservePoolMembershipArgs {
  pool_id_param: string
  user_id_param: string
  quantity_param: number
  amount_naira: number
  reference_param: string
}

interface AutoGeneratePayoutsArgs {
  pool_id_param: string
  platform_fee_percent: number
}

interface GetFarmerAvailableBalanceArgs {
  p_user_id: string
}

// Generic RPC result type
interface RpcResult<T = unknown> {
  data: T | null
  error: { message: string; code?: string } | null
}

/**
 * Process pool lock - marks pool as locked and captures authorized pledges
 */
export async function rpcProcessPoolLock(args: ProcessPoolLockArgs): Promise<RpcResult<void>> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('process_pool_lock' as never, args as never)
  return { data: null, error: error as RpcResult['error'] }
}

/**
 * Create orders for all captured pool members
 */
export async function rpcCreateOrdersForPool(args: CreateOrdersForPoolArgs): Promise<RpcResult<number>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_orders_for_pool' as never, args as never)
  return { data: data as number | null, error: error as RpcResult['error'] }
}

/**
 * Deduct captured pool quantities from listing inventory
 */
export async function rpcDeductPoolInventory(args: DeductPoolInventoryArgs): Promise<RpcResult<void>> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('deduct_pool_inventory' as never, args as never)
  return { data: null, error: error as RpcResult['error'] }
}

/**
 * Increment pool quantity atomically
 */
export async function rpcIncrementPoolQuantity(args: IncrementPoolQuantityArgs): Promise<RpcResult<void>> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_pool_quantity' as never, args as never)
  return { data: null, error: error as RpcResult['error'] }
}

/**
 * Reserve pool membership with capacity check
 */
export async function rpcReservePoolMembership(args: ReservePoolMembershipArgs): Promise<RpcResult<boolean>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reserve_pool_membership' as never, args as never)
  return { data: data as boolean | null, error: error as RpcResult['error'] }
}

/**
 * Auto-generate payouts for a completed pool
 */
export async function rpcAutoGeneratePayouts(args: AutoGeneratePayoutsArgs): Promise<RpcResult<{ id: string; reference: string; amount: number }[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('auto_generate_payouts' as never, args as never)
  return { data: data as { id: string; reference: string; amount: number }[] | null, error: error as RpcResult['error'] }
}

/**
 * Get farmer's available balance for payouts
 */
export async function rpcGetFarmerAvailableBalance(args: GetFarmerAvailableBalanceArgs): Promise<RpcResult<number>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_farmer_available_balance' as never, args as never)
  return { data: data as number | null, error: error as RpcResult['error'] }
}
