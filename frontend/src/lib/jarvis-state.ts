import type { SpeechState } from '../hooks/useSpeech';
import type { StreamState } from '../types';
import type { TtsState } from './tts';

export type JarvisState = 'idle' | 'listening' | 'thinking' | 'responding' | 'executing' | 'error' | 'approval';

export const JARVIS_LABELS: Record<JarvisState, string> = {
  idle: 'En veille', listening: 'À votre écoute', thinking: 'Réflexion en cours',
  responding: 'Réponse en cours', executing: 'Exécution en cours',
  error: 'Attention requise', approval: 'Validation nécessaire',
};

/** Only actual application signals drive the core. Never infer readiness from animation. */
export function resolveJarvisState(input: {
  speech: SpeechState;
  tts: TtsState;
  stream: StreamState;
  pendingApprovals: number;
  error: boolean;
}): JarvisState {
  if (input.speech === 'recording') return 'listening';
  if (input.error) return 'error';
  if (input.pendingApprovals > 0) return 'approval';
  if (input.stream.isStreaming && input.stream.activeToolCalls.some(t => t.status === 'running')) return 'executing';
  if (input.tts === 'speaking') return 'responding';
  if (input.stream.isStreaming) return input.stream.content ? 'responding' : 'thinking';
  if (input.speech === 'transcribing' || input.tts === 'loading') return 'thinking';
  return 'idle';
}
