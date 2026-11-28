import React, { useEffect, useRef, useState } from 'react';
import { Role } from '../types';

// Elastic pull-cord geometry constants
const ANCHOR_X = 245;
const ANCHOR_Y = 212;
const REST_X = 245;
const REST_Y = 300;
const MAX_STRETCH = 120;
const TRIGGER_PULL = 32;

// Dust particle color themes matching the lamp spectrums
const PARTICLE_THEMES: Record<string, { fill: string; glow: string }> = {
  amber: { fill: '255, 205, 120', glow: '255, 185, 80' },
  cyan: { fill: '140, 245, 255', glow: '0, 240, 255' },
  rose: { fill: '255, 160, 200', glow: '255, 51, 133' },
  mint: { fill: '160, 255, 200', glow: '0, 230, 118' },
  moonlight: { fill: '220, 235, 255', glow: '200, 220, 255' },
};

// Embedded stylesheet so the component works both standalone and inside any React app
const LAMP_STYLES = `
.lamp-login-root,
.lamp-login-root[data-color="amber"] {
  --lamp-accent: #ffab3d;
  --lamp-glow: #ffe194;
  --lamp-secondary: #d48b28;
  --beam-color: rgba(255, 185, 75, 0.22);
  --beam-start: rgba(255, 220, 130, 0.45);
  --beam-mid: rgba(255, 195, 90, 0.22);
  --beam-far: rgba(255, 175, 60, 0.08);
  --lamp-focus-glow: rgba(255, 171, 61, 0.18);
  --bg-dark: #0c0e12;
  --bg-illuminated: #161920;
  --card-bg: rgba(18, 22, 28, 0.72);
  --card-border: rgba(255, 255, 255, 0.09);
  --input-bg: rgba(255, 255, 255, 0.04);
  --input-border: rgba(255, 255, 255, 0.1);
  --text-primary: #f0f3f8;
  --text-muted: #8b95a5;
  --text-dim: #545c6b;
}
.lamp-login-root[data-color="cyan"] {
  --lamp-accent: #00f0ff;
  --lamp-glow: #a6f9ff;
  --lamp-secondary: #009eb0;
  --beam-color: rgba(0, 240, 255, 0.2);
  --beam-start: rgba(160, 245, 255, 0.45);
  --beam-mid: rgba(0, 220, 255, 0.22);
  --beam-far: rgba(0, 180, 220, 0.08);
  --lamp-focus-glow: rgba(0, 240, 255, 0.18);
}
.lamp-login-root[data-color="rose"] {
  --lamp-accent: #ff3385;
  --lamp-glow: #ffa3c7;
  --lamp-secondary: #ba1656;
  --beam-color: rgba(255, 51, 133, 0.2);
  --beam-start: rgba(255, 160, 205, 0.45);
  --beam-mid: rgba(255, 70, 150, 0.22);
  --beam-far: rgba(255, 30, 110, 0.08);
  --lamp-focus-glow: rgba(255, 51, 133, 0.18);
}
.lamp-login-root[data-color="mint"] {
  --lamp-accent: #00e676;
  --lamp-glow: #b9f6ca;
  --lamp-secondary: #00964b;
  --beam-color: rgba(0, 230, 118, 0.2);
  --beam-start: rgba(180, 255, 215, 0.45);
  --beam-mid: rgba(0, 225, 115, 0.22);
  --beam-far: rgba(0, 170, 85, 0.08);
  --lamp-focus-glow: rgba(0, 230, 118, 0.18);
}
.lamp-login-root[data-color="moonlight"] {
  --lamp-accent: #d8e5ff;
  --lamp-glow: #ffffff;
  --lamp-secondary: #7b9cd4;
  --beam-color: rgba(200, 220, 255, 0.22);
  --beam-start: rgba(255, 255, 255, 0.45);
  --beam-mid: rgba(210, 230, 255, 0.22);
  --beam-far: rgba(170, 200, 245, 0.08);
  --lamp-focus-glow: rgba(216, 229, 255, 0.2);
}
.lamp-login-root *, .lamp-login-root *::before, .lamp-login-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lamp-login-root {
  width: 100%;
  min-height: 100vh;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-primary);
  overflow-x: hidden;
  position: relative;
  transition: background-color 0.8s ease;
  user-select: none;
}
.lamp-login-root[data-on="true"] { background-color: var(--bg-illuminated); }
.ambient-glow {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 38% 38%, var(--beam-color), transparent 65%);
  opacity: 0;
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.8s ease, background 0.5s ease;
}
.lamp-login-root[data-on="true"] .ambient-glow { opacity: 0.85; }
#dustCanvas { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
.quick-controls { position: fixed; top: 24px; right: 28px; z-index: 50; display: flex; align-items: center; gap: 12px; }
.color-palette {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  padding: 6px 12px; border-radius: 30px;
  backdrop-filter: blur(12px);
}
.color-dot-btn {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--dot-color); border: 2px solid transparent;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); outline: none;
}
.color-dot-btn:hover { transform: scale(1.22); box-shadow: 0 0 10px var(--dot-color); }
.color-dot-btn.active { transform: scale(1.2); border-color: #fff; box-shadow: 0 0 12px var(--dot-color); }
.sound-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted); cursor: pointer; transition: all 0.3s ease;
}
.sound-toggle:hover { background: rgba(255, 255, 255, 0.12); color: #fff; transform: scale(1.05); }
.sound-icon { width: 18px; height: 18px; }
.scene-container {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 2rem; position: relative; z-index: 10; max-width: 1160px; margin: 0 auto; gap: 2rem;
}
.lamp-stage { flex: 1 1 420px; display: flex; justify-content: center; align-items: center; position: relative; }
.lamp-wrapper { position: relative; width: 400px; height: 520px; display: flex; justify-content: center; align-items: center; }
.lamp-svg { width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.6)); }
.lamp-shade-body { transition: filter 500ms ease; }
.lamp-login-root[data-on="true"] .lamp-shade-body { filter: drop-shadow(0 0 12px var(--lamp-accent)); }
.svg-light-beam { opacity: 0; visibility: hidden; mix-blend-mode: screen; pointer-events: none; transition: opacity 0.45s ease, visibility 0.45s ease; }
.lamp-login-root[data-on="true"] .svg-light-beam { opacity: 1; visibility: visible; }
.shade-reflector-off { opacity: 1; }
.shade-reflector-on { opacity: 0; transition: opacity 0.35s ease; }
.lamp-login-root[data-on="true"] .shade-reflector-on { opacity: 1; }
.bulb-glow-core { opacity: 0; transition: opacity 0.3s ease; }
.lamp-login-root[data-on="true"] .bulb-glow-core { opacity: 0.95; }
.bulb-filament { stroke: #555; transition: stroke 0.3s ease, filter 0.3s ease; }
.lamp-login-root[data-on="true"] .bulb-filament { stroke: #fff; filter: drop-shadow(0 0 6px var(--lamp-accent)); }
.elastic-cord-path { transition: stroke 0.3s ease; }
.lamp-login-root[data-on="true"] .elastic-cord-path { stroke: var(--lamp-glow); filter: drop-shadow(0 0 4px var(--lamp-accent)); }
.cord-bead-group { cursor: grab; touch-action: none; }
.cord-bead-group:active { cursor: grabbing; }
.bead-aura { transition: opacity 0.3s ease; }
.lamp-login-root[data-on="true"] .bead-aura { opacity: 0.35; }
.cord-tooltip {
  position: absolute; top: 360px; left: 175px;
  background: rgba(16, 19, 25, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 6px 14px; border-radius: 20px; font-size: 0.76rem; font-weight: 600;
  color: #fff; pointer-events: none; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: opacity 0.4s ease, transform 0.4s ease; white-space: nowrap;
}
.lamp-login-root[data-on="true"] .cord-tooltip { opacity: 0; transform: translateY(-8px); }
.tooltip-arrow {
  position: absolute; top: -5px; left: 50%; transform: translateX(-50%) rotate(45deg);
  width: 10px; height: 10px; background: rgba(16, 19, 25, 0.88);
  border-left: 1px solid rgba(255, 255, 255, 0.14); border-top: 1px solid rgba(255, 255, 255, 0.14);
}
.form-stage { flex: 1 1 420px; display: flex; justify-content: center; align-items: center; position: relative; min-height: 520px; }
.login-card {
  width: 100%; max-width: 410px;
  background: var(--card-bg);
  backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid var(--card-border);
  border-radius: 30px; padding: 2.5rem 2.2rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  position: relative; overflow: hidden; z-index: 10;
  opacity: 0; transform: translateY(24px) scale(0.96);
  pointer-events: none;
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease;
}
.lamp-login-root[data-on="true"] .login-card {
  opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
  box-shadow: -20px 0 60px -15px var(--beam-color), 0 30px 65px rgba(0, 0, 0, 0.55), inset 0 1px 2px rgba(255, 255, 255, 0.2);
}
.card-header { margin-bottom: 1.6rem; }
.card-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.03em; color: #fff; margin-bottom: 0.35rem; }
.card-subtitle { font-size: 0.88rem; color: var(--text-muted); line-height: 1.45; }
.auth-tabs {
  position: relative; display: flex; background: rgba(0, 0, 0, 0.28);
  padding: 4px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.06); margin-bottom: 1.6rem;
}
.auth-tab {
  flex: 1; background: transparent; border: none; padding: 9px 0;
  color: var(--text-muted); font-family: inherit; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; z-index: 2; transition: color 0.3s ease; text-align: center;
}
.auth-tab.active { color: #fff; }
.tab-slider {
  position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px);
  background: rgba(255, 255, 255, 0.12); border-radius: 12px; z-index: 1;
}
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.45rem; }
.label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; }
.input-wrapper {
  position: relative; display: flex; align-items: center;
  background: var(--input-bg); border: 1px solid var(--input-border);
  border-radius: 15px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.input-wrapper:focus-within {
  border-color: var(--lamp-accent); background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px var(--lamp-focus-glow);
}
.field-icon { position: absolute; left: 15px; width: 18px; height: 18px; color: var(--text-dim); pointer-events: none; }
.input-wrapper:focus-within .field-icon { color: var(--lamp-accent); }
.input-wrapper input {
  width: 100%; padding: 13px 42px 13px 44px; background: transparent;
  border: none; outline: none; color: #fff; font-size: 0.92rem; font-family: inherit; font-weight: 500;
}
.eye-toggle {
  position: absolute; right: 14px; background: transparent; border: none;
  color: var(--text-dim); cursor: pointer; padding: 4px; display: flex; align-items: center;
}
.eye-toggle:hover { color: #fff; }
.eye-icon { width: 18px; height: 18px; }
.submit-btn {
  position: relative; width: 100%; padding: 14px; border-radius: 15px; border: none;
  background: linear-gradient(135deg, var(--lamp-accent) 0%, var(--lamp-secondary) 100%);
  color: #0b0d10; font-family: inherit; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex; align-items: center; justify-content: center; margin-top: 0.5rem;
}
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -5px rgba(0, 0, 0, 0.5); }
.btn-content { display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-arrow { width: 18px; height: 18px; }
.lamp-error-msg { color: #ff6b6b; font-size: 0.85rem; text-align: center; margin-bottom: 0.85rem; font-weight: 500; }
.lamp-success-msg { color: #2ed573; font-size: 0.85rem; text-align: center; margin-bottom: 0.85rem; font-weight: 500; }
@media (max-width: 960px) {
  .scene-container { flex-direction: column; padding-top: 60px; gap: 1.5rem; }
  .lamp-stage { flex: 0 0 auto; height: 340px; }
  .lamp-wrapper { width: 320px; height: 380px; transform: scale(0.9); }
  .form-stage { width: 100%; min-height: auto; }
}

.lamp-select {
  width: 100%;
  padding: 13px 16px;
  background: #141820;
  border: none;
  outline: none;
  color: #fff;
  font-size: 0.92rem;
  font-family: inherit;
  font-weight: 500;
  border-radius: 15px;
  cursor: pointer;
}
`;

