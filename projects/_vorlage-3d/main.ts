/**
 * VORLAGE 3D – "Murmel-Insel" mit Three.js (Grafik) + Rapier (Physik)
 *
 * Zeigt die wichtigsten Bausteine eines 3D-Spiels:
 *  - Szene, Kamera, Licht und Schatten
 *  - Physik: Kugel rollt, springt, stößt an Hindernisse (Rapier)
 *  - Kamera, die der Spielfigur folgt
 *  - Einsammeln per Abstand, Punkte, Highscore, Runterfallen = Neustart
 *  - HUD (Punkteanzeige) als normales HTML über dem 3D-Bild
 *
 * Grundprinzip: Rapier rechnet, wo sich Dinge befinden – Three.js zeichnet sie dort hin.
 * Für ein neues Spiel: diesen Ordner kopieren und dann umbauen.
 */
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import "../../src/styles.css";
import { getHighscore, saveHighscore } from "../../src/lib/highscore.ts";
import { addBackLink } from "../../src/lib/page.ts";
import { sfx } from "../../src/lib/sfx.ts";

const GAME_ID = "murmel-insel";
const ISLAND_SIZE = 24;
const BALL_RADIUS = 0.6;
const ROLL_FORCE = 0.6;
const JUMP_IMPULSE = 6;
const COIN_COUNT = 6;

await RAPIER.init();

// ---------- Grafik: Renderer, Szene, Kamera, Licht ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#87ceeb");
scene.fog = new THREE.Fog("#87ceeb", 30, 70);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

scene.add(new THREE.HemisphereLight("#ffffff", "#5a8f3c", 1.2));
const sun = new THREE.DirectionalLight("#ffffff", 2.5);
sun.position.set(10, 20, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 });
scene.add(sun);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Physik-Welt ----------

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

/** Erzeugt eine Kiste, die sichtbar ist (Three.js) UND im Weg steht (Rapier). */
function addBox(size: THREE.Vector3, position: THREE.Vector3, color: string, rotationY = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshStandardMaterial({ color }),
  );
  mesh.position.copy(position);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed()
      .setTranslation(position.x, position.y, position.z)
      .setRotation(mesh.quaternion),
  );
  world.createCollider(RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2), body);
}

// Die Insel (Oberkante bei y = 0) und ein paar Hindernisse
addBox(new THREE.Vector3(ISLAND_SIZE, 2, ISLAND_SIZE), new THREE.Vector3(0, -1, 0), "#6ab04c");
addBox(new THREE.Vector3(3, 1, 3), new THREE.Vector3(5, 0.5, -4), "#e17055", 0.4);
addBox(new THREE.Vector3(2, 2, 2), new THREE.Vector3(-6, 1, 3), "#0984e3", 0.8);
addBox(new THREE.Vector3(6, 0.6, 1.5), new THREE.Vector3(-3, 0.3, -7), "#fdcb6e");

// ---------- Spielfigur: die Murmel ----------

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 32, 16),
  new THREE.MeshStandardMaterial({ color: "#ff7f11", roughness: 0.3, metalness: 0.2 }),
);
ball.castShadow = true;
scene.add(ball);
// Ein Streifen auf der Kugel, damit man das Rollen sieht
const stripe = new THREE.Mesh(
  new THREE.TorusGeometry(BALL_RADIUS * 1.001, 0.06, 8, 32),
  new THREE.MeshStandardMaterial({ color: "#ffffff" }),
);
ball.add(stripe);

const ballBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 3, 0)
    .setAngularDamping(1.5)
    .setLinearDamping(0.3),
);
world.createCollider(
  RAPIER.ColliderDesc.ball(BALL_RADIUS).setRestitution(0.4).setFriction(1.5),
  ballBody,
);

function resetBall() {
  ballBody.setTranslation({ x: 0, y: 3, z: 0 }, true);
  ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
}

function isOnGround(): boolean {
  const p = ballBody.translation();
  const ray = new RAPIER.Ray(p, { x: 0, y: -1, z: 0 });
  const hit = world.castRay(
    ray,
    BALL_RADIUS + 0.1,
    true,
    undefined,
    undefined,
    undefined,
    ballBody,
  );
  return hit !== null;
}

