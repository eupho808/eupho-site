const container = document.getElementById('game-container');
const healthBar = document.getElementById('health-bar');
const scoreEl = document.getElementById('score');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('gameover-overlay');
const endTitle = document.getElementById('end-title');
const endScore = document.getElementById('end-score');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const hint = document.getElementById('hint');

let scene, camera, renderer;
let player, playerVelocity, playerOnGround;
let enemies = [];
let roses = [];
let platforms = [];
let particles;
let mixer;
let animationId;
let clock = new THREE.Clock();
let isPlaying = false;
let isPointerLocked = false;
let health = 5;
let roseCount = 0;

let models = {};
let levelMesh = null;
let levelParts = [];

const MOVE_SPEED = 6;
const JUMP_FORCE = 10;
const GRAVITY = 25;
const PLAYER_RADIUS = 0.4;
const ENEMY_RADIUS = 0.5;
const PLAYER_SCALE = 0.08;
const ENEMY_SCALE = 0.05;
const LEVEL_SCALE = 0.08;

const keys = { w: false, a: false, s: false, d: false, space: false };
let cameraYaw = 0;
let cameraPitch = 0.3;

const MODEL_PATHS = {
  alice: 'assets/models/alice/Alice.DAE',
  soldier: 'assets/models/card_soldier/CardSoldier_Spades.obj',
  soldierMtl: 'assets/models/card_soldier/CardSoldier_Spades.mtl',
  floor1: 'assets/models/floor1/D01 Full.dae'
};

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a0a0a);
  scene.fog = new THREE.FogExp2(0x1a0a0a, 0.006);

  camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 500);

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(100, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 500;
  dirLight.shadow.camera.left = -150;
  dirLight.shadow.camera.right = 150;
  dirLight.shadow.camera.top = 150;
  dirLight.shadow.camera.bottom = -150;
  scene.add(dirLight);

  const hemi = new THREE.HemisphereLight(0xaaccff, 0x553333, 0.6);
  scene.add(hemi);

  window.playerLight = new THREE.PointLight(0xffaa88, 1, 30);
  scene.add(playerLight);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mousedown', onMouseDown);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('pointerlockerror', () => console.error('Pointer lock failed'));

  startBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame(); });
  retryBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame(); });
  container.addEventListener('click', () => {
    if (isPlaying && !isPointerLocked) {
      container.requestPointerLock();
    }
  });

  updateHealthUI();
  loadModels();
}

function loadModels() {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    startOverlay.querySelector('p').textContent = `loading wonderland... ${Math.round(loaded / total * 100)}%`;
  };
  manager.onLoad = () => {
    window.models = models;
    checkAllLoaded();
  };
  manager.onError = (url) => {
    console.error('Failed to load', url);
    startOverlay.querySelector('p').textContent = 'Error loading models. Check console.';
  };

  const colladaLoader = new THREE.ColladaLoader(manager);
  const mtlLoader = new THREE.MTLLoader(manager);
  const objLoader = new THREE.OBJLoader(manager);
  mtlLoader.setPath('assets/models/card_soldier/');

  // Load Alice
  colladaLoader.load(MODEL_PATHS.alice, (collada) => {
    models.alice = collada.scene;
    normalizeModel(models.alice, PLAYER_SCALE);
  });

  // Load Card Soldier (OBJ + MTL)
  mtlLoader.load('CardSoldier_Spades.mtl', (materials) => {
    materials.preload();
    objLoader.setMaterials(materials);
    objLoader.load(MODEL_PATHS.soldier, (obj) => {
      models.soldier = obj;
      normalizeModel(models.soldier, ENEMY_SCALE);
    });
  });

  // Load Floor 1 level parts
  const partIndices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
  models.floor1Parts = {};
  models.floor1PartsTotal = partIndices.length;
  models.floor1PartsLoaded = 0;
  partIndices.forEach(i => {
    const num = i.toString().padStart(2, '0');
    const path = `assets/models/floor1/Parts/d01_01_${num}.dae`;
    colladaLoader.load(path, (collada) => {
      const part = collada.scene;
      normalizeModel(part, LEVEL_SCALE);
      models.floor1Parts[num] = part;
      models.floor1PartsLoaded++;
    });
  });
}

