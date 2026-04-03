import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Fetches everything needed for the Home dashboard:
 * - All groups the user belongs to + their members
 * - All gift ideas where the user has a contribution or reservation
 */
export function useDashboard() {
  const { user } = useAuth()
  const [groups,       setGroups]       = useState([])  // [{group, members}]
  const [myGifts,      setMyGifts]      = useState([])  // my wishlist items (own wishes)
  const [commitments,  setCommitments]  = useState([])  // gifts I'm involved in
  const [loading,      setLoading]      = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // 1. All group memberships + group info + all members of those groups
    const { data: memberships } = await supabase
      .from('group_members')
      .select(`
        role,
        group_id,
        groups ( id, name, emoji, invite_code ),
        profiles!group_members_user_id_fkey ( id, display_name, emoji )
      `)
      .eq('user_id', user.id)

    if (!memberships) { setLoading(false); return }

    // For each group, fetch all its members
    const groupIds = memberships.map(m => m.group_id)

    const { data: allMembers } = await supabase
      .from('group_members')
      .select('group_id, user_id, profiles ( id, display_name, emoji )')
      .in('group_id', groupIds)

    // Build groups array: [{group, members, myRole}]
    const groupMap = {}
    memberships.forEach(m => {
      groupMap[m.group_id] = {
        group:  m.groups,
        myRole: m.role,
        members: [],
      }
    })
    ;(allMembers || []).forEach(m => {
      if (groupMap[m.group_id]) {
        groupMap[m.group_id].members.push({ userId: m.user_id, profile: m.profiles })
      }
    })
    setGroups(Object.values(groupMap))

    // 2. My own wish items (owner view — from the privacy view)
    const { data: ownGifts } = await supabase
      .from('gift_ideas_owner_view')
      .select('*')
      .eq('wishlist_owner_id', user.id)
      .in('group_id', groupIds)
      .order('created_at', { ascending: true })
    setMyGifts(ownGifts || [])

    // 3. Gifts I'm committed to (contributions or blocks on others' lists)
    //    a) gifts I blocked
    const { data: blocked } = await supabase
      .from('gift_ideas')
      .select('*, groups ( name, emoji )')
      .eq('blocked_by', user.id)
      .neq('wishlist_owner_id', user.id)

    //    b) gifts I contributed to
    const { data: myContribs } = await supabase
      .from('contributions')
      .select('gift_idea_id')
      .eq('user_id', user.id)

    let contributed = []
    if (myContribs?.length) {
      const contribGiftIds = myContribs.map(c => c.gift_idea_id)
      const { data } = await supabase
        .from('gift_ideas')
        .select('*, groups ( name, emoji )')
        .in('id', contribGiftIds)
        .neq('wishlist_owner_id', user.id)
      contributed = data || []
    }

    // Merge, deduplicate by id
    const seen = new Set()
    const merged = [...(blocked || []), ...contributed].filter(g => {
      if (seen.has(g.id)) return false
      seen.add(g.id)
      return true
    })

    // Attach owner profile for display
    const ownerIds = [...new Set(merged.map(g => g.wishlist_owner_id))]
    let ownerProfiles = []
    if (ownerIds.length) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, emoji')
        .in('id', ownerIds)
      ownerProfiles = data || []
    }
    const ownerMap = Object.fromEntries(ownerProfiles.map(p => [p.id, p]))
    const withOwner = merged.map(g => ({ ...g, ownerProfile: ownerMap[g.wishlist_owner_id] }))

    setCommitments(withOwner)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime: refresh when gift_ideas change in any of user's groups
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`dashboard-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gift_ideas' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchAll])

  return { groups, myGifts, commitments, loading, refetch: fetchAll }
}
