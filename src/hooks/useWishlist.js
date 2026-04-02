import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useWishlist(groupId, ownerId) {
  const { user } = useAuth()
  const [gifts, setGifts]   = useState([])
  const [loading, setLoading] = useState(true)
  const isOwnList = user?.id === ownerId

  const fetchGifts = useCallback(async () => {
    if (!groupId || !ownerId || !user) return
    setLoading(true)

    if (isOwnList) {
      // Owner uses the privacy view — sees only wishes, status always 'available'
      const { data } = await supabase
        .from('gift_ideas_owner_view')
        .select('*')
        .eq('group_id', groupId)
        .eq('wishlist_owner_id', ownerId)
        .order('created_at', { ascending: true })
      setGifts(data || [])
    } else {
      // Non-owner sees everything including secrets
      const { data } = await supabase
        .from('gift_ideas')
        .select('*')
        .eq('group_id', groupId)
        .eq('wishlist_owner_id', ownerId)
        .order('created_at', { ascending: true })
      setGifts(data || [])
    }
    setLoading(false)
  }, [groupId, ownerId, user, isOwnList])

  useEffect(() => { fetchGifts() }, [fetchGifts])

  // Realtime subscription
  useEffect(() => {
    if (!groupId || !ownerId) return
    const channel = supabase
      .channel(`gifts-${groupId}-${ownerId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'gift_ideas',
        filter: `group_id=eq.${groupId}`
      }, () => fetchGifts())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [groupId, ownerId, fetchGifts])

  async function addGift(giftData) {
    const payload = {
      group_id: groupId,
      wishlist_owner_id: ownerId,
      created_by: user.id,
      type: isOwnList ? 'wish' : 'secret',
      title: giftData.title,
      description: giftData.description || null,
      emoji: giftData.emoji || '🎁',
      price_cents: giftData.price ? Math.round(giftData.price * 100) : null,
      marketplace_links: giftData.marketplaceLinks || [],
      status: 'available',
    }
    const { data, error } = await supabase
      .from('gift_ideas')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateGift(giftId, updates) {
    const { data, error } = await supabase
      .from('gift_ideas')
      .update(updates)
      .eq('id', giftId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function deleteGift(giftId) {
    const { error } = await supabase
      .from('gift_ideas')
      .delete()
      .eq('id', giftId)
    if (error) throw error
  }

  async function blockGift(giftId) {
    return updateGift(giftId, { status: 'blocked', blocked_by: user.id })
  }

  async function unblockGift(giftId) {
    return updateGift(giftId, { status: 'available', blocked_by: null })
  }

  async function markReceived(giftId) {
    const { error } = await supabase.rpc('mark_gift_received', { gift_id: giftId })
    if (error) throw error
    await fetchGifts()
  }

  return {
    gifts,
    loading,
    isOwnList,
    addGift,
    updateGift,
    deleteGift,
    blockGift,
    unblockGift,
    markReceived,
    refetch: fetchGifts,
  }
}
