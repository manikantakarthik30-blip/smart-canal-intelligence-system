import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildHud, createDrone, createFlightState, stepFlight, updateHud } from "@/lib/uav-rig";

export type CanalSceneHandle = {
  dispose: () => void;
  setParallax: (nx: number, ny: number, scroll: number) => void;
};

const FLOW_SPEED = 0.38;
const FOG_COLOR = 0x0a0f1a;
const FOG_DENSITY = 0.038;

function waveHeight(x: number, z: number, t: number): number {
  const flowX = x - t * FLOW_SPEED;
  return (
    Math.sin(flowX * 0.32 + z * 0.18 + t * 0.85) * 0.2 +
    Math.sin(flowX * 0.78 - z * 0.41 + t * 1.25) * 0.09 +
    Math.sin(flowX * 1.65 + z * 1.12 + t * 1.75) * 0.035
  );
}

const WATER_VERT = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vWave;
varying vec3 vWorldPos;
varying vec3 vNormalW;

float wave(vec2 p, float t) {
  float flowX = p.x - t * ${FLOW_SPEED.toFixed(3)};
  float w1 = sin(flowX * 0.32 + p.y * 0.18 + t * 0.85) * 0.20;
  float w2 = sin(flowX * 0.78 - p.y * 0.41 + t * 1.25) * 0.09;
  float w3 = sin(flowX * 1.65 + p.y * 1.12 + t * 1.75) * 0.035;
  return w1 + w2 + w3;
}

