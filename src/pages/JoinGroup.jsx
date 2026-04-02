import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { Spinner } from '../components/UI'
import styles from './JoinGroup.module.css'

export default function JoinGroup() {
  const { code }    = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const { joinGroup } = useGroup(null)
  const [status, setStatus] = useState('joining') // 'joining' | 'error'
  const [error,  setError]  = useState('')

  useEffect(() => {
    if (!user || !code) return

    async function join() {
      try {
        const groupId = await joinGroup(code)
        navigate(`/group/${groupId}`, { replace: true })
      } catch (e) {
        setError('Ce lien d\'invitation est invalide ou a expiré.')
        setStatus('error')
      }
    }
    join()
  }, [user, code]) // eslint-disable-line

  return (
    <div className={styles.page}>
      {status === 'joining' && (
        <>
          <Spinner size={40} />
          <p className={styles.text}>Rejoindre le groupe…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className={styles.errorIcon}>😕</div>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.backLink} onClick={() => navigate('/')}>← Retour à l'accueil</button>
        </>
      )}
    </div>
  )
}
