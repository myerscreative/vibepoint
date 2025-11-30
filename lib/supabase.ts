import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Error handling helper
export const handleAuthError = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  // Handle Supabase auth errors
  if (error.message) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (message.includes('email not confirmed')) {
      return 'Please confirm your email address';
    }
    if (message.includes('user already registered')) {
      return 'An account with this email already exists';
    }
    if (message.includes('password should be at least')) {
      return 'Password must be at least 6 characters';
    }
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address';
    }

    return error.message;
  }

  return 'An unexpected error occurred';
};
