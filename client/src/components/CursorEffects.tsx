import { useEffect, useRef } from "react";

interface CursorEffectsProps {
  pixelColor?: string;
  pixelMinSize?: number;
  pixelMaxSize?: number;
  pixelLifeMs?: number;
  pixelPerMove?: number;
  sparkColors?: string[];
  sparkCount?: number;
  sparkLifeMs?: number;
  sparkSpeed?: number;
  enabled?: boolean;
  hideSystemCursor?: boolean;
  showCursorDot?: boolean;
  cursorDotSize?: number;
  cursorDotColor?: string;
  cursorDotShape?: 'square' | 'circle' | 'crosshair';
  crosshairSize?: number; // full arm length from center to end
  crosshairThickness?: number; // bar thickness
  crosshairGap?: number; // empty gap around center
}

type PixelParticle = {
  x: number;
  y: number;
  size: number;
  birthTs: number;
  lifeMs: number;
  hueShift: number;
};

type SparkParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  birthTs: number;
  lifeMs: number;
  color: string;
};

export default function CursorEffects(props: CursorEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const crossRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const isTouchDevice = navigator.maxTouchPoints > 0;

    const isEnabled = props.enabled ?? (isFinePointer && !isTouchDevice && !prefersReducedMotion);
    if (!isEnabled) return;

    const cnv = canvasRef.current;
    if (!cnv) return;
    const canvas = cnv as HTMLCanvasElement;

    const ctxMaybe = canvas.getContext("2d", { alpha: true });
    if (!ctxMaybe) return;
    const ctx = ctxMaybe as CanvasRenderingContext2D;

    let devicePixelRatioValue = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const state = {
      width: 0,
      height: 0,
      pixels: [] as PixelParticle[],
      sparks: [] as SparkParticle[],
      lastMoveTs: 0
    };

    const cfg = {
      pixelColor: props.pixelColor ?? "#8b5cf6", // violet-500
      pixelMinSize: props.pixelMinSize ?? 3,
      pixelMaxSize: props.pixelMaxSize ?? 8,
      pixelLifeMs: props.pixelLifeMs ?? 350,
      pixelPerMove: props.pixelPerMove ?? 3,
      sparkColors: props.sparkColors ?? ["#22d3ee", "#a78bfa", "#f472b6", "#34d399"],
      sparkCount: props.sparkCount ?? 14,
      sparkLifeMs: props.sparkLifeMs ?? 550,
      sparkSpeed: props.sparkSpeed ?? 2.2
    };

    const cursorCfg = {
      hideSystemCursor: props.hideSystemCursor ?? false,
      showCursorDot: props.showCursorDot ?? false,
      cursorDotSize: props.cursorDotSize ?? 8,
      cursorDotColor: props.cursorDotColor ?? (props.pixelColor ?? "#ffffff"),
      cursorDotShape: props.cursorDotShape ?? 'square',
      crosshairSize: props.crosshairSize ?? 8,
      crosshairThickness: props.crosshairThickness ?? 2,
      crosshairGap: props.crosshairGap ?? 2
    };

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      state.width = Math.floor(rect.width);
      state.height = Math.floor(rect.height);
      canvas.width = Math.floor(state.width * devicePixelRatioValue);
      canvas.height = Math.floor(state.height * devicePixelRatioValue);
      ctx.setTransform(devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0);
    }

    function randomBetween(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function addPixel(x: number, y: number) {
      state.pixels.push({
        x: x + randomBetween(-2, 2),
        y: y + randomBetween(-2, 2),
        size: randomBetween(cfg.pixelMinSize, cfg.pixelMaxSize),
        birthTs: performance.now(),
        lifeMs: cfg.pixelLifeMs,
        hueShift: Math.floor(randomBetween(-12, 12))
      });
    }

    function addClickSparks(x: number, y: number) {
      for (let i = 0; i < cfg.sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = cfg.sparkSpeed * (0.6 + Math.random() * 0.8);
        const size = randomBetween(1.5, 3.5);
        const color = cfg.sparkColors[Math.floor(Math.random() * cfg.sparkColors.length)];
        state.sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size,
          birthTs: performance.now(),
          lifeMs: cfg.sparkLifeMs,
          color
        });
      }
    }

    function onPointerMove(ev: PointerEvent) {
      const now = performance.now();
      // thin out if moving too fast to reduce overdraw
      const throttle = now - state.lastMoveTs < 8;
      state.lastMoveTs = now;
      const x = ev.clientX;
      const y = ev.clientY;
      const count = throttle ? Math.max(1, Math.floor(cfg.pixelPerMove / 2)) : cfg.pixelPerMove;
      for (let i = 0; i < count; i++) addPixel(x, y);

      if (cursorCfg.showCursorDot && dotRef.current) {
        const s = cursorCfg.cursorDotSize;
        dotRef.current.style.transform = `translate3d(${x - s / 2}px, ${y - s / 2}px, 0)`;
      }
      if (cursorCfg.cursorDotShape === 'crosshair' && crossRef.current) {
        const size = cursorCfg.crosshairSize;
        crossRef.current.style.transform = `translate3d(${x - size}px, ${y - size}px, 0)`;
      }
    }

    function onClick(ev: MouseEvent) {
      addClickSparks(ev.clientX, ev.clientY);
    }

    function step() {
      ctx.clearRect(0, 0, state.width, state.height);

      const now = performance.now();

      // pixels (trail)
      for (let i = state.pixels.length - 1; i >= 0; i--) {
        const p = state.pixels[i];
        const t = (now - p.birthTs) / p.lifeMs;
        if (t >= 1) {
          state.pixels.splice(i, 1);
          continue;
        }
        const alpha = 1 - t;
        const size = p.size * (0.8 + 0.2 * (1 - t));
        ctx.globalAlpha = alpha * 0.9;
        // subtle hue shift around base color via overlay using HSL conversion isn't cheap; approximate by alpha only
        ctx.fillStyle = cfg.pixelColor;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }

      // sparks (click)
      for (let i = state.sparks.length - 1; i >= 0; i--) {
        const s = state.sparks[i];
        const t = (now - s.birthTs) / s.lifeMs;
        if (t >= 1) {
          state.sparks.splice(i, 1);
          continue;
        }
        const alpha = 1 - t;
        // movement
        s.vx *= 0.985; // drag
        s.vy = s.vy * 0.985 + 0.03; // drag + gravity
        s.x += s.vx;
        s.y += s.vy;

        const size = s.size * (0.9 + 0.1 * (1 - t));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - size / 2, s.y - size / 2, size, size);
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(step);
    }

    const onResize = () => {
      devicePixelRatioValue = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      resizeCanvas();
    };

    // setup
    if (cursorCfg.hideSystemCursor) {
      document.body.classList.add('cursor-none');
    }
    resizeCanvas();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove as any);
      window.removeEventListener("click", onClick as any);
      if (cursorCfg.hideSystemCursor) {
        document.body.classList.remove('cursor-none');
      }
    };
  }, [
    props.enabled,
    props.pixelColor,
    props.pixelMinSize,
    props.pixelMaxSize,
    props.pixelLifeMs,
    props.pixelPerMove,
    props.sparkColors,
    props.sparkCount,
    props.sparkLifeMs,
    props.sparkSpeed,
    props.hideSystemCursor,
    props.showCursorDot,
    props.cursorDotSize,
    props.cursorDotColor,
    props.cursorDotShape
  ]);

  // Full-screen, non-interactive canvas overlay
  const dotSize = props.cursorDotSize ?? 8;
  const dotColor = props.cursorDotColor ?? (props.pixelColor ?? "#ffffff");
  const cursorShape = props.cursorDotShape ?? 'square';
  const isCircle = cursorShape === 'circle';
  const isCrosshair = cursorShape === 'crosshair';
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] select-none">
      <canvas ref={canvasRef} className="h-full w-full block" />
      {(props.showCursorDot ?? false) && !isCrosshair && (
        <div
          ref={dotRef}
          className="absolute top-0 left-0 will-change-transform"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: dotColor,
            borderRadius: isCircle ? 9999 : 0,
            transform: 'translate3d(-9999px, -9999px, 0)'
          }}
        />
      )}
      {isCrosshair && (
        <div
          ref={crossRef}
          className="absolute top-0 left-0 will-change-transform"
          style={{
            width: (props.crosshairSize ?? 8) * 2,
            height: (props.crosshairSize ?? 8) * 2,
            transform: 'translate3d(-9999px, -9999px, 0)'
          }}
        >
          {/* Vertical bar */}
          <div
            className="absolute"
            style={{
              left: (props.crosshairSize ?? 8) - (props.crosshairThickness ?? 2) / 2,
              top: 0,
              width: props.crosshairThickness ?? 2,
              height: (props.crosshairSize ?? 8) - (props.crosshairGap ?? 2),
              backgroundColor: dotColor
            }}
          />
          <div
            className="absolute"
            style={{
              left: (props.crosshairSize ?? 8) - (props.crosshairThickness ?? 2) / 2,
              top: (props.crosshairSize ?? 8) + (props.crosshairGap ?? 2),
              width: props.crosshairThickness ?? 2,
              height: (props.crosshairSize ?? 8) - (props.crosshairGap ?? 2),
              backgroundColor: dotColor
            }}
          />
          {/* Horizontal bar */}
          <div
            className="absolute"
            style={{
              top: (props.crosshairSize ?? 8) - (props.crosshairThickness ?? 2) / 2,
              left: 0,
              height: props.crosshairThickness ?? 2,
              width: (props.crosshairSize ?? 8) - (props.crosshairGap ?? 2),
              backgroundColor: dotColor
            }}
          />
          <div
            className="absolute"
            style={{
              top: (props.crosshairSize ?? 8) - (props.crosshairThickness ?? 2) / 2,
              left: (props.crosshairSize ?? 8) + (props.crosshairGap ?? 2),
              height: props.crosshairThickness ?? 2,
              width: (props.crosshairSize ?? 8) - (props.crosshairGap ?? 2),
              backgroundColor: dotColor
            }}
          />
        </div>
      )}
    </div>
  );
}


