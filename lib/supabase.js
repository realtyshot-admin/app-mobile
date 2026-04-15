import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://huesmrqzuezefyinulvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZXNtcnF6dWV6ZWZ5aW51bHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzY4NzQsImV4cCI6MjA4ODgxMjg3NH0.drEphi99Qw1Rebyd8yJW2m2SZDNLDUKJJZah2GRUefQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});