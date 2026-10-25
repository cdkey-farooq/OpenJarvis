import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Activity, ArrowUpRight, Cpu, Gauge, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { useTtsStore } from '../../lib/tts';
import { apiFetch, fetchPendingApprovals } from '../../lib/api';
import { resolveJarvisState } from '../../lib/jarvis-state';
import type { SpeechState } from '../../hooks/useSpeech';
import { exportConversations } from '../../lib/conversation-export';
import { JarvisCore } from './JarvisCore';
import './jarvis.css';

interface Snapshot {
  engine: string; model: string; agent: string | null;
  cpu_percent: number | null; ram_percent: number | null;
  process_ram_mb: number | null; uptime_seconds: number;
}

export function CommandCenter({ speech, inputError, compact }: {
  speech: SpeechState; inputError: boolean; compact: boolean;
}) {
  const conversations = useAppStore(s => s.conversations);
  const [exportError, setExportError] = useState('');
  const downloadHistory = () => {
    setExportError('');
    try {
      const blob = new Blob([exportConversations(conversations)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jarvis-conversations-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setExportError('Impossible de télécharger les conversations.'); }
  };
  const stream = useAppStore(s => s.streamState);
  const selectedModel = useAppStore(s => s.selectedModel);
  const apiUrl = useAppStore(s => s.settings.apiUrl);
  const apiKey = useAppStore(s => s.settings.apiKey);
  const tts = useTtsStore(s => s.state);
  const ttsError = useTtsStore(s => s.error);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [connection, setConnection] = useState<'checking' | 'connected' | 'error'>('checking');
  const [approvals, setApprovals] = useState<number | null>(null);
  const [simplified, setSimplified] = useState(() => {
    try { return localStorage.getItem('jarvis-simplified') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    setSnapshot(null);
    setConnection('checking');
    setApprovals(null);
    const poll = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 8000);
      try {
        const res = await apiFetch('/v1/command-center', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Snapshot = await res.json();
        if (!cancelled) { setSnapshot(data); setConnection('connected'); }
      } catch {
        if (!cancelled) { setSnapshot(null); setConnection('error'); }
      }
      // No overlapping polls. Approval errors remain unknown, never a false zero.
      try {
        const pending = await fetchPendingApprovals(controller.signal);
        if (!cancelled) setApprovals(pending.length);
      } catch { if (!cancelled) setApprovals(null); }
      clearTimeout(timeout);
      if (!cancelled) timer = setTimeout(poll, 10000);
    };
    void poll();
    return () => { cancelled = true; clearTimeout(timer); controller?.abort(); };
  }, [apiUrl, apiKey]);

  const state = resolveJarvisState({
    speech, tts, stream, pendingApprovals: approvals ?? 0,
    error: connection === 'error' || inputError || Boolean(ttsError),
  });
  const percent = (n: number | null | undefined) => n == null ? 'Indisponible' : `${n.toFixed(1)} %`;
  const toggleGraphics = () => {
    setSimplified(!simplified);
    try { localStorage.setItem('jarvis-simplified', String(!simplified)); } catch { /* Session only. */ }
  };

  return (
    <section className={`jarvis-command ${compact ? 'is-compact' : ''}`} aria-label="Centre de commande JARVIS">
      <header className="jarvis-command-header">
        <span><Activity size={13} /> CENTRE DE COMMANDE <b>01</b></span>
        <button onClick={toggleGraphics} aria-pressed={simplified}><Gauge size={13} />Mode léger {simplified ? 'actif' : 'inactif'}</button>
      </header>
      <div className="jarvis-command-grid">
        <JarvisCore state={state} compact={compact} simplified={simplified} />
        <aside className="jarvis-status" aria-label="État du backend">
          <div className="jarvis-status-title"><Cpu size={15} /> TÉLÉMÉTRIE RÉELLE</div>
          <dl>
            <div><dt>Backend</dt><dd className={connection === 'error' ? 'jarvis-warning' : ''}>{connection === 'connected' ? 'Connecté' : connection === 'checking' ? 'Vérification…' : 'Injoignable'}</dd></div>
            <div><dt>Moteur configuré</dt><dd>{snapshot?.engine || 'Indisponible'}</dd></div>
            <div><dt>Modèle sélectionné</dt><dd>{selectedModel || snapshot?.model || 'À configurer'}</dd></div>
            <div><dt>Agent configuré</dt><dd>{snapshot ? snapshot.agent || 'Conversation directe' : 'Indisponible'}</dd></div>
            {!compact && <><div><dt>CPU du serveur</dt><dd>{percent(snapshot?.cpu_percent)}</dd></div>
              <div><dt>RAM du serveur</dt><dd>{percent(snapshot?.ram_percent)}</dd></div>
              <div><dt>RAM OpenJarvis</dt><dd>{snapshot?.process_ram_mb == null ? 'Indisponible' : `${snapshot.process_ram_mb.toFixed(0)} Mo`}</dd></div></>}
            <div><dt>Autorisations en attente</dt><dd>{approvals ?? 'Indisponible'}</dd></div>
          </dl>
          <p><ShieldCheck size={13} /> La disponibilité du modèle est confirmée par une réponse réussie.</p>
          {(approvals ?? 0) > 0 && <p className="jarvis-warning">Consultez la cloche en haut à droite pour examiner chaque action.</p>}
          <Link to="/settings">Configurer les connexions <ArrowUpRight size={13} /></Link>
        </aside>
      </div>
      <div className="jarvis-actions">
        <button onClick={downloadHistory} disabled={conversations.length === 0}>Exporter les conversations ({conversations.length})</button>
        {tts !== 'idle' && <button onClick={() => useTtsStore.getState().stop()}>Couper la réponse vocale</button>}
        {stream.activeToolCalls.filter(t => t.status === 'running').map(t => <span key={t.id} role="status">Outil en cours : {t.tool}</span>)}
        {exportError && <span role="alert">{exportError}</span>}
      </div>
      {!compact && <nav className="jarvis-shortcuts" aria-label="Accès rapides">
        <Link to="/data-sources">Documents & sources <ArrowUpRight size={14} /></Link>
        <Link to="/agents">Agents & automatisations <ArrowUpRight size={14} /></Link>
        <Link to="/settings">Mémoire & paramètres <ArrowUpRight size={14} /></Link>
      </nav>}
    </section>
  );
}