function checkAllLoaded() {
  if (models.floor1PartsLoaded < models.floor1PartsTotal) {
    startOverlay.querySelector('p').textContent = `loading wonderland... ${Math.round(models.floor1PartsLoaded / models.floor1PartsTotal * 100)}%`;
    setTimeout(checkAllLoaded, 200);
    return;
  }
  models.floor1 = true;
  startOverlay.querySelector('p').textContent = 'A fan-made browser tribute. Control Alice through a corrupted Wonderland. Fight Ruin, collect roses, and survive the madness.';
  createEnvironment();
  createPlayer();
  renderer.render(scene, camera);
}

function normalizeModel(root, scale) {
  root.scale.set(scale, scale, scale);
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.side = THREE.DoubleSide;
      }
    }
  });
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  root.userData.size = size;
  root.userData.center = center;
}

function cloneModel(name) {
  const source = models[name];
  if (!source) return null;
  const clone = source.clone();
  clone.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map(m => m.clone());
      } else {
        child.material = child.material.clone();
      }
    }
  });

  // Pose Alice arms down instead of T-pose
  if (name === 'alice') {
    poseAliceArms(clone);
  }

  return clone;
}

function findBone(root, name) {
  let found = null;
  root.traverse(child => {
    if (child.isBone && child.name === name) found = child;
  });
  return found;
}

function poseAliceArms(root) {
  root.updateMatrixWorld(true);
  const bones = [];
  root.traverse(child => {
    if (child.isBone) {
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);
      bones.push({ bone: child, x: worldPos.x, y: worldPos.y, z: worldPos.z });
    }
  });

  // Shoulders: high y, far left/right
  const shoulders = bones.filter(b => b.y > 12.5 && b.y < 16 && Math.abs(b.x) > 0.7 && Math.abs(b.x) < 1.2);
  shoulders.forEach(b => {
    const angle = b.x > 0 ? Math.PI / 1.9 : -Math.PI / 1.9;
    b.bone.rotation.z = angle;
  });

  // Elbows: below shoulders, still far left/right
  const elbows = bones.filter(b => b.y > 10 && b.y < 13 && Math.abs(b.x) > 0.7);
  elbows.forEach(b => {
    b.bone.rotation.z = b.x > 0 ? Math.PI / 8 : -Math.PI / 8;
  });

  root.updateMatrixWorld(true);
  root.traverse(child => {
    if (child.isSkinnedMesh && child.skeleton) {
      child.skeleton.update();
    }
  });
}

function loadLevelParts(indices) {
  if (!models.floor1Parts) return;

  indices.forEach((i, idx) => {
    const num = i.toString().padStart(2, '0');
    const source = models.floor1Parts[num];
    if (!source) return;

    const part = source.clone();
    part.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone());
        } else {
          child.material = child.material.clone();
        }
      }
    });

    // Center the part horizontally and lift it so the bottom touches y=0
    const box = new THREE.Box3().setFromObject(part);
    const size = box.getSize(new THREE.Vector3());
    part.userData.size = size;

    // Lay out parts in a path along negative Z
    let px, pz;
    if (idx === 0) {
      px = 0;
      pz = 0;
    } else {
      px = (Math.random() - 0.5) * 15;
      pz = -idx * 14 - Math.random() * 8;
    }

    part.position.set(px, -box.min.y, pz);

    scene.add(part);
    levelParts.push(part);

    // Add collision box near the bottom of the part
    platforms.push({
      mesh: part,
      x: part.position.x,
      y: 2,
      z: part.position.z,
      height: 2,
      width: Math.max(size.x * 0.45, 4),
      depth: Math.max(size.z * 0.45, 4)
    });
  });
}

