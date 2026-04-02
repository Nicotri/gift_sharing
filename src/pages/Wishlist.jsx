import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWishlist } from '../hooks/useWishlist'
import { useGroup } from '../hooks/useGroup'
import { Button, Modal, Input, Textarea, Spinner, Toast, StatusBadge, ProgressBar } from '../components/UI'
import styles from './Wishlist.module.css'

const EMOJIS = ['🎁','🎧','📚','🏺','👗','🎮','🍷','✈️','🌸','💍','🎸','🛴','🖼️','🏋️','🎨','👟','🎩','🌿','🧸','💻']

export default function Wishlist() {
  const { groupId, ownerId } = useParams()
  const { user, profile }   = useAuth()
  const navigate             = useNavigate()
  const isOwnList            = user?.id === ownerId
  const { members }          = useGroup(groupId)

  const owner = members.find(m => m.user_id === ownerId)?.profiles

  const {
    gifts, loading,
    addGift, deleteGift, blockGift, unblockGift
  } = useWishlist(groupId, ownerId)

  const [tab, setTab]         = useState('wishes')
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast]     = useState(null)
  const [form, setForm]       = useState({ emoji:'🎁', title:'', desc:'', price:'', linkLabel:'', linkUrl:'' })
  const [saving, setSaving]   = useState(false)

  const wishes  = gifts.filter(g => g.type === 'wish')
  const secrets = gifts.filter(g => g.type === 'secret')
  // Owner only sees received secrets (reveal)
  const visibleSecrets = isOwnList ? secrets.filter(g => g.status === 'received') : secrets

  async function handleAdd() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await addGift({
        emoji: form.emoji,
        title: form.title.trim(),
        description: form.desc.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        marketplaceLinks: form.linkUrl
          ? [{ label: form.linkLabel || 'Lien', url: form.linkUrl }]
          : [],
      })
      setForm({ emoji:'🎁', title:'', desc:'', price:'', linkLabel:'', linkUrl:'' })
      setShowAdd(false)
      setToast(isOwnList ? 'Vœu ajouté ! 🎁' : 'Idée secrète ajoutée 🤫')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleBlock(gift) {
    try {
      if (gift.status === 'blocked' && gift.blocked_by === user?.id) {
        await unblockGift(gift.id)
        setToast('Réservation annulée')
      } else {
        await blockGift(gift.id)
        setToast('Cadeau réservé 🔒')
      }
    } catch (e) { console.error(e) }
  }

  const displayTab = tab === 'wishes' ? wishes : visibleSecrets

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(`/group/${groupId}`)}>←</button>
        <div className={styles.ownerRow}>
          <div className={styles.ownerAvatar}>{owner?.emoji || '🙂'}</div>
          <div>
            <h1 className={`${styles.ownerName} display`}>
              {isOwnList ? 'Ma liste' : `Liste de ${owner?.display_name || '…'}`}
            </h1>
            <p className={styles.ownerSub}>{wishes.length} souhait{wishes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'wishes' ? styles.tabActive : ''}`}
            onClick={() => setTab('wishes')}
          >
            Souhaits ({wishes.length})
          </button>
          <button
            className={`${styles.tab} ${tab === 'secrets' ? styles.tabActive : ''}`}
            onClick={() => setTab('secrets')}
          >
            {isOwnList ? 'Reçus 🎁' : `Idées secrètes 🤫 (${secrets.length})`}
          </button>
        </div>
      </div>

      {/* Add button */}
      <div className={styles.addRow}>
        {(isOwnList && tab === 'wishes') || (!isOwnList && tab === 'secrets') ? (
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
            + {isOwnList ? 'Ajouter un vœu' : 'Ajouter une idée secrète'}
          </Button>
        ) : null}
      </div>

      {/* Gift list */}
      {loading ? (
        <div className={styles.loadingWrap}><Spinner /></div>
      ) : (
        <div className={`${styles.giftList} stagger`}>
          {displayTab.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>{tab === 'wishes' ? '🌟' : '🤫'}</div>
              <p className={styles.emptyText}>
                {tab === 'wishes'
                  ? isOwnList ? 'Ajoutez vos souhaits ici !' : 'Aucun souhait pour l\'instant'
                  : isOwnList ? 'Vos cadeaux surprises apparaîtront ici une fois reçus' : 'Soyez le premier à ajouter une idée !'}
              </p>
            </div>
          )}
          {displayTab.map(gift => (
            <GiftCard
              key={gift.id}
              gift={gift}
              isOwnList={isOwnList}
              userId={user?.id}
              onBlock={() => handleBlock(gift)}
              onClick={() => navigate(`/group/${groupId}/wishlist/${ownerId}/gift/${gift.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={isOwnList ? 'Ajouter un vœu 🎁' : `Idée secrète pour ${owner?.display_name} 🤫`}
      >
        <div>
          <label className={styles.fieldLabel}>Emoji</label>
          <div className={styles.emojiPicker}>
            {EMOJIS.map(e => (
              <button key={e}
                className={`${styles.emojiOpt} ${form.emoji === e ? styles.emojiOptSel : ''}`}
                onClick={() => setForm(f => ({ ...f, emoji: e }))}
              >{e}</button>
            ))}
          </div>
        </div>
        <Input label="Titre *" placeholder="Ex : Casque Sony WH-1000XM5" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
        <Textarea label="Description" placeholder="Modèle, couleur, taille…" value={form.desc}
          onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
        <Input label="Budget (€)" type="number" min="0" placeholder="0" value={form.price}
          onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        <div className={styles.linkRow}>
          <Input label="Site" placeholder="Amazon" value={form.linkLabel}
            onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))} />
          <Input label="URL" placeholder="https://…" value={form.linkUrl}
            onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={handleAdd} loading={saving}>
          Ajouter
        </Button>
      </Modal>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

/* ── GIFT CARD ────────────────────────────────────────────── */
function GiftCard({ gift, isOwnList, userId, onBlock, onClick }) {
  const priceFmt = gift.price_cents ? `${(gift.price_cents / 100).toFixed(0)} €` : null
  const displayStatus = isOwnList && gift.status !== 'received' ? 'available' : gift.status

  return (
    <div className={`${styles.giftCard} animate-fade-up`} onClick={onClick}>
      <div className={styles.giftEmoji}>{gift.emoji}</div>
      <div className={styles.giftBody}>
        <div className={styles.giftTitle}>{gift.title}</div>
        <div className={styles.giftMeta}>
          {priceFmt && <span className={styles.giftPrice}>{priceFmt}</span>}
          {gift.type === 'secret' && gift.author_name &&
            <span className={styles.giftAuthor}>💡 {gift.author_name}</span>}
        </div>
        <div className={styles.giftFooter}>
          <StatusBadge status={displayStatus} />
        </div>
      </div>
      {!isOwnList && !['received'].includes(gift.status) && (
        <button
          className={`${styles.blockBtn} ${gift.status === 'blocked' && gift.blocked_by === userId ? styles.blockBtnActive : ''}`}
          onClick={e => { e.stopPropagation(); onBlock() }}
          title={gift.status === 'blocked' && gift.blocked_by === userId ? 'Annuler' : 'Réserver'}
        >
          {gift.status === 'blocked' && gift.blocked_by === userId ? '🔓' : '🔒'}
        </button>
      )}
    </div>
  )
}
