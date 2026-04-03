import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { useDashboard } from '../hooks/useDashboard'
import { Button, Input, Modal, Skeleton, StatusBadge, Toast } from '../components/UI'
import styles from './Home.module.css'

const GROUP_EMOJIS = ['🏡','🎄','🎂','🌸','⭐','🎊','💝','🌈','🏖️','🍀']

export default function Home() {
  const { profile }  = useAuth()
  const navigate     = useNavigate()
  const { createGroup, joinGroup } = useGroup(null)
  const { groups, myGifts, commitments, loading, refetch } = useDashboard()

  const [showCreate,  setShowCreate]  = useState(false)
  const [showJoin,    setShowJoin]    = useState(false)
  const [showFAB,     setShowFAB]     = useState(false)
  const [groupName,   setGroupName]   = useState('')
  const [groupEmoji,  setGroupEmoji]  = useState('🏡')
  const [inviteCode,  setInviteCode]  = useState('')
  const [codeError,   setCodeError]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState(null)

  // Flatten all groups → individual members (excluding self)
  const otherMembers = []
  const seen = new Set()
  groups.forEach(({ group, members }) => {
    members.forEach(m => {
      if (!m.profile || seen.has(m.userId)) return
      seen.add(m.userId)
      otherMembers.push({ ...m, group })
    })
  })

  // My own group+id for "my wishlist" shortcut
  const myMembership = groups.length > 0 ? groups[0] : null

  async function handleCreate() {
    if (!groupName.trim()) return
    setSaving(true)
    try {
      const group = await createGroup({ name: groupName.trim(), emoji: groupEmoji })
      await refetch()
      setShowCreate(false)
      setShowFAB(false)
      setGroupName('')
      navigate(`/group/${group.id}`)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setSaving(true)
    setCodeError('')
    try {
      const groupId = await joinGroup(inviteCode.trim().toLowerCase())
      await refetch()
      setShowJoin(false)
      setShowFAB(false)
      setInviteCode('')
      navigate(`/group/${groupId}`)
    } catch (e) {
      setCodeError('Code invalide ou expiré')
    }
    setSaving(false)
  }

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.greeting}>
            <span className={styles.greetingEmoji}>{profile?.emoji || '🙂'}</span>
            <div>
              <p className={styles.greetingLine}>Bonjour,</p>
              <h1 className={`${styles.greetingName} display`}>{profile?.display_name || '…'}</h1>
            </div>
          </div>
          <div className={styles.appLogo}>🎁</div>
        </div>
      </div>

      <div className={styles.content}>

        {/* ── MY WISHLIST ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Ma liste</h2>
            {myMembership && (
              <button className={styles.sectionLink}
                onClick={() => navigate(`/group/${myMembership.group.id}/wishlist/${profile?.id || ''}`)}>
                Tout voir →
              </button>
            )}
          </div>

          {loading ? (
            <Skeleton height={100} />
          ) : myGifts.length === 0 && !myMembership ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>🌟</div>
              <p className={styles.emptyText}>Créez ou rejoignez un groupe pour commencer</p>
            </div>
          ) : (
            <div className={styles.myWishlistCard}
              onClick={() => myMembership && navigate(`/group/${myMembership.group.id}/wishlist/${profile?.id || ''}`)}>
              <div className={styles.myWishlistLeft}>
                <div className={styles.myWishlistEmoji}>{profile?.emoji || '🙂'}</div>
                <div>
                  <div className={styles.myWishlistName}>{profile?.display_name}</div>
                  <div className={styles.myWishlistCount}>
                    {myGifts.length} souhait{myGifts.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {myGifts.length > 0 && (
                <div className={styles.myWishlistPreviews}>
                  {myGifts.slice(0, 3).map(g => (
                    <span key={g.id} className={styles.previewEmoji}>{g.emoji}</span>
                  ))}
                  {myGifts.length > 3 && (
                    <span className={styles.previewMore}>+{myGifts.length - 3}</span>
                  )}
                </div>
              )}
              <span className={styles.cardArrow}>→</span>
            </div>
          )}
        </section>

        {/* ── OTHER PEOPLE'S WISHLISTS ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Listes de mes proches</h2>

          {loading ? (
            <div className={styles.memberGrid}>
              {[1,2,3].map(i => <Skeleton key={i} height={88} />)}
            </div>
          ) : otherMembers.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>👥</div>
              <p className={styles.emptyText}>Invitez des proches à rejoindre votre groupe</p>
            </div>
          ) : (
            <div className={`${styles.memberGrid} stagger`}>
              {otherMembers.map(m => (
                <button
                  key={m.userId}
                  className={`${styles.memberCard} animate-fade-up`}
                  onClick={() => navigate(`/group/${m.group.id}/wishlist/${m.userId}`)}
                >
                  <div className={styles.memberAvatar}
                    style={{ background: stringToColor(m.profile.display_name) }}>
                    {m.profile.emoji}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{m.profile.display_name}</div>
                    <div className={styles.memberGroup}>{m.group.emoji} {m.group.name}</div>
                  </div>
                  <span className={styles.cardArrow}>→</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── MY COMMITMENTS ── */}
        {(loading || commitments.length > 0) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Mes engagements</h2>

            {loading ? (
              <div className={styles.commitList}>
                {[1,2].map(i => <Skeleton key={i} height={72} />)}
              </div>
            ) : (
              <div className={`${styles.commitList} stagger`}>
                {commitments.map(gift => (
                  <button
                    key={gift.id}
                    className={`${styles.commitCard} animate-fade-up`}
                    onClick={() => navigate(`/group/${gift.group_id}/wishlist/${gift.wishlist_owner_id}/gift/${gift.id}`)}
                  >
                    <div className={styles.commitEmoji}>{gift.emoji}</div>
                    <div className={styles.commitInfo}>
                      <div className={styles.commitTitle}>{gift.title}</div>
                      <div className={styles.commitMeta}>
                        Pour {gift.ownerProfile?.display_name} · {gift.groups?.emoji} {gift.groups?.name}
                      </div>
                    </div>
                    <div className={styles.commitRight}>
                      <StatusBadge status={gift.status} />
                      {gift.price_cents && (
                        <div className={styles.commitPrice}>{(gift.price_cents / 100).toFixed(0)} €</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── GROUPS ── */}
        {groups.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Mes groupes</h2>
            <div className={`${styles.groupList} stagger`}>
              {groups.map(({ group, members, myRole }) => (
                <button
                  key={group.id}
                  className={`${styles.groupCard} animate-fade-up`}
                  onClick={() => navigate(`/group/${group.id}`)}
                >
                  <div className={styles.groupEmoji}>{group.emoji}</div>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupName}>{group.name}</div>
                    <div className={styles.groupMeta}>
                      {members.length} membre{members.length !== 1 ? 's' : ''}
                      {myRole === 'admin' && <span className={styles.adminBadge}>admin</span>}
                    </div>
                  </div>
                  <span className={styles.cardArrow}>→</span>
                </button>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── FAB ── */}
      <div className={styles.fabWrap}>
        {showFAB && (
          <div className={`${styles.fabMenu} animate-fade-up`}>
            <button className={styles.fabMenuItem} onClick={() => { setShowCreate(true); setShowFAB(false) }}>
              <span className={styles.fabMenuIcon}>✨</span>
              Créer un groupe
            </button>
            <button className={styles.fabMenuItem} onClick={() => { setShowJoin(true); setShowFAB(false) }}>
              <span className={styles.fabMenuIcon}>🔗</span>
              Rejoindre un groupe
            </button>
          </div>
        )}
        <button
          className={`${styles.fab} ${showFAB ? styles.fabOpen : ''}`}
          onClick={() => setShowFAB(v => !v)}
          aria-label="Actions"
        >
          {showFAB ? '✕' : '+'}
        </button>
      </div>
      {showFAB && <div className={styles.fabBackdrop} onClick={() => setShowFAB(false)} />}

      {/* ── CREATE MODAL ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un groupe">
        <Input label="Nom du groupe" placeholder="Ex : Famille Martin"
          value={groupName} onChange={e => setGroupName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
        <div>
          <label className={styles.fieldLabel}>Icône</label>
          <div className={styles.emojiGrid}>
            {GROUP_EMOJIS.map(em => (
              <button key={em}
                className={`${styles.emojiBtn} ${groupEmoji === em ? styles.emojiBtnSel : ''}`}
                onClick={() => setGroupEmoji(em)}>{em}</button>
            ))}
          </div>
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={handleCreate} loading={saving}>
          Créer le groupe 🎉
        </Button>
      </Modal>

      {/* ── JOIN MODAL ── */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Rejoindre un groupe">
        <p className={styles.joinHint}>Demandez le code d'invitation à l'administrateur du groupe.</p>
        <Input label="Code d'invitation" placeholder="Ex : famille-martin-2024"
          value={inviteCode} onChange={e => setInviteCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          error={codeError} autoFocus />
        <Button variant="primary" size="lg" fullWidth onClick={handleJoin} loading={saving}>
          Rejoindre →
        </Button>
      </Modal>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function stringToColor(str = '') {
  const colors = ['#FFE5D4','#D4F0E5','#D4E5F0','#F0D4E5','#F0EDD4','#E5D4F0']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
