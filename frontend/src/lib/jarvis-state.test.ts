import { describe, expect, it } from 'vitest';
import { resolveJarvisState } from './jarvis-state';
import type { StreamState } from '../types';

const stream: StreamState = {
  conversationId: 'one', isStreaming: false, phase: '', elapsedMs: 0,
  activeToolCalls: [], content: '',
};
const base = { stream, speech: 'idle' as const, tts: 'idle' as const, pendingApprovals: 0, error: false };

describe('JARVIS activity reflects actual application state', () => {
  it('is idle when nothing is active', () => expect(resolveJarvisState(base)).toBe('idle'));
  it('shows an open microphone even when an error exists', () => {
    expect(resolveJarvisState({ ...base, speech: 'recording', error: true })).toBe('listening');
  });
  it('shows errors ahead of stale approvals and playback', () => {
    expect(resolveJarvisState({ ...base, error: true, pendingApprovals: 1, tts: 'speaking' })).toBe('error');
  });
  it('requires review while an approval is pending', () => {
    expect(resolveJarvisState({ ...base, pendingApprovals: 1 })).toBe('approval');
  });
  it('distinguishes a running tool from token generation', () => {
    const active = { ...stream, isStreaming: true, content: 'Partial response', activeToolCalls: [
      { id: 'tool', tool: 'search', arguments: '{}', status: 'running' as const },
    ] };
    expect(resolveJarvisState({ ...base, stream: active })).toBe('executing');
    expect(resolveJarvisState({ ...base, stream: { ...active, activeToolCalls: [] } })).toBe('responding');
    expect(resolveJarvisState({ ...base, stream: { ...active, isStreaming: false } })).toBe('idle');
  });
  it('waits for content before showing a text reply', () => {
    expect(resolveJarvisState({ ...base, stream: { ...stream, isStreaming: true } })).toBe('thinking');
  });
  it('uses real TTS and transcription states', () => {
    expect(resolveJarvisState({ ...base, tts: 'speaking' })).toBe('responding');
    expect(resolveJarvisState({ ...base, tts: 'loading' })).toBe('thinking');
    expect(resolveJarvisState({ ...base, speech: 'transcribing' })).toBe('thinking');
  });
});
