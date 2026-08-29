import * as THREE from "three";

export type DroneRig = {
  root: THREE.Group;
  body: THREE.Group;
  rotors: { group: THREE.Group; dir: number }[];
  gimbal: THREE.Group;
  spot: THREE.SpotLight;
  beam: THREE.Mesh;
  scanDisc: THREE.Mesh;
  hudRing: THREE.Mesh;
  diamond: THREE.LineSegments;
  discMat: THREE.ShaderMaterial;
  navRed: THREE.PointLight;
  navGreen: THREE.PointLight;
  navWhite: THREE.PointLight;
  navRedMesh: THREE.Mesh;
  navGreenMesh: THREE.Mesh;
  navWhiteMesh: THREE.Mesh;
  heading: number;
};

export type HudBits = {
  el: HTMLDivElement;
  alt: HTMLElement;
  spd: HTMLElement;
  bat: HTMLElement;
  obj: HTMLElement;
  rec: HTMLElement;
  needle: HTMLElement;
};

type Pass = { x0: number; x1: number; z: number };

const PASSES: Pass[] = [
  { x0: -8, x1: 8, z: -3 },
  { x0: 8, x1: -8, z: -1 },
  { x0: -8, x1: 8, z: 1 },
  { x0: 8, x1: -8, z: 3 },
];

const ARM_DEFS = [
  { yaw: -Math.PI / 4, dir: 1, nav: "red" as const },
  { yaw: Math.PI / 4, dir: -1, nav: "green" as const },
  { yaw: (3 * Math.PI) / 4, dir: 1, nav: null },
  { yaw: (-3 * Math.PI) / 4, dir: -1, nav: null },
];

const WHITE = new THREE.Color(0xc8f0ff);
const YELLOW = new THREE.Color(0xffff00);
const RED = new THREE.Color(0xff3300);
const tmpColor = new THREE.Color();

export type FlightState = {
  mode: "entry" | "cruise" | "turn" | "lock";
  pass: number;
  x: number;
  z: number;
  y: number;
  entryT: number;
  turnT: number;
  lockT: number;
  lockDebris: number;
  objects: number;
  cooldown: number;
  vx: number;
};

export function createFlightState(): FlightState {
  return {
    mode: "entry",
    pass: 0,
    x: 5.4,
    z: 5.2,
    y: 6.4,
    entryT: 0,
    turnT: 0,
    lockT: 0,
    lockDebris: -1,
    objects: 47,
    cooldown: 0,
    vx: 1,
  };
}

