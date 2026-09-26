export interface RecorderViewProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  elapsedTime: number;
  recordingBlob: Blob | null;
  error: string | null;
  mediaStream: MediaStream | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDownload: () => void;
  onStopStream: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RecorderView({
  isRecording,
  isPaused,
  hasRecording,
  elapsedTime,
  recordingBlob,
  error,
  mediaStream,
  onStart,
  onPause,
  onResume,
  onStop,
  onDownload,
  onStopStream,
}: RecorderViewProps) {
  return (
    <div className="recorder-app">
      <header className="recorder-header">
        <div className="brand">
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
            </svg>
          </div>
          <span>Screen Recorder</span>
        </div>
        <div className="header-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Local · No uploads
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={onStopStream} title="Reset">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 119 9"/>
              <path d="M3 3v6h6"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="recorder-main">
      {/* Preview Area */}
      <div className="preview-wrapper">
        {mediaStream && (
          <video
            className="preview-video"
            autoPlay
            playsInline
            muted
            ref={(el) => {
              if (el) {
                el.srcObject = mediaStream;
              }
            }}
          />
        )}
        {!mediaStream && !hasRecording && (
          <div className="preview-placeholder">
            <div className="placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
              </svg>
            </div>
            <h3>Your screen preview will appear here</h3>
            <p>Click "Start Recording" to begin</p>
          </div>
        )}
        {hasRecording && !mediaStream && (
          <video
            className="preview-video"
            src={recordingBlob ? URL.createObjectURL(recordingBlob) : undefined}
            controls
            autoPlay
            playsInline
          />
        )}
        {isRecording && (
          <div className="recording-badge">
            <span className="recording-dot" />
            <span>Recording</span>
          </div>
        )}
        {isPaused && (
          <div className="recording-badge paused">
            <span className="recording-dot" />
            <span>Paused</span>
          </div>
        )}
      </div>

        {/* Timer */}
        {(isRecording || isPaused) && (
          <div className="timer-display">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{formatTime(elapsedTime)}</span>
          </div>
        )}

        {/* Source Picker */}
        {!isRecording && !hasRecording && (
          <div className="source-picker-section">
            <h3 className="section-label">What would you like to record?</h3>
            <div className="source-options">
              <button
                className="source-card"
                onClick={onStart}
              >
                <div className="source-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <span>Entire Screen</span>
                <span className="source-hint">Record your full display</span>
              </button>
              <button
                className="source-card"
                onClick={onStart}
              >
                <div className="source-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                    <line x1="10" y1="10" x2="14" y2="10"/>
                  </svg>
                </div>
                <span>Application Window</span>
                <span className="source-hint">Pick a specific window</span>
              </button>
              <button
                className="source-card"
                onClick={onStart}
              >
                <div className="source-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span>Browser Tab</span>
                <span className="source-hint">Just the active tab</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
            <button className="error-close" onClick={onStopStream}>×</button>
          </div>
        )}

        {/* Controls */}
        <div className="controls-section">
          {!isRecording && !hasRecording && (
            <button className="btn btn-primary btn-start" onClick={onStart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Start Recording
            </button>
          )}

          {isRecording && !isPaused && (
            <>
              <button className="btn btn-secondary" onClick={onPause}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
                Pause
              </button>
              <button className="btn btn-danger" onClick={onStop}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                Stop
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button className="btn btn-primary" onClick={onResume}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Resume
              </button>
              <button className="btn btn-danger" onClick={onStop}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                Stop
              </button>
            </>
          )}

          {hasRecording && !mediaStream && (
            <div className="download-section">
              <div className="download-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="download-label">Recording ready!</p>
              <p className="download-meta">{recordingBlob?.size ? `(${(recordingBlob.size / 1024 / 1024).toFixed(2)} MB)` : ''}</p>
              <div className="download-actions">
                <button className="btn btn-primary" onClick={onDownload}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download WebM
                </button>
                <button className="btn btn-secondary" onClick={() => { onStopStream(); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                  </svg>
                  Record Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="info-footer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <pre
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
            }}
          >
            Recordings stay on your device. Nothing is uploaded. No accounts, no tracking, no cookies. WebM files work in any modern browser.
          </pre>
          &copy; 2026 Screen Recorder {'—'} <a href="https://electromenager.best" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>electromenager.best</a>
        </div>
      </main>
    </div>
  );
}
