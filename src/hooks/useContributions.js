import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useContributions(giftId, isOwnList) {
  const { user } = useAuth()
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchContributions = useCallback(async () => {
    if (!giftId) return
    setLoading(true)
    // Use the public view — hides individual amounts from non-contributors
    const { data } = await supabase
      .from('contributions_public_view')
      .select('*')
      .eq('gift_idea_id', giftId)
    setContributions(data || [])
    setLoading(false)
  }, [giftId])

  useEffect(() => { fetchContributions() }, [fetchContributions])

  // Realtime
  useEffect(() => {
    if (!giftId) return
    const channel = supabase
      .channel(`contributions-${giftId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'contributions',
        filter: `gift_idea_id=eq.${giftId}`
      }, () => fetchContributions())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [giftId, fetchContributions])

  const myContribution = contributions.find(c => c.user_id === user?.id)
  const totalCents = contributions.reduce((sum, c) => sum + (c.amount_cents || 0), 0)

  async function upsertContribution(amountEuros) {
    const amountCents = Math.round(amountEuros * 100)
    const { error } = await supabase
      .from('contributions')
      .upsert(
        { gift_idea_id: giftId, user_id: user.id, amount_cents: amountCents },
        { onConflict: 'gift_idea_id,user_id' }
      )
    if (error) throw error
    await fetchContributions()
  }

  async function removeContribution() {
    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('gift_idea_id', giftId)
      .eq('user_id', user.id)
    if (error) throw error
    await fetchContributions()
  }

  return {
    contributions,
    myContribution,
    totalCents,
    loading,
    upsertContribution,
    removeContribution,
    refetch: fetchContributions,
  }
}
