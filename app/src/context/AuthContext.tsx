import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../lib/types'

const SUPABASE_URL = 'https://fkjaqhydotxubxnieguh.supabase.co'
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function parseJwt(token: string): { exp: number; sub: string; email: string } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const tokenKey = `sb-${import.meta.env.VITE_SUPABASE_URL.split('//')[1]!.split('.')[0]}-auth-token`

  const refresh = useCallback(async () => {
    const tokenStr = localStorage.getItem(tokenKey)
    if (!tokenStr) {
      setSession(null)
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const tokenData = JSON.parse(tokenStr)
      const accessToken = tokenData.access_token
      const payload = parseJwt(accessToken)
      if (!payload || payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(tokenKey)
        setSession(null)
        setProfile(null)
        setLoading(false)
        return
      }
      const userId = payload.sub
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`, {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'apikey': ANON_KEY,
        }
      })
      const profiles = await res.json()
      const p = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null
      setProfile(p)
      setSession({
        access_token: accessToken,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        expires_at: tokenData.expires_at,
        token_type: tokenData.token_type,
        user: {
          id: userId,
          email: payload.email,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
        } as User,
      } as Session)
    } catch {
      localStorage.removeItem(tokenKey)
      setSession(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [tokenKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signOut = async () => {
    localStorage.removeItem(tokenKey)
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