export interface LampLoginPageProps {
  initialTab?: 'signin' | 'register';
  onLoginSuccess?: (credentials: { username: string; password: string }) => Promise<boolean> | boolean;
  onRegisterSuccess?: (details: { name: string; username: string; password: string; role: Role }) => Promise<{ user: unknown; error?: string }>;
  onNavigateRegister?: () => void;
}

const LampLoginPage: React.FC<LampLoginPageProps> = ({
  initialTab = 'signin',
  onLoginSuccess,
  onRegisterSuccess,
}) => {
  const [isOn, setIsOn] = useState(initialTab === 'register');
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialTab);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>(Role.Student);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [lampColor, setLampColor] = useState('amber');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [beadPos, setBeadPos] = useState({ x: REST_X, y: REST_Y });
  const [shadeTilt, setShadeTilt] = useState(0);
  const [cardTilt, setCardTilt] = useState({ rx: 0, ry: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elasticCordRef = useRef<SVGPathElement>(null);
  const formStageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const isOnRef = useRef(isOn);
  const isSoundRef = useRef(isSoundEnabled);
  const colorRef = useRef(lampColor);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const draggingRef = useRef(false);
  const dragPosRef = useRef({ x: REST_X, y: REST_Y });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    isOnRef.current = isOn;
  }, [isOn]);

  useEffect(() => {
    isSoundRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  useEffect(() => {
    colorRef.current = lampColor;
  }, [lampColor]);

  // Initialize Web Audio synthesizer for cord pluck & switch snap
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playElasticPluckSound = (pullDist: number, turningOn: boolean) => {
    if (!isSoundRef.current) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480 + Math.min(260, pullDist * 3), now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      if (pullDist >= TRIGGER_PULL) {
        const snap = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snap.type = 'sine';
        snap.frequency.setValueAtTime(turningOn ? 1800 : 1500, now + 0.02);
        snap.frequency.exponentialRampToValueAtTime(320, now + 0.06);
        snapGain.gain.setValueAtTime(0.35, now + 0.02);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        snap.connect(snapGain);
        snapGain.connect(ctx.destination);
        snap.start(now + 0.02);
        snap.stop(now + 0.07);
      }
    } catch {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  };

  // Update quadratic SVG path for the elastic cord
  const updateCordPath = (curX: number, curY: number, twangOffset = 0) => {
    const cord = elasticCordRef.current;
    if (!cord) return;
    const midX = (ANCHOR_X + curX) / 2 + twangOffset;
    const midY = (ANCHOR_Y + curY) / 2;
    const stretchRatio = Math.max(1, (curY - ANCHOR_Y) / (REST_Y - ANCHOR_Y));
    const strokeWidth = Math.max(1.6, 2.6 / Math.sqrt(stretchRatio));
    cord.setAttribute('d', `M ${ANCHOR_X} ${ANCHOR_Y} Q ${midX} ${midY} ${curX} ${curY}`);
    cord.setAttribute('stroke-width', strokeWidth.toFixed(2));
  };

  // Damped spring animation when cord is released
  const animateSpringBack = (startX: number, startY: number) => {
    cancelAnimationFrame(animFrameRef.current);
    const startTime = performance.now();
    const duration = 750;
    const dx = startX - REST_X;
    const dy = startY - REST_Y;

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const decay = Math.exp(-6 * t) * Math.cos(18 * t);
      const curX = REST_X + dx * decay;
      const curY = REST_Y + dy * decay;
      const twang = Math.sin(24 * t) * Math.exp(-5 * t) * (dx * 0.4 + dy * 0.25);

      dragPosRef.current = { x: curX, y: curY };
      setBeadPos({ x: curX, y: curY });
      setShadeTilt(((curY - REST_Y) / MAX_STRETCH) * 2.2);
      updateCordPath(curX, curY, twang);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        dragPosRef.current = { x: REST_X, y: REST_Y };
        setBeadPos({ x: REST_X, y: REST_Y });
        setShadeTilt(0);
        updateCordPath(REST_X, REST_Y, 0);
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  const releasePull = (curX: number, curY: number) => {
    const pullDist = curY - REST_Y;
    let nextState = isOnRef.current;
    if (pullDist >= TRIGGER_PULL) {
      nextState = !isOnRef.current;
      setIsOn(nextState);
      isOnRef.current = nextState;
    }
    playElasticPluckSound(pullDist, nextState);
    animateSpringBack(curX, curY);
  };

  const performSimulatedPull = () => {
    initAudio();
    const targetY = REST_Y + 48;
    setBeadPos({ x: REST_X, y: targetY });
    setShadeTilt(1.8);
    updateCordPath(REST_X, targetY, 0);
    setTimeout(() => {
      releasePull(REST_X, targetY);
    }, 140);
  };

  const clientToSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: REST_X, y: REST_Y };
    const rect = svg.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 500 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    cancelAnimationFrame(animFrameRef.current);
    initAudio();
    draggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const pt = clientToSvgPoint(e.clientX, e.clientY);
    const clampedX = Math.max(REST_X - 45, Math.min(REST_X + 45, pt.x));
    const clampedY = Math.max(REST_Y, Math.min(REST_Y + MAX_STRETCH, pt.y));
    dragPosRef.current = { x: clampedX, y: clampedY };
    setBeadPos({ x: clampedX, y: clampedY });
    setShadeTilt(((clampedY - REST_Y) / MAX_STRETCH) * 2.2);
    updateCordPath(clampedX, clampedY, 0);
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const { x, y } = dragPosRef.current;
    if (Math.hypot(x - REST_X, y - REST_Y) < 6) {
      performSimulatedPull();
    } else {
      releasePull(x, y);
    }
  };

  // Ambient floating dust particles canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.4) * 0.35,
      vy: -Math.random() * 0.4 - 0.15,
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      pulse: Math.random() * Math.PI,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const theme = PARTICLE_THEMES[colorRef.current] || PARTICLE_THEMES.amber;
      const factor = isOnRef.current ? 1 : 0.08;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentAlpha = (Math.sin(p.pulse) * 0.3 + 0.7) * p.alpha;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${theme.fill}, ${currentAlpha * factor})`;
        if (isOnRef.current) {
          ctx.shadowBlur = 7;
          ctx.shadowColor = `rgba(${theme.glow}, 0.5)`;
        }
        ctx.fill();
        ctx.restore();
      }
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Form submission handler (connects to external auth prop or runs preview verification)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOn) {
      performSimulatedPull();
      return;
    }
    setError('');
    setStatusMsg('');
    setLoading(true);
    try {
      if (isForgotMode) {
        if (!fullName.trim() || !username.trim() || newPassword.length < 6) {
          setError('Enter Full Name, Username / Roll No / Email, and a new password (min 6 chars).');
          setLoading(false);
          return;
        }
        const res = await fetch((window.location.hostname === 'localhost' ? 'http://localhost:5000/api/auth/reset-password' : '/api/auth/reset-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, identifier: username, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatusMsg(data.message || 'Password updated successfully. Please sign in.');
          setIsForgotMode(false);
          setNewPassword('');
          setPassword('');
        } else {
          setError(data.message || 'Failed to reset password.');
        }
      } else if (activeTab === 'register') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        if (onRegisterSuccess) {
          const res = await onRegisterSuccess({ name: fullName, username, password, role });
          if (res.user) {
            setStatusMsg('Registration successful! Please sign in.');
            setActiveTab('signin');
          } else {
            setError(res.error || 'Registration failed.');
          }
        }
      } else if (onLoginSuccess) {
        const ok = await onLoginSuccess({ username, password });
        if (!ok) {
          setError('Invalid username or password.');
        }
      }
    } catch {
      setError(activeTab === 'register' ? 'Registration failed. Try again.' : 'Invalid username or password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{LAMP_STYLES}</style>
      <div className="lamp-login-root" data-on={isOn ? 'true' : 'false'} data-color={lampColor}>
        <div className="ambient-glow" />
        <canvas ref={canvasRef} id="dustCanvas" />

        <div className="quick-controls">
          <div className="color-palette" title="Choose Lamp Color">
            {[
              { id: 'amber', color: '#ffab3d', label: 'Amber Light' },
              { id: 'cyan', color: '#00f0ff', label: 'Cyan Light' },
              { id: 'rose', color: '#ff3385', label: 'Rose Light' },
              { id: 'mint', color: '#00e676', label: 'Mint Light' },
              { id: 'moonlight', color: '#d8e5ff', label: 'Moonlight' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                className={`color-dot-btn ${lampColor === c.id ? 'active' : ''}`}
                style={{ '--dot-color': c.color } as React.CSSProperties}
                aria-label={c.label}
                onClick={() => setLampColor(c.id)}
              />
            ))}
          </div>

          <button
            type="button"
            className="sound-toggle"
            title="Toggle Sound"
            onClick={() => {
              setIsSoundEnabled((prev) => !prev);
              initAudio();
            }}
          >
            {isSoundEnabled ? (
              <svg className="sound-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg className="sound-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        </div>

        <main className="scene-container">
          <div className="lamp-stage">
            <div className="lamp-wrapper">
              <svg ref={svgRef} className="lamp-svg" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="metalArm" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3e434a" />
                    <stop offset="50%" stopColor="#7a828e" />
                    <stop offset="100%" stopColor="#24272c" />
                  </linearGradient>
                  <linearGradient id="brassJoint" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffe299" />
                    <stop offset="45%" stopColor="#c99738" />
                    <stop offset="85%" stopColor="#805915" />
                    <stop offset="100%" stopColor="#f5d38a" />
                  </linearGradient>
                  <linearGradient id="shadeExterior" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#343840" />
                    <stop offset="40%" stopColor="#21252a" />
                    <stop offset="100%" stopColor="#121417" />
                  </linearGradient>
                  <linearGradient id="shadeHighlight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="42%" stopColor="#ffffff" stopOpacity="0.16" />
                    <stop offset="72%" stopColor="#ffffff" stopOpacity="0.025" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="shadeRim" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffd584" />
                    <stop offset="50%" stopColor="#e2ab46" />
                    <stop offset="100%" stopColor="#996a1a" />
                  </linearGradient>
                  <radialGradient id="reflectorOff" cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#2c3036" />
                    <stop offset="55%" stopColor="#1a1d22" />
                    <stop offset="100%" stopColor="#0e1012" />
                  </radialGradient>
                  <radialGradient id="reflectorOn" cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="35%" stopColor="var(--lamp-glow, #ffe194)" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="var(--lamp-accent, #ffab3d)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#2a2015" stopOpacity="0.85" />
                  </radialGradient>
                  <linearGradient id="volumetricBeam" x1="0%" y1="0%" x2="90%" y2="70%">
                    <stop offset="0%" stopColor="var(--beam-start, rgba(255, 220, 130, 0.45))" />
                    <stop offset="25%" stopColor="var(--beam-mid, rgba(255, 195, 90, 0.22))" />
                    <stop offset="65%" stopColor="var(--beam-far, rgba(255, 175, 60, 0.08))" />
                    <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                  </linearGradient>
                  <filter id="bulbGlowFilter" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="beamSoftFilter" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                </defs>

                <ellipse className="desk-shadow" cx="190" cy="460" rx="90" ry="16" fill="rgba(0, 0, 0, 0.55)" />
                <g className="light-beam-group">
                  <polygon
                    className="svg-light-beam"
                    points="182,185 308,225 820,480 340,510"
                    fill="url(#volumetricBeam)"
                    filter="url(#beamSoftFilter)"
                  />
                </g>
                <g className="lamp-base-group">
                  <ellipse cx="190" cy="445" rx="72" ry="14" fill="#15171a" />
                  <ellipse cx="190" cy="443" rx="70" ry="12" fill="url(#metalArm)" />
                  <ellipse cx="190" cy="441" rx="66" ry="10" fill="#1c1f24" />
                  <ellipse cx="190" cy="439" rx="60" ry="7" fill="none" stroke="#8e949f" strokeOpacity=".22" strokeWidth=".8" />
                  <circle cx="190" cy="439" r="15" fill="url(#brassJoint)" />
                  <circle cx="190" cy="439" r="7" fill="#15171a" />
                  <circle cx="190" cy="439" r="3.2" fill="#747b86" />
                </g>
                <g className="lamp-arm-lower">
                  <line x1="186" y1="439" x2="156" y2="295" stroke="url(#metalArm)" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="194" y1="439" x2="164" y2="295" stroke="url(#metalArm)" strokeWidth="4.5" strokeLinecap="round" />
                </g>
                <g className="lamp-elbow-joint">
                  <circle cx="160" cy="295" r="13" fill="url(#brassJoint)" />
                  <circle cx="160" cy="295" r="6" fill="#1c1f24" />
                  <circle cx="160" cy="295" r="3.3" fill="#858b94" />
                </g>
                <g className="lamp-arm-upper">
                  <line x1="160" y1="295" x2="215" y2="175" stroke="url(#metalArm)" strokeWidth="5" strokeLinecap="round" />
                  <path d="M 190 439 Q 168 360 160 295 Q 190 230 215 175" stroke="#101114" strokeWidth="3" fill="none" strokeLinecap="round" />
                </g>
                <g className="lamp-neck">
                  <circle cx="215" cy="175" r="11" fill="url(#brassJoint)" />
                  <rect x="209" y="162" width="16" height="15" rx="3" fill="url(#metalArm)" transform="rotate(25, 217, 169)" />
                </g>

                <g
                  className="lamp-shade-assembly"
                  transform={`rotate(${shadeTilt}, 215, 175)`}
                >
                  <path
                    className="lamp-shade-body"
                    d="M 182.3 184.6 C 188 135, 220 112, 248 115 C 275 118, 298 155, 307.7 225.4 A 66 22 18 0 1 182.3 184.6 Z"
                    fill="url(#shadeExterior)"
                    stroke="#16181b"
                    strokeWidth="1.8"
                  />
                  <path
                    className="shade-enamel-highlight"
                    d="M 187 181 C 193 139, 221 119, 247 120 C 267 122, 286 144, 297 178 C 271 163, 224 153, 187 181 Z"
                    fill="url(#shadeHighlight)"
                  />
                  <ellipse className="shade-reflector-off" cx="245" cy="205" rx="66" ry="22" transform="rotate(18, 245, 205)" fill="url(#reflectorOff)" />
                  <ellipse className="shade-reflector-on" cx="245" cy="205" rx="66" ry="22" transform="rotate(18, 245, 205)" fill="url(#reflectorOn)" />
                  <path className="shade-rim-trim" d="M 182.3 184.6 A 66 22 18 0 0 307.7 225.4" stroke="url(#shadeRim)" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <g className="bulb-unit">
                    <ellipse cx="245" cy="195" rx="14" ry="17" transform="rotate(18, 245, 195)" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
                    <path className="bulb-filament" d="M 241 189 Q 245 183 249 189" stroke="#555" strokeWidth="1.8" fill="none" />
                    <circle className="bulb-glow-core" cx="245" cy="188" r="11" fill="var(--lamp-glow, #ffe194)" filter="url(#bulbGlowFilter)" opacity="0" />
                  </g>
                  <g className="cord-socket-grommet">
                    <rect x="242" y="206" width="6" height="6" rx="1.5" fill="url(#brassJoint)" stroke="#68420e" strokeWidth="0.8" />
                    <circle cx="245" cy="212" r="3" fill="#ffe299" stroke="#7a5513" strokeWidth="0.8" />
                  </g>
                </g>

                <g className="pull-cord-system">
                  <path
                    ref={elasticCordRef}
                    className="elastic-cord-path"
                    d={`M ${ANCHOR_X} ${ANCHOR_Y} Q ${ANCHOR_X} ${(ANCHOR_Y + REST_Y) / 2} ${REST_X} ${REST_Y}`}
                    stroke="#e8bb54"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <g
                    className="cord-bead-group"
                    transform={`translate(${beadPos.x}, ${beadPos.y})`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    <circle className="bead-aura" cx="0" cy="0" r="16" fill="var(--lamp-accent)" opacity="0" />
                    <path className="bead-shape" d="M -4 -8 L 4 -8 L 7 6 C 7 10, -7 10, -7 6 Z" fill="url(#brassJoint)" stroke="#7a5513" strokeWidth="0.8" />
                    <circle className="cord-hit-area" cx="0" cy="0" r="32" fill="transparent" />
                  </g>
                </g>
              </svg>

              <div className="cord-tooltip">
                <span>Pull string to turn on</span>
                <div className="tooltip-arrow" />
              </div>
            </div>
          </div>

          <div
            ref={formStageRef}
            className="form-stage"
            onMouseMove={(e) => {
              if (!isOn || !formStageRef.current) return;
              const rect = formStageRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              setCardTilt({
                rx: -(y / rect.height) * 9,
                ry: (x / rect.width) * 9,
              });
            }}
            onMouseLeave={() => setCardTilt({ rx: 0, ry: 0 })}
          >
            <div
              className="login-card"
              style={
                isOn
                  ? {
                      transform: `perspective(900px) rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg)`,
                    }
                  : undefined
              }
            >
              <div className="card-header">
                <h1 className="card-title">{activeTab === 'signin' ? 'College Portal' : 'Create Account'}</h1>
                <p className="card-subtitle">
                  {activeTab === 'signin' ? 'Sign in to continue to your account' : 'Sign up to access your college portal'}
                </p>
              </div>

              <div className="auth-tabs" data-active={activeTab}>
                <button
                  type="button"
                  className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('signin');
                    setError('');
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('register');
                    setError('');
                    setStatusMsg('');
                    setPassword('');
                  }}
                >
                  Sign Up
                </button>
                <div className="tab-slider" />
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {(activeTab === 'register' || isForgotMode) && (
                  <div className="form-group">
                    <label htmlFor="fullNameField">Full Name</label>
                    <div className="input-wrapper">
                      <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        id="fullNameField"
                        type="text"
                        placeholder="Enter full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="userField">{isForgotMode ? "Username, Roll No, Mobile, or Email" : "Username"}</label>
                  <div className="input-wrapper">
                    <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="userField"
                      type="text"
                      placeholder={isForgotMode ? "Enter username, roll no, or contact" : "Enter username (e.g. admin)"}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="passField">{isForgotMode ? "New Password" : "Password"}</label>
                    {activeTab === "signin" && (
                      <button type="button" className="forgot-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => { setIsForgotMode((v) => !v); setError(""); setStatusMsg(""); }}>
                        {isForgotMode ? "Back to Sign In" : "Forgot Password?"}
                      </button>
                    )}
                  </div>
                  <div className="input-wrapper">
                    <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="passField"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={isForgotMode ? newPassword : password}
                      onChange={(e) => isForgotMode ? setNewPassword(e.target.value) : setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {activeTab === 'register' && (
                  <div className="form-group">
                    <label htmlFor="roleField">I am a...</label>
                    <div className="input-wrapper">
                      <select
                        id="roleField"
                        className="lamp-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                      >
                        <option value={Role.Student}>Student</option>
                        <option value={Role.Teacher}>Teacher</option>
                        <option value={Role.Admin}>Admin</option>
                      </select>
                    </div>
                  </div>
                )}

                {error && <p className="lamp-error-msg">{error}</p>}
                {statusMsg && <p className="lamp-success-msg">{statusMsg}</p>}

                <button type="submit" className="submit-btn" disabled={loading}>
                  <span className="btn-content">
                    <span>
                      {loading
                        ? (isForgotMode ? 'Resetting...' : activeTab === 'signin' ? 'Signing in...' : 'Creating...')
                        : (isForgotMode ? 'Reset Password' : activeTab === 'signin' ? 'Sign In' : 'Create Account')}
                    </span>
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default LampLoginPage;