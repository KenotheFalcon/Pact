/**
 * API endpoint for fetching a single pool
 * GET /api/pools/[id]
 */

import { NextRequest } from 'next/server';

import { getPool } from '@/lib/database';
import { 
  apiSuccess, 
  apiNotFound, 
  apiInternalError,
  getErrorMessage 
} from '@/lib/api/responses';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getPool(params.id);

    if (!pool) {
      return apiNotFound('Pool');
    }

    return apiSuccess(pool);
  } catch (error: unknown) {
    return apiInternalError(getErrorMessage(error, 'Failed to fetch pool'));
  }
}
