import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useGroup(groupId) {
  const { user } = useAuth()
  const [group, setGroup]     = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchGroup = useCallback(async () => {
    if (!groupId || !user) return
    setLoading(true)

    const { data: g, error: ge } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle()

    if (ge) { setError(ge.message); setLoading(false); return }
    setGroup(g)

    const { data: m } = await supabase
      .from('group_members')
      .select('*, profiles(*)')
      .eq('group_id', groupId)

    setMembers(m || [])
    setLoading(false)
  }, [groupId, user])

  useEffect(() => { fetchGroup() }, [fetchGroup])

  // Realtime: member joins/leaves
  useEffect(() => {
    if (!groupId) return
    const channel = supabase
      .channel(`group-members-${groupId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'group_members',
        filter: `group_id=eq.${groupId}`
      }, () => fetchGroup())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [groupId, fetchGroup])

  // Use the SECURITY DEFINER function — avoids RLS issues for anonymous users
  async function createGroup({ name, emoji }) {
    const { data, error } = await supabase
      .rpc('create_group', { p_name: name, p_emoji: emoji })

    if (error) throw error

    // Fetch the full group row to return it
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', data)
      .single()

    return group
  }

  async function joinGroup(inviteCode) {
    const { data, error } = await supabase
      .rpc('join_group_by_code', { code: inviteCode })
    if (error) throw error
    return data
  }

  return { group, members, loading, error, createGroup, joinGroup, refetch: fetchGroup }
}
