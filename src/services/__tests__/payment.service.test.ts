import { PaymentService } from '../payment.service';
import {
  initializePayment as paystackInitialize,
  verifyPayment as paystackVerify,
  generatePaymentReference,
  toKobo,
} from '@/lib/payments/paystack';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
  })),
}));

jest.mock('@/lib/payments/paystack', () => ({
  initializePayment: jest.fn(),
  verifyPayment: jest.fn(),
  generatePaymentReference: jest.fn(() => 'PACT-TEST-REF'),
  toKobo: jest.fn((amount) => amount * 100),
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeTransaction', () => {
    it('should initialize a split payment transaction successfully', async () => {
      // Setup mock response
      const mockPaystackResponse = {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://checkout.paystack.com/test',
          access_code: 'test_access_code',
          reference: 'PACT-TEST-REF',
        },
      };
      (paystackInitialize as jest.Mock).mockResolvedValue(mockPaystackResponse);

      const userId = 'user-123';
      const email = 'test@example.com';
      const amount = 1000;
      const metadata = { type: 'pool_join' };

      const result = await PaymentService.initializeTransaction(
        userId,
        email,
        amount,
        metadata
      );

      // Verify the generate reference was called
      expect(generatePaymentReference).toHaveBeenCalledWith('PACT');

      // Verify toKobo conversion
      expect(toKobo).toHaveBeenCalledWith(amount);

      // Verify paystackInitialize was called with correct data
      expect(paystackInitialize).toHaveBeenCalledWith({
        email,
        amount: 100000,
        reference: 'PACT-TEST-REF',
        callback_url: expect.stringContaining('/checkout/success?reference=PACT-TEST-REF'),
        metadata: {
          ...metadata,
          user_id: userId,
          custom_fields: [
            {
              display_name: 'Platform Fee',
              variable_name: 'platform_fee',
              value: '50', // 5% of 1000
            },
          ],
        },
      });

      // Verify the result includes reference
      expect(result).toEqual({
        ...mockPaystackResponse,
        reference: 'PACT-TEST-REF',
      });
    });

    it('should use provided referenceOverride if available', async () => {
      const mockPaystackResponse = { status: true, data: {} };
      (paystackInitialize as jest.Mock).mockResolvedValue(mockPaystackResponse);

      await PaymentService.initializeTransaction(
        'user-123',
        'test@example.com',
        1000,
        {},
        'CUSTOM-REF-123'
      );

      // Verify generate reference was NOT called
      expect(generatePaymentReference).not.toHaveBeenCalled();

      // Verify paystackInitialize was called with custom reference
      expect(paystackInitialize).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: 'CUSTOM-REF-123',
        })
      );
    });

    it('should throw Error with message when paystackInitialize fails with an Error object', async () => {
      const errorMsg = 'Paystack API Error';
      (paystackInitialize as jest.Mock).mockRejectedValue(new Error(errorMsg));

      await expect(
        PaymentService.initializeTransaction('user-123', 'test@example.com', 1000, {})
      ).rejects.toThrow(`Payment initialization failed: ${errorMsg}`);
    });

    it('should throw Error with unknown error message when paystackInitialize fails with non-Error object', async () => {
      (paystackInitialize as jest.Mock).mockRejectedValue('Some weird string error');

      await expect(
        PaymentService.initializeTransaction('user-123', 'test@example.com', 1000, {})
      ).rejects.toThrow('Payment initialization failed: Unknown error');
    });
  });

  describe('verifyTransaction', () => {
    it('should return success response when paystack verification succeeds', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          amount: 100000,
          customer: { email: 'test@example.com' },
        },
      };
      (paystackVerify as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PaymentService.verifyTransaction('PACT-TEST-REF');

      expect(paystackVerify).toHaveBeenCalledWith('PACT-TEST-REF');
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
      });
    });

    it('should return failure response when paystack verification status is not success', async () => {
      const mockResponse = {
        data: {
          status: 'failed',
          gateway_response: 'Declined',
        },
      };
      (paystackVerify as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PaymentService.verifyTransaction('PACT-TEST-REF');

      expect(paystackVerify).toHaveBeenCalledWith('PACT-TEST-REF');
      expect(result).toEqual({
        success: false,
        status: 'failed',
      });
    });

    it('should throw Error with message when paystackVerify fails with an Error object', async () => {
      const errorMsg = 'Network timeout';
      (paystackVerify as jest.Mock).mockRejectedValue(new Error(errorMsg));

      await expect(
        PaymentService.verifyTransaction('PACT-TEST-REF')
      ).rejects.toThrow(`Payment verification failed: ${errorMsg}`);
    });

    it('should throw Error with unknown error message when paystackVerify fails with non-Error object', async () => {
      (paystackVerify as jest.Mock).mockRejectedValue({ code: 500 });

      await expect(
        PaymentService.verifyTransaction('PACT-TEST-REF')
      ).rejects.toThrow('Payment verification failed: Unknown error');
    });
  });
});
