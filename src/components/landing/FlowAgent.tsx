import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type AgentState =
  | 'idle'
  | 'dispatching'
  | 'alert'
  | 'success'
  | 'tracking'
  | 'listening';

interface Props {
  /** Active animation state — drives the agent's pose, colour, tag, and motion. */
  state?: AgentState;
  className?: string;
  onStateChange?: (nextState: AgentState) => void;
}

const STATES: Record<AgentState, [string, number]> = {
  idle: ['idle', 0x60a5fa],
  dispatching: ['dispatching', 0x60a5fa],
  alert: ['alert', 0xf87171],
  success: ['success', 0x34d399],
  tracking: ['tracking', 0x60a5fa],
  listening: ['listening', 0x60a5fa],
};

function capsule(r: number, len: number) {
  const p: THREE.Vector2[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / n);
    p.push(new THREE.Vector2(Math.max(r * Math.cos(a), 1e-4), -len / 2 + r * Math.sin(a)));
  }
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI / 2) * (i / n);
    p.push(new THREE.Vector2(Math.max(r * Math.cos(a), 1e-4), len / 2 + r * Math.sin(a)));
  }
  return new THREE.LatheGeometry(p, 40);
}

function rbox(w: number, h: number, d: number, r: number, b = 0.03) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}

function glowTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  if (x) {
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
}

const B = (c: THREE.ColorRepresentation, o?: THREE.MeshBasicMaterialParameters) =>
  new THREE.MeshBasicMaterial(Object.assign({ color: c, toneMapped: false }, o));

/**
 * Pure React component rendering the 3D LogiFlow AI agent "Flow" directly into WebGL.
 * Zero iframe dependency — 100% bundled with Vite and works reliably across all hosts.
 */