function createEnvironment() {
  // Build level from smaller parts instead of one giant mesh
  loadLevelParts([1, 2, 6, 7, 11, 12, 13, 25]);

  // Continuous ground plane so the player never falls between parts
  const groundGeo = new THREE.PlaneGeometry(300, 300);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x160a0a, roughness: 1.0, metalness: 0.0 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
  platforms.push({ mesh: groundMesh, x: 0, y: 0, z: 0, width: 150, depth: 150, height: 0 });

  // Fallback void below
  const voidGeo = new THREE.PlaneGeometry(500, 500);
  const voidMat = new THREE.MeshStandardMaterial({ color: 0x0a0505, roughness: 1.0 });
  const voidMesh = new THREE.Mesh(voidGeo, voidMat);
  voidMesh.rotation.x = -Math.PI / 2;
  voidMesh.position.y = -30;
  voidMesh.receiveShadow = true;
  scene.add(voidMesh);

  for (let i = 0; i < 8; i++) {
    const x = -20 + Math.random() * 40;
    const z = -15 - Math.random() * 80;
    spawnEnemy(x, 1, z);
  }

  for (let i = 0; i < 12; i++) {
    const x = -25 + Math.random() * 50;
    const z = -15 - Math.random() * 90;
    spawnRose(x, 1.5, z);
  }

  createParticles();
}

function createPlayer() {
  if (models.alice) {
    player = cloneModel('alice');
    player.position.set(0, 2, 0);
    addVorpalBlade(player);
  } else {
    player = new THREE.Group();
    const placeholder = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 1, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    placeholder.position.y = 0.8;
    player.add(placeholder);
    player.position.set(0, 2, 0);
  }

  playerVelocity = new THREE.Vector3();
  playerOnGround = false;
  scene.add(player);
}

function addVorpalBlade(parent) {
  const bladeGroup = new THREE.Group();

  const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.rotation.x = Math.PI / 2;
  bladeGroup.add(handle);

  const bladeGeo = new THREE.BoxGeometry(0.04, 0.01, 0.5);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2, emissive: 0x111111 });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.z = 0.35;
  blade.rotation.x = Math.PI / 2;
  bladeGroup.add(blade);

  bladeGroup.position.set(0.35, 0.9, 0.25);
  bladeGroup.rotation.y = -0.3;
  parent.add(bladeGroup);
}

let isAttacking = false;

function createWeaponSwing() {
  if (isAttacking) return;
  isAttacking = true;

  // Swing arc in front of Alice
  let swingTime = 0;
  const swingDuration = 0.35;
  const hitEnemies = new Set();

  const animateSwing = () => {
    swingTime += 0.016;
    const t = Math.min(swingTime / swingDuration, 1);

    // Arc in front of player
    const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw)).normalize();
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw)).normalize();
    const arcAngle = (t - 0.5) * Math.PI;
    const strikePos = player.position.clone()
      .add(new THREE.Vector3(0, 1.1, 0))
      .add(forward.clone().multiplyScalar(1.2))
      .add(right.clone().multiplyScalar(Math.sin(arcAngle) * 0.8));

    checkEnemyHits(strikePos, hitEnemies);

    if (t < 1) {
      requestAnimationFrame(animateSwing);
    } else {
      isAttacking = false;
    }
  };
  animateSwing();
}

function checkEnemyHits(strikePos, hitEnemies) {
  enemies.forEach(enemy => {
    if (enemy.dead) return;
    if (hitEnemies.has(enemy)) return;
    const dist = strikePos.distanceTo(enemy.mesh.position);
    if (dist < 1.6) {
      hitEnemies.add(enemy);
      enemy.health--;
      if (enemy.health <= 0) {
        enemy.dead = true;
        scene.remove(enemy.mesh);
        spawnRose(enemy.mesh.position.x, enemy.mesh.position.y + 0.5, enemy.mesh.position.z);
      }
    }
  });
}

function spawnEnemy(x, y, z) {
  let mesh;
  if (models.soldier) {
    mesh = cloneModel('soldier');
    mesh.position.set(x, y + 2, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
  } else {
    mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    body.position.y = 0.4;
    mesh.add(body);
    mesh.position.set(x, y, z);
  }

  scene.add(mesh);

  enemies.push({
    mesh: mesh,
    health: 2,
    dead: false,
    baseY: y
  });
}

function spawnRose(x, y, z) {
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x006400 });
  const stem = new THREE.Mesh(stemGeo, stemMat);

  const roseGeo = new THREE.DodecahedronGeometry(0.15);
  const roseMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 });
  const rose = new THREE.Mesh(roseGeo, roseMat);
  rose.position.y = 0.2;

  const group = new THREE.Group();
  group.add(stem);
  group.add(rose);
  group.position.set(x, y, z);
  group.userData = { collected: false };
  scene.add(group);
  roses.push(group);
}

