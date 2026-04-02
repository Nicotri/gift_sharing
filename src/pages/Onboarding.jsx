import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, Input } from '../components/UI'
import styles from './Onboarding.module.css'

const EMOJIS = ['🙂','😄','😎','🥳','🤗','😍','🧑','👩','👨','🧒','👴','👵','🧔','👸','🤴']

export default function Onboarding() {
  const { signInAnonymously } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]         = useState('name') // 'name' | 'emoji'
  const [name, setName]         = useState('')
  const [emoji, setEmoji]       = useState('🙂')
  const [nameError, setNameError] = useState('')
  const [loading, setLoading]   = useState(false)

  function handleNameNext() {
    if (!name.trim()) { setNameError('Entrez votre prénom'); return }
    setNameError('')
    setStep('emoji')
  }

  async function handleFinish() {
    setLoading(true)
    try {
      await signInAnonymously({ displayName: name.trim(), emoji })
      navigate('/')
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.content}>
        {/* Logo */}
        <div className={`${styles.logoWrap} animate-pop`}>
          <div className={styles.logoEmoji}>🎁</div>
          <h1 className={`${styles.appName} display`}>Wishlist</h1>
          <p className={styles.tagline}>Partagez vos envies, surprenez vos proches</p>
        </div>

        {/* Steps */}
        <div className={`${styles.card} animate-fade-up`} style={{ animationDelay: '0.1s' }}>
          {step === 'name' && (
            <div className={styles.stepContent}>
              <div className={styles.stepHeader}>
                <div className={styles.stepIcon}>👋</div>
                <h2 className={`${styles.stepTitle} display`}>Bonjour !</h2>
                <p className={styles.stepSub}>Comment vous appelez-vous ?</p>
              </div>
              <Input
                label="Votre prénom"
                placeholder="Ex : Sophie"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                error={nameError}
                autoFocus
              />
              <Button variant="primary" size="lg" fullWidth onClick={handleNameNext}>
                Continuer →
              </Button>
            </div>
          )}

          {step === 'emoji' && (
            <div className={styles.stepContent}>
              <div className={styles.stepHeader}>
                <div className={styles.stepIcon} style={{ fontSize: 48 }}>{emoji}</div>
                <h2 className={`${styles.stepTitle} display`}>Bonjour, {name} !</h2>
                <p className={styles.stepSub}>Choisissez votre avatar</p>
              </div>
              <div className={styles.emojiGrid}>
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    className={`${styles.emojiBtn} ${emoji === e ? styles.emojiBtnSelected : ''}`}
                    onClick={() => setEmoji(e)}
                    aria-label={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className={styles.stepActions}>
                <Button variant="ghost" size="md" onClick={() => setStep('name')}>← Retour</Button>
                <Button variant="primary" size="md" style={{ flex: 1 }} onClick={handleFinish} loading={loading}>
                  C'est parti 🎉
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className={styles.disclaimer}>
          Aucun compte requis · Vos données restent privées
        </p>
      </div>
    </div>
  )
}
