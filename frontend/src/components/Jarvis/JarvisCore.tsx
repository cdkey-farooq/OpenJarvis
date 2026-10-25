import type { JarvisState } from '../../lib/jarvis-state';
import { JARVIS_LABELS } from '../../lib/jarvis-state';

/** CSS 3D transforms: no GPU context, downloaded video, timer, or render loop required. */
export function JarvisCore({ state, compact, simplified }: {
  state: JarvisState; compact: boolean; simplified: boolean;
}) {
  return (
    <div className={`jarvis-core ${compact ? 'is-compact' : ''} ${simplified ? 'is-simplified' : ''}`} data-state={state}>
      <div className="jarvis-orbit" aria-hidden="true">
        <div className="jarvis-ring ring-outer" />
        <div className="jarvis-ring ring-middle" />
        <div className="jarvis-ring ring-inner" />
        <div className="jarvis-heart"><span>J</span></div>
        <div className="jarvis-reflection" />
      </div>
      <div className="jarvis-core-caption">
        <span className="jarvis-eyebrow">PERSONAL INTELLIGENCE</span>
        <h1>J.A.R.V.I.S.</h1>
        <p role="status" aria-live="polite"><i />{JARVIS_LABELS[state]}</p>
      </div>
    </div>
  );
}
