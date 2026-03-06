import { renderHook, waitFor } from '@testing-library/react';
import { usePoolChat } from './usePoolChat';

// Mock the supabase client
const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockEq = jest.fn(() => ({ order: mockOrder }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect, insert: jest.fn() }));
const mockSubscribe = jest.fn();
const mockOn = jest.fn(() => ({ subscribe: mockSubscribe }));
const mockChannel = jest.fn(() => ({ on: mockOn }));
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel
  }))
}));

describe('usePoolChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', async () => {
    const { result } = renderHook(() => usePoolChat('test-pool-id', null));

    // Initial state before fetch completes
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(typeof result.current.sendMessage).toBe('function');

    // Wait for the async fetchMessages to complete to avoid act() warnings
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should not fetch messages if poolId is empty', async () => {
    const { result } = renderHook(() => usePoolChat('', null));

    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.unreadCount).toBe(0);

    // Verify that Supabase was not called
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockChannel).not.toHaveBeenCalled();
  });
});
