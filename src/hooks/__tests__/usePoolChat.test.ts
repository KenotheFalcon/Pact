import { renderHook, act } from '@testing-library/react';

import { createClient } from '@/lib/supabase/client';

import { usePoolChat } from '../usePoolChat';

// Mock the supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('usePoolChat', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    channel: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    removeChannel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should initialize with correct default state', async () => {
    // We delay the order mock so it doesn't resolve immediately to avoid state updates during render
    let resolveOrder: any;
    mockSupabase.order.mockImplementation(() => new Promise((resolve) => {
      resolveOrder = resolve;
    }));

    const poolId = 'test-pool-id';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = { id: 'test-user-id' } as any;

    const { result } = renderHook(() => usePoolChat(poolId, currentUser));

    // Assert initial state before the fetch completes
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.unreadCount).toBe(0);
    expect(typeof result.current.sendMessage).toBe('function');

    // Clean up to prevent act warnings
    await act(async () => {
      resolveOrder({ data: [], error: null });
    });
  });
});
