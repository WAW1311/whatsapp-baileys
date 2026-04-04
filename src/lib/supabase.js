import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Database calls will fail."
    );
  }
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
