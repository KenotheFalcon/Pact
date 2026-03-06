import { PAYSTACK_API_BASE_URL, PAYSTACK_ENDPOINTS, PAYSTACK_CURRENCY } from '@/lib/constants'

export type TransferRecipient = {
  name: string;
  account_number: string;
  bank_code: string;
  type?: "nuban";
};

export type CreateRecipientResponse = {
  status: boolean;
  message: string;
  data?: { recipient_code: string };
};

export type InitiateTransferParams = {
  amount: number; // in kobo
  recipient: string; // recipient_code
  reason?: string;
  reference: string;
};

export type TransferResponse = {
  status: boolean;
  message: string;
  data?: { transfer_code: string; id: number; status: string };
};

function getSecret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY not set");
  return key;
}

async function paystack(path: string, options: RequestInit) {
  const res = await fetch(`${PAYSTACK_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecret()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || `Paystack error: ${res.status}`);
  }
  return json;
}

export async function createTransferRecipient(
  recipient: TransferRecipient
): Promise<CreateRecipientResponse> {
  return paystack(PAYSTACK_ENDPOINTS.TRANSFER_RECIPIENT, {
    method: "POST",
    body: JSON.stringify({
      ...recipient,
      currency: PAYSTACK_CURRENCY,
      type: recipient.type || "nuban",
    }),
  });
}

export async function initiateTransfer(
  params: InitiateTransferParams
): Promise<TransferResponse> {
  return paystack(PAYSTACK_ENDPOINTS.TRANSFER, {
    method: "POST",
    body: JSON.stringify({ ...params, source: "balance" }),
  });
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<{
  status: boolean;
  message: string;
  data?: { account_number: string; account_name: string };
}> {
  return paystack(
    `${PAYSTACK_ENDPOINTS.RESOLVE_ACCOUNT}?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      method: "GET",
    }
  );
}

export function generateTransferReference(prefix = "PAYOUT"): string {
  const array = new Uint8Array(4);
  globalThis.crypto.getRandomValues(array);
  const rand = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}_${ts}_${rand}`;
}
