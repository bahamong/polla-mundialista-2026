"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** El participante registra su pago/cupo (queda pendiente de aprobación). */
export async function submitPayment(formData: FormData): Promise<{
  success?: true;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("payment_method") ?? "");
  const reference = String(formData.get("reference") ?? "");

  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    amount,
    payment_method: method,
    reference,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true };
}

/** Admin: aprueba o rechaza un pago. */
export async function reviewPayment(
  paymentId: string,
  decision: "approved" | "rejected",
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("payments")
    .update({
      status: decision,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (error) return { error: error.message };
  revalidatePath("/admin/payments");
  revalidatePath("/admin/users");
  return { success: true };
}