// ---------- Münzen ----------

const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 24);
const coinMaterial = new THREE.MeshStandardMaterial({
  color: "#ffd700",
  metalness: 0.8,
  roughness: 0.2,
  emissive: "#7a5c00",
});
const coins: THREE.Mesh[] = [];

// Einmal rechnen, damit Raycasts (siehe unten) alle Hindernisse kennen.
world.step();

function placeCoinRandomly(coin: THREE.Mesh) {
  const half = ISLAND_SIZE / 2 - 1.5;
  const x = THREE.MathUtils.randFloat(-half, half);
  const z = THREE.MathUtils.randFloat(-half, half);
  // Von oben einen Strahl nach unten schießen: so landet die Münze auf dem Boden ODER auf einem Hindernis.
  const ray = new RAPIER.Ray({ x, y: 20, z }, { x: 0, y: -1, z: 0 });
  const hit = world.castRay(ray, 40, true, undefined, undefined, undefined, ballBody);
  const groundY = hit ? 20 - hit.timeOfImpact : 0;
  coin.position.set(x, groundY + 0.9, z);
}

for (let i = 0; i < COIN_COUNT; i++) {
  const coin = new THREE.Mesh(coinGeometry, coinMaterial);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  placeCoinRandomly(coin);
  scene.add(coin);
  coins.push(coin);
}

// ---------- Punkte & Anzeige ----------

let score = 0;
const hud = document.querySelector<HTMLDivElement>("#hud")!;
const message = document.querySelector<HTMLDivElement>("#message")!;

function updateHud() {
  hud.textContent = `🪙 ${score}   🏆 ${getHighscore(GAME_ID)}`;
}

function showMessage(text: string) {
  message.textContent = text;
  message.style.opacity = "1";
  setTimeout(() => {
    message.style.opacity = "0";
  }, 1500);
}

updateHud();

// ---------- Tastatur ----------

const keys = new Set<string>();
window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Space" && isOnGround()) {
    ballBody.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
    sfx.jump();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

// ---------- Game Loop ----------

const timer = new THREE.Timer();
timer.connect(document);
const cameraOffset = new THREE.Vector3(0, 7, 11);
const cameraTarget = new THREE.Vector3();

renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 1 / 30);

  // 1. Eingabe → Kräfte auf die Kugel
  const force = { x: 0, y: 0, z: 0 };
  if (keys.has("ArrowUp")) force.z -= ROLL_FORCE;
  if (keys.has("ArrowDown")) force.z += ROLL_FORCE;
  if (keys.has("ArrowLeft")) force.x -= ROLL_FORCE;
  if (keys.has("ArrowRight")) force.x += ROLL_FORCE;
  ballBody.applyImpulse({ x: force.x * dt * 10, y: 0, z: force.z * dt * 10 }, true);

  // 2. Physik einen Schritt weiterrechnen
  world.timestep = dt;
  world.step();

  // 3. Grafik an die Physik anpassen
  ball.position.copy(ballBody.translation());
  ball.quaternion.copy(ballBody.rotation());

  // 4. Spielregeln
  for (const coin of coins) {
    coin.rotation.z += dt * 3;
    if (coin.position.distanceTo(ball.position) < BALL_RADIUS + 0.6) {
      score += 1;
      sfx.coin();
      placeCoinRandomly(coin);
      updateHud();
    }
  }

  if (ball.position.y < -15) {
    const isRecord = saveHighscore(GAME_ID, score);
    showMessage(isRecord ? `Neuer Rekord: ${score}! 🏆` : "Plumps! 💦");
    sfx.gameOver();
    score = 0;
    updateHud();
    resetBall();
  }

  // 5. Kamera folgt weich der Kugel
  cameraTarget.copy(ball.position).add(cameraOffset);
  camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * 4));
  camera.lookAt(ball.position);

  renderer.render(scene, camera);
});

addBackLink();
