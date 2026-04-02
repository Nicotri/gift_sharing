import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { Button, Input, Modal } from '../components/UI'
import styles from './Home.module.css'

const GROUP_EMOJIS = ['🏡','🎄','🎂','🌸','⭐','🎊','💝','🌈','🏖️','🍀']

export default function Home() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const { createGroup, joinGroup } = useGroup(null)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin,   setShowJoin]   = useState(false)
  const [groupName,  setGroupName]  = useState('')
  const [groupEmoji, setGroupEmoji] = useState('🏡')
  const [inviteCode, setInviteCode] = useState('')
  const [codeError,  setCodeError]  = useState('')
  const [loading,    setLoading]    = useState(false)

  async function handleCreate() {
    if (!groupName.trim()) return
    setLoading(true)
    try {
      const group = await createGroup({ name: groupName.trim(), emoji: groupEmoji })
      navigate(`/group/${group.id}`)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setLoading(true)
    setCodeError('')
    try {
      const groupId = await joinGroup(inviteCode.trim().toLowerCase())
      navigate(`/group/${groupId}`)
    } catch (e) {
      setCodeError('Code invalide ou expiré')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.greeting}>
          <span className={styles.greetingEmoji}>{profile?.emoji || '👋'}</span>
          <div>
            <p className={styles.greetingLine}>Bonjour,</p>
            <h1 className={`${styles.greetingName} display`}>{profile?.display_name || '…'}</h1>
          </div>
        </div>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroEmoji}>🎁</div>
        <h2 className={`${styles.heroTitle} display`}>Vos listes cadeaux</h2>
        <p className={styles.heroSub}>Centralisez vos idées et surprenez vos proches</p>
      </div>

      <div className={`${styles.actions} stagger`}>
        <button className={`${styles.actionCard} animate-fade-up`} onClick={() => setShowCreate(true)}>
          <div className={styles.actionIcon}>✨</div>
          <div>
            <div className={styles.actionTitle}>Créer un groupe</div>
            <div className={styles.actionSub}>Famille, amis, collègues…</div>
          </div>
          <span className={styles.actionArrow}>→</span>
        </button>

        <button className={`${styles.actionCard} animate-fade-up`} onClick={() => setShowJoin(true)}>
          <div className={styles.actionIcon}>🔗</div>
          <div>
            <div className={styles.actionTitle}>Rejoindre un groupe</div>
            <div className={styles.actionSub}>Avec un code d'invitation</div>
          </div>
          <span className={styles.actionArrow}>→</span>
        </button>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un groupe">
        <Input
          label="Nom du groupe"
          placeholder="Ex : Famille Martin"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />
        <div>
          <label className={styles.fieldLabel}>Icône</label>
          <div className={styles.emojiGrid}>
            {GROUP_EMOJIS.map(em => (
              <button
                key={em}
                className={`${styles.emojiBtn} ${groupEmoji === em ? styles.emojiBtnSel : ''}`}
                onClick={() => setGroupEmoji(em)}
              >{em}</button>
            ))}
          </div>
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={handleCreate} loading={loading}>
          Créer le groupe 🎉
        </Button>
      </Modal>

      {/* Join modal */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Rejoindre un groupe">
        <p className={styles.joinHint}>Demandez le code d'invitation à l'administrateur du groupe.</p>
        <Input
          label="Code d'invitation"
          placeholder="Ex : famille-martin-2024"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          error={codeError}
          autoFocus
        />
        <Button variant="primary" size="lg" fullWidth onClick={handleJoin} loading={loading}>
          Rejoindre →
        </Button>
      </Modal>
    </div>
  )
}
