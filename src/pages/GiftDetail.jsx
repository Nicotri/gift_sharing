import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWishlist } from '../hooks/useWishlist'
import { useContributions } from '../hooks/useContributions'
import { useGroup } from '../hooks/useGroup'
import { Button, Toast, StatusBadge, ProgressBar, Spinner } from '../components/UI'
import styles from './GiftDetail.module.css'

export default function GiftDetail() {
  const { groupId, ownerId, giftId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOwnList = user?.id === ownerId
  const { members } = useGroup(groupId)

  const { gifts, loading, blockGift, unblockGift, markReceived } = useWishlist(groupId, ownerId)
  const gift = gifts.find(g => g.id === giftId)

  const {
    contributions, myContribution, totalCents,
    upsertContribution, removeContribution
  } = useContributions(giftId, isOwnList)

  const [contribInput, setContribInput] = useState('')
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)
  const [showReveal, setShowReveal] = useState(false)

  if (loading) return <div className={styles.loadWrap}><Spinner /></div>
  if (!gift)   return <div className={styles.loadWrap}><p>Cadeau introuvable.</p></div>

  if (showReveal) return (
    <RevealScreen
      gift={gift}
      contributions={contributions}
      members={members}
      onBack={() => navigate(`/group/${groupId}/wishlist/${ownerId}`)}
    />
  )

  const priceFmt     = gift.price_cents ? (gift.price_cents / 100) : null
  const totalFmt     = (totalCents / 100).toFixed(0)
  const remaining    = priceFmt ? Math.max(0, priceFmt - totalCents / 100).toFixed(0) : null
  const displayStatus = isOwnList && gift.status !== 'received' ? 'available' : gift.status
  const canContrib   = !isOwnList && gift.price_cents && gift.status !== 'blocked' && gift.status !== 'received'
  const canBlock     = !isOwnList && !gift.price_cents && gift.status !== 'received'
  const canReceive   = isOwnList && ['blocked','partial','full'].includes(gift.status)

  async function handleContrib() {
    const amt = parseFloat(contribInput)
    if (!amt || amt <= 0) return
    setSaving(true)
    try {
      await upsertContribution(amt)
      setContribInput('')
      setToast(myContribution ? 'Contribution modifiée ✓' : 'Vous avez rejoint la cagnotte 🎉')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleRemoveContrib() {
    setSaving(true)
    try { await removeContribution(); setToast('Contribution retirée') }
    catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleBlock() {
    setSaving(true)
    try {
      if (gift.status === 'blocked' && gift.blocked_by === user?.id) {
        await unblockGift(gift.id); setToast('Réservation annulée')
      } else {
        await blockGift(gift.id); setToast('Cadeau réservé 🔒')
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleReceived() {
    setSaving(true)
    try { await markReceived(gift.id); setShowReveal(true) }
    catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <button className={styles.backBtn}
          onClick={() => navigate(`/group/${groupId}/wishlist/${ownerId}`)}>←</button>
        <span className={styles.topbarTitle}>{gift.title}</span>
      </div>

      {/* Hero image / emoji */}
      <div className={styles.hero}>
        <div className={styles.heroEmoji}>{gift.emoji}</div>
      </div>

      <div className={styles.body}>
        {/* Title + status */}
        <div className={styles.titleRow}>
          <div>
            <h1 className={`${styles.title} display`}>{gift.title}</h1>
            {priceFmt && <div className={styles.price}>{priceFmt} €</div>}
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        {/* Description */}
        {gift.description && <p className={styles.desc}>{gift.description}</p>}

        {/* Secret idea author */}
        {gift.type === 'secret' && !isOwnList && (
          <div className={styles.authorCard}>
            <span className={styles.authorIcon}>💡</span>
            <div>
              <div className={styles.authorLabel}>Idée proposée par</div>
              <div className={styles.authorName}>
                {members.find(m => m.user_id === gift.created_by)?.profiles?.display_name || 'Un membre'}
              </div>
            </div>
          </div>
        )}

        {/* Marketplace links */}
        {gift.marketplace_links?.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Où trouver ce cadeau</div>
            <div className={styles.linksRow}>
              {gift.marketplace_links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  className={styles.marketLink} onClick={e => e.stopPropagation()}>
                  🛒 {l.label} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── CAGNOTTE (contributions) ── */}
        {canContrib && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Cagnotte</div>
            <ProgressBar
              value={totalCents / 100}
              max={priceFmt}
              label={`${totalFmt} € collectés · ${remaining} € restants`}
            />
            {contributions.length > 0 && (
              <div className={styles.participants}>
                <span className={styles.participantsLabel}>Participants :</span>
                {contributions.map(c => (
                  <span key={c.id} className={styles.participantChip}>
                    {members.find(m => m.user_id === c.user_id)?.profiles?.emoji || '🙂'}
                    {' '}
                    {members.find(m => m.user_id === c.user_id)?.profiles?.display_name || 'Membre'}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.contribInputRow}>
              <input
                className={styles.amountInput}
                type="number" min="1"
                placeholder={myContribution ? `Mon apport actuel : ${(myContribution.amount_cents/100).toFixed(0)} €` : 'Mon apport (€)'}
                value={contribInput}
                onChange={e => setContribInput(e.target.value)}
              />
              <Button variant="sage" size="sm" onClick={handleContrib} loading={saving && !!contribInput}>
                {myContribution ? 'Modifier' : 'Rejoindre'}
              </Button>
            </div>
            {myContribution && (
              <Button variant="text" size="sm" onClick={handleRemoveContrib} style={{ marginTop: 4 }}>
                Retirer ma contribution
              </Button>
            )}
          </div>
        )}

        {/* ── BLOCK (no price) ── */}
        {canBlock && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Réservation</div>
            {gift.status === 'blocked' && gift.blocked_by !== user?.id ? (
              <div className={styles.blockedNotice}>🔒 Déjà réservé par quelqu'un d'autre</div>
            ) : (
              <Button
                variant={gift.status === 'blocked' ? 'ghost' : 'primary'}
                size="md" fullWidth
                onClick={handleBlock} loading={saving}
              >
                {gift.status === 'blocked' && gift.blocked_by === user?.id
                  ? '🔓 Annuler ma réservation'
                  : '🔒 Réserver ce cadeau'}
              </Button>
            )}
          </div>
        )}

        {/* ── CONTRIBUTIONS visible to owner AFTER received ── */}
        {isOwnList && gift.status === 'received' && contributions.length > 0 && (
          <div className={`${styles.section} ${styles.revealSection}`}>
            <div className={styles.sectionTitle}>Offert par</div>
            <div className={styles.revealParticipants}>
              {contributions.map(c => {
                const m = members.find(mb => mb.user_id === c.user_id)?.profiles
                return (
                  <div key={c.id} className={styles.revealChip}>
                    <span className={styles.revealEmoji}>{m?.emoji || '🙂'}</span>
                    <span>{m?.display_name || 'Membre'}</span>
                  </div>
                )
              })}
            </div>
            <div className={styles.revealTotal}>Total collecté : {totalFmt} €</div>
          </div>
        )}

        {/* ── MARK RECEIVED ── */}
        {canReceive && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Vous avez reçu ce cadeau ?</div>
            <Button variant="primary" size="md" fullWidth onClick={handleReceived} loading={saving}>
              🎁 Marquer comme reçu
            </Button>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

/* ── REVEAL SCREEN ───────────────────────────────────────── */
function RevealScreen({ gift, contributions, members, onBack }) {
  const totalFmt = (contributions.reduce((s, c) => s + (c.amount_cents || 0), 0) / 100).toFixed(0)

  return (
    <div className={styles.revealPage}>
      <div className={`${styles.revealEmoji} animate-pop`}>🎉</div>
      <h1 className={`${styles.revealTitle} display`}>Vous avez reçu</h1>
      <p className={styles.revealGiftName}>{gift.emoji} {gift.title}</p>

      <div className={`${styles.revealCard} animate-fade-up`} style={{ animationDelay: '0.15s' }}>
        <div className={styles.revealCardTitle}>Offert par</div>
        <div className={styles.revealNames}>
          {contributions.map(c => {
            const m = members.find(mb => mb.user_id === c.user_id)?.profiles
            return (
              <div key={c.id} className={styles.revealName}>
                <span>{m?.emoji || '🙂'}</span>
                <span>{m?.display_name || 'Membre'}</span>
              </div>
            )
          })}
        </div>
        {parseFloat(totalFmt) > 0 && (
          <div className={styles.revealAmount}>{totalFmt} € collectés 💝</div>
        )}
      </div>

      <button className={`${styles.revealBackBtn} animate-fade-up`}
        style={{ animationDelay: '0.25s' }} onClick={onBack}>
        Merci à tous 💌
      </button>
    </div>
  )
}
