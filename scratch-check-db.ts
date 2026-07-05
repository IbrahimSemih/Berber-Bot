import { createAdminClient } from "@/lib/supabase/admin";

async function checkStaff() {
  const supabase = createAdminClient();
  const { data: shops } = await supabase.from("shops").select("*");
  console.log("Shops:", shops);
  
  const { data: staff } = await supabase.from("staff").select("*");
  console.log("Staff:", staff);
}

checkStaff();
