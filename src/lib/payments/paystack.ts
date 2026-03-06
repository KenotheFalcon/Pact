// Paystack payment integration utilities

import { KOBO_PER_NAIRA, PAYSTACK_URLS } from '@/lib/constants'

import type {
  PaystackInitializeData,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from "@/types/payment";

// Type declarations for Paystack Inline JS (loaded from CDN)
interface PaystackPopHandler {
  openIframe: () => void;
}

interface PaystackPopConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

interface PaystackPopInstance {
  setup: (config: PaystackPopConfig) => PaystackPopHandler | undefined;
}

declare global {
  interface Window {
    PaystackPop?: PaystackPopInstance;
  }
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";


interface PaystackCaptureResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    amount: number;
    status: string;
    [key: string]: unknown;
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    amount: number;
    [key: string]: unknown;
  };
}

/**
 * Initialize a Paystack payment
 * Server-side only
 */
export async function initializePayment(
  data: PaystackInitializeData
): Promise<PaystackInitializeResponse> {
  const response = await fetch(PAYSTACK_URLS.INITIALIZE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message =
      typeof errorData?.message === "string"
        ? errorData.message
        : "Failed to initialize payment";
    throw new Error(message);
  }

  return response.json();
}

/**
 * Verify a Paystack payment
 * Server-side only
 */
export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  const response = await fetch(`${PAYSTACK_URLS.VERIFY}/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message =
      typeof errorData?.message === "string"
        ? errorData.message
        : "Failed to verify payment";
    throw new Error(message);
  }

  return response.json();
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(prefix: string = "PACT"): string {
  const timestamp = Date.now();
  const array = new Uint8Array(4);
  globalThis.crypto.getRandomValues(array);
  const random = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Convert amount to kobo (smallest currency unit)
 */
export function toKobo(naira: number): number {
  return Math.round(naira * KOBO_PER_NAIRA);
}

/**
 * Convert amount from kobo to naira
 */
export function fromKobo(kobo: number): number {
  return kobo / KOBO_PER_NAIRA;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Capture an authorized payment
 * This is used when a pool locks and we need to capture all authorized payments
 * Server-side only
 */
export async function capturePayment(
  authorizationCode: string
): Promise<PaystackCaptureResponse> {
  const response = await fetch(PAYSTACK_URLS.CHARGE_AUTHORIZATION, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authorization_code: authorizationCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to capture payment");
  }

  return response.json();
}

/**
 * Get transaction details by reference
 * Server-side only
 */
export async function getTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const response = await fetch(`${PAYSTACK_URLS.TRANSACTION}/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch transaction");
  }

  return response.json();
}

/**
 * Refund a payment
 * Server-side only
 */
export async function refundPayment(
  reference: string,
  amount?: number
): Promise<PaystackRefundResponse> {
  const body: { transaction: string; amount?: number } = {
    transaction: reference,
  };
  if (amount) {
    body.amount = toKobo(amount);
  }

  const response = await fetch(PAYSTACK_URLS.REFUND, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to refund payment");
  }

  return response.json();
}

/**
 * Client-side: Open Paystack payment modal
 * Requires @paystack/inline-js package
 */
export function openPaystackModal(
  email: string,
  amount: number,
  reference: string,
  onSuccess: (reference: string) => void,
  onClose: () => void
) {
  if (typeof window === "undefined") {
    throw new Error("openPaystackModal can only be called on the client side");
  }

  const handler = window.PaystackPop?.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: toKobo(amount),
    ref: reference,
    callback: (response) => {
      onSuccess(response.reference);
    },
    onClose,
  });

  if (handler) {
    handler.openIframe();
  } else {
    throw new Error("Paystack not loaded");
  }
}
