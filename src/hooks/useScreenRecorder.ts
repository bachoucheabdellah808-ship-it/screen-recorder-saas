import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseScreenRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  elapsedTime: number;
  recordingBlob: Blob | null;
  error: string | null;
  mediaStream: MediaStream | null;
  startRecording: (sourceType?: 'screen' | 'window' | 'tab') => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Blob | null;
  downloadRecording: () => void;
  stopStream: () => void;
}

const MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
];

function getSupportedMimeType(): string {
  for (const mime of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'video/webm';
}

export function useScreenRecorder(): UseScreenRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const elapsedIntervalRef = useRef<number | null>(null);
  const pauseDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  // Clean up on unmount — security: release all media tracks and blobs
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setMediaStream(null);
      setIsRecording(false);
      setIsPaused(false);
      setHasRecording(false);
      setRecordingBlob(null);
    };
  }, []);

  const startElapsedTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    pauseDurationRef.current = 0;
    elapsedIntervalRef.current = window.setInterval(() => {
      const pausedTime = isPaused ? pauseDurationRef.current : 0;
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current - pausedTime) / 1000));
    }, 1000);
  }, [isPaused]);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (sourceType: 'screen' | 'window' | 'tab' = 'screen') => {
    setError(null);
    chunksRef.current = [];

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        stopStream();
      }

      // Build video+audio constraints for the chosen source.
      // Some options (cursor, displaySurfaceFallback) are hints only —
      // browsers silently ignore unsupported ones.
      const videoHints = {
        cursor: 'always' as const,
        displaySurfaceFallback: 'window' as const,
      };

      const audioHints = {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      };

      let stream: MediaStream;

      if (sourceType === 'screen' || sourceType === 'window' || sourceType === 'tab') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: videoHints as MediaTrackConstraints,
          audio: audioHints as MediaTrackConstraints,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: audioHints,
        });
      }

      if (!stream) {
        throw new Error('No media stream received');
      }

      streamRef.current = stream;
      setMediaStream(stream);

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps for good quality
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopElapsedTimer();
        setIsRecording(false);
        setIsPaused(false);
        pauseDurationRef.current = 0;

        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setRecordingBlob(blob);
          setHasRecording(true);
        }
      };

      recorder.onerror = (event) => {
        setError(`Recording error: ${event.type}`);
        setIsRecording(false);
        setIsPaused(false);
      };

      // Start recording with 1-second intervals for chunk collection
      recorder.start(1000);
      setIsRecording(true);
      startElapsedTimer();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setIsRecording(false);
      setIsPaused(false);
      throw err;
    }
  }, [startElapsedTimer, stopElapsedTimer]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.pause();
      setIsPaused(true);
      pauseStartTimeRef.current = Date.now();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'paused') {
      recorder.resume();
      setIsPaused(false);
      pauseDurationRef.current += Date.now() - pauseStartTimeRef.current;
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
      recorder.stop();
      stopElapsedTimer();
      setIsRecording(false);
      setIsPaused(false);
      return chunksRef.current.length > 0
        ? new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        : null;
    }
    return null;
  }, [stopElapsedTimer]);

  const downloadRecording = useCallback(() => {
    if (!recordingBlob) return;

    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordingBlob]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMediaStream(null);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  return {
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
    stopRecording,
    downloadRecording,
    stopStream,
  };
}