function createParticles() {
  const geo = new THREE.BufferGeometry();
  const count = 200;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffaaaa, size: 0.1, transparent: true, opacity: 0.5 });
  particles = new THREE.Points(geo, mat);
  scene.add(particles);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

const CODE_MAP = {
  'KeyW': 'w',
  'KeyA': 'a',
  'KeyS': 's',
  'KeyD': 'd',
  'Space': 'space'
};

function onKeyDown(e) {
  const mapped = CODE_MAP[e.code];
  if (mapped && keys.hasOwnProperty(mapped)) {
    keys[mapped] = true;
    console.log('KEYDOWN SET', mapped, 'keys now:', JSON.stringify(keys));
    if (isPlaying) e.preventDefault();
  }
}

function onKeyUp(e) {
  const mapped = CODE_MAP[e.code];
  if (mapped && keys.hasOwnProperty(mapped)) {
    keys[mapped] = false;
    console.log('KEYUP SET', mapped, 'keys now:', JSON.stringify(keys));
  }
}

function onMouseMove(e) {
  if (!isPointerLocked || !isPlaying) return;
  cameraYaw -= e.movementX * 0.002;
  cameraPitch -= e.movementY * 0.002;
  cameraPitch = Math.max(-0.5, Math.min(1.2, cameraPitch));
}

function onMouseDown(e) {
  if (!isPlaying) return;
  if (e.button === 0) {
    createWeaponSwing();
  }
}

function onPointerLockChange() {
  isPointerLocked = document.pointerLockElement === container;
}

function startGame() {
  isPlaying = true;
  keys.w = keys.a = keys.s = keys.d = keys.space = false;
  health = 5;
  roseCount = 0;

  enemies.forEach(e => scene.remove(e.mesh));
  enemies = [];
  roses.forEach(r => scene.remove(r));
  roses = [];
  levelParts.forEach(p => scene.remove(p));
  levelParts = [];
  platforms.forEach(p => scene.remove(p.mesh));
  platforms = [];
  if (player) scene.remove(player);

  createEnvironment();
  createPlayer();
  player.position.set(0, 1.5, 0);
  cameraYaw = Math.PI;
  cameraPitch = 0.3;
  playerVelocity.set(0, 0, 0);

  startOverlay.classList.add('hidden');
  startOverlay.style.pointerEvents = 'none';
  gameOverOverlay.classList.add('hidden');
  gameOverOverlay.style.pointerEvents = 'none';
  hint.style.display = 'block';

  // Remove focus from start/retry buttons so keys go to window
  if (document.activeElement && (document.activeElement.id === 'start-btn' || document.activeElement.id === 'retry-btn')) {
    document.activeElement.blur();
  }

  updateHealthUI();
  updateScoreUI();

  if (container.requestPointerLock) {
    container.requestPointerLock();
  }

  if (animationId) cancelAnimationFrame(animationId);
  clock = new THREE.Clock();
  animate();
}

function gameOver(won) {
  isPlaying = false;
  document.exitPointerLock();
  endTitle.textContent = won ? 'WONDERLAND SAVED' : 'MADNESS WINS';
  endTitle.style.color = won ? '#32cd32' : '#cc0000';
  endScore.textContent = 'Roses collected: ' + roseCount;
  gameOverOverlay.classList.remove('hidden');
  gameOverOverlay.style.pointerEvents = 'auto';
  hint.style.display = 'none';
}

