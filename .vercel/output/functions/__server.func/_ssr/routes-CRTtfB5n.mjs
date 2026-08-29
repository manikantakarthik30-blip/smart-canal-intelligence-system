import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Linkedin, i as Menu, n as Waves, o as Github, r as TriangleAlert, t as X } from "../_libs/lucide-react.mjs";
import { C as SRGBColorSpace, D as SpotLight, E as SphereGeometry, O as Vector3, S as RingGeometry, T as ShaderMaterial, _ as MeshStandardMaterial, a as Color, b as PlaneGeometry, c as DirectionalLight, d as HemisphereLight, f as LineBasicMaterial, g as MeshBasicMaterial, h as Mesh, i as CircleGeometry, k as WireframeGeometry, l as FogExp2, m as MathUtils, n as WebGLRenderer, o as ConeGeometry, p as LineSegments, r as BoxGeometry, s as CylinderGeometry, t as OrbitControls, u as Group, v as OctahedronGeometry, w as Scene, x as PointLight, y as PerspectiveCamera } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CRTtfB5n.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PASSES = [
	{
		x0: -8,
		x1: 8,
		z: -3
	},
	{
		x0: 8,
		x1: -8,
		z: -1
	},
	{
		x0: -8,
		x1: 8,
		z: 1
	},
	{
		x0: 8,
		x1: -8,
		z: 3
	}
];
var ARM_DEFS = [
	{
		yaw: -Math.PI / 4,
		dir: 1,
		nav: "red"
	},
	{
		yaw: Math.PI / 4,
		dir: -1,
		nav: "green"
	},
	{
		yaw: 3 * Math.PI / 4,
		dir: 1,
		nav: null
	},
	{
		yaw: -3 * Math.PI / 4,
		dir: -1,
		nav: null
	}
];
var WHITE = new Color(13168895);
var YELLOW = new Color(16776960);
var RED = new Color(16724736);
var tmpColor = new Color();
function createFlightState() {
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
		vx: 1
	};
}
function createDrone(scene) {
	const root = new Group();
	const body = new Group();
	root.add(body);
	const matBody = new MeshStandardMaterial({
		color: 1710618,
		roughness: .86,
		metalness: .18
	});
	const matDome = new MeshStandardMaterial({
		color: 1118481,
		roughness: .72,
		metalness: .12
	});
	const matGimbal = new MeshStandardMaterial({
		color: 328965,
		roughness: .22,
		metalness: .72
	});
	const matLens = new MeshStandardMaterial({
		color: 657946,
		roughness: .06,
		metalness: .95
	});
	const matArm = new MeshStandardMaterial({
		color: 2236962,
		roughness: .7,
		metalness: .28
	});
	const matMotor = new MeshStandardMaterial({
		color: 3355443,
		roughness: .55,
		metalness: .38
	});
	const matRotor = new MeshStandardMaterial({
		color: 3355443,
		roughness: .38,
		metalness: .2,
		transparent: true,
		opacity: .85
	});
	body.add(new Mesh(new CylinderGeometry(.3, .3, .08, 8), matBody));
	const dome = new Mesh(new SphereGeometry(.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), matDome);
	dome.position.y = .04;
	body.add(dome);
	const hang = new Mesh(new CylinderGeometry(.016, .016, .16, 8), matGimbal);
	hang.position.y = -.12;
	body.add(hang);
	const gimbal = new Group();
	gimbal.position.y = -.22;
	gimbal.add(new Mesh(new SphereGeometry(.12, 8, 8), matGimbal));
	const lens = new Mesh(new CylinderGeometry(.06, .06, .02, 16), matLens);
	lens.position.y = -.12;
	gimbal.add(lens);
	body.add(gimbal);
	const rotors = [];
	let navRed;
	let navGreen;
	let navRedMesh;
	let navGreenMesh;
	for (const def of ARM_DEFS) {
		const arm = new Mesh(new BoxGeometry(.6, .03, .06), matArm);
		arm.rotation.y = def.yaw;
		arm.position.set(Math.cos(def.yaw) * .3, .02, Math.sin(def.yaw) * .3);
		body.add(arm);
		const tipX = Math.cos(def.yaw) * .6;
		const tipZ = Math.sin(def.yaw) * .6;
		const motor = new Mesh(new CylinderGeometry(.1, .1, .06, 8), matMotor);
		motor.position.set(tipX, .06, tipZ);
		body.add(motor);
		const rotor = new Group();
		rotor.position.set(tipX, .1, tipZ);
		const bladeA = new Mesh(new BoxGeometry(.45, .008, .06), matRotor);
		const bladeB = new Mesh(new BoxGeometry(.45, .008, .06), matRotor);
		bladeB.rotation.y = Math.PI / 2;
		rotor.add(bladeA, bladeB);
		const disc = new Mesh(new CircleGeometry(.26, 24), new MeshBasicMaterial({
			color: 8952234,
			transparent: true,
			opacity: .22,
			side: 2,
			depthWrite: false
		}));
		disc.rotation.x = -Math.PI / 2;
		rotor.add(disc);
		body.add(rotor);
		rotors.push({
			group: rotor,
			dir: def.dir
		});
		if (def.nav) {
			const col = def.nav === "red" ? 16711680 : 65280;
			const light = new PointLight(col, .5, .8, 2);
			light.position.set(tipX, .08, tipZ);
			body.add(light);
			const bead = new Mesh(new SphereGeometry(.03, 8, 8), new MeshBasicMaterial({ color: col }));
			bead.position.set(tipX, .09, tipZ);
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
	const navWhite = new PointLight(16777215, .7, 1.2, 2);
	navWhite.position.set(-.22, .08, 0);
	body.add(navWhite);
	const navWhiteMesh = new Mesh(new SphereGeometry(.028, 8, 8), new MeshBasicMaterial({ color: 16777215 }));
	navWhiteMesh.position.set(-.22, .09, 0);
	body.add(navWhiteMesh);
	const spot = new SpotLight(13168895, 3.5, 12, .35, .4, 1.1);
	spot.position.set(0, -.34, 0);
	spot.target.position.set(0, -8, 0);
	spot.castShadow = true;
	spot.shadow.mapSize.set(1024, 1024);
	root.add(spot);
	root.add(spot.target);
	const beamMat = new MeshBasicMaterial({
		color: 13168895,
		transparent: true,
		opacity: .12,
		depthWrite: false,
		side: 2,
		blending: 2,
		fog: true
	});
	const beam = new Mesh(new ConeGeometry(1.55, 3.2, 28, 1, true), beamMat);
	beam.position.y = -1.7;
	root.add(beam);
	const discMat = new ShaderMaterial({
		glslVersion: "100",
		transparent: true,
		depthWrite: false,
		blending: 2,
		uniforms: {
			uColor: { value: new Color(13168895) },
			uOpacity: { value: .42 }
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
    `
	});
	const scanDisc = new Mesh(new PlaneGeometry(5.4, 5.4), discMat);
	scanDisc.rotation.x = -Math.PI / 2;
	scanDisc.renderOrder = 2;
	scene.add(scanDisc);
	const hudRing = new Mesh(new RingGeometry(1.15, 1.28, 72), new MeshBasicMaterial({
		color: 16724736,
		transparent: true,
		opacity: 0,
		side: 2,
		depthWrite: false,
		blending: 2
	}));
	hudRing.rotation.x = -Math.PI / 2;
	hudRing.renderOrder = 3;
	scene.add(hudRing);
	const diamond = new LineSegments(new WireframeGeometry(new OctahedronGeometry(.2, 0)), new LineBasicMaterial({ color: 16724736 }));
	diamond.visible = false;
	scene.add(diamond);
	scene.add(root);
	root.scale.setScalar(2.45);
	const rim = new PointLight(8978380, 1.6, 8, 2);
	rim.position.set(.4, .5, .8);
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
		heading: 0
	};
}
function buildHud(container) {
	const host = container.parentElement ?? container;
	let el = host.querySelector(".uav-hud");
	if (!el) {
		el = document.createElement("div");
		el.className = "uav-hud";
		el.setAttribute("aria-hidden", "true");
		host.appendChild(el);
	}
	return {
		el,
		alt: el.querySelector("[data-hud=\"alt\"]"),
		spd: el.querySelector("[data-hud=\"spd\"]"),
		bat: el.querySelector("[data-hud=\"bat\"]"),
		obj: el.querySelector("[data-hud=\"obj\"]"),
		rec: el.querySelector("[data-hud=\"rec\"]"),
		needle: el.querySelector("[data-hud=\"needle\"]")
	};
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
function angLerp(cur, target, t) {
	let d = target - cur;
	while (d > Math.PI) d -= Math.PI * 2;
	while (d < -Math.PI) d += Math.PI * 2;
	return cur + d * t;
}
function ease(t) {
	return t * t * (3 - 2 * t);
}
function stepFlight(drone, flight, debris, elapsed, delta, reduced, waterY) {
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
		pitch = lerp(.48, .22, t);
		roll = Math.sin(t * Math.PI) * -.72;
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
		flight.y = lerp(PATROL_Y, 2.8, Math.min(1, flight.lockT / .45));
		pitch = .04;
		spd = .4;
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
		roll = Math.sin(t * Math.PI) * .78 * zDir;
		pitch = .16;
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
		pitch = .32;
		spd = 2.3;
		if (dir > 0 ? flight.x >= pass.x1 : flight.x <= pass.x1) {
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
	const bob = Math.sin(elapsed * 2.5) * .16;
	const wob = Math.sin(elapsed * 1.8) * .08;
	const y = flight.y + bob;
	drone.root.position.set(flight.x + wob, y, flight.z);
	const targetYaw = flight.vx >= 0 ? 0 : Math.PI;
	drone.heading = angLerp(drone.heading, targetYaw, Math.min(1, delta * 1.35));
	drone.body.rotation.order = "YXZ";
	drone.body.rotation.y = drone.heading;
	drone.body.rotation.x = pitch + Math.sin(elapsed * 2.1) * .08;
	drone.body.rotation.z = roll + Math.sin(elapsed * 1.35) * .14;
	const spin = reduced ? 6 : 42;
	for (const r of drone.rotors) r.group.rotation.y += r.dir * spin * delta;
	const navBlink = elapsed % 1 < .5;
	drone.navRed.intensity = navBlink ? .5 : 0;
	drone.navGreen.intensity = navBlink ? .5 : 0;
	drone.navRedMesh.visible = navBlink;
	drone.navGreenMesh.visible = navBlink;
	const strobe = elapsed % 1 < .12;
	drone.navWhite.intensity = strobe ? 1.1 : 0;
	drone.navWhiteMesh.visible = strobe;
	let scanMix = 0;
	let discScale = 1;
	const hudMat = drone.hudRing.material;
	if (flight.mode === "lock") {
		if (flight.lockT < .3) scanMix = flight.lockT / .3;
		else if (flight.lockT < 1.2) scanMix = 1;
		else scanMix = 2;
		tmpColor.copy(WHITE).lerp(YELLOW, Math.min(1, scanMix));
		if (scanMix >= 2) tmpColor.copy(RED);
		hudMat.opacity = scanMix >= 1 ? .85 : .35;
		drone.hudRing.rotation.z += delta * 2.6;
		if (scanMix >= 2) {
			const pulse = .5 + .5 * Math.sin(flight.lockT * 18);
			drone.hudRing.scale.setScalar(.7 + pulse * .45);
		} else drone.hudRing.scale.setScalar(.9);
		discScale = lerp(1, .55, Math.min(1, flight.lockT / .6));
		drone.diamond.visible = scanMix >= 2;
		const d = debris[flight.lockDebris];
		if (d && drone.diamond.visible) {
			drone.diamond.position.set(d.x, waterY(d.x, d.z) + .45, d.z);
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
	drone.beam.material.color.copy(tmpColor);
	drone.discMat.uniforms.uColor.value.copy(tmpColor);
	const wy = waterY(flight.x, flight.z) + .05;
	drone.scanDisc.position.set(flight.x, wy, flight.z);
	drone.scanDisc.scale.setScalar(discScale);
	drone.discMat.uniforms.uOpacity.value = flight.mode === "lock" ? .7 : .38;
	drone.hudRing.position.set(flight.x, wy + .03, flight.z);
	const beamH = Math.max(1.2, y - wy);
	drone.beam.scale.set(1, beamH / 3.2, 1);
	drone.beam.position.y = -beamH / 2;
	drone.spot.target.position.set(0, -beamH - .4, 0);
	return {
		color: tmpColor,
		waterY: wy,
		spd,
		y
	};
}
function updateHud(hud, flight, heading, spd, y, elapsed) {
	if (hud.alt) hud.alt.textContent = `ALT: ${y.toFixed(1)}m`;
	if (hud.spd) hud.spd.textContent = `SPD: ${spd.toFixed(1)} m/s`;
	if (hud.bat) hud.bat.textContent = `BAT: ${Math.max(62, Math.round(87 - elapsed * .012))}%`;
	if (hud.obj) hud.obj.textContent = `OBJECTS: ${flight.objects}`;
	if (hud.rec) hud.rec.classList.toggle("is-off", Math.floor(elapsed * 2) % 2 === 1);
	if (hud.needle) {
		const deg = MathUtils.radToDeg(heading);
		hud.needle.style.transform = `rotate(${deg}deg)`;
	}
}
var FLOW_SPEED = .38;
var FOG_COLOR = 659226;
var FOG_DENSITY = .038;
function waveHeight(x, z, t) {
	const flowX = x - t * FLOW_SPEED;
	return Math.sin(flowX * .32 + z * .18 + t * .85) * .2 + Math.sin(flowX * .78 - z * .41 + t * 1.25) * .09 + Math.sin(flowX * 1.65 + z * 1.12 + t * 1.75) * .035;
}
var WATER_VERT = `
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
var WATER_FRAG = `
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
var SKY_VERT = `
varying vec3 vDir;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vDir = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
var SKY_FRAG = `
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
function addUrbanBank(scene, z, facing) {
	const group = new Group();
	const wallMat = new MeshStandardMaterial({
		color: 1317398,
		roughness: .94,
		metalness: .04
	});
	const mossMat = new MeshStandardMaterial({
		color: 1781282,
		roughness: .98,
		metalness: 0
	});
	const buildingMat = new MeshStandardMaterial({
		color: 1053980,
		roughness: .88,
		metalness: .08
	});
	const windowMat = new MeshBasicMaterial({
		color: 13214812,
		transparent: true,
		opacity: .55
	});
	const windowCyan = new MeshBasicMaterial({
		color: 53247,
		transparent: true,
		opacity: .28
	});
	const wall = new Mesh(new BoxGeometry(96, 2.4, 1.4), wallMat);
	wall.position.set(0, .55, 0);
	wall.castShadow = false;
	group.add(wall);
	const lip = new Mesh(new BoxGeometry(96, .22, 1.8), mossMat);
	lip.position.set(0, 1.68, facing * .15);
	group.add(lip);
	const walk = new Mesh(new BoxGeometry(96, .12, 3.2), wallMat);
	walk.position.set(0, 1.78, facing * 1.6);
	group.add(walk);
	const rng = (s) => {
		const x = Math.sin(s * 127.1 + z * 13.7) * 43758.5453;
		return x - Math.floor(x);
	};
	for (let i = 0; i < 14; i++) {
		const x = -40 + i * 6.2 + (rng(i + 2) - .5) * 1.4;
		const h = 3.2 + rng(i + 9) * 7.5;
		const w = 2.2 + rng(i + 4) * 2.4;
		const d = 2.4 + rng(i + 6) * 2;
		const b = new Mesh(new BoxGeometry(w, h, d), buildingMat);
		b.position.set(x, 1.85 + h / 2, facing * (3.4 + d * .35));
		group.add(b);
		const rows = Math.max(3, Math.floor(h / 1.15));
		const cols = 2 + Math.floor(rng(i + 11) * 2);
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
			if (rng(i * 17 + r * 8 + c) < .38) continue;
			const win = new Mesh(new PlaneGeometry(.22, .32), rng(i + r + c) > .82 ? windowCyan : windowMat);
			win.position.set(x - w * .28 + c * .42, 2.4 + r * .95, facing * (3.4 + d * .35) + facing * (d / 2 + .02));
			if (facing < 0) win.rotation.y = Math.PI;
			group.add(win);
		}
	}
	group.position.z = z;
	scene.add(group);
}
function addPosts(scene) {
	const wood = new MeshStandardMaterial({
		color: 2761756,
		roughness: .92,
		metalness: .02
	});
	const geo = new CylinderGeometry(.07, .1, 2.1, 6);
	for (const [x, y, z] of [
		[
			-18,
			.55,
			8.4
		],
		[
			-7,
			.5,
			9.1
		],
		[
			6,
			.48,
			8.2
		],
		[
			16.5,
			.52,
			9
		],
		[
			-12,
			.5,
			-8.6
		],
		[
			3,
			.46,
			-9.2
		],
		[
			14,
			.5,
			-8.4
		]
	]) {
		const m = new Mesh(geo, wood);
		m.position.set(x, y, z);
		m.rotation.z = (x > 0 ? -1 : 1) * .04;
		scene.add(m);
	}
}
function mountCanalScene(container) {
	const width = container.clientWidth || window.innerWidth;
	const height = container.clientHeight || window.innerHeight;
	const mobile = width < 768;
	const renderer = new WebGLRenderer({
		antialias: !mobile,
		alpha: false,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 1.85));
	renderer.setSize(width, height);
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = .78;
	renderer.setClearColor(FOG_COLOR, 1);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = 2;
	container.appendChild(renderer.domElement);
	const scene = new Scene();
	scene.background = new Color(FOG_COLOR);
	scene.fog = new FogExp2(FOG_COLOR, FOG_DENSITY);
	const camera = new PerspectiveCamera(46, width / height, .1, 180);
	camera.position.set(3.8, 5.2, 11.4);
	camera.lookAt(5.4, 5.6, 5.2);
	const hemi = new HemisphereLight(1714746, 660752, .55);
	scene.add(hemi);
	const moon = new DirectionalLight(9349308, .72);
	moon.position.set(-14, 22, 10);
	scene.add(moon);
	const greenGlow = new PointLight(65416, 2.4, 28, 1.6);
	greenGlow.position.set(6.5, 3.4, 2.2);
	scene.add(greenGlow);
	const cyanGlow = new PointLight(53247, 1.8, 24, 1.6);
	cyanGlow.position.set(-9, 2.8, 4.5);
	scene.add(cyanGlow);
	const sky = new Mesh(new SphereGeometry(90, 24, 16), new ShaderMaterial({
		glslVersion: "100",
		vertexShader: SKY_VERT,
		fragmentShader: SKY_FRAG,
		side: 1,
		depthWrite: false
	}));
	scene.add(sky);
	const waterGeo = new PlaneGeometry(92, 28, mobile ? 90 : 160, mobile ? 40 : 72);
	const waterMat = new ShaderMaterial({
		glslVersion: "100",
		uniforms: {
			uTime: { value: 0 },
			uDeep: { value: new Color("#1a3a2a") },
			uShallow: { value: new Color("#2a5a40") },
			uFoam: { value: new Color("#9ecbb4") },
			uGreen: { value: new Color("#00ff88") },
			uCyan: { value: new Color("#00cfff") },
			uFogColor: { value: new Color(FOG_COLOR) },
			uFogDensity: { value: FOG_DENSITY },
			uCameraPos: { value: camera.position.clone() },
			uScanPos: { value: new Vector3(12, 0, 0) },
			uScanColor: { value: new Color(13168895) },
			uScanRadius: { value: 1.7 }
		},
		vertexShader: WATER_VERT,
		fragmentShader: WATER_FRAG
	});
	const water = new Mesh(waterGeo, waterMat);
	water.rotation.x = -Math.PI / 2;
	water.position.y = 0;
	scene.add(water);
	addUrbanBank(scene, -14.4, -1);
	addUrbanBank(scene, 14.4, 1);
	addPosts(scene);
	const debrisMats = [
		new MeshStandardMaterial({
			color: 5919304,
			roughness: .9,
			metalness: .05
		}),
		new MeshStandardMaterial({
			color: 7037012,
			roughness: .88,
			metalness: .04
		}),
		new MeshStandardMaterial({
			color: 4012598,
			roughness: .92,
			metalness: .03
		}),
		new MeshStandardMaterial({
			color: 4867388,
			roughness: .9,
			metalness: .04
		}),
		new MeshStandardMaterial({
			color: 3817526,
			roughness: .95,
			metalness: .02
		})
	];
	const debris = [];
	for (let i = 0; i < 15; i++) {
		const w = .35 + Math.random() * .55;
		const d = .18 + Math.random() * .32;
		const geo = new BoxGeometry(w, .045, d);
		const mesh = new Mesh(geo, debrisMats[i % debrisMats.length]);
		const lanes = [
			-3,
			-1,
			1,
			3
		];
		const x = i < 8 ? -6.5 + i % 4 * 4.1 + (Math.random() - .5) * .4 : -36 + Math.random() * 72;
		const z = i < 8 ? lanes[i % 4] + (Math.random() - .5) * .28 : -8 + Math.random() * 16;
		mesh.position.set(x, .08, z);
		mesh.rotation.y = Math.random() * Math.PI;
		scene.add(mesh);
		debris.push({
			mesh,
			speed: .22 + Math.random() * .28,
			spin: (Math.random() - .5) * .18,
			tilt: Math.random() * Math.PI * 2,
			x,
			z,
			phase: Math.random() * Math.PI * 2
		});
	}
	const drone = createDrone(scene);
	const flight = createFlightState();
	const hud = buildHud(container);
	const look = new Vector3(5.4, 5.6, 5.2);
	const lookGoal = new Vector3();
	const chaseOffset = new Vector3();
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.enableZoom = false;
	controls.enableDamping = true;
	controls.dampingFactor = .06;
	controls.minPolarAngle = .85;
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
	const desiredCam = camera.position.clone().clone();
	const parallax = {
		x: 0,
		y: 0,
		s: 0
	};
	let last = performance.now();
	let elapsed = 0;
	let raf = 0;
	let disposed = false;
	const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
	const animate = (now) => {
		if (disposed) return;
		const delta = Math.min((now - last) / 1e3, .1);
		last = now;
		elapsed += reduced ? 0 : delta;
		waterMat.uniforms.uTime.value = elapsed;
		waterMat.uniforms.uCameraPos.value.copy(camera.position);
		if (!reduced) {
			greenGlow.intensity = 2.1 + Math.sin(elapsed * .7) * .35;
			cyanGlow.intensity = 1.55 + Math.cos(elapsed * .55) * .3;
		}
		for (const d of debris) {
			if (!reduced) {
				d.x += d.speed * delta;
				if (d.x > 42) d.x = -42;
				d.mesh.rotation.y += d.spin * delta;
			}
			const y = waveHeight(d.x, -d.z, elapsed);
			d.mesh.position.set(d.x, y + .05, d.z);
			d.mesh.rotation.x = Math.sin(elapsed * .8 + d.phase) * .12;
			d.mesh.rotation.z = Math.cos(elapsed * .6 + d.tilt) * .1;
		}
		const scan = stepFlight(drone, flight, debris, elapsed, reduced ? 0 : delta, reduced, (x, z) => waveHeight(x, -z, elapsed));
		lookGoal.set(flight.x, flight.y + .15, flight.z);
		look.lerp(lookGoal, Math.min(1, delta * 2.4));
		controls.target.copy(look);
		if (!orbiting && !reduced) {
			const ang = elapsed * .22;
			chaseOffset.set(Math.sin(ang) * 5.6 + 1.4, 2.6 + Math.sin(elapsed * .35) * .45, 6.4 + Math.cos(ang) * 2.2);
			desiredCam.set(flight.x + chaseOffset.x, Math.max(3.1, flight.y + chaseOffset.y), flight.z + chaseOffset.z);
			desiredCam.x += parallax.x * 1.8;
			desiredCam.y += parallax.y * .9 - parallax.s * 2.4;
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
		setParallax: (nx, ny, scroll) => {
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
				if (obj instanceof Mesh) {
					obj.geometry.dispose();
					const mat = obj.material;
					if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
					else mat.dispose();
				}
			});
			renderer.dispose();
			renderer.domElement.remove();
		}
	};
}
var CHART_CDN = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js";
var POLLUTION = [
	45,
	62,
	38,
	71,
	55,
	83,
	67
];
var DAYS = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
];
function loadChartJs() {
	const w = window;
	if (w.Chart) return Promise.resolve(w.Chart);
	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[data-scis-chart="1"]`);
		if (existing) {
			existing.addEventListener("load", () => {
				if (w.Chart) resolve(w.Chart);
				else reject(/* @__PURE__ */ new Error("Chart.js loaded without Chart"));
			});
			existing.addEventListener("error", () => reject(/* @__PURE__ */ new Error("Chart.js failed to load")));
			return;
		}
		const script = document.createElement("script");
		script.src = CHART_CDN;
		script.async = true;
		script.dataset.scisChart = "1";
		script.onload = () => {
			if (w.Chart) resolve(w.Chart);
			else reject(/* @__PURE__ */ new Error("Chart.js loaded without Chart"));
		};
		script.onerror = () => reject(/* @__PURE__ */ new Error("Chart.js failed to load"));
		document.head.appendChild(script);
	});
}
function easeOutCubic(t) {
	return 1 - (1 - t) ** 3;
}
function useCountUp(target, active, duration = 1600) {
	const [value, setValue] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setValue(target);
			return;
		}
		let raf = 0;
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			setValue(Math.round(target * easeOutCubic(t)));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [
		active,
		target,
		duration
	]);
	return value;
}
function LiveDashboard() {
	const sectionRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	const waste = useCountUp(247, inView, 1700);
	const health = useCountUp(32, inView, 1400);
	const drones = useCountUp(3, inView, 900);
	const alerts = useCountUp(18, inView, 1200);
	(0, import_react.useEffect)(() => {
		const el = sectionRef.current;
		if (!el) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) setInView(true);
		}, { threshold: .28 });
		io.observe(el);
		return () => io.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!inView) return;
		if (!canvasRef.current) return;
		let chart = null;
		let cancelled = false;
		loadChartJs().then((Chart) => {
			if (cancelled || !canvasRef.current) return;
			const ctx = canvasRef.current.getContext("2d");
			if (!ctx) return;
			chart = new Chart(ctx, {
				type: "line",
				data: {
					labels: DAYS,
					datasets: [{
						label: "Pollution index",
						data: POLLUTION,
						borderColor: "#00ff88",
						backgroundColor: "rgba(0, 255, 136, 0.10)",
						pointBackgroundColor: "#00cfff",
						pointBorderColor: "#00ff88",
						pointRadius: 4,
						pointHoverRadius: 6,
						borderWidth: 2,
						fill: true,
						tension: .38
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: "index",
						intersect: false
					},
					plugins: {
						legend: { display: false },
						tooltip: {
							backgroundColor: "#111111",
							borderColor: "rgba(0, 255, 136, 0.35)",
							borderWidth: 1,
							titleColor: "#00ff88",
							bodyColor: "#f4f7f5",
							padding: 12,
							displayColors: false,
							callbacks: { label: (item) => ` Pollution index  ${item.parsed.y}` }
						}
					},
					scales: {
						x: {
							grid: {
								color: "rgba(255,255,255,0.05)",
								drawBorder: false
							},
							ticks: {
								color: "#9aaba3",
								font: {
									family: "Outfit",
									size: 12
								}
							}
						},
						y: {
							min: 0,
							max: 100,
							grid: {
								color: "rgba(255,255,255,0.06)",
								drawBorder: false
							},
							ticks: {
								color: "#9aaba3",
								font: {
									family: "Outfit",
									size: 11
								},
								stepSize: 20
							},
							title: {
								display: true,
								text: "Pollution index",
								color: "#9aaba3",
								font: {
									family: "Outfit",
									size: 11,
									weight: 500
								}
							}
						}
					}
				}
			});
		});
		return () => {
			cancelled = true;
			chart?.destroy();
		};
	}, [inView]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		ref: sectionRef,
		id: "live-dashboard",
		className: "dashboard reveal",
		"aria-labelledby": "dash-title",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "dash-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "dash-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "dash-kicker",
							children: "Command · Vijayawada Urban Canals"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							id: "dash-title",
							className: "dash-title",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "live-pill",
								"aria-label": "Live",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-dot" }), "LIVE"]
							}), "Live Monitoring Dashboard"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "dash-sub",
							children: "Eluru Canal and Ryves Canal · week ending 29 Aug 2026 · telemetry from UAV-01, UAV-02, UAV-03"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "dash-grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "metric-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-label",
									children: "Waste Objects Detected Today"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-value metric-green",
									children: waste
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-meta",
									children: "Eluru 162 · Ryves 85 · last sweep 06:42 IST"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "metric-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-label",
									children: "Canal Health Score"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "metric-value metric-critical",
									children: [health, "%"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-badge metric-badge-critical",
									children: "CRITICAL"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "metric-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-label",
									children: "Active Drone Units"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-value metric-cyan",
									children: drones
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-meta",
									children: "UAV-01 Eluru · UAV-02 Ryves · UAV-03 Bandar lock"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "metric-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-label",
									children: "Alerts Sent Today"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-value metric-orange",
									children: alerts
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "metric-meta",
									children: "VMC operations · APPCB copy · 4 still open"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "chart-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "chart-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Pollution Level - Last 7 Days" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Composite index from debris density, turbidity, and surface-film detections" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "chart-wrap",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
							ref: canvasRef,
							"aria-label": "Pollution level line chart for Monday through Sunday"
						})
					})]
				})
			]
		})
	});
}
var DW = 160;
var DH = 90;
var canvas = null;
function getCanvas() {
	if (typeof document === "undefined") return null;
	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.width = DW;
		canvas.height = DH;
	}
	return canvas;
}
function clamp(n, a, b) {
	return n < a ? a : n > b ? b : n;
}
function blurSep(src, w, h, k) {
	const r = k - 1 >> 1;
	const tmp = new Float32Array(src.length);
	const out = new Float32Array(src.length);
	const div = k;
	for (let y = 0; y < h; y++) {
		let sum = 0;
		const row = y * w;
		for (let x = -r; x <= r; x++) sum += src[row + clamp(x, 0, w - 1)];
		for (let x = 0; x < w; x++) {
			tmp[row + x] = sum / div;
			sum += src[row + clamp(x + r + 1, 0, w - 1)] - src[row + clamp(x - r, 0, w - 1)];
		}
	}
	for (let x = 0; x < w; x++) {
		let sum = 0;
		for (let y = -r; y <= r; y++) sum += tmp[clamp(y, 0, h - 1) * w + x];
		for (let y = 0; y < h; y++) {
			out[y * w + x] = sum / div;
			sum += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
		}
	}
	return out;
}
function labelFor(areaPct) {
	if (areaPct < 1.8) return "Plastic Waste";
	if (areaPct < 4.5) return "Debris";
	return "Garbage Bag";
}
function detectWaste(img) {
	const canvas = getCanvas();
	if (!canvas || !img.naturalWidth) return [];
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return [];
	try {
		ctx.drawImage(img, 0, 0, DW, DH);
		const { data } = ctx.getImageData(0, 0, DW, DH);
		const L = /* @__PURE__ */ new Float32Array(14400);
		for (let i = 0, p = 0; i < data.length; i += 4, p++) L[p] = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
		const bg = blurSep(L, DW, DH, 15);
		const sorted = Array.from(L).sort((a, b) => a - b);
		const p62 = sorted[Math.floor(sorted.length * .62)] ?? 140;
		const mask = /* @__PURE__ */ new Uint8Array(14400);
		for (let i = 0; i < L.length; i++) {
			if ((i / DW | 0) < DH * .16) continue;
			if (L[i] - bg[i] > 10 && L[i] > p62) mask[i] = 1;
		}
		const seen = /* @__PURE__ */ new Uint8Array(14400);
		const hits = [];
		const dirs = [
			1,
			-1,
			DW,
			-160,
			161,
			159,
			-159,
			-161
		];
		for (let i = 0; i < mask.length; i++) {
			if (!mask[i] || seen[i]) continue;
			const stack = [i];
			seen[i] = 1;
			let minX = i % DW;
			let maxX = minX;
			let minY = i / DW | 0;
			let maxY = minY;
			let area = 0;
			let sumL = 0;
			while (stack.length) {
				const cur = stack.pop();
				const x = cur % DW;
				const y = cur / DW | 0;
				area++;
				sumL += L[cur];
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
				for (const d of dirs) {
					const n = cur + d;
					if (n < 0 || n >= mask.length || seen[n] || !mask[n]) continue;
					const nx = n % DW;
					if (Math.abs(nx - x) > 1) continue;
					seen[n] = 1;
					stack.push(n);
				}
			}
			if (area < 7) continue;
			const bw = maxX - minX + 1;
			const bh = maxY - minY + 1;
			const topPct = minY / DH * 100;
			if (bw > DW * .34 && topPct < 42) continue;
			if (bh > DH * .38) continue;
			if (bw < 4 || bh < 3) continue;
			if (area / (bw * bh) < .22) continue;
			if (topPct < 28 && bw > DW * .16 && bh > DH * .14) continue;
			const pad = 3;
			const x0 = Math.max(0, minX - pad);
			const y0 = Math.max(0, minY - pad);
			const x1 = Math.min(159, maxX + pad);
			const y1 = Math.min(89, maxY + pad);
			const width = (x1 - x0 + 1) / DW * 100;
			const height = (y1 - y0 + 1) / DH * 100;
			const left = x0 / DW * 100;
			const top = y0 / DH * 100;
			const meanL = sumL / area;
			const fill = area / (bw * bh);
			const conf = Math.min(97.8, 84 + (meanL - 150) * .06 + fill * 8);
			const areaPct = width * height / 100;
			hits.push({
				left,
				top,
				width,
				height,
				label: labelFor(areaPct),
				conf: Math.round(conf * 10) / 10,
				area
			});
		}
		hits.sort((a, b) => b.area - a.area);
		return hits.slice(0, 4);
	} catch {
		return [];
	}
}
function trackHits(prev, hits, nextId) {
	const used = /* @__PURE__ */ new Set();
	const next = [];
	for (const p of prev) {
		let best = -1;
		let bestD = 420;
		hits.forEach((h, i) => {
			if (used.has(i)) return;
			const dx = p.left + p.width / 2 - (h.left + h.width / 2);
			const dy = p.top + p.height / 2 - (h.top + h.height / 2);
			const d = dx * dx + dy * dy;
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		});
		if (best >= 0 && bestD < 484) {
			used.add(best);
			const h = hits[best];
			next.push({
				id: p.id,
				left: p.left * .4 + h.left * .6,
				top: p.top * .4 + h.top * .6,
				width: p.width * .4 + h.width * .6,
				height: p.height * .4 + h.height * .6,
				label: h.label,
				conf: h.conf,
				area: h.area,
				misses: 0
			});
		} else if (p.misses < 5) next.push({
			...p,
			misses: p.misses + 1
		});
	}
	const fresh = [];
	hits.forEach((h, i) => {
		if (used.has(i)) return;
		fresh.push({
			...h,
			id: ++nextId.n,
			misses: 0
		});
	});
	return {
		boxes: [...next, ...fresh].slice(0, 5),
		spawned: fresh
	};
}
var FLOW = "/flow/";
var WM = "https://upload.wikimedia.org/wikipedia/commons/";
var WATER_URLS = [
	`${FLOW}scene1.gif`,
	`${WM}thumb/c/c2/Eluru_canal_and_National_Highway_16_near_Denduluru.jpg/1280px-Eluru_canal_and_National_Highway_16_near_Denduluru.jpg`,
	`${WM}thumb/f/f6/A_canal_of_river_Krishna.jpg/1280px-A_canal_of_river_Krishna.jpg`,
	`${FLOW}scene2.gif`,
	`${WM}thumb/a/a6/River_Krishna_in_full_flow_at_Vijayawada.jpg/1280px-River_Krishna_in_full_flow_at_Vijayawada.jpg`,
	`${WM}thumb/c/c5/Krishna_River_and_Prakasham_barrage_at_Krishna_ghat.jpg/1280px-Krishna_River_and_Prakasham_barrage_at_Krishna_ghat.jpg`,
	`${FLOW}scene3.gif`,
	`${WM}thumb/e/e0/Krishna_river_at_Vijayawada.jpg/1280px-Krishna_river_at_Vijayawada.jpg`,
	`${WM}thumb/9/98/Aerial_view_of_National_Highway_16_and_Eluru_canal_near_Denduluru.jpg/1280px-Aerial_view_of_National_Highway_16_and_Eluru_canal_near_Denduluru.jpg`,
	`${WM}thumb/a/a4/Krishna_river_canal.jpg/1280px-Krishna_river_canal.jpg`,
	`${WM}5/5b/River_litter_plastic_fragments_1.jpg`,
	`${WM}thumb/2/24/Water-pollution.jpg/1280px-Water-pollution.jpg`,
	`${WM}thumb/3/3a/Fishing_boat_near_Prakasam_barrage.jpg/1280px-Fishing_boat_near_Prakasam_barrage.jpg`,
	`${WM}thumb/c/cb/Krishna_nadi_at_vijayavada.jpg/1280px-Krishna_nadi_at_vijayavada.jpg`,
	`${WM}thumb/b/b2/Krishna_river_bank.jpg/1280px-Krishna_river_bank.jpg`,
	`${WM}thumb/3/3b/View_of_Krishna_River_while_boating.jpg/1280px-View_of_Krishna_River_while_boating.jpg`,
	`${WM}thumb/2/20/Railway_bridges_on_Krishna_near_Vijayawada_IMG20191107114614.jpg/1280px-Railway_bridges_on_Krishna_near_Vijayawada_IMG20191107114614.jpg`,
	`${WM}3/33/River_Krishna_View_at_Vijayawada_City.jpg`,
	`${WM}thumb/4/49/Krishna_River%2C_Andhra_Pradesh%2C_India_%282017%29.jpg/1280px-Krishna_River%2C_Andhra_Pradesh%2C_India_%282017%29.jpg`,
	`${WM}thumb/7/7d/Traditional_Fishing_Boat_on_Indian_River.jpg/1280px-Traditional_Fishing_Boat_on_Indian_River.jpg`,
	`${WM}thumb/2/20/Canal_Road_in_Vijayawada.JPG/1280px-Canal_Road_in_Vijayawada.JPG`,
	`${WM}4/4f/Grand_Union_Canal%2C_Paddington_Branch_%28geograph_3206364%29.jpg`,
	`${WM}thumb/e/ea/Krishna_River_and_bridge_at_Vijayawada.jpg/1280px-Krishna_River_and_bridge_at_Vijayawada.jpg`,
	`${WM}thumb/2/25/Krishna_River_near_Vijayawada_Andhra_Pradesh_India.jpg/1280px-Krishna_River_near_Vijayawada_Andhra_Pradesh_India.jpg`
];
var CAMERAS = [
	{
		id: "CAM-01",
		location: "Eluru Canal, Governorpet Reach",
		startCount: 41,
		offset: 0,
		delay: 0
	},
	{
		id: "CAM-02",
		location: "Ryves Canal, One Town",
		startCount: 28,
		offset: 3,
		delay: 400
	},
	{
		id: "CAM-03",
		location: "Eluru Canal, Bhavanipuram Bund",
		startCount: 36,
		offset: 6,
		delay: 800
	}
];
function istTime(date = /* @__PURE__ */ new Date()) {
	return new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
		timeZone: "Asia/Kolkata"
	}).format(date);
}
function frameName(url) {
	return decodeURIComponent(url.split("?")[0].split("/").pop() ?? "frame.jpg").replace(/^1280px-/, "").slice(0, 48);
}
function holdMs(url, reduced) {
	if (url.includes(".gif")) return reduced ? 14e3 : 1e4;
	return reduced ? 3200 : 2500;
}
var INITIAL_LOG$1 = [
	{
		key: 5,
		time: "15:32:18",
		camera: "CAM-02",
		object: "Plastic Waste",
		confidence: "91.3%",
		location: "Ryves Canal, One Town",
		frame: "scene2.gif"
	},
	{
		key: 4,
		time: "15:31:52",
		camera: "CAM-01",
		object: "Debris",
		confidence: "87.6%",
		location: "Eluru Canal, Governorpet Reach",
		frame: "Eluru_canal_Denduluru.jpg"
	},
	{
		key: 3,
		time: "15:31:19",
		camera: "CAM-03",
		object: "Garbage Bag",
		confidence: "94.2%",
		location: "Eluru Canal, Bhavanipuram Bund",
		frame: "scene3.gif"
	},
	{
		key: 2,
		time: "15:30:47",
		camera: "CAM-01",
		object: "Plastic Waste",
		confidence: "96.1%",
		location: "Eluru Canal, Governorpet Reach",
		frame: "scene1.gif"
	},
	{
		key: 1,
		time: "15:30:11",
		camera: "CAM-02",
		object: "Debris",
		confidence: "88.4%",
		location: "Ryves Canal, One Town",
		frame: "Krishna_river_canal.jpg"
	}
];
function CameraCard({ camera, now, reduced, onFrame, onHit }) {
	const [boxes, setBoxes] = (0, import_react.useState)([]);
	const [objects, setObjects] = (0, import_react.useState)(camera.startCount);
	const [index, setIndex] = (0, import_react.useState)(camera.offset % WATER_URLS.length);
	const [armed, setArmed] = (0, import_react.useState)(false);
	const stageRef = (0, import_react.useRef)(null);
	const imgRef = (0, import_react.useRef)(null);
	const idRef = (0, import_react.useRef)({ n: camera.startCount });
	const boxesRef = (0, import_react.useRef)([]);
	const onFrameRef = (0, import_react.useRef)(onFrame);
	const onHitRef = (0, import_react.useRef)(onHit);
	onFrameRef.current = onFrame;
	onHitRef.current = onHit;
	boxesRef.current = boxes;
	(0, import_react.useEffect)(() => {
		const el = stageRef.current;
		if (!el) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) setArmed(true);
		}, { rootMargin: "220px 0px" });
		io.observe(el);
		return () => io.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!armed) return;
		onFrameRef.current(WATER_URLS[camera.offset % WATER_URLS.length]);
	}, [armed, camera.offset]);
	(0, import_react.useEffect)(() => {
		if (!armed) return;
		let timer = 0;
		let live = true;
		const loop = () => {
			setIndex((i) => {
				const next = (i + 1) % WATER_URLS.length;
				const url = WATER_URLS[next];
				onFrameRef.current(url);
				if (live) timer = window.setTimeout(loop, holdMs(url, reduced));
				return next;
			});
		};
		const first = WATER_URLS[camera.offset % WATER_URLS.length];
		timer = window.setTimeout(loop, camera.delay + holdMs(first, reduced));
		return () => {
			live = false;
			window.clearTimeout(timer);
		};
	}, [
		armed,
		reduced,
		camera.delay,
		camera.offset
	]);
	const src = WATER_URLS[index];
	(0, import_react.useEffect)(() => {
		if (!armed) return;
		let timer = 0;
		let live = true;
		const scan = () => {
			if (!live) return;
			const img = imgRef.current;
			if (!img || !img.naturalWidth) return;
			const hits = detectWaste(img);
			const { boxes: next, spawned } = trackHits(boxesRef.current, hits, idRef.current);
			boxesRef.current = next;
			setBoxes(next);
			if (spawned.length) {
				setObjects((n) => n + spawned.length);
				const s = spawned[0];
				onHitRef.current({
					object: s.label,
					conf: `${s.conf.toFixed(1)}%`,
					frame: frameName(src)
				});
			}
		};
		const kick = () => {
			if (!live) return;
			scan();
			timer = window.setInterval(scan, reduced ? 900 : 360);
		};
		const img = imgRef.current;
		if (img?.complete && img.naturalWidth) kick();
		else img?.addEventListener("load", kick, { once: true });
		return () => {
			live = false;
			window.clearInterval(timer);
			img?.removeEventListener("load", kick);
		};
	}, [
		armed,
		src,
		reduced
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "cctv-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "cctv-top",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "cctv-live",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rec-dot",
							"aria-hidden": "true"
						}), "REC"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "cctv-id",
						children: camera.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
						className: "cctv-time",
						dateTime: now ? now.toISOString() : void 0,
						children: now ? istTime(now) : "--:--:--"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: stageRef,
				className: "cctv-stage",
				"aria-label": `${camera.id} live canal feed`,
				children: [
					armed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						ref: imgRef,
						className: "cctv-frame",
						src,
						alt: "",
						loading: "lazy",
						decoding: "async",
						crossOrigin: "anonymous",
						draggable: false,
						onError: () => setIndex((i) => (i + 1) % WATER_URLS.length)
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "cctv-tint",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "cctv-scan",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "cctv-sweep",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "cctv-hud",
						"aria-hidden": "true"
					}),
					boxes.map((box) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "yolo-box is-locked",
						style: {
							left: `${box.left}%`,
							top: `${box.top}%`,
							width: `${box.width}%`,
							height: `${box.height}%`
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "yolo-label",
							children: [
								box.label,
								" ",
								box.conf.toFixed(1),
								"%"
							]
						})
					}, box.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "cctv-place",
						children: camera.location
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "cctv-bottom",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Objects: ", objects] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"YOLOv8 · ",
					boxes.length,
					" locked · ",
					frameName(src)
				] })]
			})
		]
	});
}
function DetectionFeed() {
	const headingId = (0, import_react.useId)();
	const [now, setNow] = (0, import_react.useState)(null);
	const [rows, setRows] = (0, import_react.useState)(INITIAL_LOG$1);
	const [reduced, setReduced] = (0, import_react.useState)(false);
	const frames = (0, import_react.useRef)({});
	const logId = (0, import_react.useRef)(10);
	const pushHit = (camera, hit) => {
		frames.current[camera.id] = hit.frame;
		setRows((prev) => [{
			key: ++logId.current,
			time: istTime(/* @__PURE__ */ new Date()),
			camera: camera.id,
			object: hit.object,
			confidence: hit.conf,
			location: camera.location,
			frame: hit.frame
		}, ...prev].slice(0, 5));
	};
	(0, import_react.useEffect)(() => {
		setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
		setNow(/* @__PURE__ */ new Date());
		const clock = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => window.clearInterval(clock);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "feed reveal",
		"aria-labelledby": headingId,
		id: "ai-detection-feed",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "feed-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "feed-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "feed-kicker",
							children: "FloW-Img · ORCA-Uboat · Eluru & Krishna surface"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: headingId,
							className: "feed-title",
							children: "AI Detection Feed"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "feed-sub",
							children: "Bounding boxes lock onto bright floating waste on the water — sampled from each live frame, not random HUD."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "cctv-grid",
					children: CAMERAS.map((camera) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraCard, {
						camera,
						now,
						reduced,
						onFrame: (url) => {
							frames.current[camera.id] = url;
						},
						onHit: (hit) => pushHit(camera, hit)
					}, camera.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "log-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "log-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Last 5 detections" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Rolling log · IST · FloW water-surface frames and canal photography" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "log-scroll",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "log-table",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Time"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Camera"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Object Type"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Confidence"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Location"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: i === 0 ? "log-row-new" : void 0,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "num",
										children: row.time
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.camera }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [row.object, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "log-frame",
										children: [" · ", row.frame]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "num log-conf",
										children: row.confidence
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.location })
								]
							}, row.key)) })]
						})
					})]
				})
			]
		})
	});
}
var MAP_SRC = "https://maps.google.com/maps?q=16.5062,80.6480&ll=16.5062,80.6480&z=13&t=k&hl=en&output=embed&maptype=satellite";
var HOTSPOTS = [
	{
		name: "Eluru Canal",
		reach: "Governorpet to Krishnalanka · 16.518°N, 80.630°E",
		level: "CRITICAL",
		tone: "critical",
		last: "Last detected: 5 mins ago",
		note: "162 waste objects this sweep. UAV-01 holding over the reach."
	},
	{
		name: "Ryves Canal",
		reach: "One Town corridor · 16.515°N, 80.620°E",
		level: "HIGH",
		tone: "high",
		last: "Last detected: 12 mins ago",
		note: "Surface film and mixed debris. UAV-02 on a return pass."
	},
	{
		name: "Bandar Road Drain",
		reach: "Bandar Road outfall into Krishna · 16.506°N, 80.648°E",
		level: "MODERATE",
		tone: "moderate",
		last: "Last detected: 28 mins ago",
		note: "Turbidity elevated after market hours. Drain mouth still clear."
	}
];
function HotspotMap() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "hotspots reveal",
		id: "pollution-hotspot-map",
		"aria-labelledby": "hotspot-title",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hotspots-inner",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "hotspots-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hotspots-kicker",
						children: "Geospatial · Vijayawada 16.5062°N 80.6480°E"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "hotspot-title",
						className: "hotspots-title",
						children: "Pollution Hotspot Map"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hotspots-sub",
						children: "Live severity on Eluru Canal, Ryves Canal, and the Bandar Road drain outfall — zoom 13 over the city core."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hotspot-layout",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "map-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "map-shell",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
							className: "map-embed",
							title: "Google Map of Vijayawada canal pollution hotspots",
							src: MAP_SRC,
							width: "100%",
							height: "500",
							loading: "lazy",
							referrerPolicy: "no-referrer-when-downgrade",
							allowFullScreen: true
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "map-legend",
						"aria-label": "Severity legend",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "legend-swatch swatch-critical" }), "Red = Critical"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "legend-swatch swatch-high" }), "Orange = High"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "legend-swatch swatch-moderate" }), "Yellow = Moderate"] })
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "hotspot-side",
					"aria-label": "Active hotspots",
					children: HOTSPOTS.map((spot) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: `hotspot-card tone-${spot.tone}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hotspot-card-top",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `pulse-dot pulse-${spot.tone}`,
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: spot.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "hotspot-reach",
										children: spot.reach
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `sev-badge sev-${spot.tone}`,
										children: ["Pollution: ", spot.level]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "hotspot-last",
								children: spot.last
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "hotspot-note",
								children: spot.note
							})
						]
					}, spot.name))
				})]
			})]
		})
	});
}
var INCIDENTS = [
	{
		tone: "critical",
		badge: "● CRITICAL",
		title: "Mass Garbage Accumulation — Eluru Canal",
		subtitle: "Governorpet Reach · 162 waste objects detected · UAV-01 holding position",
		time: "Today · 06:42 IST",
		status: "CLEANUP DEPLOYED",
		statusTone: "ok",
		action: true
	},
	{
		tone: "high",
		badge: "● HIGH",
		title: "Surface Film + Plastic Debris — Ryves Canal",
		subtitle: "One Town corridor · Mixed debris and oil film · CAM-02 detection",
		time: "Today · 08:15 IST",
		status: "ALERT SENT TO VMC",
		statusTone: "warn",
		action: false
	},
	{
		tone: "high",
		badge: "● HIGH",
		title: "Garbage Bags Blocking Flow — Eluru Canal",
		subtitle: "Bhavanipuram Bund · Flow obstruction detected · UAV-03 sweep",
		time: "Today · 09:30 IST",
		status: "UNDER REVIEW",
		statusTone: "caution",
		action: false
	},
	{
		tone: "moderate",
		badge: "⚡ MODERATE",
		title: "Elevated Turbidity — Bandar Road Drain",
		subtitle: "Outfall into Krishna River · Post-market hours reading · CAM-03",
		time: "Today · 11:00 IST",
		status: "MONITORING",
		statusTone: "caution",
		action: false
	},
	{
		tone: "resolved",
		badge: "✓ RESOLVED",
		title: "Cleanup Complete — Ryves Canal Krishna Ghat",
		subtitle: "Surface cleared · UAV-02 confirmed · GWMC team deployed successfully",
		time: "Yesterday · 16:20 IST",
		status: "CLOSED",
		statusTone: "ok",
		action: false
	}
];
var INITIAL_LOG = [
	{
		key: 10,
		time: "06:42",
		location: "Eluru Canal Governorpet",
		severity: "CRITICAL",
		sentTo: "VMC Commissioner",
		method: "SMS + Email",
		status: "Delivered"
	},
	{
		key: 9,
		time: "06:45",
		location: "Eluru Canal Governorpet",
		severity: "CRITICAL",
		sentTo: "APPCB Vijayawada",
		method: "Email",
		status: "Delivered"
	},
	{
		key: 8,
		time: "08:15",
		location: "Ryves Canal One Town",
		severity: "HIGH",
		sentTo: "GWMC Operations",
		method: "SMS",
		status: "Delivered"
	},
	{
		key: 7,
		time: "08:17",
		location: "Ryves Canal One Town",
		severity: "HIGH",
		sentTo: "Ward Councillor 42",
		method: "WhatsApp",
		status: "Delivered"
	},
	{
		key: 6,
		time: "09:30",
		location: "Eluru Canal Bhavanipuram",
		severity: "HIGH",
		sentTo: "VMC Engineering",
		method: "SMS + Email",
		status: "Delivered"
	},
	{
		key: 5,
		time: "09:32",
		location: "Eluru Canal Bhavanipuram",
		severity: "HIGH",
		sentTo: "UAV Control Room",
		method: "App Push",
		status: "Delivered"
	},
	{
		key: 4,
		time: "11:00",
		location: "Bandar Road Drain",
		severity: "MODERATE",
		sentTo: "GWMC Monitoring",
		method: "Email",
		status: "Delivered"
	},
	{
		key: 3,
		time: "11:05",
		location: "Bandar Road Drain",
		severity: "MODERATE",
		sentTo: "Environmental Officer",
		method: "SMS",
		status: "Pending"
	},
	{
		key: 2,
		time: "14:30",
		location: "Ryves Canal One Town",
		severity: "HIGH",
		sentTo: "VMC Commissioner",
		method: "SMS + Email",
		status: "Delivered"
	},
	{
		key: 1,
		time: "16:20",
		location: "Ryves Canal Krishna Ghat",
		severity: "RESOLVED",
		sentTo: "All Departments",
		method: "Email",
		status: "Delivered"
	}
];
var LOCATIONS = [
	"Eluru Canal Governorpet",
	"Ryves Canal One Town",
	"Eluru Canal Bhavanipuram",
	"Bandar Road Drain",
	"Ryves Canal Krishna Ghat"
];
var SEVERITIES = [
	"CRITICAL",
	"HIGH",
	"MODERATE",
	"RESOLVED"
];
var TARGETS = [
	"VMC Commissioner",
	"APPCB Vijayawada",
	"GWMC Operations",
	"Ward Councillor 42",
	"VMC Engineering",
	"UAV Control Room",
	"GWMC Monitoring",
	"Environmental Officer",
	"All Departments"
];
var METHODS = [
	"SMS + Email",
	"Email",
	"SMS",
	"WhatsApp",
	"App Push"
];
function pick(list) {
	return list[Math.floor(Math.random() * list.length)];
}
function istClock(date = /* @__PURE__ */ new Date()) {
	return new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		timeZone: "Asia/Kolkata"
	}).format(date);
}
function makeDispatch(key) {
	const severity = pick(SEVERITIES);
	return {
		key,
		time: istClock(),
		location: pick(LOCATIONS),
		severity,
		sentTo: pick(TARGETS),
		method: pick(METHODS),
		status: Math.random() > .18 ? "Delivered" : "Pending"
	};
}
function AlertsBoard() {
	const headingId = (0, import_react.useId)();
	const [rows, setRows] = (0, import_react.useState)(INITIAL_LOG);
	(0, import_react.useEffect)(() => {
		let id = 20;
		const tick = window.setInterval(() => {
			setRows((prev) => [makeDispatch(++id), ...prev].slice(0, 12));
		}, 3e4);
		return () => window.clearInterval(tick);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "incidents reveal",
		id: "alerts",
		"aria-labelledby": headingId,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "incidents-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "incidents-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "incidents-kicker",
							children: "Incident Command · Vijayawada Canals"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: headingId,
							className: "incidents-title",
							children: "Alerts & Notifications"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "incidents-sub",
							children: "Real-time incidents from UAV fleet and fixed CCTV nodes on Eluru and Ryves Canal"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "incident-stack",
					children: INCIDENTS.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: `incident-card tone-${card.tone}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "incident-copy",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `incident-badge tone-${card.tone}`,
									children: card.badge
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: card.title }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "incident-sub",
									children: card.subtitle
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "incident-time",
									children: card.time
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "incident-aside",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `incident-status tone-${card.statusTone}`,
								children: card.status
							}), card.action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "incident-feed",
								href: "#ai-detection-feed",
								children: "View Feed →"
							}) : null]
						})]
					}, card.title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "incident-stats",
					"aria-label": "Alert totals",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "incident-stat",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-value",
								children: "18"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-label",
								children: "Total Alerts Today"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "incident-stat",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-value is-critical",
								children: "4"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-label",
								children: "Critical"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "incident-stat",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-value is-ok",
								children: "12"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-label",
								children: "Resolved"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "incident-stat",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-value is-warn",
								children: "2"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "incident-stat-label",
								children: "Pending Action"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "dispatch-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "dispatch-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Notification Dispatch Log" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Live handoff to VMC, GWMC, APPCB and UAV control · IST" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dispatch-scroll",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "dispatch-table",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Time"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Location"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Severity"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Sent To"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Method"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									children: "Status"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: i === 0 ? "is-new" : void 0,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "num",
										children: row.time
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.location }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `sev sev-${row.severity.toLowerCase()}`,
										children: row.severity
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.sentTo }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.method }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: row.status === "Delivered" ? "is-ok" : "is-warn",
										children: row.status
									})
								]
							}, row.key)) })]
						})
					})]
				})
			]
		})
	});
}
var INCLUDES = [
	{
		id: "waste",
		label: "Waste Detection Statistics",
		on: true
	},
	{
		id: "alerts",
		label: "Alert Notification Log",
		on: true
	},
	{
		id: "map",
		label: "Map Hotspot Summary",
		on: true
	},
	{
		id: "drone",
		label: "Drone Flight Paths",
		on: true
	},
	{
		id: "raw",
		label: "Raw Sensor Data",
		on: false
	}
];
var SUMMARY = [
	"Total waste objects detected: 247",
	"Critical incidents: 4",
	"Canals monitored: 3",
	"Drone flight hours: 6.2 hrs",
	"Alerts dispatched: 18",
	"Cleanup actions initiated: 3",
	"Canal health score: 32% (Critical)"
];
var JSPDF_SRC = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
function loadJsPdf() {
	const w = window;
	if (w.jspdf?.jsPDF) return Promise.resolve(w.jspdf.jsPDF);
	return new Promise((resolve, reject) => {
		const existing = document.querySelector("script[data-scis-jspdf=\"1\"]");
		if (existing) {
			existing.addEventListener("load", () => {
				if (w.jspdf?.jsPDF) resolve(w.jspdf.jsPDF);
				else reject(/* @__PURE__ */ new Error("jsPDF missing"));
			});
			return;
		}
		const script = document.createElement("script");
		script.src = JSPDF_SRC;
		script.async = true;
		script.dataset.scisJspdf = "1";
		script.onload = () => {
			if (w.jspdf?.jsPDF) resolve(w.jspdf.jsPDF);
			else reject(/* @__PURE__ */ new Error("jsPDF missing"));
		};
		script.onerror = () => reject(/* @__PURE__ */ new Error("jsPDF failed to load"));
		document.head.appendChild(script);
	});
}
function reportStamp(date = /* @__PURE__ */ new Date()) {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	];
	const day = String(date.getDate()).padStart(2, "0");
	return {
		pretty: date.toLocaleDateString("en-IN", {
			day: "numeric",
			month: "long",
			year: "numeric"
		}),
		file: `SCIS_Canal_Report_${day}${months[date.getMonth()]}${date.getFullYear()}.pdf`,
		iso: date.toISOString().slice(0, 10)
	};
}
function writePdf(JsPDF, opts) {
	const doc = new JsPDF({
		unit: "mm",
		format: "a4"
	});
	const stamp = reportStamp(opts.date ? new Date(opts.date) : /* @__PURE__ */ new Date());
	const green = [
		0,
		140,
		80
	];
	const dark = [
		20,
		24,
		22
	];
	const muted = [
		90,
		100,
		96
	];
	const red = [
		180,
		40,
		40
	];
	doc.setFillColor(10, 10, 10);
	doc.rect(0, 0, 210, 18, "F");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(13);
	doc.setTextColor(0, 255, 136);
	doc.text("SMART CANAL INTELLIGENCE SYSTEM", 105, 12, { align: "center" });
	doc.setFontSize(16);
	doc.setTextColor(...dark);
	doc.text("Canal Pollution Monitoring Report", 105, 30, { align: "center" });
	doc.setFont("helvetica", "normal");
	doc.setFontSize(11);
	doc.setTextColor(...muted);
	doc.text(`Date: ${stamp.pretty}`, 105, 38, { align: "center" });
	doc.text("Location: Vijayawada, Andhra Pradesh, India", 105, 44, { align: "center" });
	doc.text(`Scope: ${opts.canal}  ·  ${opts.type}`, 105, 50, { align: "center" });
	doc.setDrawColor(...green);
	doc.setLineWidth(.4);
	doc.line(18, 56, 192, 56);
	let y = 66;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(12);
	doc.setTextColor(...green);
	doc.text("SUMMARY", 18, y);
	y += 8;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(11);
	doc.setTextColor(...dark);
	for (const line of [
		"Total Waste Objects Detected: 247",
		"Critical Incidents: 4",
		"Canals Monitored: 3",
		"Active Drone Units: 3 (UAV-01, UAV-02, UAV-03)",
		"Drone Flight Hours: 6.2 hrs",
		"Alerts Dispatched: 18",
		"Cleanup Actions Initiated: 3",
		"Canal Health Score: 32% — CRITICAL"
	]) {
		doc.text(`•  ${line}`, 20, y);
		y += 7;
	}
	y += 4;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(12);
	doc.setTextColor(...green);
	doc.text("CANAL STATUS", 18, y);
	y += 9;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(11);
	doc.setTextColor(...dark);
	for (const block of [
		[
			"1. Eluru Canal — CRITICAL",
			"Location: Governorpet to Krishnalanka",
			"Objects Detected: 162",
			"Last Sweep: 06:42 IST"
		],
		[
			"2. Ryves Canal — HIGH",
			"Location: One Town Corridor",
			"Objects Detected: 85",
			"Last Sweep: 08:15 IST"
		],
		[
			"3. Bandar Road Drain — MODERATE",
			"Location: Outfall into Krishna River",
			"Objects Detected: 23",
			"Last Sweep: 11:00 IST"
		]
	]) {
		doc.setFont("helvetica", "bold");
		if (block[0].includes("CRITICAL")) doc.setTextColor(...red);
		else if (block[0].includes("HIGH")) doc.setTextColor(200, 110, 20);
		else doc.setTextColor(160, 140, 20);
		doc.text(block[0], 20, y);
		y += 6;
		doc.setFont("helvetica", "normal");
		doc.setTextColor(...dark);
		for (const line of block.slice(1)) {
			doc.text(line, 24, y);
			y += 6;
		}
		y += 3;
	}
	y += 2;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(12);
	doc.setTextColor(...green);
	doc.text("ALERTS LOG (last 5)", 18, y);
	y += 8;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(10);
	doc.setTextColor(...dark);
	for (const row of [
		"06:42 | Eluru Canal | CRITICAL | VMC Notified",
		"08:15 | Ryves Canal | HIGH | APPCB Notified",
		"09:30 | Eluru Bhavanipuram | HIGH | Under Review",
		"11:00 | Bandar Road | MODERATE | Monitoring",
		"16:20 | Ryves Krishna Ghat | RESOLVED | Closed"
	]) {
		doc.text(row, 20, y);
		y += 6.5;
	}
	y = 276;
	doc.setDrawColor(...green);
	doc.line(18, y, 192, y);
	doc.setFontSize(9);
	doc.setTextColor(...green);
	doc.text("Generated by SCIS AI Engine v2.1", 105, y + 6, { align: "center" });
	doc.setTextColor(...muted);
	doc.text("Powered by YOLOv8 + OpenCV", 105, y + 11, { align: "center" });
	doc.text("Smart Canal Intelligence System — Vijayawada", 105, y + 16, { align: "center" });
	doc.save(stamp.file);
	return stamp.file;
}
function ReportGenerator() {
	const headingId = (0, import_react.useId)();
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [fileName, setFileName] = (0, import_react.useState)("SCIS_Canal_Report.pdf");
	const formRef = (0, import_react.useRef)(null);
	const today = reportStamp().iso;
	const generate = (event) => {
		event.preventDefault();
		if (phase === "busy") return;
		const form = event.currentTarget;
		const data = new FormData(form);
		setPhase("busy");
		setProgress(0);
		const started = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - started) / 3e3);
			setProgress(t);
			if (t < 1) {
				requestAnimationFrame(tick);
				return;
			}
			loadJsPdf().then((JsPDF) => {
				const name = writePdf(JsPDF, {
					date: String(data.get("date") || today),
					canal: String(data.get("canal") || "All Canals"),
					type: String(data.get("type") || "Full Report")
				});
				setFileName(name);
				setPhase("done");
			}).catch(() => setPhase("idle"));
		};
		requestAnimationFrame(tick);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "report reveal",
		id: "generate-report",
		"aria-labelledby": headingId,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "report-inner",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "report-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "report-kicker",
						children: "Export · SCIS AI Engine v2.1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: headingId,
						className: "report-title",
						children: "Canal Intelligence Report Generator"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "report-sub",
						children: "Generate and download a full PDF summary of today's canal monitoring data"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "report-layout",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					ref: formRef,
					className: "report-form",
					onSubmit: generate,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "report-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Date Range" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								suppressHydrationWarning: true,
								type: "date",
								name: "date",
								defaultValue: today
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "report-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Canal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								name: "canal",
								defaultValue: "All Canals",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "All Canals" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Eluru Canal" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Ryves Canal" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Bandar Road Drain" })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "report-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Report Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								name: "type",
								defaultValue: "Full Report",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Full Report" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Pollution Summary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Alert Log" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Drone Activity Report" })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
							className: "report-checks",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Include" }), INCLUDES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "report-check",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									suppressHydrationWarning: true,
									type: "checkbox",
									name: item.id,
									defaultChecked: item.on
								}), item.label]
							}, item.id))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "report-go",
							type: "submit",
							disabled: phase === "busy",
							children: "Generate Report"
						}),
						phase === "busy" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "report-progress",
							role: "status",
							"aria-live": "polite",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Compiling UAV logs and CCTV detections…" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "report-bar",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "report-bar-fill",
									style: { width: `${Math.round(progress * 100)}%` }
								})
							})]
						}) : null,
						phase === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "report-success",
							role: "status",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "✅ Report downloaded successfully!" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "report-file",
								children: fileName
							})]
						}) : null
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "report-preview",
					"aria-label": "Report preview",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "preview-banner",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "SMART CANAL INTELLIGENCE SYSTEM" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Weekly Pollution Report — Vijayawada" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
									dateTime: today,
									children: reportStamp().pretty
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "preview-lines",
							children: SUMMARY.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "preview-stamp",
							children: "GENERATED BY SCIS AI ENGINE v2.1"
						})
					]
				})]
			})]
		})
	});
}
var LINKS = [
	{
		href: "#home",
		label: "Home"
	},
	{
		href: "#live-dashboard",
		label: "Dashboard"
	},
	{
		href: "#ai-detection-feed",
		label: "Detection"
	},
	{
		href: "#pollution-hotspot-map",
		label: "Map"
	},
	{
		href: "#alerts",
		label: "Alerts"
	},
	{
		href: "#generate-report",
		label: "Report"
	}
];
function SiteNav() {
	const [solid, setSolid] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [active, setActive] = (0, import_react.useState)("#home");
	(0, import_react.useEffect)(() => {
		const onScroll = () => setSolid(window.scrollY > 28);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	(0, import_react.useEffect)(() => {
		const nodes = LINKS.map((l) => l.href.slice(1)).map((id) => document.getElementById(id)).filter((n) => Boolean(n));
		const io = new IntersectionObserver((entries) => {
			const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
			if (visible?.target.id) setActive(`#${visible.target.id}`);
		}, {
			rootMargin: "-40% 0px -45% 0px",
			threshold: [
				.1,
				.35,
				.6
			]
		});
		nodes.forEach((n) => io.observe(n));
		return () => io.disconnect();
	}, []);
	const go = (href) => (event) => {
		document.querySelector(href)?.classList.add("is-in");
		setOpen(false);
		setActive(href);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: `site-nav${solid ? " is-solid" : ""}${open ? " is-open" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "brand",
				href: "#home",
				onClick: go("#home"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, {
					size: 20,
					strokeWidth: 2.2,
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SCIS" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "nav-toggle",
				"aria-expanded": open,
				"aria-controls": "site-nav-links",
				"aria-label": open ? "Close menu" : "Open menu",
				onClick: () => setOpen((v) => !v),
				children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 20 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				id: "site-nav-links",
				className: "nav-links",
				"aria-label": "Primary",
				children: LINKS.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: link.href,
					className: active === link.href ? "is-active" : void 0,
					onClick: go(link.href),
					children: link.label
				}, link.href))
			})
		]
	});
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "site-footer reveal",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "footer-title",
				children: "Smart Canal Intelligence System | Vijayawada, Andhra Pradesh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "footer-meta",
				children: "Powered by YOLOv8 + OpenCV + Google Maps | Built for cleaner urban waterways"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "footer-social",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#",
					"aria-label": "GitHub (placeholder)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { size: 18 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#",
					"aria-label": "LinkedIn (placeholder)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Linkedin, { size: 18 })
				})]
			})
		]
	});
}
function AlertDock({ open, onOpen, onClose }) {
	const closeRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		closeRef.current?.focus();
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "alert-dock",
		children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "alert-pop",
			role: "alertdialog",
			"aria-labelledby": "alert-pop-title",
			"aria-modal": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "alert-pop-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
							size: 16,
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							id: "alert-pop-title",
							children: "Active alert"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							ref: closeRef,
							type: "button",
							className: "alert-pop-close",
							onClick: onClose,
							"aria-label": "Dismiss alert",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "High pollution detected at Eluru Canal — 5 mins ago" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "alert-pop-meta",
					children: "CAM-01 · Governorpet Reach · CRITICAL · UAV-01 on station"
				})
			]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "alert-fab",
			onClick: () => open ? onClose() : onOpen(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "alert-fab-pulse",
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					size: 16,
					"aria-hidden": "true"
				}),
				"Active Alert"
			]
		})]
	});
}
function inViewport(el) {
	const r = el.getBoundingClientRect();
	return r.top < window.innerHeight - 24 && r.bottom > 64;
}
function useReveals() {
	(0, import_react.useEffect)(() => {
		const nodes = Array.from(document.querySelectorAll(".reveal"));
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const show = (el) => el.classList.add("is-in");
		if (reduced) {
			nodes.forEach(show);
			return;
		}
		const io = new IntersectionObserver((entries) => {
			for (const entry of entries) if (entry.isIntersecting || entry.intersectionRatio > 0) {
				show(entry.target);
				io.unobserve(entry.target);
			}
		}, {
			threshold: .01,
			rootMargin: "80px 0px 0px 0px"
		});
		nodes.forEach((el) => {
			if (inViewport(el)) show(el);
			else io.observe(el);
		});
		const onScroll = () => {
			for (const el of nodes) if (!el.classList.contains("is-in") && inViewport(el)) {
				show(el);
				io.unobserve(el);
			}
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("hashchange", onScroll);
		return () => {
			io.disconnect();
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("hashchange", onScroll);
		};
	}, []);
}
var HERO_LAYERS = [
	[".hero-canvas", .18],
	[".uav-hud", .1],
	[".hero-vignette", .32],
	[".hero-grain", .46],
	[".hero-overlay", .62]
];
var FLOAT_SEL = ".dash-head, .feed-head, .hotspots-head, .incidents-head, .report-head, .metric-card, .cctv-card, .incident-card, .hotspot-card, .report-form, .report-preview, .chart-wrap";
function useParallax(sceneRef) {
	(0, import_react.useEffect)(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		document.querySelector(".hero-sticky");
		const overlay = document.querySelector(".hero-overlay");
		const layers = HERO_LAYERS.map(([sel, speed]) => ({
			el: document.querySelector(sel),
			speed
		})).filter((l) => !!l.el);
		let mx = 0;
		let my = 0;
		let tx = 0;
		let ty = 0;
		let raf = 0;
		let live = true;
		const apply = () => {
			if (!live) return;
			tx += (mx - tx) * .07;
			ty += (my - ty) * .07;
			const y = window.scrollY;
			const vh = window.innerHeight || 1;
			const heroTravel = Math.min(1, Math.max(0, y / (vh * .92)));
			for (const layer of layers) {
				const py = heroTravel * layer.speed * vh * .42;
				const px = tx * 28 * (.35 + layer.speed);
				const ly = ty * 18 * (.25 + layer.speed);
				layer.el.style.transform = `translate3d(${px}px, ${py + ly}px, 0)`;
			}
			if (overlay) overlay.style.opacity = String(1 - heroTravel * 1.15);
			const floats = document.querySelectorAll(FLOAT_SEL);
			for (const el of floats) {
				const r = el.getBoundingClientRect();
				if (r.bottom < -80 || r.top > vh + 80) continue;
				const mid = (r.top + r.height * .5 - vh * .5) / vh;
				const depth = el.matches(".metric-card, .cctv-card, .incident-card, .hotspot-card") ? 28 : 18;
				el.style.setProperty("--par-y", `${(-mid * depth).toFixed(1)}px`);
			}
			sceneRef.current?.setParallax(tx, ty, heroTravel);
			raf = requestAnimationFrame(apply);
		};
		const onMove = (e) => {
			mx = (e.clientX / window.innerWidth - .5) * 2;
			my = (e.clientY / window.innerHeight - .5) * 2;
		};
		window.addEventListener("pointermove", onMove, { passive: true });
		raf = requestAnimationFrame(apply);
		return () => {
			live = false;
			cancelAnimationFrame(raf);
			window.removeEventListener("pointermove", onMove);
			for (const layer of layers) layer.el.style.transform = "";
			if (overlay) overlay.style.opacity = "";
			document.querySelectorAll(FLOAT_SEL).forEach((el) => {
				el.style.removeProperty("--par-y");
			});
		};
	}, [sceneRef]);
}
function Home() {
	const mountRef = (0, import_react.useRef)(null);
	const sceneRef = (0, import_react.useRef)(null);
	const [alertOpen, setAlertOpen] = (0, import_react.useState)(false);
	useReveals();
	useParallax(sceneRef);
	(0, import_react.useEffect)(() => {
		const el = mountRef.current;
		if (!el) return;
		sceneRef.current = mountCanalScene(el);
		return () => {
			sceneRef.current?.dispose();
			sceneRef.current = null;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteNav, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "hero",
				id: "home",
				"aria-label": "Smart Canal Intelligence System",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hero-sticky",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: mountRef,
							className: "hero-canvas"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "uav-hud",
							"aria-hidden": "true",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "uav-hud-box uav-hud-tl",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "UAV-01 · ACTIVE" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											"data-hud": "alt",
											children: "ALT: 8.0m"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											"data-hud": "spd",
											children: "SPD: 2.3 m/s"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											"data-hud": "bat",
											children: "BAT: 87%"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "uav-hud-box uav-hud-tr",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "THERMAL: OFF" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "ZOOM: 2.4x" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											"data-hud": "obj",
											children: "OBJECTS: 47"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "uav-hud-rec",
											"data-hud": "rec",
											children: "● REC"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "uav-cross",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "uav-cross-ring" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "uav-compass",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "n",
											children: "N"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "e",
											children: "E"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "s",
											children: "S"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w",
											children: "W"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "uav-needle",
											"data-hud": "needle"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hero-vignette",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hero-grain",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "letterbox letterbox-bottom",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hero-overlay",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hero-stamp",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "hero-stamp-line",
										children: "Vijayawada · Andhra Pradesh"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "hero-stamp-meta",
										children: "16.5062°N · 80.6480°E · Eluru Canal · Ryves Canal"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hero-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "hero-kicker",
											children: "Night Operations · Canal Watch"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "hero-title",
											children: "Smart Canal Intelligence System"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "hero-rule" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "hero-subtitle",
											children: "AI-Powered Pollution Detection | Vijayawada, Andhra Pradesh"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									className: "hero-scroll",
									href: "#live-dashboard",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Descend" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "scroll-arrow" })]
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveDashboard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetectionFeed, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotspotMap, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertsBoard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportGenerator, {})
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDock, {
			open: alertOpen,
			onOpen: () => setAlertOpen(true),
			onClose: () => setAlertOpen(false)
		})
	] });
}
//#endregion
export { Home as component };
