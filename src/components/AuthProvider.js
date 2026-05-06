'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  getIdToken: async () => null,
  signOut: async () => {},
  refreshProfile: async () => {},
  authFetch: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  /**
   * Authenticated fetch helper — automatically adds Authorization header.
   * Returns parsed JSON or null on failure.
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const token = await getIdToken();
    if (!token) return null;

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) return null;
    return res.json().catch(() => null);
  }, [getIdToken]);

  /**
   * Fetches or refreshes the user profile from /api/profile.
   */
  const refreshProfile = useCallback(async () => {
    const data = await authFetch('/api/profile');
    if (data) setProfile(data);
    return data;
  }, [authFetch]);

  useEffect(() => {
    let auth;

    try {
      auth = getFirebaseAuth();
    } catch {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        // Fetch profile when user signs in
        try {
          const token = await nextUser.getIdToken();
          const res = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
          }
        } catch {
          // Profile fetch failed silently — will retry later
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, getIdToken, signOut, refreshProfile, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}
