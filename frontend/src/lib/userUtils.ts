import { User } from '@supabase/supabase-js';

// Get user initials from email or name
export const getUserInitials = (user: User) => {
  if (user.user_metadata?.name) {
    return user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }
  if (user.email) {
    return user.email.split('@')[0].substring(0, 2).toUpperCase();
  }
  return 'U';
};

// Get display name
export const getDisplayName = (user: User) => {
  if (user.user_metadata?.name) {
    return user.user_metadata.name;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'Unknown User';
}; 