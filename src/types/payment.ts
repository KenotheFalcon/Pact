export interface PaystackInitializeData {
  amount: number;
  email: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    log: Record<string, unknown>;
    fees: number;
    fees_split: Record<string, unknown>;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: Record<string, unknown>;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: Record<string, unknown>;
    split: Record<string, unknown>;
    order_id: Record<string, unknown>;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: Record<string, unknown>;
    source: Record<string, unknown>;
    fees_breakdown: Record<string, unknown>;
    transaction_date: string;
    plan_object: Record<string, unknown>;
    subaccount: Record<string, unknown>;
  };
}

// Webhook Data Types

export interface PaystackWebhookEvent {
  event: string;
  data: PaystackWebhookData;
}

export interface PaystackWebhookData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  metadata?: {
    type?: string;
    pool_id?: string;
    user_id?: string;
    [key: string]: unknown;
  };
  transfer_code?: string; // For transfer events
  recipient?: {
    domain: string;
    type: string;
    currency: string;
    name: string;
    details: {
      account_number: string;
      account_name: string | null;
      bank_code: string;
      bank_name: string;
    };
  };
  [key: string]: unknown;
}
