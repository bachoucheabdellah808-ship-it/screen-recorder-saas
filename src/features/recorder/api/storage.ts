import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Storage API client for Screen Recorder SaaS
 *
 * Stores user recordings in Google Cloud Storage via Supabase.
 * All uploads are encrypted at rest (Supabase default).
 *
 * Phase 1: recorder is local-only (download as WebM).
 * Phase 2: upload recordings to the cloud so users can
 *           access them from any device + add a dashboard.
 */

export interface StorageUploadResult {
  url: string;
  path: string;
  sizeBytes: number;
}

export interface StorageConfig {
  projectUrl: string;
  anonKey: string;
  bucket: string;
  folder?: string;
}

let supabase: SupabaseClient | null = null;

export function initSupabase(config: StorageConfig): void {
  supabase = createClient(config.projectUrl, config.anonKey);
  console.info('[ScreenRecorder] Supabase client initialised');
}

export function isSupabaseReady(): boolean {
  return supabase !== null;
}

export async function uploadRecording(
  blob: Blob,
  name: string,
  config?: Partial<StorageConfig>,
): Promise<StorageUploadResult> {
  if (!supabase) {
    throw new Error('Supabase not initialised. Call initSupabase() first.');
  }
  const folder = config?.folder ?? 'recordings';
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  const path = `${folder}/${slug}-${Date.now()}.webm`;
  const { error } = await supabase
    .storage
    .from(config?.bucket ?? 'recordings')
    .upload(path, blob, { contentType: 'video/webm', upsert: false });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  const { data: urlData } = supabase
    .storage
    .from(config?.bucket ?? 'recordings')
    .getPublicUrl(path);
  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) throw new Error('Could not generate public URL.');
  return { url: publicUrl, path, sizeBytes: blob.size };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