function updatePlayer(dt) {
  const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
  const move = new THREE.Vector3();

  if (keys.w) move.sub(forward);
  if (keys.s) move.add(forward);
  if (keys.d) move.sub(right);
  if (keys.a) move.add(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(MOVE_SPEED);
    playerVelocity.x += (move.x - playerVelocity.x) * 10 * dt;
    playerVelocity.z += (move.z - playerVelocity.z) * 10 * dt;
  } else {
    playerVelocity.x *= Math.pow(0.001, dt);
    playerVelocity.z *= Math.pow(0.001, dt);
  }

  playerVelocity.y -= GRAVITY * dt;

  if (keys.space && playerOnGround) {
    playerVelocity.y = JUMP_FORCE;
    playerOnGround = false;
  }

  player.position.add(playerVelocity.clone().multiplyScalar(dt));

  if (player.position.y < -20) {
    health = 0;
    updateHealthUI();
    gameOver(false);
    return;
  }

  playerOnGround = false;
  platforms.forEach(p => {
    const dx = player.position.x - p.x;
    const dz = player.position.z - p.z;
    const py = player.position.y - PLAYER_RADIUS;

    if (Math.abs(dx) < p.width && Math.abs(dz) < p.depth) {
      if (py <= p.y + 0.1 && py >= p.y - 2.5 && playerVelocity.y <= 0) {
        player.position.y = p.y + PLAYER_RADIUS;
        playerVelocity.y = 0;
        playerOnGround = true;
      }
    }
  });

  // Camera: third-person follow with lag so movement is visible
  const camDist = 10;
  const camHeight = 5;
  const targetCamX = player.position.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * camDist;
  const targetCamY = Math.max(player.position.y + camHeight + Math.sin(cameraPitch) * camDist * 0.5, player.position.y + 2);
  const targetCamZ = player.position.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * camDist;

  const lerpFactor = 5 * dt; // smooth follow
  camera.position.x += (targetCamX - camera.position.x) * lerpFactor;
  camera.position.y += (targetCamY - camera.position.y) * lerpFactor;
  camera.position.z += (targetCamZ - camera.position.z) * lerpFactor;
  camera.lookAt(player.position.x, player.position.y + 1.8, player.position.z);

  if (playerLight) {
    playerLight.position.copy(player.position);
    playerLight.position.y += 2;
  }

  if (move.length() > 0) {
    player.rotation.y = cameraYaw;
  }

  // Debug overlay
  const debugEl = document.getElementById('game-debug');
  if (debugEl) {
    debugEl.textContent = `keys: w=${keys.w} a=${keys.a} s=${keys.s} d=${keys.d} | pos: ${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)} | vel: ${playerVelocity.x.toFixed(2)}, ${playerVelocity.z.toFixed(2)} | yaw: ${cameraYaw.toFixed(2)}`;
  }

  // Prevent walking off the level sides too easily
  if (player.position.y < -15) {
    health = 0;
    updateHealthUI();
    gameOver(false);
  }
}

function updateEnemies(dt) {
  const time = clock.getElapsedTime();

  enemies.forEach(enemy => {
    if (enemy.dead) return;

    const dist = enemy.mesh.position.distanceTo(player.position);
    if (dist < 18 && dist > 1.4) {
      const dir = new THREE.Vector3()
        .subVectors(player.position, enemy.mesh.position)
        .normalize();
      enemy.mesh.position.add(dir.multiplyScalar(2.5 * dt));
      enemy.mesh.lookAt(player.position.x, enemy.mesh.position.y, player.position.z);
    }

    enemy.mesh.position.y = enemy.baseY + Math.sin(time * 3 + enemy.mesh.position.x) * 0.05;

    if (dist < 1.4) {
      health -= 1;
      updateHealthUI();
      const push = new THREE.Vector3()
        .subVectors(enemy.mesh.position, player.position)
        .normalize()
        .multiplyScalar(3);
      enemy.mesh.position.add(push);
      if (health <= 0) {
        gameOver(false);
      }
    }
  });
}

function updateRoses() {
  for (let i = roses.length - 1; i >= 0; i--) {
    const rose = roses[i];
    rose.rotation.y += 0.02;
    const dist = rose.position.distanceTo(player.position);
    if (dist < 1.5) {
      roseCount++;
      updateScoreUI();
      scene.remove(rose);
      roses.splice(i, 1);
      if (roseCount >= 12) {
        gameOver(true);
      }
    }
  }
}

function updateParticles() {
  if (particles) {
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.02;
      if (positions[i + 1] < 0) positions[i + 1] = 20;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }
}

function updateHealthUI() {
  healthBar.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const rose = document.createElement('div');
    rose.className = 'rose' + (i >= health ? ' empty' : '');
    healthBar.appendChild(rose);
  }
}

function updateScoreUI() {
  scoreEl.textContent = 'ROSES: ' + roseCount + ' / 12';
}

function animate() {
  if (!isPlaying) return;
  animationId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  updatePlayer(dt);
  updateEnemies(dt);
  updateRoses();
  updateParticles();

  if (mixer) mixer.update(dt);

  renderer.render(scene, camera);
}

init();
