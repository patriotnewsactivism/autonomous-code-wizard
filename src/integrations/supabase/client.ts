import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxgmziujgesdswtjdasu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4Z216aXVqZ2VzZHN3dGpkYXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MzI0MDQsImV4cCI6MjA3NzEwODQwNH0.Ib_o4AYbp3WAhbwyPwqDVbSLkzQ8s2CUnMaVgXyGsbQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
