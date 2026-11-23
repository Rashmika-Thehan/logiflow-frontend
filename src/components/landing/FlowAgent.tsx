import { useEffect, useRef } from 'react';

export type AgentState =
  | 'idle'
  | 'dispatching'
  | 'alert'
  | 'success'
  | 'tracking'
  | 'listening';

interface Props {
  /** Active animation state — drives the agent's pose, colour and motion. */
  state?: AgentState;
  className?: string;
}

/**
 * Embeds the LogiFlow 3D agent "Flow" via an iframe pointing to the
 * self-contained Three.js scene at /flow-agent.html.
 *
 * Tracks cursor movement across the entire page/window and broadcasts
 * normalized look-at coordinates via postMessage so Flow follows the
 * mouse wherever it goes on the screen.
 */
export function FlowAgent({ state = 'idle', className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ flowState: state }, '*');
  }, [state]);

  useEffect(() => {
    let rafId: number | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;

        const rect = iframe.getBoundingClientRect();
        // Agent's chest/head center point relative to viewport
        const originX = rect.left + rect.width * 0.5;
        const originY = rect.top + rect.height * 0.45;

        // Normalise vector from agent center to cursor
        // Using window dimensions so edge-to-edge movement maps to roughly [-1.2, +1.2]
        const spanX = Math.max(originX, window.innerWidth - originX);
        const spanY = Math.max(originY, window.innerHeight - originY);

        const nx = spanX > 0 ? (e.clientX - originX) / spanX : 0;
        // In Three.js normalized device coordinates, up is positive Y
        const ny = spanY > 0 ? -((e.clientY - originY) / spanY) : 0;

        // Give a generous, natural range with slight sensitivity boost
        const mx = Math.max(-1.5, Math.min(1.5, nx * 1.35));
        const my = Math.max(-1.3, Math.min(1.3, ny * 1.35));

        iframe.contentWindow.postMessage(
          { flowMouse: { x: mx, y: my } },
          '*'
        );
      });
    };

    const onMouseLeaveDoc = (e: MouseEvent) => {
      // When cursor leaves the browser viewport, gently reset to center
      if (!e.relatedTarget && !(e as unknown as { toElement?: Element }).toElement) {
        iframeRef.current?.contentWindow?.postMessage(
          { flowMouse: { x: 0, y: 0 } },
          '*'
        );
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeaveDoc);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onMouseLeaveDoc);
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="/flow-agent.html"
      title="Flow – LogiFlow AI agent"
      aria-label="Animated LogiFlow AI agent named Flow"
      scrolling="no"
      className={className}
      style={{
        border: 'none',
        background: 'transparent',
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
