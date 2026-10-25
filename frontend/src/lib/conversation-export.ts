import type { Conversation } from '../types';

/** Export user conversations only; never include settings or credentials. */
export function exportConversations(conversations: Conversation[], now = new Date()): string {
  return JSON.stringify({
    format: 'jarvis-conversations',
    version: 1,
    exportedAt: now.toISOString(),
    conversations: conversations.map(c => ({
      id: c.id, title: c.title, createdAt: c.createdAt, updatedAt: c.updatedAt,
      model: c.model,
      messages: c.messages.map(m => ({
        id: m.id, role: m.role, content: m.content, timestamp: m.timestamp,
        researchSources: m.researchSources,
      })),
    })),
  }, null, 2);
}
