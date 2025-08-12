import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Types for better TypeScript support
export type Tables = Database["public"]["Tables"];
export type Baby = Tables["babies"]["Row"];
export type Family = Tables["families"]["Row"];
export type Caregiver = Tables["caregivers"]["Row"];
export type SleepRecord = Tables["sleep_records"]["Row"];
export type FeedingRecord = Tables["feeding_records"]["Row"];
export type WalkRecord = Tables["walk_records"]["Row"];
export type GrowthRecord = Tables["growth_records"]["Row"];
