import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    // Use maybeSingle() instead of single() — returns null instead of 406 when no row
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('fetchProfile error:', error)
      setLoading(false)
      return
    }

    if (data) {
      setProfile(data)
    } else {
      // Profile row missing — create it now (fallback for anonymous users)
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: userId, display_name: 'Membre', emoji: '🙂' })
        .select()
        .single()
      setProfile(created)
    }
    setLoading(false)
  }

  async function signInAnonymously({ displayName, emoji }) {
    setLoading(true)
    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { display_name: displayName, emoji } }
    })
    if (error) { setLoading(false); throw error }

    // Upsert profile immediately — don't rely solely on the trigger
    await supabase
      .from('profiles')
      .upsert(
        { id: data.user.id, display_name: displayName, emoji },
        { onConflict: 'id' }
      )

    return data.user
  }

  async function updateProfile(updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInAnonymously, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
