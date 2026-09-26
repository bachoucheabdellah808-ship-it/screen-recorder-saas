import { useState, useEffect, useCallback } from 'react'
import { useScreenRecorder } from './hooks/useScreenRecorder'
import { RecorderView } from './components/RecorderView'
import { initSupabase, uploadRecording, formatBytes, isSupabaseReady, type StorageUploadResult } from './features/recorder/api/storage'
import './App.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function App() {
  const {
    isRecording,
    isPaused,
    hasRecording,
    elapsedTime,
    recordingBlob,
    error,
    mediaStream,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopStream,
    downloadRecording,
  } = useScreenRecorder()

  // Auth state
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  // Cloud recording state
  const [cloudRecordings, setCloudRecordings] = useState<StorageUploadResult[]>([])
  const [uploading, setUploading] = useState(false)
  const [view, setView] = useState<'record' | 'dashboard'>('record')

  // Initialise Supabase + auth on mount
  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn(
        '[ScreenRecorder] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
          'are not set. Cloud features are disabled. Add them to .env ' +
          'to enable cloud save and auth.',
      )
      setLoadingAuth(false)
      return
    }
    initSupabase({ projectUrl: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, bucket: 'recordings' })

    // Check existing session
    ;(async () => {
      let res;
      try {
        res = await fetch('/api/auth/session');
      } catch {
        setLoadingAuth(false);
        return;
      }
      if (res?.ok) {
        const json = await res.json()
        const session = (json as { data?: { session?: { user?: { id: string; email: string } } } }).data?.session
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! })
          await loadCloudRecordings()
        }
      }
      setLoadingAuth(false)
    })()
  }, [])

  // Load cloud recordings for the signed-in user
  const loadCloudRecordings = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/recordings')
      if (!res.ok) throw new Error('Failed to load recordings')
      const data = await res.json()
      setCloudRecordings(data)
    } catch {
      console.error('[ScreenRecorder] Could not load cloud recordings')
    }
  }, [user])

  // Save recording to cloud
  const saveToCloud = useCallback(async (blob: Blob, name: string) => {
    if (!isSupabaseReady() || !user) return
    setUploading(true)
    try {
      const result = await uploadRecording(blob, name, { bucket: 'recordings' })
      setCloudRecordings((prev) => [result, ...prev])
      return result
    } catch (err) {
      console.error('[ScreenRecorder] Cloud save failed:', err)
      throw err
    } finally {
      setUploading(false)
    }
  }, [user])

  // Handle recording done: show save options
  const handleRecordingDone = useCallback(() => {
    if (!hasRecording || !recordingBlob) return
    const name = `Recording-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
    // Try cloud save if authenticated, then fall back to local download
    ;(async () => {
      if (user && isSupabaseReady()) {
        try {
          await saveToCloud(recordingBlob, name)
        } catch {
          // fall through to local download
        }
      }
      downloadRecording()
    })()
  }, [hasRecording, recordingBlob, user, isSupabaseReady, saveToCloud, downloadRecording])

  if (loadingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Top bar */}
      <header className="top-bar">
        <div className="brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
          </svg>
          <span>Screen Recorder</span>
        </div>
        <nav className="top-nav">
          <button className={`nav-btn ${view === 'record' ? 'active' : ''}`} onClick={() => setView('record')}>
            Record
          </button>
          <button className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            Cloud ({cloudRecordings.length})
          </button>
        </nav>
        <div className="top-auth">
          {user ? (
            <div className="user-chip">
              <span className="user-email">{user.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                setUser(null)
                setCloudRecordings([])
                setView('record')
              }}>Sign out</button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={async () => {
              const email = prompt('Email:')
              if (!email) return
              const password = prompt('Password:')
              if (!password) return
              const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              })
              if (res.ok) {
                setUser({ id: 'placeholder', email })
                setView('record')
              }
            }}>Sign in</button>
          )}
        </div>
      </header>

      <main className="app-main">
        {view === 'record' ? (
          <RecorderView
            isRecording={isRecording}
            isPaused={isPaused}
            hasRecording={hasRecording}
            elapsedTime={elapsedTime}
            recordingBlob={recordingBlob}
            error={error}
            mediaStream={mediaStream}
            onStart={() => startRecording()}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={handleRecordingDone}
            onDownload={downloadRecording}
            onStopStream={stopStream}
            onSaveToCloud={recordingBlob ? () => saveToCloud(recordingBlob, `Recording-${Date.now()}`) : undefined}
            uploading={uploading}
          />
        ) : (
          <div className="dashboard">
            <h2>Your cloud recordings</h2>
            {cloudRecordings.length === 0 ? (
              <p className="empty-state">No recordings saved to the cloud yet. Record something and it will be saved here automatically when you are signed in.</p>
            ) : (
              <ul className="recording-list">
                {cloudRecordings.map((r) => (
                  <li key={r.path} className="recording-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
                    </svg>
                    <div className="recording-info">
                      <span className="recording-name">{r.path.split('/').pop()}</span>
                      <span className="recording-size">{formatBytes(r.sizeBytes)}</span>
                    </div>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">View</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
