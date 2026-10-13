/**
 * SPLAT ARENA 3D - 1v1 Tactical Rival Duel Edition
 * 
 * Features:
 * - Single Smart Rival Operative AI:
 *   - Line-of-sight analysis & dynamic pillar cover seeking
 *   - Corner peeking & tactical burst fire
 *   - Lead aiming (predictive projectile trajectory based on player movement)
 *   - Real-time predictive dodging against incoming player paintballs
 *   - Strategic flanking maneuvers
 * - Seamless 1st Person & 3rd Person Camera Toggle [V]
 * - 3D Player & Rival Armatures with Blaster Recoil & Stride Cycles
 * - Solid 3D collision physics for walls, pillars, and central platform
 * - Clean paint splatter decals on solid surfaces only (no floating paint)
 * - Procedural Web Audio Engine
 */

// ============================================================================
// CONFIGURATION & DIFFICULTY SETTINGS
// ============================================================================
const DIFFICULTY_CONFIG = {
  easy: {
    label: 'EASY',
    badgeColor: '#4ade80',
    rivalHp: 6,
    rivalSpeed: 6.5,
    burstCount: 2,
    burstDelay: 0.18,
    peekReaction: 0.75,
    leadAccuracy: 0.35,
    dodgeChance: 0.30,
    enemyDmg: 10,
    playerHp: 150,
    timeLimit: 90,
    inkCost: 0, // Infinite ink
    autoReload: true,
    shieldRegen: false,
    scoreMultiplier: 1.0
  },
  medium: {
    label: 'MEDIUM',
    badgeColor: '#38bdf8',
    rivalHp: 10,
    rivalSpeed: 8.8,
    burstCount: 3,
    burstDelay: 0.14,
    peekReaction: 0.45,
    leadAccuracy: 0.75,
    dodgeChance: 0.60,
    enemyDmg: 14,
    playerHp: 100,
    timeLimit: 75,
    inkCost: 6,
    autoReload: true,
    shieldRegen: false,
    scoreMultiplier: 1.5
  },
  hard: {
    label: 'HARD',
    badgeColor: '#f59e0b',
    rivalHp: 15,
    rivalSpeed: 11.2,
    burstCount: 4,
    burstDelay: 0.11,
    peekReaction: 0.25,
    leadAccuracy: 0.92,
    dodgeChance: 0.85,
    enemyDmg: 18,
    playerHp: 100,
    timeLimit: 60,
    inkCost: 9,
    autoReload: false,
    shieldRegen: false,
    scoreMultiplier: 2.5
  },
  insane: {
    label: 'INSANE',
    badgeColor: '#f43f5e',
    rivalHp: 20,
    rivalSpeed: 13.5,
    burstCount: 4,
    burstDelay: 0.09,
    peekReaction: 0.12,
    leadAccuracy: 1.0,
    dodgeChance: 0.95,
    enemyDmg: 22,
    playerHp: 80,
    timeLimit: 45,
    inkCost: 12,
    autoReload: false,
    shieldRegen: true,
    scoreMultiplier: 4.0
  }
};

const PALETTE = [
  { name: 'Neon Pink', hex: '#ff007f', num: 0xff007f },
  { name: 'Electric Cyan', hex: '#00e5ff', num: 0x00e5ff },
  { name: 'Acid Lime', hex: '#39ff14', num: 0x39ff14 },
  { name: 'Vivid Yellow', hex: '#ffe600', num: 0xffe600 },
  { name: 'Blaze Orange', hex: '#ff6b00', num: 0xff6b00 },
  { name: 'Hyper Violet', hex: '#a855f7', num: 0xa855f7 }
];

const ENEMY_PAINT = { name: 'Crimson Plasma', hex: '#ff0055', num: 0xff0055 };

// Arena Pillar Coordinates
const ARENA_PILLARS = [
  { x: -22, z: -22 }, { x: 22, z: -22 },
  { x: -22, z: 22 }, { x: 22, z: 22 },
  { x: -12, z: 0 }, { x: 12, z: 0 },
  { x: 0, z: -14 }, { x: 0, z: 14 }
];

// ============================================================================
// PROCEDURAL AUDIO SYNTHESIZER
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPlayerShoot() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playEnemyShoot() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.14);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playSplat() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340 + Math.random() * 80, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.14);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.14);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playHit() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playPlayerHurt() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.2);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playDodgeWhoosh() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playEmpty() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playReload() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(780, now + 2.2);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 2.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 2.2);
  }
}

