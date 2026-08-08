import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../api/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigateRef = useRef(null);

  // Initialize session and listen for auth changes
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session && mounted) {
          await fetchUserProfile(session);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setToken(null);
        setLoading(false);
      } else {
        await fetchUserProfile(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(session) {
    try {
      setToken(session.access_token);
      // Ensure user is in our public.users table via trigger, then fetch profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which might happen if trigger is delayed
        console.error("Failed to fetch user profile:", error);
      }

      setUser({
        ...session.user,
        // merge public.users data
        roles: data?.roles || ['USER'],
        name: data?.name || session.user.user_metadata?.name || 'User',
        profile: data?.profile || null
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Auth actions
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  }, []);

  const logout = useCallback(async (redirectPath = '/login') => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    if (navigateRef.current) {
      navigateRef.current(redirectPath, { replace: true });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, navigateRef }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