export function FlowAgent({ state = 'idle', className, onStateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<AgentState>(state);
  const setStateRef = useRef<((s: AgentState) => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    setStateRef.current?.(state);
  }, [state]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    cam.position.set(0, 0.8, 11);
    cam.lookAt(0, 0.6, 0);

    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    ren.setClearColor(0, 0);
    ren.toneMapping = THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure = 1.15;
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(ren.domElement);
    ren.domElement.style.display = 'block';
    ren.domElement.style.width = '100%';
    ren.domElement.style.height = '100%';
    ren.domElement.style.touchAction = 'none';

    // Image-based lighting environment
    try {
      const e = new THREE.Scene();
      e.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x06080d, side: THREE.BackSide })));
      (
        [
          [0x60a5fa, 5, [-8, 5, 8], [6, 3]],
          [0xffffff, 4, [0, 12, 2], [10, 2]],
          [0x34d399, 4, [8, 3, -8], [6, 2]],
          [0xfbbf24, 2.5, [8, -1, 6], [3, 2]],
        ] as const
      ).forEach((l) => {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(l[3][0], l[3][1]),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(l[0]).multiplyScalar(l[1]), side: THREE.DoubleSide })
        );
        m.position.set(l[2][0], l[2][1], l[2][2]);
        m.lookAt(0, 0, 0);
        e.add(m);
      });
      const pm = new THREE.PMREMGenerator(ren);
      scene.environment = pm.fromScene(e, 0.04).texture;
      pm.dispose();
    } catch {
      // Fallback if PMREM generator fails
    }

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(2, 9, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.radius = 6;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const bounce = new THREE.PointLight(0x60a5fa, 1.4, 10);
    bounce.position.set(0, -2.2, 1.5);
    scene.add(bounce);
    scene.add(new THREE.HemisphereLight(0x8899bb, 0x050505, 0.35));

    const GT = glowTex();
    const white = new THREE.MeshPhysicalMaterial({ color: 0xf2f2ef, roughness: 0.38, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.28 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x020202, roughness: 0.05, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03 });
    const amber = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.55, roughness: 0.4 });
    const vis = new THREE.Color(0x60a5fa);
    const visM = B(vis);

    const agent = new THREE.Group();
    agent.name = 'flow-agent';
    scene.add(agent);

    const body = new THREE.Group();
    agent.add(body);

    function addMesh(g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p?: THREE.Group) {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      (p || body).add(o);
      return o;
    }

    // Torso
    addMesh(capsule(0.9, 1.2), white, 0, 0, 0).scale.z = 0.65;
    const belt = addMesh(new THREE.TorusGeometry(0.88, 0.03, 12, 64), amber, 0, -0.8, 0);
    belt.scale.set(1, 0.65, 1);
    belt.rotation.x = Math.PI / 2;
    addMesh(new THREE.CylinderGeometry(0.45, 0.3, 0.3, 32), dark, 0, -1.65, 0);
    addMesh(new THREE.CylinderGeometry(0.25, 0.28, 0.3, 24), dark, 0, 1.55, 0);

    // Dynamic digital tag badge on chest
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 512;
    tagCanvas.height = 160;
    const tagCtx = tagCanvas.getContext('2d');
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.anisotropy = 4;
    const tagMat = B(0xffffff, { map: tagTex, transparent: true });

    addMesh(rbox(0.76, 0.26, 0.03, 0.05, 0.008), dark, 0, 0.5, 0.59);
    addMesh(new THREE.PlaneGeometry(0.72, 0.225), tagMat, 0, 0.5, 0.612);

    function updateTagBadge(s: string, hexColor: string) {
      if (!tagCtx) return;
      const w = 512;
      const h = 160;
      const r = 36;
      tagCtx.clearRect(0, 0, w, h);

      // Dark pill
      tagCtx.fillStyle = 'rgba(8, 10, 16, 0.94)';
      tagCtx.beginPath();
      tagCtx.moveTo(r, 6);
      tagCtx.lineTo(w - r, 6);
      tagCtx.quadraticCurveTo(w - 6, 6, w - 6, r);
      tagCtx.lineTo(w - 6, h - r);
      tagCtx.quadraticCurveTo(w - 6, h - 6, w - r, h - 6);
      tagCtx.lineTo(r, h - 6);
      tagCtx.quadraticCurveTo(6, h - 6, 6, h - r);
      tagCtx.lineTo(6, r);
      tagCtx.quadraticCurveTo(6, 6, r, 6);
      tagCtx.closePath();
      tagCtx.fill();

      // Border in state color
      tagCtx.strokeStyle = hexColor;
      tagCtx.lineWidth = 6;
      tagCtx.stroke();

      // Subtle inner rim
      tagCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      tagCtx.lineWidth = 2;
      tagCtx.stroke();

      const label = s.toUpperCase();
      tagCtx.font = 'bold 50px "Geist", "Inter", system-ui, -apple-system, sans-serif';
      tagCtx.textBaseline = 'middle';

      const metrics = tagCtx.measureText(label);
      const dotR = 13;
      const gap = 20;
      const totalW = dotR * 2 + gap + metrics.width;
      const startX = (w - totalW) / 2;

      // Indicator dot
      tagCtx.fillStyle = hexColor;
      tagCtx.shadowColor = hexColor;
      tagCtx.shadowBlur = 24;
      tagCtx.beginPath();
      tagCtx.arc(startX + dotR, h / 2, dotR, 0, Math.PI * 2);
      tagCtx.fill();

      // White label
      tagCtx.shadowBlur = 0;
      tagCtx.fillStyle = '#ffffff';
      tagCtx.fillText(label, startX + dotR * 2 + gap, h / 2);

      tagTex.needsUpdate = true;
    }

    addMesh(new THREE.BoxGeometry(0.7, 0.03, 0.01), B(0x777777), 0, 0.0, 0.6);
    addMesh(new THREE.CircleGeometry(0.07, 24), B(0x34d399), -0.35, 0, 0.61);
    addMesh(rbox(0.14, 0.14, 0.02, 0.03, 0.005), B(0xf87171), 0.35, 0, 0.6);
    const routeDot = addMesh(new THREE.CircleGeometry(0.04, 16), B(0xffffff), -0.35, 0, 0.63);

    const ledCols = [0x34d399, 0x60a5fa, 0xfbbf24];
    const ledMul = [1, 0.7, 0.45];
    const ledMats = ledCols.map((c, i) => {
      const m = B(c);
      addMesh(new THREE.BoxGeometry(0.2, 0.06, 0.03), m, (i - 1) * 0.32, -0.42, 0.58);
      return m;
    });

    // Head
    const head = new THREE.Group();
    head.name = 'head';
    head.position.y = 1.65;
    body.add(head);

    const hm = addMesh(capsule(0.75, 0.7), white, 0, 0.75, 0, head);
    hm.rotation.z = Math.PI / 2;
    hm.scale.z = 0.9;
    addMesh(rbox(1.5, 0.78, 0.12, 0.34, 0.02), glass, 0, 0.75, 0.66, head);
    const eyes = [-0.34, 0.34].map((x) => addMesh(capsule(0.07, 0.16), visM, x, 0.75, 0.73, head));
    const shim = addMesh(
      new THREE.PlaneGeometry(0.22, 0.6),
      B(0xffffff, { transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
      0,
      0.75,
      0.735,
      head
    );
    const haloMat = new THREE.SpriteMaterial({
      map: GT,
      color: vis,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(3, 1.3, 1);
    halo.position.set(0, 0.75, 0.85);
    head.add(halo);

    [-1, 1].forEach((s) => {
      const p = addMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 32), amber, s * 1.12, 0.75, 0, head);
      p.rotation.z = Math.PI / 2;
    });
    addMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12), dark, 0.5, 1.72, 0, head);
    const tipM = B(0x34d399);
    addMesh(new THREE.SphereGeometry(0.1, 20, 20), tipM, 0.5, 2.12, 0, head);
    addMesh(new THREE.ConeGeometry(0.1, 0.2, 20), tipM, 0.5, 1.99, 0, head).rotation.x = Math.PI;

    // Arms
    function makeArm(side: number) {
      const sh = new THREE.Group();
      sh.position.set(side * 1.08, 0.6, 0);
      body.add(sh);
      addMesh(new THREE.SphereGeometry(0.22, 24, 24), dark, 0, 0, 0, sh);
      addMesh(capsule(0.14, 0.5), white, 0, -0.4, 0, sh);
      const el = new THREE.Group();
      el.position.y = -0.8;
      sh.add(el);
      addMesh(new THREE.SphereGeometry(0.15, 20, 20), dark, 0, 0, 0, el);
      addMesh(capsule(0.12, 0.4), white, 0, -0.4, 0, el);
      addMesh(new THREE.TorusGeometry(0.12, 0.025, 10, 32), amber, 0, -0.78, 0, el).rotation.x = Math.PI / 2;
      addMesh(new THREE.SphereGeometry(0.2, 24, 24), white, 0, -0.98, 0, el).scale.set(1, 1.1, 0.85);
      return { sh, el };
    }
    const L = makeArm(-1);
    const R = makeArm(1);

    // Hover disk & shadow
    const diskM = B(vis, { transparent: true, opacity: 0.8 });
    const disk = addMesh(new THREE.CylinderGeometry(1, 1, 0.06, 48), diskM, 0, -2.15, 0, agent);
    disk.scale.set(1.15, 1, 0.8);
    const floorMat = B(vis, { map: GT, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const floor = addMesh(new THREE.PlaneGeometry(1, 1), floorMat, 0, -2.5, 0, agent);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(6, 4, 1);

    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.45 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.52;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    body.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
        o.castShadow = true;
      }
    });

    // Antenna wave rings & particles
    const tipPos = [0.5, 2.12, 0] as const;
    const ringMats = [0, 1, 2].map(() =>
      B(0x22d3ee, { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    const rings = ringMats.map((mat) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 64), mat);
      m.rotation.x = Math.PI / 2;
      m.position.set(...tipPos);
      head.add(m);
      return m;
    });
    const micMat = B(0xffffff, { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const mic = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 64), micMat);
    mic.rotation.x = Math.PI / 2;
    mic.position.set(...tipPos);
    head.add(mic);

    const N = 60;
    const pp = new Float32Array(N * 3);
    const pv: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) pv.push(new THREE.Vector3());
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pm = new THREE.PointsMaterial({ color: 0x34d399, size: 0.09, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    agent.add(new THREE.Points(pg, pm));
    let pT = -9;

    function burst() {
      pT = clock.getElapsedTime();
      for (let i = 0; i < N; i++) {
        pp[i * 3] = (Math.random() - 0.5) * 1.2;
        pp[i * 3 + 1] = 2.4;
        pp[i * 3 + 2] = 0.8;
        pv[i].set((Math.random() - 0.5) * 2.4, Math.random() * 1.8 + 0.3, Math.random() * 1.4);
      }
    }

    let activeState: AgentState = stateRef.current;
    let st = 0;
    let successTimer: ReturnType<typeof setTimeout> | null = null;
    const clock = new THREE.Clock();

    function setAgentState(s: AgentState) {
      if (!STATES[s]) return;
      activeState = s;
      st = clock.getElapsedTime();
      if (successTimer) clearTimeout(successTimer);
      if (s === 'success') {
        burst();
        successTimer = setTimeout(() => {
          setAgentState('idle');
          onStateChange?.('idle');
        }, 3500);
      }
      const hex = '#' + new THREE.Color(STATES[s][1]).getHexString();
      updateTagBadge(STATES[s][0], hex);
    }
    setStateRef.current = setAgentState;
    setAgentState(activeState);

    // Mouse pointer tracking
    const mouse = { x: 0, y: 0 };
    const ray = new THREE.Raycaster();
    const pt = new THREE.Vector2();

    const onPointerMove = (e: PointerEvent) => {
      const rect = ren.domElement.getBoundingClientRect();
      const originX = rect.left + rect.width * 0.5;
      const originY = rect.top + rect.height * 0.45;

      const spanX = Math.max(originX, window.innerWidth - originX);
      const spanY = Math.max(originY, window.innerHeight - originY);

      const nx = spanX > 0 ? (e.clientX - originX) / spanX : 0;
      const ny = spanY > 0 ? -((e.clientY - originY) / spanY) : 0;

      mouse.x = Math.max(-1.5, Math.min(1.5, nx * 1.35));
      mouse.y = Math.max(-1.3, Math.min(1.3, ny * 1.35));

      pt.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pt.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      ray.setFromCamera(pt, cam);
      const hits = ray.intersectObject(body, true);
      ren.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
    };

    const onPointerDown = () => {
      ray.setFromCamera(pt, cam);
      if (ray.intersectObject(body, true).length > 0) {
        setAgentState('success');
        onStateChange?.('success');
      }
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        mouse.x = 0;
        mouse.y = 0;
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    ren.domElement.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mouseleave', onMouseLeave);

    // Responsive sizing
    function resize() {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (!w || !h) return;
      ren.setSize(w, h, false);
      cam.aspect = w / h;
      cam.fov = w / h < 0.8 ? 44 : 30;
      cam.updateProjectionMatrix();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('resize', resize);
    resize();

    // Animation Loop
    const cur = { rz: 0.3, rx: 0, fz: -0.4, lfz: -0.4, hx: 0, hy: 0, hz: 0, ay: -0.2 };
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const tgt = new THREE.Color();

    ren.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const e = t - st;
      const k = Math.min(1, dt * 6);

      tgt.setHex(STATES[activeState][1]);
      vis.lerp(tgt, 0.12);
      visM.color.copy(vis);
      haloMat.color.copy(vis);
      diskM.color.copy(vis);
      floorMat.color.copy(vis);
      bounce.color.copy(vis);

      let y = Math.sin((t * 2 * Math.PI) / 3) * 0.08;
      let x = 0;
      if (activeState === 'success') y += 0.12 * Math.exp(-e * 4) * Math.cos(e * 18);
      if (activeState === 'alert' && e < 0.6) x = Math.sin((e * 2 * Math.PI) / 0.12) * 0.04;
      body.position.set(x, y, 0);

      cur.ay = lerp(cur.ay, -0.2 + mouse.x * 0.28, k);
      agent.rotation.y = cur.ay;

      let hy = Math.sin((t * 2 * Math.PI) / 4) * 0.052;
      let hx = -mouse.y * 0.32 + (activeState === 'tracking' ? 0.14 : 0);
      const hz = activeState === 'listening' ? -0.087 : 0;
      if (activeState === 'dispatching') hy = Math.sin((t * 2 * Math.PI) / 1.2) * 0.35;
      else hy += mouse.x * 0.65;

      cur.hy = lerp(cur.hy, hy, k);
      cur.hx = lerp(cur.hx, hx, k);
      cur.hz = lerp(cur.hz, hz, k);
      head.rotation.set(cur.hx, cur.hy, cur.hz);

      const rz = activeState === 'success' ? (e < 1.5 ? 2.4 + Math.sin(e * 9) * 0.25 : 0.3) : 0.3;
      const rx = activeState === 'dispatching' ? -0.5 : 0;
      const fz = activeState === 'dispatching' ? -1 : activeState === 'listening' ? -0.8 : activeState === 'success' ? -0.3 : -0.4;
      const lfz = activeState === 'listening' ? -0.8 : -0.4;

      cur.rz = lerp(cur.rz, rz, k);
      cur.rx = lerp(cur.rx, rx, k);
      cur.fz = lerp(cur.fz, fz, k);
      cur.lfz = lerp(cur.lfz, lfz, k);

      R.sh.rotation.set(cur.rx, 0, cur.rz);
      R.el.rotation.x = cur.fz;
      L.sh.rotation.set(0, 0, -0.3);
      L.el.rotation.x = cur.lfz;

      const P = activeState === 'dispatching' ? 0.83 : activeState === 'tracking' ? 0.8 : 2.5;
      shim.position.x = -0.6 + ((t / P) % 1) * 1.2;
      haloMat.opacity = activeState === 'listening' ? 0.65 : activeState === 'success' ? 0.6 : 0.4;

      const bl = t % 4.2 < 0.12 ? 0.1 : 1;
      eyes.forEach((o) => (o.scale.y = bl));

      routeDot.position.x = -0.35 + ((t / (activeState === 'dispatching' ? 0.8 : 2.2)) % 1) * 0.7;

      const cyc = activeState === 'dispatching' ? 0.3 : 2;
      ledMats.forEach((m, i) => {
        const p = 0.5 + 0.5 * Math.sin(((t - i * 0.3 * (cyc / 2)) * 2 * Math.PI) / cyc);
        m.color.setHex(ledCols[i]).multiplyScalar(ledMul[i] * (0.35 + 0.65 * p));
      });

      diskM.opacity = 0.8 + 0.2 * Math.sin(t * Math.PI);
      if (activeState === 'alert') {
        diskM.opacity = Math.sin(t * 14) > 0 ? 1 : 0.25;
        tipM.color.setHex(0xf87171).multiplyScalar(0.5 + 0.5 * Math.sin((t * 2 * Math.PI) / 0.4));
      } else {
        tipM.color.setHex(0x34d399).multiplyScalar(0.6 + 0.4 * Math.sin((t * 2 * Math.PI) / 1.8));
      }

      rings.forEach((r, i) => {
        let a = 0;
        let s = 1;
        if (activeState === 'dispatching' && i === 0) {
          const p = (t / 1.6) % 1;
          s = 0.4 + p * 3;
          a = 1 - p;
        }
        if (activeState === 'tracking') {
          const p = ((t / 1.5) - i * 0.33 + 3) % 1;
          s = 0.4 + p * 3;
          a = (1 - p) * 0.8;
        }
        r.scale.set(s, s, s);
        ringMats[i].opacity = lerp(ringMats[i].opacity, a, 0.5);
      });

      const mp = (t / 1.4) % 1;
      mic.scale.setScalar(0.5 + mp * 3);
      micMat.opacity = activeState === 'listening' ? (1 - mp) * 0.8 : 0;

      const pa = t - pT;
      if (pa < 1.5) {
        for (let i = 0; i < N; i++) {
          pp[i * 3] += pv[i].x * dt;
          pp[i * 3 + 1] += pv[i].y * dt;
          pp[i * 3 + 2] += pv[i].z * dt;
        }
        pg.attributes.position.needsUpdate = true;
        pm.opacity = 1 - pa / 1.5;
      } else {
        pm.opacity = 0;
      }

      ren.render(scene, cam);
    });

    return () => {
      if (successTimer) clearTimeout(successTimer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mouseleave', onMouseLeave);
      observer.disconnect();

      ren.setAnimationLoop(null);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      ren.dispose();
      if (container.contains(ren.domElement)) {
        container.removeChild(ren.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label="Interactive 3D LogiFlow AI Agent"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    />
  );
}
