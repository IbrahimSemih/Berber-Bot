"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function sendOnboardingWelcomeEmailAction() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "Yetkisiz işlem." };
  }

  const name = user.email.split("@")[0];
  return sendWelcomeEmail(user.email, name);
}
