import { useParams, useNavigate } from 'react-router-dom'
import { useGroup } from '../hooks/useGroup'
import { useAuth } from '../hooks/useAuth'
import { Spinner, Skeleton, Toast } from '../components/UI'
import { useState } from 'react'
import styles from './Group.module.css'

export default function Group() {
  const { groupId }  = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { group, members, loading } = useGroup(groupId)
  const [toast, setToast] = useState(null)

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${group.invite_code}`
    navigator.clipboard.writeText(link)
    setToast('Lien copié ! 📋')
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.heroSkeleton}><Skeleton height={160} /></div>
      <div style={{ padding: '16px' }}>
        {[1,2,3].map(i => <Skeleton key={i} height={76} className={styles.memberSkeleton} />)}
      </div>
    </div>
  )

  if (!group) return <div className={styles.page}><p style={{padding:40,textAlign:'center',color:'var(--text-light)'}}>Groupe introuvable.</p></div>

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>←</button>
        <div className={styles.heroContent}>
          <div className={styles.groupEmoji}>{group.emoji}</div>
          <h1 className={`${styles.groupName} display`}>{group.name}</h1>
          <p className={styles.groupMeta}>{members.length} membre{members.length > 1 ? 's' : ''}</p>
        </div>
        <button className={styles.inviteBtn} onClick={copyInviteLink}>
          🔗 Inviter
        </button>
      </div>

      {/* Members */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Membres &amp; leurs listes</div>
        <div className={`${styles.memberList} stagger`}>
          {members.map(m => {
            const isMe = m.user_id === user?.id
            return (
              <button
                key={m.id}
                className={`${styles.memberCard} animate-fade-up`}
                onClick={() => navigate(`/group/${groupId}/wishlist/${m.user_id}`)}
              >
                <div className={styles.memberAvatar} style={{ background: stringToColor(m.profiles?.display_name || '') }}>
                  {m.profiles?.emoji || '🙂'}
                </div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>
                    {m.profiles?.display_name || 'Membre'}
                    {isMe && <span className={styles.meBadge}>moi</span>}
                  </div>
                  <div className={styles.memberRole}>{m.role === 'admin' ? 'Administrateur' : 'Membre'}</div>
                </div>
                <span className={styles.memberArrow}>→</span>
              </button>
            )
          })}
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

// Deterministic pastel bg from name
function stringToColor(str) {
  const colors = ['#FFE5D4','#D4F0E5','#D4E5F0','#F0D4E5','#F0EDD4','#E5D4F0']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