// ============================================================================
// MAIN GAME CLASS
// ============================================================================
class SplatArenaGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.sound = new SoundEffects();

    this.currentDifficulty = 'medium';
    this.config = DIFFICULTY_CONFIG[this.currentDifficulty];
    this.currentColorIndex = 0;
    this.isPlaying = false;
    this.cameraMode = 'first'; // 'first' or 'third'

    // Stats
    this.score = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.timeLeft = 60;
    this.timerInterval = null;

    // Player vitals
    this.maxHealth = this.config.playerHp;
    this.health = this.maxHealth;
    this.ink = 100;
    this.isReloading = false;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Physics Collections
    this.collidables = [];
    this.obstacleMeshes = [];
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.splatters = [];
    this.particles = [];
    this.maxSplatters = 180;

    // Player State
    this.player = {
      position: new THREE.Vector3(0, 1.8, 25),
      velocity: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      speed: 13,
      sprintMultiplier: 1.45,
      jumpForce: 10.5,
      gravity: 25,
      isGrounded: true,
      height: 1.8,
      radius: 0.9,
      avatar: null,
      avatarLegL: null,
      avatarLegR: null,
      avatarGun: null,
      walkCycle: 0,
      fpsGun: null,
      gunRecoil: 0
    };

    // Single Smart Rival Operative
    this.rival = null;

    this.keys = {};
    this.isPointerLocked = false;

    this.initDOM();
    this.initThree();
    this.setupArena();
    this.setupPlayerVisuals();
    this.setupRivalVisuals();
    this.setupEventListeners();
    this.animate();
  }

  initDOM() {
    this.dom = {
      hud: document.getElementById('hud'),
      score: document.getElementById('score-display'),
      timer: document.getElementById('timer-display'),
      diffBadge: document.getElementById('difficulty-badge'),
      cameraBadge: document.getElementById('camera-badge'),
      healthBar: document.getElementById('health-bar'),
      healthDisplay: document.getElementById('health-display'),
      rivalHpBar: document.getElementById('rival-hp-bar'),
      rivalHpText: document.getElementById('rival-hp-text'),
      aiStatusText: document.getElementById('ai-status-text'),
      inkBar: document.getElementById('ink-bar'),
      inkPercent: document.getElementById('ink-percent'),
      reloadPrompt: document.getElementById('reload-prompt'),
      palette: document.getElementById('color-palette'),
      damageOverlay: document.getElementById('damage-overlay'),
      hitmarker: document.getElementById('hitmarker'),
      startMenu: document.getElementById('start-menu'),
      playBtn: document.getElementById('play-btn'),
      gameOverModal: document.getElementById('game-over-modal'),
      restartBtn: document.getElementById('restart-btn'),
      changeDiffBtn: document.getElementById('change-diff-btn'),
      resultTitle: document.getElementById('result-title'),
      resultSubtitle: document.getElementById('result-subtitle'),
      finalScore: document.getElementById('final-score'),
      finalSplats: document.getElementById('final-splats'),
      finalAccuracy: document.getElementById('final-accuracy'),
      finalDiff: document.getElementById('final-difficulty'),
      diffButtons: document.querySelectorAll('.diff-btn'),
      audioToggle: document.getElementById('audio-toggle')
    };

    // Render Color Palette
    this.dom.palette.innerHTML = '';
    PALETTE.forEach((color, i) => {
      const slot = document.createElement('div');
      slot.className = `color-slot ${i === 0 ? 'active' : ''}`;
      slot.style.backgroundColor = color.hex;
      slot.style.boxShadow = `0 0 10px ${color.hex}`;
      slot.innerHTML = `<span>${i + 1}</span>`;
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectColor(i);
      });
      this.dom.palette.appendChild(slot);
    });
  }

  selectColor(index) {
    this.currentColorIndex = index;
    const slots = this.dom.palette.querySelectorAll('.color-slot');
    slots.forEach((s, idx) => {
      if (idx === index) s.classList.add('active');
      else s.classList.remove('active');
    });
    this.dom.inkBar.style.boxShadow = `0 0 14px ${PALETTE[index].hex}`;

    if (this.player.fpsGunTank) {
      this.player.fpsGunTank.material.color.setHex(PALETTE[index].num);
      this.player.fpsGunTank.material.emissive.setHex(PALETTE[index].num);
    }
    if (this.player.avatarTank) {
      this.player.avatarTank.material.color.setHex(PALETTE[index].num);
      this.player.avatarTank.material.emissive.setHex(PALETTE[index].num);
    }
  }

  toggleCameraMode() {
    this.cameraMode = (this.cameraMode === 'first') ? 'third' : 'first';
    this.dom.cameraBadge.textContent = (this.cameraMode === 'first') ? '1ST PERSON' : '3RD PERSON';
    this.dom.cameraBadge.style.color = (this.cameraMode === 'first') ? '#38bdf8' : '#a855f7';

    if (this.player.avatar) {
      this.player.avatar.visible = (this.cameraMode === 'third');
    }
    if (this.player.fpsGun) {
      this.player.fpsGun.visible = (this.cameraMode === 'first');
    }
  }

  // ============================================================================
  // THREE.JS SETUP
  // ============================================================================
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(35, 60, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 160;
    const d = 55;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    const lightCoords = [
      [-32, 9, -32, 0x00e5ff],
      [32, 9, -32, 0xff007f],
      [-32, 9, 32, 0x39ff14],
      [32, 9, 32, 0xa855f7]
    ];
    lightCoords.forEach(([x, y, z, col]) => {
      const pl = new THREE.PointLight(col, 1.4, 45);
      pl.position.set(x, y, z);
      this.scene.add(pl);
    });
  }

  // ============================================================================
  // ARENA GENERATION
  // ============================================================================
  setupArena() {
    const arenaSize = 84;
    const wallHeight = 15;

    // Floor Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.fillStyle = '#38bdf8';
    for (let x = 0; x <= 512; x += 128) {
      for (let y = 0; y <= 512; y += 128) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(16, 16);

    const floorGeo = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.5, metalness: 0.2 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.collidables.push(floor);

    // Perimeter Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.1 });
    const createWall = (w, h, d, x, y, z) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(x, y, z);
      wall.receiveShadow = true;
      wall.castShadow = true;
      this.scene.add(wall);
      this.collidables.push(wall);
      this.obstacleMeshes.push(wall);
      return wall;
    };

    const half = arenaSize / 2;
    createWall(arenaSize, wallHeight, 1.2, 0, wallHeight / 2, -half);
    createWall(arenaSize, wallHeight, 1.2, 0, wallHeight / 2, half);
    createWall(1.2, wallHeight, arenaSize, -half, wallHeight / 2, 0);
    createWall(1.2, wallHeight, arenaSize, half, wallHeight / 2, 0);

    // Pillars / Cover Columns
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.3 });
    ARENA_PILLARS.forEach((p) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.6, 9, 16), coverMat);
      pillar.position.set(p.x, 4.5, p.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.collidables.push(pillar);
      this.obstacleMeshes.push(pillar);
    });

    // Central Platform
    const centerPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(18, 2, 18),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    centerPlatform.position.set(0, 1, 0);
    centerPlatform.receiveShadow = true;
    centerPlatform.castShadow = true;
    this.scene.add(centerPlatform);
    this.collidables.push(centerPlatform);
    this.obstacleMeshes.push(centerPlatform);
  }

  // ============================================================================
  // PLAYER 3D VISUALS (1ST & 3RD PERSON AVATAR)
  // ============================================================================
  setupPlayerVisuals() {
    const fpsGunGroup = new THREE.Group();
    const gunBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const gunBarrelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.1 });
    const inkTankMat = new THREE.MeshStandardMaterial({
      color: PALETTE[0].num,
      emissive: PALETTE[0].num,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 16), gunBarrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -0.3);
    fpsGunGroup.add(barrel);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.4), gunBodyMat);
    body.position.set(0, -0.04, -0.1);
    fpsGunGroup.add(body);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.1), gunBodyMat);
    grip.position.set(0, -0.18, 0);
    grip.rotation.x = -0.3;
    fpsGunGroup.add(grip);

    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 16), inkTankMat);
    tank.position.set(0, 0.12, -0.1);
    fpsGunGroup.add(tank);
    this.player.fpsGunTank = tank;

    fpsGunGroup.position.set(0.32, -0.28, -0.55);
    this.camera.add(fpsGunGroup);
    this.scene.add(this.camera);
    this.player.fpsGun = fpsGunGroup;

    // Third Person 3D Avatar
    const avatar = new THREE.Group();
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.7,
      roughness: 0.1
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), armorMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    avatar.add(torso);

    const backTank = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 16), inkTankMat.clone());
    backTank.position.set(0, 1.1, -0.42);
    backTank.castShadow = true;
    avatar.add(backTank);
    this.player.avatarTank = backTank;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), armorMat);
    head.position.y = 1.85;
    head.castShadow = true;
    avatar.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.2), visorMat);
    visor.position.set(0, 1.85, 0.28);
    avatar.add(visor);

    const legGeo = new THREE.BoxGeometry(0.3, 0.85, 0.35);
    const legL = new THREE.Mesh(legGeo, armorMat);
    legL.position.set(-0.25, 0.42, 0);
    legL.castShadow = true;
    avatar.add(legL);

    const legR = new THREE.Mesh(legGeo, armorMat);
    legR.position.set(0.25, 0.42, 0);
    legR.castShadow = true;
    avatar.add(legR);

    this.player.avatarLegL = legL;
    this.player.avatarLegR = legR;

    const gunClone = fpsGunGroup.clone();
    gunClone.scale.set(1.4, 1.4, 1.4);
    gunClone.position.set(0.45, 1.1, 0.5);
    avatar.add(gunClone);
    this.player.avatarGun = gunClone;

    avatar.visible = false;
    this.scene.add(avatar);
    this.player.avatar = avatar;
  }

  // ============================================================================
  // SMART 1V1 RIVAL OPERATIVE
  // ============================================================================
  setupRivalVisuals() {
    const group = new THREE.Group();
    const rivalArmor = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
    const rivalVisor = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const rivalTrim = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.2, 0.55), rivalArmor);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    // Gold shoulder pads
    const padL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.4), rivalTrim);
    padL.position.set(-0.58, 1.5, 0);
    group.add(padL);
    const padR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.4), rivalTrim);
    padR.position.set(0.58, 1.5, 0);
    group.add(padR);

    // Backpack with dual glowing crimson canisters
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.7 });
    const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 16), tankMat);
    tank1.position.set(-0.2, 1.2, -0.42);
    group.add(tank1);
    const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 16), tankMat);
    tank2.position.set(0.2, 1.2, -0.42);
    group.add(tank2);

    // Head & Crimson Visor
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), rivalArmor);
    head.position.y = 1.95;
    head.castShadow = true;
    group.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.22), rivalVisor);
    visor.position.set(0, 1.95, 0.3);
    group.add(visor);

    // Animated Legs
    const legGeo = new THREE.BoxGeometry(0.32, 0.88, 0.36);
    const legL = new THREE.Mesh(legGeo, rivalArmor);
    legL.position.set(-0.26, 0.44, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, rivalArmor);
    legR.position.set(0.26, 0.44, 0);
    legR.castShadow = true;
    group.add(legR);

    // Tactical Paint Blaster
    const gunGroup = new THREE.Group();
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.85), new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9 }));
    rifle.position.set(0, 0, 0.2);
    gunGroup.add(rifle);
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16), tankMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0, 0.7);
    gunGroup.add(muzzle);

    gunGroup.position.set(0.48, 1.2, 0.4);
    group.add(gunGroup);

    // Floating 3D Overhead Health Bar & Nameplate Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 42;
    const spriteTex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, depthTest: false });
    const hpSprite = new THREE.Sprite(spriteMat);
    hpSprite.scale.set(2.4, 0.56, 1);
    hpSprite.position.set(0, 2.75, 0);
    group.add(hpSprite);

    group.position.set(0, 0, -26);
    this.scene.add(group);

    this.rival = {
      group,
      legL,
      legR,
      gunGroup,
      hpSprite,
      canvas,
      ctx: canvas.getContext('2d'),
      spriteTex,
      walkCycle: 0,
      maxHp: this.config.rivalHp,
      hp: this.config.rivalHp,
      state: 'SEEK_COVER', // 'SEEK_COVER', 'IN_COVER', 'PEEK_AND_FIRE', 'FLANK', 'DODGING'
      currentPillar: null,
      targetCoverPos: new THREE.Vector3(0, 0, -26),
      peekTimer: 0,
      peekDirection: 1, // 1 for right, -1 for left
      burstShotsRemaining: 0,
      burstTimer: 0,
      repositionTimer: 3.5,
      dodgeCooldown: 0,
      dodgeVelocity: new THREE.Vector3(),
      dodgeTimer: 0,
      timeInCover: 0,
      active: true,
      hitboxRadius: 1.4
    };
    this.updateRivalHpBar();
  }

  // ============================================================================
  // SHOOTING & COMBAT ACTIONS
  // ============================================================================
  shootPlayerPaintball() {
    if (!this.isPlaying) return;

    // Cannot shoot while actively reloading
    if (this.isReloading) {
      this.sound.playEmpty();
      return;
    }

    if (this.ink < this.config.inkCost) {
      this.sound.playEmpty();
      this.dom.reloadPrompt.classList.remove('hidden');
      return;
    }

    if (this.config.inkCost > 0) {
      this.ink = Math.max(0, this.ink - this.config.inkCost);
      this.updateInkBar();
      if (this.ink < this.config.inkCost) {
        this.dom.reloadPrompt.classList.remove('hidden');
      }
    }

    this.shotsFired++;
    this.sound.playPlayerShoot();
    this.player.gunRecoil = 0.15;

    const colorObj = PALETTE[this.currentColorIndex];
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    let startPos;
    if (this.cameraMode === 'first') {
      startPos = this.camera.position.clone();
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const down = new THREE.Vector3(0, -1, 0).applyQuaternion(this.camera.quaternion);
      startPos.add(right.multiplyScalar(0.28)).add(down.multiplyScalar(0.2));
    } else {
      startPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      startPos.add(direction.clone().multiplyScalar(0.8));
    }

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 12),
      new THREE.MeshStandardMaterial({
        color: colorObj.num,
        emissive: colorObj.num,
        emissiveIntensity: 0.6,
        roughness: 0.1
      })
    );
    ball.position.copy(startPos);
    this.scene.add(ball);

    this.playerProjectiles.push({
      mesh: ball,
      velocity: direction.multiplyScalar(70),
      prevPosition: startPos.clone(),
      color: colorObj,
      life: 2.5
    });
  }

  rivalFireBurstShot() {
    if (!this.rival || !this.rival.active) return;

    // Strict Line-of-Sight Check: Do NOT shoot if wall/pillar blocks the view!
    if (!this.hasLineOfSight(this.rival.group.position, this.player.position)) {
      return;
    }

    this.sound.playEnemyShoot();

    const startPos = this.rival.group.position.clone().add(new THREE.Vector3(0, 1.4, 0));

    // LEAD AIMING (Predict where player will be)
    const distToPlayer = startPos.distanceTo(this.player.position);
    const projectileSpeed = 55;
    const timeToTarget = distToPlayer / projectileSpeed;

    const predictedPlayerPos = this.player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    predictedPlayerPos.addScaledVector(this.player.velocity, timeToTarget * this.config.leadAccuracy);

    // Apply minor human-like spread based on difficulty
    const spread = (1.0 - this.config.leadAccuracy) * 1.5;
    predictedPlayerPos.x += (Math.random() - 0.5) * spread;
    predictedPlayerPos.y += (Math.random() - 0.5) * spread;
    predictedPlayerPos.z += (Math.random() - 0.5) * spread;

    const dir = predictedPlayerPos.sub(startPos).normalize();

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({
        color: ENEMY_PAINT.num,
        emissive: ENEMY_PAINT.num,
        emissiveIntensity: 0.8,
        roughness: 0.1
      })
    );
    ball.position.copy(startPos);
    this.scene.add(ball);

    this.enemyProjectiles.push({
      mesh: ball,
      velocity: dir.multiplyScalar(projectileSpeed),
      prevPosition: startPos.clone(),
      life: 2.6
    });
  }

  // ============================================================================
  // PAINT SPLATTERS (STRICT SOLID CONTACT ONLY)
  // ============================================================================
  createPaintSplatter(point, normal, colorObj, surfaceScale = 1.0) {
    this.sound.playSplat();

    const splatShape = new THREE.Shape();
    const pointsCount = 14;
    const baseRadius = 0.95 * surfaceScale;

    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2;
      const radiusVariance = (Math.sin(i * 3.7) * 0.4 + 0.6) * baseRadius;
      const px = Math.cos(angle) * radiusVariance;
      const py = Math.sin(angle) * radiusVariance;
      if (i === 0) splatShape.moveTo(px, py);
      else splatShape.lineTo(px, py);
    }
    splatShape.closePath();

    const splatGeo = new THREE.ShapeGeometry(splatShape);
    const splatMat = new THREE.MeshBasicMaterial({
      color: colorObj.num,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4
    });

    const splatMesh = new THREE.Mesh(splatGeo, splatMat);
    splatMesh.position.copy(point).add(normal.clone().multiplyScalar(0.04));

    const defaultNormal = new THREE.Vector3(0, 0, 1);
    const quat = new THREE.Quaternion();
    if (defaultNormal.dot(normal) < -0.9999) {
      quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    } else {
      quat.setFromUnitVectors(defaultNormal, normal);
    }
    splatMesh.quaternion.copy(quat);
    splatMesh.rotateZ(Math.random() * Math.PI * 2);

    this.scene.add(splatMesh);
    this.splatters.push(splatMesh);

    if (this.splatters.length > this.maxSplatters) {
      const oldest = this.splatters.shift();
      this.scene.remove(oldest);
      oldest.geometry.dispose();
      oldest.material.dispose();
    }

    this.createSplatterParticles(point, normal, colorObj, 14);
  }

  createSplatterParticles(point, normal, colorObj, count = 16) {
    for (let i = 0; i < count; i++) {
      const pGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({ color: colorObj.num });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(point);

      const vel = normal.clone().multiplyScalar(4 + Math.random() * 6);
      vel.x += (Math.random() - 0.5) * 8;
      vel.y += (Math.random() - 0.5) * 8;
      vel.z += (Math.random() - 0.5) * 8;

      this.scene.add(pMesh);
      this.particles.push({ mesh: pMesh, vel, life: 0.6 + Math.random() * 0.4 });
    }
  }

  damagePlayer(amount) {
    this.health = Math.max(0, this.health - amount);
    this.sound.playPlayerHurt();

    const pct = Math.round((this.health / this.maxHealth) * 100);
    this.dom.healthBar.style.width = `${pct}%`;
    this.dom.healthDisplay.textContent = `${this.health} HP`;

    if (pct < 30) {
      this.dom.healthBar.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
      this.dom.healthDisplay.style.color = '#ef4444';
    } else {
      this.dom.healthBar.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      this.dom.healthDisplay.style.color = '#34d399';
    }

    this.dom.damageOverlay.classList.add('active');
    setTimeout(() => {
      this.dom.damageOverlay.classList.remove('active');
    }, 220);

    if (this.health <= 0) {
      this.endGame(false, 'OUTPLAYED BY THE RIVAL OPERATIVE!');
    }
  }

  showHitmarker() {
    this.dom.hitmarker.classList.remove('hidden');
    this.dom.hitmarker.classList.add('active');
    setTimeout(() => {
      this.dom.hitmarker.classList.remove('active');
      this.dom.hitmarker.classList.add('hidden');
    }, 120);
  }

  // ============================================================================
  // SMART AI REASONING (COVER, LINE-OF-SIGHT & DODGE)
  // ============================================================================
  hasLineOfSight(posA, posB) {
    const origin = posA.clone().add(new THREE.Vector3(0, 1.4, 0));
    const target = posB.clone().add(new THREE.Vector3(0, 1.4, 0));
    const toTarget = target.clone().sub(origin);
    const dist = toTarget.length();
    if (dist < 0.2) return true;
    toTarget.normalize();

    // Start 0.4 units forward along direction to avoid self-clipping with current cover pillar
    const start = origin.clone().add(toTarget.clone().multiplyScalar(0.4));
    const ray = new THREE.Raycaster(start, toTarget, 0.1, Math.max(0.1, dist - 0.7));
    const hits = ray.intersectObjects(this.obstacleMeshes);
    return hits.length === 0;
  }

  findBestCover() {
    let bestPillar = null;
    let bestCoverPos = null;
    let minScore = Infinity;

    const rivalPos = this.rival.group.position;
    const playerPos = this.player.position;

    ARENA_PILLARS.forEach((p) => {
      const pillarVec = new THREE.Vector3(p.x, 0, p.z);
      // Vector from player through pillar to the safe side
      const awayFromPlayer = pillarVec.clone().sub(playerPos);
      awayFromPlayer.y = 0;
      awayFromPlayer.normalize();

      const candidatePos = pillarVec.clone().add(awayFromPlayer.multiplyScalar(3.4));

      // Distance from rival to this cover
      const distFromRival = rivalPos.distanceTo(candidatePos);
      // Distance from player to pillar (don't pick a pillar the player is standing next to)
      const distFromPlayer = playerPos.distanceTo(pillarVec);

      if (distFromPlayer < 8) return; // Unsafe

      // Prefer closer pillars with solid occlusion
      const score = distFromRival - (distFromPlayer * 0.4);
      if (score < minScore) {
        minScore = score;
        bestPillar = p;
        bestCoverPos = candidatePos;
      }
    });

    return { pillar: bestPillar, position: bestCoverPos || rivalPos.clone() };
  }

  updateRivalAI(delta) {
    if (!this.rival || !this.rival.active) return;
    const r = this.rival;
    const playerPos = this.player.position;
    const rivalPos = r.group.position;

    // Face towards Player
    const toPlayer = playerPos.clone().sub(rivalPos);
    toPlayer.y = 0;
    if (toPlayer.lengthSq() > 0.1) {
      r.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }

    // Aim gun pitch towards player
    const distXZ = Math.hypot(toPlayer.x, toPlayer.z);
    const deltaY = (playerPos.y + 1.2) - (rivalPos.y + 1.2);
    const pitchAngle = Math.atan2(deltaY, distXZ);
    r.gunGroup.rotation.x = -pitchAngle;

    // Active Line-of-Sight status
    const canSeePlayer = this.hasLineOfSight(rivalPos, playerPos);

    // 1. PREDICTIVE DODGE CHECK (Incoming player paintballs)
    r.dodgeCooldown = Math.max(0, r.dodgeCooldown - delta);
    if (r.dodgeCooldown <= 0 && this.playerProjectiles.length > 0) {
      for (let i = 0; i < this.playerProjectiles.length; i++) {
        const proj = this.playerProjectiles[i];
        const toRival = rivalPos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(proj.mesh.position);
        const dist = toRival.length();

        if (dist < 18) {
          const projDir = proj.velocity.clone().normalize();
          const dot = toRival.clone().normalize().dot(projDir);

          if (dot > 0.88) {
            // Incoming shot on collision course! Check dodge probability
            if (Math.random() < this.config.dodgeChance) {
              const dodgeSide = (Math.random() > 0.5 ? 1 : -1);
              const dodgeDir = new THREE.Vector3(-projDir.z, 0, projDir.x).multiplyScalar(dodgeSide);
              r.dodgeVelocity.copy(dodgeDir.multiplyScalar(22));
              r.dodgeTimer = 0.22;
              r.dodgeCooldown = 1.6;
              this.sound.playDodgeWhoosh();
              this.createSplatterParticles(rivalPos.clone().add(new THREE.Vector3(0, 1.0, 0)), dodgeDir, ENEMY_PAINT, 8);
              this.dom.aiStatusText.textContent = 'DODGED SHOT!';
              this.dom.aiStatusText.style.color = '#38bdf8';
              break;
            }
          }
        }
      }
    }

    // Handle Active Dodge Impulse
    if (r.dodgeTimer > 0) {
      r.dodgeTimer -= delta;
      rivalPos.addScaledVector(r.dodgeVelocity, delta);
      r.dodgeVelocity.multiplyScalar(0.85);
    }

    // Insane Mode Shield Regen in Cover
    if (this.config.shieldRegen && r.state === 'IN_COVER' && r.hp < r.maxHp) {
      r.timeInCover += delta;
      if (r.timeInCover > 4.0) {
        r.hp = Math.min(r.maxHp, r.hp + delta * 1.5);
        this.updateRivalHpBar();
      }
    } else {
      r.timeInCover = 0;
    }

    // 2. STATE MACHINE
    let isMoving = false;

    switch (r.state) {
      case 'SEEK_COVER': {
        this.dom.aiStatusText.textContent = 'SEEKING COVER';
        this.dom.aiStatusText.style.color = '#38bdf8';

        if (!r.targetCoverPos) {
          const cover = this.findBestCover();
          r.currentPillar = cover.pillar;
          r.targetCoverPos = cover.position;
        }

        const toCover = r.targetCoverPos.clone().sub(rivalPos);
        toCover.y = 0;
        const distToCover = toCover.length();

        if (distToCover > 1.0) {
          isMoving = true;
          toCover.normalize();
          rivalPos.addScaledVector(toCover, this.config.rivalSpeed * delta);
        } else {
          // Arrived in cover
          r.state = 'IN_COVER';
          r.peekTimer = this.config.peekReaction;
          r.peekDirection = (Math.random() > 0.5 ? 1 : -1);
          r.peekSearchTime = 0;
        }
        break;
      }

      case 'IN_COVER': {
        this.dom.aiStatusText.textContent = 'CONCEALED IN COVER';
        this.dom.aiStatusText.style.color = '#4ade80';

        r.peekTimer -= delta;
        if (r.peekTimer <= 0) {
          r.state = 'PEEK_AND_FIRE';
          r.burstShotsRemaining = this.config.burstCount;
          r.burstTimer = 0.05;
          r.peekSearchTime = 0;
        }
        break;
      }

      case 'PEEK_AND_FIRE': {
        // Step out to the side of the pillar to get line-of-sight
        if (!canSeePlayer) {
          isMoving = true;
          this.dom.aiStatusText.textContent = 'PEEKING CORNER';
          this.dom.aiStatusText.style.color = '#f59e0b';
          const peekVec = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize().multiplyScalar(r.peekDirection);
          rivalPos.addScaledVector(peekVec, this.config.rivalSpeed * 0.9 * delta);

          // If peeking for more than 1.1s without visual, give up and flank
          r.peekSearchTime = (r.peekSearchTime || 0) + delta;
          if (r.peekSearchTime > 1.1) {
            r.peekSearchTime = 0;
            r.state = 'FLANK';
            r.repositionTimer = 2.2;
          }
          break; // STRICT: NEVER shoot while blocked by walls!
        }

        // Line-of-sight is CLEAR and confirmed
        r.peekSearchTime = 0;
        this.dom.aiStatusText.textContent = 'PEEKING & FIRING';
        this.dom.aiStatusText.style.color = '#ff0055';

        // Fire Burst
        r.burstTimer -= delta;
        if (r.burstTimer <= 0 && r.burstShotsRemaining > 0) {
          this.rivalFireBurstShot();
          r.burstShotsRemaining--;
          r.burstTimer = this.config.burstDelay;

          if (r.burstShotsRemaining <= 0) {
            // Burst finished -> Duck back into cover or flank
            if (Math.random() < 0.45) {
              r.state = 'FLANK';
              r.repositionTimer = 2.4;
            } else {
              r.state = 'SEEK_COVER';
              r.targetCoverPos = null;
            }
          }
        }
        break;
      }

      case 'FLANK': {
        this.dom.aiStatusText.textContent = 'FLANKING MANEUVER';
        this.dom.aiStatusText.style.color = '#f59e0b';

        r.repositionTimer -= delta;
        isMoving = true;

        // Circle around the arena to flank
        const flankVec = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize().multiplyScalar(r.peekDirection);
        rivalPos.addScaledVector(flankVec, this.config.rivalSpeed * 1.15 * delta);

        if (canSeePlayer) {
          // Visual acquired while flanking! Stop and open fire
          r.state = 'PEEK_AND_FIRE';
          r.burstShotsRemaining = this.config.burstCount;
          r.burstTimer = 0.05;
          r.peekSearchTime = 0;
        } else if (r.repositionTimer <= 0) {
          // Reposition completed, take fresh cover
          r.state = 'SEEK_COVER';
          r.targetCoverPos = null;
        }
        break;
      }
    }

    // Leg running animation
    if (isMoving) {
      r.walkCycle += delta * 14;
      r.legL.rotation.x = Math.sin(r.walkCycle) * 0.65;
      r.legR.rotation.x = -Math.sin(r.walkCycle) * 0.65;
    } else {
      r.legL.rotation.x = 0;
      r.legR.rotation.x = 0;
    }

    // === SOLID ARENA BOUNDARY & OBSTACLE COLLISIONS FOR RIVAL ===
    const arenaBound = 38.5;
    rivalPos.x = Math.max(-arenaBound, Math.min(arenaBound, rivalPos.x));
    rivalPos.z = Math.max(-arenaBound, Math.min(arenaBound, rivalPos.z));

    ARENA_PILLARS.forEach((p) => {
      const dx = rivalPos.x - p.x;
      const dz = rivalPos.z - p.z;
      const dist = Math.hypot(dx, dz);
      const minDist = 3.3;
      if (dist < minDist && dist > 0.001) {
        const overlap = minDist - dist;
        rivalPos.x += (dx / dist) * overlap;
        rivalPos.z += (dz / dist) * overlap;
      }
    });

    const platHalf = 9.8;
    if (Math.abs(rivalPos.x) < platHalf && Math.abs(rivalPos.z) < platHalf) {
      const ox = platHalf - Math.abs(rivalPos.x);
      const oz = platHalf - Math.abs(rivalPos.z);
      if (ox < oz) rivalPos.x = Math.sign(rivalPos.x) * platHalf;
      else rivalPos.z = Math.sign(rivalPos.z) * platHalf;
    }
  }

  updateRivalHpBar() {
    if (!this.rival) return;
    const pct = Math.max(0, Math.round((this.rival.hp / this.rival.maxHp) * 100));
    this.dom.rivalHpBar.style.width = `${pct}%`;
    this.dom.rivalHpText.textContent = `${pct}% HP`;

    // Update 3D overhead sprite canvas
    if (this.rival.ctx && this.rival.canvas) {
      const { ctx, canvas, spriteTex } = this.rival;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      // Label
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`RIVAL [${this.rival.hp} / ${this.rival.maxHp}]`, canvas.width / 2, 16);

      // Fill Bar
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(4, 22, (canvas.width - 8) * (pct / 100), 15);

      spriteTex.needsUpdate = true;
    }
  }

  // ============================================================================
  // PROJECTILES & COLLISIONS
  // ============================================================================
  updateProjectiles(delta) {
    const raycaster = new THREE.Raycaster();

    // 1. Player Projectiles
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];
      p.life -= delta;
      p.velocity.y -= 9.8 * delta;

      p.prevPosition.copy(p.mesh.position);
      const moveStep = p.velocity.clone().multiplyScalar(delta);
      const nextPos = p.mesh.position.clone().add(moveStep);
      const stepDist = p.prevPosition.distanceTo(nextPos);
      const stepDir = p.velocity.clone().normalize();

      raycaster.set(p.prevPosition, stepDir);
      raycaster.far = stepDist + 0.1;

      let hitDetected = false;

      // Hit Check on Rival Operative
      if (this.rival && this.rival.active) {
        const dist = nextPos.distanceTo(this.rival.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
        if (dist <= this.rival.hitboxRadius) {
          hitDetected = true;
          this.shotsHit++;
          this.showHitmarker();
          this.sound.playHit();

          this.rival.hp--;
          this.updateRivalHpBar();

          // Under fire: force rival to immediately seek new cover!
          this.rival.state = 'SEEK_COVER';
          this.rival.targetCoverPos = null;

          if (this.rival.hp <= 0) {
            // Defeated!
            this.createSplatterParticles(this.rival.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), new THREE.Vector3(0, 1, 0), p.color, 35);

            // Raycast down to place paint puddle on the ground
            const floorRay = new THREE.Raycaster(
              this.rival.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
              new THREE.Vector3(0, -1, 0),
              0,
              10
            );
            const floorHits = floorRay.intersectObjects(this.collidables);
            if (floorHits.length > 0) {
              this.createPaintSplatter(floorHits[0].point, new THREE.Vector3(0, 1, 0), p.color, 2.5);
            }

            this.rival.group.visible = false;
            this.rival.active = false;
            this.score += Math.round(500 * this.config.scoreMultiplier);
            this.endGame(true, 'RIVAL OPERATIVE DEFEATED IN 1V1 DUEL!');
          } else {
            this.createSplatterParticles(nextPos, stepDir.clone().negate(), p.color, 16);
          }
        }
      }

      // Hit Check on Arena Walls/Floor/Pillars
      if (!hitDetected) {
        const hits = raycaster.intersectObjects(this.collidables);
        if (hits.length > 0) {
          const hit = hits[0];
          hitDetected = true;
          const hitNormal = hit.face ? hit.face.normal.clone().applyQuaternion(hit.object.quaternion) : new THREE.Vector3(0, 1, 0);
          this.createPaintSplatter(hit.point, hitNormal, p.color);
        }
      }

      if (hitDetected || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.playerProjectiles.splice(i, 1);
      } else {
        p.mesh.position.copy(nextPos);
      }
    }

    // 2. Enemy Projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.life -= delta;
      p.velocity.y -= 7.0 * delta;

      p.prevPosition.copy(p.mesh.position);
      const moveStep = p.velocity.clone().multiplyScalar(delta);
      const nextPos = p.mesh.position.clone().add(moveStep);
      const stepDist = p.prevPosition.distanceTo(nextPos);
      const stepDir = p.velocity.clone().normalize();

      raycaster.set(p.prevPosition, stepDir);
      raycaster.far = stepDist + 0.1;

      let hitDetected = false;

      // Hit Check on Player
      const distToPlayer = nextPos.distanceTo(this.player.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
      if (distToPlayer <= this.player.radius + 0.4) {
        hitDetected = true;
        this.damagePlayer(this.config.enemyDmg);
        this.createSplatterParticles(this.player.position.clone().add(new THREE.Vector3(0, 1.0, 0)), stepDir.clone().negate(), ENEMY_PAINT, 16);
      }

      // Hit Check on Environment
      if (!hitDetected) {
        const hits = raycaster.intersectObjects(this.collidables);
        if (hits.length > 0) {
          const hit = hits[0];
          hitDetected = true;
          const hitNormal = hit.face ? hit.face.normal.clone().applyQuaternion(hit.object.quaternion) : new THREE.Vector3(0, 1, 0);
          this.createPaintSplatter(hit.point, hitNormal, ENEMY_PAINT);
        }
      }

      if (hitDetected || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.enemyProjectiles.splice(i, 1);
      } else {
        p.mesh.position.copy(nextPos);
      }
    }
  }

  // ============================================================================
  // PLAYER MOVEMENT & SOLID COLLISIONS
  // ============================================================================
  updatePlayer(delta) {
    if (!this.isPlaying || !this.isPointerLocked) return;

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW']) moveDir.z -= 1;
    if (this.keys['KeyS']) moveDir.z += 1;
    if (this.keys['KeyA']) moveDir.x -= 1;
    if (this.keys['KeyD']) moveDir.x += 1;
    moveDir.normalize();

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);

    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const currentSpeed = this.player.speed * (isSprinting ? this.player.sprintMultiplier : 1.0);

    const wishVel = new THREE.Vector3();
    wishVel.addScaledVector(forward, -moveDir.z * currentSpeed);
    wishVel.addScaledVector(right, moveDir.x * currentSpeed);

    this.player.velocity.x = wishVel.x;
    this.player.velocity.z = wishVel.z;

    // Platform ground elevation
    let groundElevation = 0;
    const isAbovePlatform = (Math.abs(this.player.position.x) < 8.9 && Math.abs(this.player.position.z) < 8.9);
    if (isAbovePlatform && this.player.position.y >= 2.0 + this.player.height - 0.4) {
      groundElevation = 2.0;
    }

    if (this.keys['Space'] && this.player.isGrounded) {
      this.player.velocity.y = this.player.jumpForce;
      this.player.isGrounded = false;
    }

    this.player.velocity.y -= this.player.gravity * delta;
    this.player.position.addScaledVector(this.player.velocity, delta);

    const minStandingHeight = groundElevation + this.player.height;
    if (this.player.position.y <= minStandingHeight) {
      this.player.position.y = minStandingHeight;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    }

    // === SOLID WALL COLLISIONS ===
    const playerRadius = this.player.radius;

    // 1. Perimeter Walls
    const maxBound = 40.5 - playerRadius;
    this.player.position.x = Math.max(-maxBound, Math.min(maxBound, this.player.position.x));
    this.player.position.z = Math.max(-maxBound, Math.min(maxBound, this.player.position.z));

    // 2. Pillars
    const minPillarDist = 2.5 + playerRadius;
    ARENA_PILLARS.forEach((col) => {
      const dx = this.player.position.x - col.x;
      const dz = this.player.position.z - col.z;
      const dist = Math.hypot(dx, dz);
      if (dist < minPillarDist && dist > 0.001) {
        const overlap = minPillarDist - dist;
        this.player.position.x += (dx / dist) * overlap;
        this.player.position.z += (dz / dist) * overlap;
      }
    });

    // 3. Central Platform Sides
    if (this.player.position.y < 2.0 + this.player.height - 0.2) {
      const platHalf = 9.0 + playerRadius;
      if (Math.abs(this.player.position.x) < platHalf && Math.abs(this.player.position.z) < platHalf) {
        const ox = platHalf - Math.abs(this.player.position.x);
        const oz = platHalf - Math.abs(this.player.position.z);
        if (ox < oz) this.player.position.x = Math.sign(this.player.position.x) * platHalf;
        else this.player.position.z = Math.sign(this.player.position.z) * platHalf;
      }
    }

    // Avatar animations
    if (this.player.avatar) {
      this.player.avatar.position.set(this.player.position.x, this.player.position.y - this.player.height, this.player.position.z);
      this.player.avatar.rotation.y = this.player.yaw;

      if (moveDir.lengthSq() > 0.01) {
        this.player.walkCycle += delta * 12;
        this.player.avatarLegL.rotation.x = Math.sin(this.player.walkCycle) * 0.65;
        this.player.avatarLegR.rotation.x = -Math.sin(this.player.walkCycle) * 0.65;
      } else {
        this.player.avatarLegL.rotation.x = 0;
        this.player.avatarLegR.rotation.x = 0;
      }

      if (this.player.avatarGun) {
        this.player.avatarGun.rotation.x = this.player.pitch;
      }
    }

    // Camera
    if (this.cameraMode === 'first') {
      this.camera.position.copy(this.player.position);
      this.camera.rotation.set(this.player.pitch, this.player.yaw, 0);

      if (this.player.fpsGun) {
        this.player.gunRecoil = Math.max(0, this.player.gunRecoil - delta * 1.5);
        this.player.fpsGun.position.set(0.32, -0.28, -0.55 + this.player.gunRecoil);
      }
    } else {
      const camOffset = new THREE.Vector3(0.9, 1.8, 3.8);
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);

      const targetCamPos = this.player.position.clone().add(camOffset);
      targetCamPos.y += Math.sin(this.player.pitch) * 1.2;

      const camRay = new THREE.Raycaster(this.player.position, targetCamPos.clone().sub(this.player.position).normalize());
      camRay.far = camOffset.length();
      const hits = camRay.intersectObjects(this.collidables);
      if (hits.length > 0) {
        this.camera.position.copy(hits[0].point.clone().sub(camRay.ray.direction.multiplyScalar(0.2)));
      } else {
        this.camera.position.copy(targetCamPos);
      }

      this.camera.rotation.set(this.player.pitch, this.player.yaw, 0);
    }

    // Auto Ink refill (gradual passive regen: 4.5% per second)
    if (this.config.autoReload && !this.isReloading && this.ink < 100) {
      this.ink = Math.min(100, this.ink + 4.5 * delta);
      this.updateInkBar();
    }
  }

  refillInk() {
    if (this.ink >= 100 || this.isReloading) return;
    this.isReloading = true;
    this.sound.playReload();
    this.dom.reloadPrompt.classList.remove('hidden');

    const reloadDuration = 2200; // 2.2 seconds (slower, tactical reload)
    const startTime = performance.now();
    const startInk = this.ink;

    if (this.reloadInterval) clearInterval(this.reloadInterval);
    this.reloadInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / reloadDuration);
      this.ink = startInk + (100 - startInk) * progress;
      this.updateInkBar();

      const remainingSec = Math.max(0, (reloadDuration - elapsed) / 1000).toFixed(1);
      this.dom.reloadPrompt.textContent = `RECHARGING INK (${remainingSec}s)...`;

      if (progress >= 1.0) {
        clearInterval(this.reloadInterval);
        this.reloadInterval = null;
        this.ink = 100;
        this.isReloading = false;
        this.updateInkBar();
        this.dom.reloadPrompt.classList.add('hidden');
        this.dom.reloadPrompt.textContent = 'PRESS [R] OR WAIT TO REFILL';
      }
    }, 40);
  }

  updateInkBar() {
    const pct = Math.round(this.ink);
    this.dom.inkBar.style.width = `${pct}%`;
    this.dom.inkPercent.textContent = `${pct}%`;

    if (this.ink >= this.config.inkCost && !this.isReloading) {
      this.dom.reloadPrompt.classList.add('hidden');
    }
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================
  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key) - 1;
        if (idx < PALETTE.length) this.selectColor(idx);
      }

      if (e.code === 'KeyV' || e.code === 'KeyC') {
        this.toggleCameraMode();
      }

      if (e.code === 'KeyR') {
        this.refillInk();
      }

      if (e.code === 'Escape' && this.isPlaying) {
        document.exitPointerLock();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === document.body);
      if (!this.isPointerLocked && this.isPlaying) {
        this.dom.startMenu.classList.remove('hidden');
        this.dom.playBtn.textContent = 'RESUME DUEL';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sensitivity = 0.0022;
      this.player.yaw -= e.movementX * sensitivity;
      this.player.pitch -= e.movementY * sensitivity;

      const maxPitch = Math.PI / 2 - 0.08;
      this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.isPointerLocked) {
        this.shootPlayerPaintball();
      }
    });

    window.addEventListener('wheel', (e) => {
      if (!this.isPointerLocked) return;
      if (e.deltaY > 0) {
        this.selectColor((this.currentColorIndex + 1) % PALETTE.length);
      } else {
        this.selectColor((this.currentColorIndex - 1 + PALETTE.length) % PALETTE.length);
      }
    });

    this.dom.diffButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setDifficulty(btn.getAttribute('data-diff'));
      });
    });

    this.dom.playBtn.addEventListener('click', () => {
      this.sound.init();
      if (!this.isPlaying) {
        this.startGame();
      } else {
        this.resumeGame();
      }
    });

    this.dom.restartBtn.addEventListener('click', () => {
      this.dom.gameOverModal.classList.add('hidden');
      this.startGame();
    });

    this.dom.changeDiffBtn.addEventListener('click', () => {
      this.dom.gameOverModal.classList.add('hidden');
      this.dom.startMenu.classList.remove('hidden');
      this.dom.playBtn.textContent = 'ENTER 1V1 DUEL';
    });

    this.dom.audioToggle.addEventListener('click', () => {
      this.sound.enabled = !this.sound.enabled;
      this.dom.audioToggle.textContent = this.sound.enabled ? '🔊' : '🔇';
    });
  }

  // ============================================================================
  // GAME LIFECYCLE
  // ============================================================================
  setDifficulty(diffKey) {
    if (!DIFFICULTY_CONFIG[diffKey]) return;
    this.currentDifficulty = diffKey;
    this.config = DIFFICULTY_CONFIG[diffKey];

    this.dom.diffButtons.forEach((b) => {
      if (b.getAttribute('data-diff') === diffKey) b.classList.add('active');
      else b.classList.remove('active');
    });

    this.dom.diffBadge.textContent = this.config.label;
    this.dom.diffBadge.style.color = this.config.badgeColor;
    this.dom.diffBadge.style.textShadow = `0 0 10px ${this.config.badgeColor}`;
  }

  startGame() {
    this.sound.init();
    this.isPlaying = true;
    this.score = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.timeLeft = this.config.timeLimit;
    this.maxHealth = this.config.playerHp;
    this.health = this.maxHealth;
    this.ink = 100;

    this.dom.score.textContent = '0';
    this.dom.timer.textContent = this.timeLeft;
    this.dom.healthBar.style.width = '100%';
    this.dom.healthDisplay.textContent = `${this.health} HP`;
    this.dom.healthBar.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
    this.dom.healthDisplay.style.color = '#34d399';

    // Reset Player
    this.player.position.set(0, 1.8, 25);
    this.player.velocity.set(0, 0, 0);
    this.player.yaw = 0;
    this.player.pitch = 0;

    // Reset Rival
    if (this.rival) {
      this.rival.active = true;
      this.rival.group.visible = true;
      if (!this.scene.children.includes(this.rival.group)) {
        this.scene.add(this.rival.group);
      }
      this.rival.maxHp = this.config.rivalHp;
      this.rival.hp = this.config.rivalHp;
      this.rival.group.position.set(0, 0, -26);
      this.rival.state = 'SEEK_COVER';
      this.rival.targetCoverPos = null;
      this.rival.dodgeCooldown = 0;
      this.rival.dodgeTimer = 0;
      this.rival.timeInCover = 0;
      this.updateRivalHpBar();
    }

    // Clear projectiles & particles
    this.playerProjectiles.forEach(p => this.scene.remove(p.mesh));
    this.playerProjectiles = [];
    this.enemyProjectiles.forEach(p => this.scene.remove(p.mesh));
    this.enemyProjectiles = [];
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];

    this.updateInkBar();

    this.dom.startMenu.classList.add('hidden');
    this.dom.gameOverModal.classList.add('hidden');
    this.dom.hud.classList.remove('hidden');

    document.body.requestPointerLock();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isPlaying || !this.isPointerLocked) return;
      this.timeLeft--;
      this.dom.timer.textContent = this.timeLeft;
      if (this.timeLeft <= 0) {
        this.endGame(false, 'TIME EXPIRED! DUEL DRAW.');
      }
    }, 1000);
  }

  resumeGame() {
    this.dom.startMenu.classList.add('hidden');
    document.body.requestPointerLock();
  }

  endGame(isVictory, message = '') {
    this.isPlaying = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    document.exitPointerLock();

    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;

    this.dom.hud.classList.add('hidden');
    this.dom.gameOverModal.classList.remove('hidden');

    if (isVictory) {
      this.dom.resultTitle.textContent = 'VICTORY!';
      this.dom.resultTitle.style.color = '#38bdf8';
      this.dom.resultSubtitle.textContent = message || `Rival outplayed with ${this.timeLeft}s left on the clock!`;
      this.score += this.timeLeft * 30;
    } else {
      this.dom.resultTitle.textContent = 'DEFEAT!';
      this.dom.resultTitle.style.color = '#ef4444';
      this.dom.resultSubtitle.textContent = message || 'You were defeated by the rival operative!';
    }

    this.dom.finalScore.textContent = this.score;
    this.dom.finalSplats.textContent = isVictory ? 'SPLATTERED' : 'SURVIVED';
    this.dom.finalAccuracy.textContent = `${accuracy}% (${this.shotsHit}/${this.shotsFired})`;
    this.dom.finalDiff.textContent = this.config.label;
    this.dom.finalDiff.style.color = this.config.badgeColor;
  }

  // ============================================================================
  // MAIN ANIMATION LOOP
  // ============================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayer(delta);
    this.updateRivalAI(delta);
    this.updateProjectiles(delta);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life -= delta;
      part.vel.y -= 18 * delta;
      part.mesh.position.addScaledVector(part.vel, delta);
      part.mesh.scale.multiplyScalar(0.96);

      if (part.life <= 0 || part.mesh.position.y < 0) {
        this.scene.remove(part.mesh);
        part.mesh.geometry.dispose();
        part.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new SplatArenaGame();
});