void main() {
  vUv = uv;
  vec2 p = position.xy;
  float t = uTime;
  float h = wave(p, t);

  float eps = 0.18;
  float hL = wave(vec2(p.x - eps, p.y), t);
  float hR = wave(vec2(p.x + eps, p.y), t);
  float hD = wave(vec2(p.x, p.y - eps), t);
  float hU = wave(vec2(p.x, p.y + eps), t);
  vec3 n = normalize(vec3(hL - hR, hD - hU, 2.0 * eps));

  vec3 pos = vec3(position.x, position.y, h);
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vWave = h;
  vNormalW = normalize(mat3(modelMatrix) * n);

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const WATER_FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uGreen;
uniform vec3 uCyan;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCameraPos;
uniform vec3 uScanPos;
uniform vec3 uScanColor;
uniform float uScanRadius;

varying vec2 vUv;
varying float vWave;
varying vec3 vWorldPos;
varying vec3 vNormalW;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(uCameraPos - vWorldPos);
  float ndotv = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - ndotv, 2.6);

  float h = smoothstep(-0.16, 0.22, vWave);
  vec3 col = mix(uDeep, uShallow, h);

  float flow = vWorldPos.x - uTime * ${FLOW_SPEED.toFixed(3)};
  float streak = pow(abs(sin(flow * 2.2 + vWorldPos.z * 1.55 + uTime * 0.55)), 10.0);
  col += uCyan * streak * 0.07;
  col += uGreen * streak * 0.045 * (1.0 - h);

  float slick = 0.5 + 0.5 * sin(vWorldPos.x * 0.22 + vWorldPos.z * 0.31 + uTime * 0.18);
  vec3 irid = mix(uGreen, uCyan, slick);
  col += irid * fresnel * 0.42;

  float foam = smoothstep(0.155, 0.26, vWave);
  col = mix(col, uFoam, foam * 0.5);
  col *= 0.52 + 0.48 * h;

  vec3 L = normalize(vec3(-0.32, 0.82, 0.38));
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 52.0);
  col += vec3(0.62, 0.88, 0.95) * spec * 0.62;

  float sd = length(vWorldPos.xz - uScanPos.xz);
  float core = smoothstep(uScanRadius, uScanRadius * 0.1, sd);
  float halo = smoothstep(uScanRadius * 1.55, uScanRadius * 0.45, sd);
  col += uScanColor * (core * 1.15 + halo * 0.28);

  float dist = length(uCameraPos - vWorldPos);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
}
`;

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vDir = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const SKY_FRAG = /* glsl */ `
precision highp float;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 top = vec3(0.039, 0.059, 0.102);
  vec3 mid = vec3(0.102, 0.165, 0.227);
  vec3 low = vec3(0.055, 0.09, 0.11);
  float h = d.y;
  vec3 col = mix(low, mid, smoothstep(-0.15, 0.12, h));
  col = mix(col, top, smoothstep(0.08, 0.62, h));
  gl_FragColor = vec4(col, 1.0);
}
`;

type Debris = {
  mesh: THREE.Mesh;
  speed: number;
  spin: number;
  tilt: number;
  x: number;
  z: number;
  phase: number;
};

function addUrbanBank(scene: THREE.Scene, z: number, facing: number) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x141a16,
    roughness: 0.94,
    metalness: 0.04,
  });
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x1b2e22,
    roughness: 0.98,
    metalness: 0.0,
  });
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x10151c,
    roughness: 0.88,
    metalness: 0.08,
  });
  const windowMat = new THREE.MeshBasicMaterial({
    color: 0xc9a45c,
    transparent: true,
    opacity: 0.55,
  });
  const windowCyan = new THREE.MeshBasicMaterial({
    color: 0x00cfff,
    transparent: true,
    opacity: 0.28,
  });

  const wall = new THREE.Mesh(new THREE.BoxGeometry(96, 2.4, 1.4), wallMat);
  wall.position.set(0, 0.55, 0);
  wall.castShadow = false;
  group.add(wall);

  const lip = new THREE.Mesh(new THREE.BoxGeometry(96, 0.22, 1.8), mossMat);
  lip.position.set(0, 1.68, facing * 0.15);
  group.add(lip);

  const walk = new THREE.Mesh(new THREE.BoxGeometry(96, 0.12, 3.2), wallMat);
  walk.position.set(0, 1.78, facing * 1.6);
  group.add(walk);

  const rng = (s: number) => {
    const x = Math.sin(s * 127.1 + z * 13.7) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 14; i++) {
    const x = -40 + i * 6.2 + (rng(i + 2) - 0.5) * 1.4;
    const h = 3.2 + rng(i + 9) * 7.5;
    const w = 2.2 + rng(i + 4) * 2.4;
    const d = 2.4 + rng(i + 6) * 2.0;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat);
    b.position.set(x, 1.85 + h / 2, facing * (3.4 + d * 0.35));
    group.add(b);

    const rows = Math.max(3, Math.floor(h / 1.15));
    const cols = 2 + Math.floor(rng(i + 11) * 2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng(i * 17 + r * 8 + c) < 0.38) continue;
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(0.22, 0.32),
          rng(i + r + c) > 0.82 ? windowCyan : windowMat,
        );
        win.position.set(
          x - w * 0.28 + c * 0.42,
          2.4 + r * 0.95,
          facing * (3.4 + d * 0.35) + facing * (d / 2 + 0.02),
        );
        if (facing < 0) win.rotation.y = Math.PI;
        group.add(win);
      }
    }
  }

  group.position.z = z;
  scene.add(group);
}

function addPosts(scene: THREE.Scene) {
  const wood = new THREE.MeshStandardMaterial({
    color: 0x2a241c,
    roughness: 0.92,
    metalness: 0.02,
  });
  const geo = new THREE.CylinderGeometry(0.07, 0.1, 2.1, 6);
  const positions = [
    [-18, 0.55, 8.4],
    [-7, 0.5, 9.1],
    [6, 0.48, 8.2],
    [16.5, 0.52, 9.0],
    [-12, 0.5, -8.6],
    [3, 0.46, -9.2],
    [14, 0.5, -8.4],
  ];
  for (const [x, y, z] of positions) {
    const m = new THREE.Mesh(geo, wood);
    m.position.set(x, y, z);
    m.rotation.z = (x > 0 ? -1 : 1) * 0.04;
    scene.add(m);
  }
}

export function mountCanalScene(container: HTMLElement): CanalSceneHandle {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const mobile = width < 768;

  const renderer = new THREE.WebGLRenderer({
    antialias: !mobile,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 1.85));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.setClearColor(FOG_COLOR, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_COLOR);
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);

  const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 180);
  camera.position.set(3.8, 5.2, 11.4);
  camera.lookAt(5.4, 5.6, 5.2);

  const hemi = new THREE.HemisphereLight(0x1a2a3a, 0x0a1510, 0.55);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0x8ea8bc, 0.72);
  moon.position.set(-14, 22, 10);
  scene.add(moon);

  const greenGlow = new THREE.PointLight(0x00ff88, 2.4, 28, 1.6);
  greenGlow.position.set(6.5, 3.4, 2.2);
  scene.add(greenGlow);

  const cyanGlow = new THREE.PointLight(0x00cfff, 1.8, 24, 1.6);
  cyanGlow.position.set(-9, 2.8, 4.5);
  scene.add(cyanGlow);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(90, 24, 16),
    new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL1,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  scene.add(sky);

  const segsX = mobile ? 90 : 160;
  const segsZ = mobile ? 40 : 72;
  const waterGeo = new THREE.PlaneGeometry(92, 28, segsX, segsZ);
  const waterMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL1,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#1a3a2a") },
      uShallow: { value: new THREE.Color("#2a5a40") },
      uFoam: { value: new THREE.Color("#9ecbb4") },
      uGreen: { value: new THREE.Color("#00ff88") },
      uCyan: { value: new THREE.Color("#00cfff") },
      uFogColor: { value: new THREE.Color(FOG_COLOR) },
      uFogDensity: { value: FOG_DENSITY },
      uCameraPos: { value: camera.position.clone() },
      uScanPos: { value: new THREE.Vector3(12, 0, 0) },
      uScanColor: { value: new THREE.Color(0xc8f0ff) },
      uScanRadius: { value: 1.7 },
    },
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  scene.add(water);

  addUrbanBank(scene, -14.4, -1);
  addUrbanBank(scene, 14.4, 1);
  addPosts(scene);

  const debrisMats = [
    new THREE.MeshStandardMaterial({ color: 0x5a5248, roughness: 0.9, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0x6b6054, roughness: 0.88, metalness: 0.04 }),
    new THREE.MeshStandardMaterial({ color: 0x3d3a36, roughness: 0.92, metalness: 0.03 }),
    new THREE.MeshStandardMaterial({ color: 0x4a453c, roughness: 0.9, metalness: 0.04 }),
    new THREE.MeshStandardMaterial({ color: 0x3a4036, roughness: 0.95, metalness: 0.02 }),
  ];

  const debris: Debris[] = [];
  for (let i = 0; i < 15; i++) {
    const w = 0.35 + Math.random() * 0.55;
    const d = 0.18 + Math.random() * 0.32;
    const geo = new THREE.BoxGeometry(w, 0.045, d);
    const mesh = new THREE.Mesh(geo, debrisMats[i % debrisMats.length]);
    const lanes = [-3, -1, 1, 3];
    const x = i < 8 ? -6.5 + (i % 4) * 4.1 + (Math.random() - 0.5) * 0.4 : -36 + Math.random() * 72;
    const z = i < 8 ? lanes[i % 4] + (Math.random() - 0.5) * 0.28 : -8 + Math.random() * 16;
    mesh.position.set(x, 0.08, z);
    mesh.rotation.y = Math.random() * Math.PI;
    scene.add(mesh);
    debris.push({
      mesh,
      speed: 0.22 + Math.random() * 0.28,
      spin: (Math.random() - 0.5) * 0.18,
      tilt: Math.random() * Math.PI * 2,
      x,
      z,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const drone = createDrone(scene);
  const flight = createFlightState();
  const hud = buildHud(container);
  const look = new THREE.Vector3(5.4, 5.6, 5.2);
  const lookGoal = new THREE.Vector3();
  const chaseOffset = new THREE.Vector3();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = 0.85;
  controls.maxPolarAngle = 1.45;
  controls.target.copy(look);
  controls.update();
  let orbiting = false;
  controls.addEventListener("start", () => {
    orbiting = true;
  });
  controls.addEventListener("end", () => {
    orbiting = false;
  });

  const camBase = camera.position.clone();
  const desiredCam = camBase.clone();
  const parallax = { x: 0, y: 0, s: 0 };
  let last = performance.now();
  let elapsed = 0;
  let raf = 0;
  let disposed = false;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const isMobile = w < 768;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.4 : 1.85));
    renderer.setSize(w, h, false);
  };
  window.addEventListener("resize", onResize);
  const resizeObs = new ResizeObserver(onResize);
  resizeObs.observe(container);

  const animate = (now: number) => {
    if (disposed) return;
    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += reduced ? 0 : delta;

    waterMat.uniforms.uTime.value = elapsed;
    waterMat.uniforms.uCameraPos.value.copy(camera.position);

    if (!reduced) {
      greenGlow.intensity = 2.1 + Math.sin(elapsed * 0.7) * 0.35;
      cyanGlow.intensity = 1.55 + Math.cos(elapsed * 0.55) * 0.3;
    }

    for (const d of debris) {
      if (!reduced) {
        d.x += d.speed * delta;
        if (d.x > 42) d.x = -42;
        d.mesh.rotation.y += d.spin * delta;
      }
      const y = waveHeight(d.x, -d.z, elapsed);
      d.mesh.position.set(d.x, y + 0.05, d.z);
      d.mesh.rotation.x = Math.sin(elapsed * 0.8 + d.phase) * 0.12;
      d.mesh.rotation.z = Math.cos(elapsed * 0.6 + d.tilt) * 0.1;
    }

    const scan = stepFlight(
      drone,
      flight,
      debris,
      elapsed,
      reduced ? 0 : delta,
      reduced,
      (x, z) => waveHeight(x, -z, elapsed),
    );

    lookGoal.set(flight.x, flight.y + 0.15, flight.z);
    look.lerp(lookGoal, Math.min(1, delta * 2.4));
    controls.target.copy(look);
    if (!orbiting && !reduced) {
      const ang = elapsed * 0.22;
      chaseOffset.set(Math.sin(ang) * 5.6 + 1.4, 2.6 + Math.sin(elapsed * 0.35) * 0.45, 6.4 + Math.cos(ang) * 2.2);
      desiredCam.set(flight.x + chaseOffset.x, Math.max(3.1, flight.y + chaseOffset.y), flight.z + chaseOffset.z);
      desiredCam.x += parallax.x * 1.8;
      desiredCam.y += parallax.y * 0.9 - parallax.s * 2.4;
      desiredCam.z += parallax.s * 3.6;
      camera.position.lerp(desiredCam, Math.min(1, delta * 1.8));
    }
    controls.update();

    waterMat.uniforms.uScanPos.value.set(flight.x, scan.waterY, flight.z);
    waterMat.uniforms.uScanColor.value.copy(scan.color);
    waterMat.uniforms.uScanRadius.value = flight.mode === "lock" ? 1.35 : 2.05;

    updateHud(hud, flight, drone.heading, scan.spd, scan.y, elapsed);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  };

  raf = requestAnimationFrame(animate);

  return {
    setParallax: (nx: number, ny: number, scroll: number) => {
      parallax.x = nx;
      parallax.y = ny;
      parallax.s = scroll;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      resizeObs.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
