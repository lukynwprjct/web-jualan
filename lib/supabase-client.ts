import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://retpbhcztvthymtluesu.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldHBiaGN6dHZ0aG1tdGx1ZXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MzgwODQsImV4cCI6MjA0NjExNDA4NH0.mR0G8qF0b5L5qX5Qv7V4e9xY4f3X2K1N8p0A9B6C7D8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
