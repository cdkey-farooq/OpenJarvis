import { describe, expect, it } from 'vitest';
import { exportConversations } from './conversation-export';

describe('conversation backup', () => {
  it('exports readable text and sources while excluding runtime payloads and secrets', () => {
    const data = JSON.parse(exportConversations([{
      id: 'c', title: 'Famille', createdAt: 1, updatedAt: 2, model: 'auto',
      messages: [{ id: 'm', role: 'assistant', content: 'Une archive française', timestamp: 3,
        researchSources: [{ref: 1, title: 'Archive', url: 'https://example.org'}],
        toolCalls: [{id: 't', tool: 'shell', arguments: 'sensitive', status: 'success'}],
        audio: {url: 'blob:temporary'},
      }],
    }], new Date('2026-10-25T12:00:00Z')));
    expect(data.version).toBe(1);
    expect(data.exportedAt).toBe('2026-10-25T12:00:00.000Z');
    expect(data.conversations[0].messages[0].content).toBe('Une archive française');
    expect(data.conversations[0].messages[0].researchSources).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain('sensitive');
    expect(JSON.stringify(data)).not.toContain('blob:temporary');
  });
  it('handles an empty history', () => {
    expect(JSON.parse(exportConversations([])).conversations).toEqual([]);
  });
});
