"use server";

import { createClient } from "@/lib/supabase/server";
import {
  resolveBankAccount,
  createTransferRecipient,
  initiateTransfer,
  generateTransferReference,
} from "@/lib/payments/transfers";

export async function requestPayout(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const amountStr = formData.get("amount") as string;
  const bankCode = formData.get("bankCode") as string;
  const accountNumber = formData.get("accountNumber") as string;
  const amount = Number(amountStr);

  if (!amount || !bankCode || !accountNumber) {
    return;
  }

  // Verify account info with Paystack
  const resolveResp = await resolveBankAccount(accountNumber, bankCode);
  if (!resolveResp.status || !resolveResp.data?.account_name) {
    return;
  }

  // Check balance
  const { data: available, error: balError } = await supabase.rpc(
    "get_farmer_available_balance",
    { p_user_id: user.id }
  );
  if (balError) return;
  if (amount > Number(available || 0)) return;

  // Farmer profile
  const { data: farmer } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("user_id", user.id)
    .single();
  if (!farmer) return;

  // Create recipient
  const recipientResp = await createTransferRecipient({
    name: resolveResp.data.account_name,
    bank_code: bankCode,
    account_number: accountNumber,
  });
  const recipientCode = recipientResp?.data?.recipient_code;
  if (!recipientCode) return;

  // Initiate transfer
  const reference = generateTransferReference();
  const transferResp = await initiateTransfer({
    amount,
    recipient: recipientCode,
    reference,
  });

  // Record payout
  const { data: payout, error: payoutErr } = await supabase
    .from("payouts")
    .insert({
      user_id: user.id,
      amount,
      reference,
      status: transferResp?.data?.status || "pending",
      transfer_code: transferResp?.data?.transfer_code,
      recipient_code: recipientCode,
    })
    .select()
    .single();

  if (payoutErr) return;
  return;
}
