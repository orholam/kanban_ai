import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { clearLocalSupabaseSession, supabase } from '../lib/supabase';
import { fetchAccountProfile } from '../lib/accountProfile';
import { recordAnalyticsEvent } from '../lib/analyticsEvents';
import type { AccountProfileRow } from '../types';
import { isLocalAppMode, LOCAL_DEV_EMAIL, LOCAL_DEV_USER_ID } from '../lib/localApp';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** Null while signed out; defined when signed in (possibly still loading). */
  accountProfile: AccountProfileRow | null;
  /** True while fetching `accountProfile` for the current user. */
  profileLoading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function syntheticLocalUser(): User {
  return {
    id: LOCAL_DEV_USER_ID,
    email: LOCAL_DEV_EMAIL,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

function syntheticLocalProfile(): AccountProfileRow {
  return {
    id: LOCAL_DEV_USER_ID,
    full_name: 'Local developer',
    display_name: 'Local developer',
    name: null,
    username: null,
    account_role: 'owner',
    subscription_plan: 'pro',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountProfile, setAccountProfile] = useState<AccountProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (isLocalAppMode()) {
      setUser(syntheticLocalUser());
      setSession(null);
      setAccountProfile(syntheticLocalProfile());
      setProfileLoading(false);
      setLoading(false);
      return;
    }

    const hydratedRef = { current: false };
    const wasSignedOutRef = { current: true };

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      wasSignedOutRef.current = !s?.user;
      setLoading(false);
      hydratedRef.current = true;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'TOKEN_REFRESHED') {
        setSession(s);
        setUser(s?.user ?? null);
        return;
      }

      if (event === 'SIGNED_OUT') {
        wasSignedOutRef.current = true;
        setSession(null);
        setUser(null);
        return;
      }

      if (event === 'SIGNED_IN' && s?.user) {
        setSession(s);
        setUser(s.user);
        if (hydratedRef.current) {
          if (wasSignedOutRef.current) {
            void recordAnalyticsEvent('sign_in', {}, { kind: 'user', userId: s.user.id });
          }
          wasSignedOutRef.current = false;
        }
        return;
      }

      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLocalAppMode()) {
      return;
    }
    if (!user) {
      setAccountProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    let cancelled = false;
    fetchAccountProfile(user.id).then((row) => {
      if (!cancelled) {
        setAccountProfile(row);
        setProfileLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signOut = async () => {
    if (isLocalAppMode()) {
      navigate('/kanban', { replace: true });
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      await clearLocalSupabaseSession();
    }
    navigate('/login', { replace: true });
    return { error: null };
  };

  const value = {
    session,
    user,
    accountProfile,
    profileLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
