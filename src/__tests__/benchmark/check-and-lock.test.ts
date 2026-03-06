import { checkAndLockPools } from '../../app/actions/capture-pool-payments';

jest.mock('../../lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { status: 'locked', listing: {} },
            error: null
          }),
          in: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    }),
    rpc: jest.fn().mockResolvedValue({
      data: 1,
      error: null
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } })
    }
  })
}));

jest.mock('../../lib/notifications/helpers', () => ({
  notifyPoolLocked: jest.fn().mockResolvedValue(true),
  notifyPoolCancelled: jest.fn().mockResolvedValue(true)
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

// We'll override the mock inside the test file to test the function itself
describe('checkAndLockPools benchmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Custom mock for the initial query to return pools
    const serverModule = require('../../lib/supabase/server');
    serverModule.createClient.mockResolvedValue({
      from: jest.fn().mockImplementation((table) => {
        if (table === 'pools') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field, val) => {
                if (field === 'status' && val === 'active') {
                  return Promise.resolve({
                    data: Array.from({ length: 10 }).map((_, i) => ({
                      id: `pool${i}`,
                      current_quantity: 10,
                      min_quantity: 5,
                      status: 'locked' // Need to be locked for capturePoolPayments to succeed in mock
                    })),
                    error: null
                  });
                }
                return {
                  single: jest.fn().mockResolvedValue({
                    data: { status: 'locked', listing: {} },
                    error: null
                  })
                };
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        }
        if (table === 'pool_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 'member1' }],
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: null }) }) })
        };
      }),
      rpc: jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // simulate DB delay
        return { data: 1, error: null };
      })
    });
  });

  it('measures checkAndLockPools', async () => {
    const start = performance.now();
    const result = await checkAndLockPools();
    const end = performance.now();
    console.log(`Execution time: ${end - start} ms`);
    console.log(`Result:`, result);
  });
});