export function createDrone(scene: THREE.Scene): DroneRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const matBody = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.86, metalness: 0.18 });
  const matDome = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.72, metalness: 0.12 });
  const matGimbal = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.22, metalness: 0.72 });
  const matLens = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.06, metalness: 0.95 });
  const matArm = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.28 });
  const matMotor = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.55, metalness: 0.38 });
  const matRotor = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.38,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
  });

  body.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 8), matBody));

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    matDome,
  );
  dome.position.y = 0.04;
  body.add(dome);

  const hang = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 8), matGimbal);
  hang.position.y = -0.12;
  body.add(hang);

  const gimbal = new THREE.Group();
  gimbal.position.y = -0.22;
  gimbal.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), matGimbal));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), matLens);
  lens.position.y = -0.12;
  gimbal.add(lens);
  body.add(gimbal);

  const rotors: { group: THREE.Group; dir: number }[] = [];
  let navRed!: THREE.PointLight;
  let navGreen!: THREE.PointLight;
  let navRedMesh!: THREE.Mesh;
  let navGreenMesh!: THREE.Mesh;

  for (const def of ARM_DEFS) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.06), matArm);
    arm.rotation.y = def.yaw;
    arm.position.set(Math.cos(def.yaw) * 0.3, 0.02, Math.sin(def.yaw) * 0.3);
    body.add(arm);

    const tipX = Math.cos(def.yaw) * 0.6;
    const tipZ = Math.sin(def.yaw) * 0.6;
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8), matMotor);
    motor.position.set(tipX, 0.06, tipZ);
    body.add(motor);

    const rotor = new THREE.Group();
    rotor.position.set(tipX, 0.1, tipZ);
    const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.008, 0.06), matRotor);
    const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.008, 0.06), matRotor);
    bladeB.rotation.y = Math.PI / 2;
    rotor.add(bladeA, bladeB);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.26, 24),
      new THREE.MeshBasicMaterial({
        color: 0x8899aa,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    rotor.add(disc);
    body.add(rotor);
    rotors.push({ group: rotor, dir: def.dir });

    if (def.nav) {
      const col = def.nav === "red" ? 0xff0000 : 0x00ff00;
      const light = new THREE.PointLight(col, 0.5, 0.8, 2);
      light.position.set(tipX, 0.08, tipZ);
      body.add(light);
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: col }),
      );
      bead.position.set(tipX, 0.09, tipZ);
      body.add(bead);
      if (def.nav === "red") {
        navRed = light;
        navRedMesh = bead;
      } else {
        navGreen = light;
        navGreenMesh = bead;
      }
    }
  }

  const navWhite = new THREE.PointLight(0xffffff, 0.7, 1.2, 2);
  navWhite.position.set(-0.22, 0.08, 0);
  body.add(navWhite);
  const navWhiteMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  navWhiteMesh.position.set(-0.22, 0.09, 0);
  body.add(navWhiteMesh);

  const spot = new THREE.SpotLight(0xc8f0ff, 3.5, 12, 0.35, 0.4, 1.1);
  spot.position.set(0, -0.34, 0);
  spot.target.position.set(0, -8, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  root.add(spot);
  root.add(spot.target);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xc8f0ff,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    fog: true,
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.55, 3.2, 28, 1, true), beamMat);
  beam.position.y = -1.7;
  root.add(beam);

  const discMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL1,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(0xc8f0ff) },
      uOpacity: { value: 0.42 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        vec2 c = vUv - 0.5;
        float r = length(c) * 2.0;
        float glow = pow(1.0 - smoothstep(0.0, 1.0, r), 1.35);
        float rim = smoothstep(0.55, 0.8, r) * (1.0 - smoothstep(0.8, 1.0, r));
        gl_FragColor = vec4(uColor, (glow * 0.85 + rim * 1.05) * uOpacity);
      }
    `,
  });
  const scanDisc = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), discMat);
  scanDisc.rotation.x = -Math.PI / 2;
  scanDisc.renderOrder = 2;
  scene.add(scanDisc);

  const hudRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.28, 72),
    new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  hudRing.rotation.x = -Math.PI / 2;
  hudRing.renderOrder = 3;
  scene.add(hudRing);

  const diamond = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.2, 0)),
    new THREE.LineBasicMaterial({ color: 0xff3300 }),
  );
  diamond.visible = false;
  scene.add(diamond);

  scene.add(root);
  root.scale.setScalar(2.45);

  const rim = new THREE.PointLight(0x88ffcc, 1.6, 8, 2);
  rim.position.set(0.4, 0.5, 0.8);
  root.add(rim);

  return {
    root,
    body,
    rotors,
    gimbal,
    spot,
    beam,
    scanDisc,
    hudRing,
    diamond,
    discMat,
    navRed,
    navGreen,
    navWhite,
    navRedMesh,
    navGreenMesh,
    navWhiteMesh,
    heading: 0,
  };
}

export function buildHud(container: HTMLElement): HudBits {
  const host = container.parentElement ?? container;
  let el = host.querySelector<HTMLDivElement>(".uav-hud");
  if (!el) {
    el = document.createElement("div");
    el.className = "uav-hud";
    el.setAttribute("aria-hidden", "true");
    host.appendChild(el);
  }
  return {
    el,
    alt: el.querySelector('[data-hud="alt"]') as HTMLElement,
    spd: el.querySelector('[data-hud="spd"]') as HTMLElement,
    bat: el.querySelector('[data-hud="bat"]') as HTMLElement,
    obj: el.querySelector('[data-hud="obj"]') as HTMLElement,
    rec: el.querySelector('[data-hud="rec"]') as HTMLElement,
    needle: el.querySelector('[data-hud="needle"]') as HTMLElement,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function angLerp(cur: number, target: number, t: number) {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * t;
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

export function stepFlight(
  drone: DroneRig,
  flight: FlightState,
  debris: Array<{ x: number; z: number; mesh: THREE.Object3D }>,
  elapsed: number,
  delta: number,
  reduced: boolean,
  waterY: (x: number, z: number) => number,
) {
  const SPEED = 1.8;
  const PATROL_Y = 3.5;
  let pitch = 0;
  let roll = 0;
  let spd = 2.3;

  if (reduced) {
    flight.x = 0;
    flight.z = 0;
    flight.y = PATROL_Y;
    flight.mode = "cruise";
  } else if (flight.mode === "entry") {
    flight.entryT += delta;
    const t = ease(Math.min(1, flight.entryT / 5.2));
    flight.x = lerp(5.4, -6.2, t);
    flight.z = lerp(5.2, -3, t);
    flight.y = lerp(6.4, PATROL_Y, t);
    pitch = lerp(0.48, 0.22, t);
    roll = Math.sin(t * Math.PI) * -0.72;
    spd = lerp(4.2, 2.4, t);
    flight.vx = -1;
    if (flight.entryT >= 5.2) {
      flight.mode = "cruise";
      flight.pass = 0;
      flight.x = -6.2;
      flight.z = -3;
      flight.vx = 1;
    }
  } else if (flight.mode === "lock") {
    flight.lockT += delta;
    const d = debris[flight.lockDebris];
    if (d) {
      flight.x = lerp(flight.x, d.x, Math.min(1, delta * 2.2));
      flight.z = lerp(flight.z, d.z, Math.min(1, delta * 2.2));
    }
    const down = Math.min(1, flight.lockT / 0.45);
    flight.y = lerp(PATROL_Y, 2.8, down);
    pitch = 0.04;
    spd = 0.4;
    if (flight.lockT >= 2.5) {
      flight.mode = "cruise";
      flight.lockT = 0;
      flight.cooldown = 4;
      flight.y = PATROL_Y;
    }
  } else if (flight.mode === "turn") {
    flight.turnT += delta;
    const t = ease(Math.min(1, flight.turnT / 2));
    const cur = PASSES[flight.pass];
    const nextI = (flight.pass + 1) % PASSES.length;
    const next = PASSES[nextI];
    flight.x = cur.x1;
    flight.z = lerp(cur.z, next.z, t);
    const zDir = Math.sign(next.z - cur.z) || 1;
    roll = Math.sin(t * Math.PI) * 0.78 * zDir;
    pitch = 0.16;
    spd = 1.1;
    flight.vx = Math.sign(next.x1 - next.x0);
    if (flight.turnT >= 2) {
      flight.mode = "cruise";
      flight.pass = nextI;
      flight.turnT = 0;
      flight.x = next.x0;
      flight.z = next.z;
    }
  } else {
    const pass = PASSES[flight.pass];
    const dir = Math.sign(pass.x1 - pass.x0) || 1;
    flight.vx = dir;
    flight.x += dir * SPEED * delta;
    flight.z = pass.z;
    flight.y = PATROL_Y;
    pitch = 0.32;
    spd = 2.3;
    const done = dir > 0 ? flight.x >= pass.x1 : flight.x <= pass.x1;
    if (done) {
      flight.x = pass.x1;
      flight.mode = "turn";
      flight.turnT = 0;
    }
    if (flight.cooldown > 0) flight.cooldown -= delta;
    else {
      let best = -1;
      let bestD = 1.65 * 1.65;
      for (let i = 0; i < debris.length; i++) {
        const dx = debris[i].x - flight.x;
        const dz = debris[i].z - flight.z;
        const dd = dx * dx + dz * dz;
        if (dd < bestD) {
          bestD = dd;
          best = i;
        }
      }
      if (best >= 0) {
        flight.mode = "lock";
        flight.lockT = 0;
        flight.lockDebris = best;
        flight.objects += 1;
      }
    }
  }

  const bob = Math.sin(elapsed * 2.5) * 0.16;
  const wob = Math.sin(elapsed * 1.8) * 0.08;
  const y = flight.y + bob;
  drone.root.position.set(flight.x + wob, y, flight.z);

  const targetYaw = flight.vx >= 0 ? 0 : Math.PI;
  drone.heading = angLerp(drone.heading, targetYaw, Math.min(1, delta * 1.35));
  drone.body.rotation.order = "YXZ";
  drone.body.rotation.y = drone.heading;
  drone.body.rotation.x = pitch + Math.sin(elapsed * 2.1) * 0.08;
  drone.body.rotation.z = roll + Math.sin(elapsed * 1.35) * 0.14;

  const spin = reduced ? 6 : 42;
  for (const r of drone.rotors) r.group.rotation.y += r.dir * spin * delta;

  const navBlink = elapsed % 1 < 0.5;
  drone.navRed.intensity = navBlink ? 0.5 : 0;
  drone.navGreen.intensity = navBlink ? 0.5 : 0;
  drone.navRedMesh.visible = navBlink;
  drone.navGreenMesh.visible = navBlink;
  const strobe = elapsed % 1 < 0.12;
  drone.navWhite.intensity = strobe ? 1.1 : 0;
  drone.navWhiteMesh.visible = strobe;

  let scanMix = 0;
  let discScale = 1;
  const hudMat = drone.hudRing.material as THREE.MeshBasicMaterial;
  if (flight.mode === "lock") {
    if (flight.lockT < 0.3) scanMix = flight.lockT / 0.3;
    else if (flight.lockT < 1.2) scanMix = 1;
    else scanMix = 2;
    tmpColor.copy(WHITE).lerp(YELLOW, Math.min(1, scanMix));
    if (scanMix >= 2) tmpColor.copy(RED);
    hudMat.opacity = scanMix >= 1 ? 0.85 : 0.35;
    drone.hudRing.rotation.z += delta * 2.6;
    if (scanMix >= 2) {
      const pulse = 0.5 + 0.5 * Math.sin(flight.lockT * 18);
      drone.hudRing.scale.setScalar(0.7 + pulse * 0.45);
    } else {
      drone.hudRing.scale.setScalar(0.9);
    }
    discScale = lerp(1, 0.55, Math.min(1, flight.lockT / 0.6));
    drone.diamond.visible = scanMix >= 2;
    const d = debris[flight.lockDebris];
    if (d && drone.diamond.visible) {
      drone.diamond.position.set(d.x, waterY(d.x, d.z) + 0.45, d.z);
      drone.diamond.rotation.y += delta * 2.2;
    }
  } else {
    tmpColor.copy(WHITE);
    hudMat.opacity = Math.max(0, hudMat.opacity - delta * 2);
    drone.diamond.visible = false;
    discScale = 1;
  }

  drone.spot.color.copy(tmpColor);
  drone.spot.intensity = flight.mode === "lock" ? 4.2 : 3.5;
  (drone.beam.material as THREE.MeshBasicMaterial).color.copy(tmpColor);
  drone.discMat.uniforms.uColor.value.copy(tmpColor);
  const wy = waterY(flight.x, flight.z) + 0.05;
  drone.scanDisc.position.set(flight.x, wy, flight.z);
  drone.scanDisc.scale.setScalar(discScale);
  drone.discMat.uniforms.uOpacity.value = flight.mode === "lock" ? 0.7 : 0.38;
  drone.hudRing.position.set(flight.x, wy + 0.03, flight.z);
  const beamH = Math.max(1.2, y - wy);
  drone.beam.scale.set(1, beamH / 3.2, 1);
  drone.beam.position.y = -beamH / 2;
  drone.spot.target.position.set(0, -beamH - 0.4, 0);

  return { color: tmpColor, waterY: wy, spd, y };
}

export function updateHud(hud: HudBits, flight: FlightState, heading: number, spd: number, y: number, elapsed: number) {
  if (hud.alt) hud.alt.textContent = `ALT: ${y.toFixed(1)}m`;
  if (hud.spd) hud.spd.textContent = `SPD: ${spd.toFixed(1)} m/s`;
  if (hud.bat) hud.bat.textContent = `BAT: ${Math.max(62, Math.round(87 - elapsed * 0.012))}%`;
  if (hud.obj) hud.obj.textContent = `OBJECTS: ${flight.objects}`;
  if (hud.rec) hud.rec.classList.toggle("is-off", Math.floor(elapsed * 2) % 2 === 1);
  if (hud.needle) {
    const deg = THREE.MathUtils.radToDeg(heading);
    hud.needle.style.transform = `rotate(${deg}deg)`;
  }
}
