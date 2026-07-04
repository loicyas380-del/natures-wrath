/* ============================================
   THE FORGOTTEN HOUSE - Moteur de Jeu 3D
   Jeu d'horreur FPS — Style Granny original
   Three.js r128 — Aucune dependance externe
   ============================================ */

// ============================================
// SECTION 1: CONFIGURATION & CONSTANTS
// ============================================
const CONFIG = {
    WORLD: { GRAVITY: -20, PLAYER_HEIGHT: 1.7, PLAYER_RADIUS: 0.35, CROUCH_HEIGHT: 0.9 },
    PLAYER: { SPEED: 3.5, SPRINT_MULT: 1.7, SPRINT_DRAIN: 15, STAMINA_REGEN: 8, JUMP_FORCE: 6, MOUSE_SENS: 0.002 },
    ENEMY: { SPEED_PATROL: 1.8, SPEED_CHASE: 4.2, SPEED_SEARCH: 2.5, DETECT_RANGE: 14, HEAR_RANGE: 10, HEAR_RUN: 18, CHASE_TIMEOUT: 8, SEARCH_TIME: 12 },
    ITEMS: {
        CELLAR_KEY:  { id: 'cellar_key',  name: 'Cle de la cave',      icon: '🔑', color: 0x886633 },
        BEDROOM_KEY: { id: 'bedroom_key', name: 'Cle de la chambre',   icon: '🗝️', color: 0x6688aa },
        BASEMENT_KEY:{ id: 'basement_key',name: 'Cle du sous-sol',     icon: '🔑', color: 0xaa4444 },
        WIRE_CUTTER:{ id: 'wire_cutter', name: 'Coupe-fil',            icon: '✂️', color: 0x888888 },
        GEN_PART1:  { id: 'gen_part1',   name: 'Piece generateur (1)', icon: '⚙️', color: 0xaaaaaa },
        GEN_PART2:  { id: 'gen_part2',   name: 'Piece generateur (2)', icon: '⚙️', color: 0x999999 },
        FLASHLIGHT:{ id: 'flashlight',  name: 'Lampe torche',         icon: '🔦', color: 0xffff88 },
        CROWBAR:    { id: 'crowbar',     name: 'Pied-de-biche',       icon: '🔧', color: 0xcc6633 },
        MASTER_KEY: { id: 'master_key',  name: 'Passe-partout',       icon: '🗝️', color: 0xdddd44 },
        FINAL_KEY:  { id: 'final_key',   name: 'Cle de sortie',       icon: '🔑', color: 0xff4444 },
        MEDKIT:     { id: 'medkit',      name: 'Trousse de soin',     icon: '🩹', color: 0xff4444 },
    },
    DOORS: {
        CELLAR:   { id: 'door_cellar',   required: 'cellar_key',   name: 'Porte de la cave' },
        BEDROOM:  { id: 'door_bedroom',  required: 'bedroom_key',  name: 'Porte de la chambre' },
        BASEMENT: { id: 'door_basement', required: 'basement_key', name: 'Porte du sous-sol' },
        FRONT:    { id: 'door_front',    required: 'final_key',    name: 'Porte d\'entree' },
        SECRET:   { id: 'door_secret',   required: 'crowbar',      name: 'Passage secret' },
    }
};

// ============================================
// SECTION 2: ETAT DU JEU
// ============================================
let gameState = {
    running: false,
    paused: false,
    time: 0,
    dayTime: 0,
    startTime: 0,
    difficulty: 1,
    itemsCollected: 0,
    totalItems: 0,
    generatorFixed: false,
    alarmCut: false,
    doorsOpened: [],
    playerDead: false,
    hasWon: false,
};

let settings = {
    volume: 0.7,
    musicVolume: 0.5,
    sensitivity: 8,
    quality: 'medium',
};

// ============================================
// SECTION 3: SYSTEME AUDIO PROCEDURAL
// ============================================
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = settings.volume;
            this.masterGain.connect(this.ctx.destination);
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = settings.musicVolume;
            this.musicGain.connect(this.masterGain);
            this.initialized = true;
        } catch(e) { console.warn('Audio non disponible'); }
    }

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

    setVolume(v) { settings.volume = v; if (this.masterGain) this.masterGain.gain.value = v; }
    setMusicVolume(v) { settings.musicVolume = v; if (this.musicGain) this.musicGain.gain.value = v; }

    playTone(freq, duration, type, volume, detune) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        if (detune) osc.detune.value = detune;
        gain.gain.setValueAtTime((volume || 0.1) * settings.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, volume) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime((volume || 0.05) * settings.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }

    footstep(loud) {
        const vol = loud ? 0.12 : 0.04;
        this.playTone(80 + Math.random() * 40, 0.08, 'triangle', vol);
        this.playNoise(0.05, vol * 0.5);
    }

    doorOpen() {
        this.playTone(200, 0.3, 'sawtooth', 0.08);
        this.playTone(150, 0.4, 'square', 0.05);
    }

    doorLocked() {
        this.playTone(400, 0.1, 'square', 0.08);
        setTimeout(() => this.playTone(300, 0.1, 'square', 0.08), 120);
    }

    itemPickup() {
        this.playTone(600, 0.1, 'sine', 0.1);
        setTimeout(() => this.playTone(800, 0.15, 'sine', 0.1), 80);
        setTimeout(() => this.playTone(1000, 0.2, 'sine', 0.08), 160);
    }

    hit() {
        this.playTone(100, 0.3, 'sawtooth', 0.15);
        this.playNoise(0.2, 0.1);
    }

    ambientLoop() {
        if (!this.ctx || !gameState.running) return;
        this.playNoise(3, 0.02);
        this.playTone(55 + Math.random() * 10, 4, 'sine', 0.015);
        setTimeout(() => this.ambientLoop(), 3000 + Math.random() * 4000);
    }

    chaseMusic() {
        if (!this.ctx) return;
        const notes = [110, 130, 110, 146, 110, 130, 98, 110];
        notes.forEach((n, i) => {
            setTimeout(() => {
                if (gameState.running && !gameState.paused) {
                    this.playTone(n, 0.3, 'sawtooth', 0.06 * settings.musicVolume);
                    this.playTone(n * 0.5, 0.3, 'square', 0.03 * settings.musicVolume);
                }
            }, i * 250);
        });
    }

    heartbeat(rate) {
        if (!this.ctx) return;
        this.playTone(40, 0.15, 'sine', 0.12);
        setTimeout(() => this.playTone(35, 0.12, 'sine', 0.08), 150);
    }

    creak() {
        this.playTone(300 + Math.random() * 200, 0.2, 'sawtooth', 0.03);
    }

    enemyGrowl() {
        this.playTone(60, 0.5, 'sawtooth', 0.08);
        this.playTone(55, 0.6, 'square', 0.04);
    }
}

const audio = new AudioSystem();

// ============================================
// SECTION 4: THREE.JS — MOTEUR 3D
// ============================================
let scene, camera, renderer, clock;
let colliders = [];
let interactables = [];
let itemObjects = [];
let doorObjects = [];
let hidingSpots = [];
let waypointGroups = [];

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050208);
    scene.fog = new THREE.FogExp2(0x050208, 0.06);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, CONFIG.WORLD.PLAYER_HEIGHT, 0);

    const qualitySettings = {
        low:    { shadowMap: false, pixelsRatio: 0.75, shadows: false },
        medium: { shadowMap: true,  pixelsRatio: 1,    shadows: true  },
        high:   { shadowMap: true,  pixelsRatio: 1.5,  shadows: true  },
    };
    const qs = qualitySettings[settings.quality] || qualitySettings.medium;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: qs.shadowMap });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * qs.pixelsRatio, 2));
    renderer.shadowMap.enabled = qs.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;

    clock = new THREE.Clock();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ============================================
// SECTION 5: GENERATION DE LA MAISON
// ============================================
function createMaterial(color, opts) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });
}

function addBox(x, y, z, w, h, d, material, castsShadow, receiveShadow, name) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = !!castsShadow;
    mesh.receiveShadow = receiveShadow !== false;
    if (name) mesh.name = name;
    scene.add(mesh);
    return mesh;
}

function addCollider(x, y, z, w, h, d) {
    colliders.push({ min: { x: x-w/2, y: y-h/2, z: z-d/2 }, max: { x: x+w/2, y: y+h/2, z: z+d/2 } });
}

function addInteractable(x, y, z, radius, data) {
    interactables.push({ x, y, z, radius, data });
}

function buildHouse() {
    const WALL_H = 3;
    const WALL_THICK = 0.15;
    const FLOOR_Y_G = 0;
    const FLOOR_Y_1 = 3;
    const FLOOR_Y_B = -3;
    const CEIL_MAT = createMaterial(0x2a2218);
    const FLOOR_MAT = createMaterial(0x3a3020);
    const WALL_MAT = createMaterial(0x4a4035);
    const WALL_MAT2 = createMaterial(0x3d3530);
    const WOOD_MAT = createMaterial(0x5a3a1a);
    const DARK_MAT = createMaterial(0x1a1510);
    const CARPET_MAT = createMaterial(0x4a1515);

    // Sol extérieur
    addBox(0, -0.05, 0, 60, 0.1, 60, createMaterial(0x1a1a12), false, true, 'ground');

    // ========================
    // REZ-DE-CHausSEE (y=0)
    // ========================

    // Sols
    addBox(6, 0.02, 6, 12, 0.04, 12, CARPET_MAT, false, true);   // Salon
    addBox(-6, 0.02, 6, 8, 0.04, 12, FLOOR_MAT, false, true);    // Cuisine
    addBox(6, 0.02, -6, 12, 0.04, 6, FLOOR_MAT, false, true);    // Couloir
    addBox(-6, 0.02, -4, 8, 0.04, 8, createMaterial(0x2a2a25), false, true); // Salle de bain

    // Plafonds
    addBox(6, WALL_H, 6, 12, 0.1, 12, CEIL_MAT, false, true);
    addBox(-6, WALL_H, 6, 8, 0.1, 12, CEIL_MAT, false, true);
    addBox(6, WALL_H, -6, 12, 0.1, 6, CEIL_MAT, false, true);

    // --- Murs Salon (12x12, centre 6,6) ---
    addBox(0, WALL_H/2, 0, WALL_THICK, WALL_H, 12, WALL_MAT, true, true);   // Mur gauche salon
    addBox(12, WALL_H/2, 0, WALL_THICK, WALL_H, 12, WALL_MAT, true, true);  // Mur droit salon
    addBox(6, WALL_H/2, 12, 12, WALL_H, WALL_THICK, WALL_MAT, true, true);  // Mur arriere
    addBox(6, WALL_H/2, 0, 4, WALL_H, WALL_THICK, WALL_MAT2, true, true);   // Mur avant gauche (entree)
    addBox(9.5, WALL_H/2, 0, 5, WALL_H, WALL_THICK, WALL_MAT2, true, true); // Mur avant droite
    addBox(6, WALL_H*0.75, 0, 3, WALL_H*0.5, WALL_THICK, WOOD_MAT, true, true); // au-dessus de la porte

    addCollider(0, WALL_H/2, 0, WALL_THICK, WALL_H, 12);
    addCollider(12, WALL_H/2, 0, WALL_THICK, WALL_H, 12);
    addCollider(6, WALL_H/2, 12, 12, WALL_H, WALL_THICK);
    addCollider(6, WALL_H*0.75, 0, 3, WALL_H*0.5, WALL_THICK);
    addCollider(9.5, WALL_H*0.75, 0, 5, WALL_H*0.5, WALL_THICK);

    // --- Murs Cuisine (8x12, centre -6,6) ---
    addBox(-10, WALL_H/2, 0, WALL_THICK, WALL_H, 12, WALL_MAT, true, true);
    addBox(-2, WALL_H/2, 6, WALL_THICK, WALL_H, 12, WALL_MAT, true, true);
    addBox(-6, WALL_H/2, 12, 8, WALL_H, WALL_THICK, WALL_MAT, true, true);
    addBox(-6, WALL_H/2, 0, 8, WALL_H, WALL_THICK, WALL_MAT, true, true);

    addCollider(-10, WALL_H/2, 0, WALL_THICK, WALL_H, 12);
    addCollider(-2, WALL_H/2, 6, WALL_THICK, WALL_H, 12);
    addCollider(-6, WALL_H/2, 12, 8, WALL_H, WALL_THICK);
    addCollider(-6, WALL_H/2, 0, 8, WALL_H, WALL_THICK);

    // Couloir
    addBox(6, WALL_H/2, -3, WALL_THICK, WALL_H, 6, WALL_MAT2, true, true);
    addBox(0, WALL_H/2, -3, WALL_THICK, WALL_H, 6, WALL_MAT2, true, true);

    addCollider(6, WALL_H/2, -3, WALL_THICK, WALL_H, 6);
    addCollider(0, WALL_H/2, -3, WALL_THICK, WALL_H, 6);

    // Salle de bain
    addBox(-2, WALL_H/2, -4, WALL_THICK, WALL_H, 8, createMaterial(0x35404a), true, true);
    addBox(-10, WALL_H/2, -4, WALL_THICK, WALL_H, 8, WALL_MAT, true, true);
    addBox(-6, WALL_H/2, -8, 8, WALL_H, WALL_THICK, WALL_MAT, true, true);

    addCollider(-2, WALL_H/2, -4, WALL_THICK, WALL_H, 8);
    addCollider(-10, WALL_H/2, -4, WALL_THICK, WALL_H, 8);
    addCollider(-6, WALL_H/2, -8, 8, WALL_H, WALL_THICK);

    // --- Escalier bas (vers sous-sol) ---
    addBox(-2, -1.5, 8, 2.5, 3, 3, DARK_MAT, false, false, 'stairs_down');
    for (let i = 0; i < 6; i++) {
        addBox(-2, -i*0.5 - 0.25, 7 + i*0.5, 2.2, 0.2, 0.5, WOOD_MAT, true, true);
    }

    // Porte de la cave
    createDoor(-6, WALL_H/2, 0, 1.2, 2.4, 0.1, 'door_cellar', WOOD_MAT, CONFIG.DOORS.CELLAR);

    // --- Escalier haut (vers etage) ---
    addBox(10, 1.5, -5, 2.5, 3, 3, DARK_MAT, false, false, 'stairs_up');
    for (let i = 0; i < 6; i++) {
        addBox(10, i*0.5 + 0.25, -7 + i*0.5, 2.2, 0.2, 0.5, WOOD_MAT, true, true);
    }

    // --- MEUBLES REZ-DE-CHausSEE ---
    // Canape salon
    addBox(9, 0.4, 9, 3, 0.8, 1.2, createMaterial(0x5a2222), true, true, 'furniture');
    addCollider(9, 0.4, 9, 3, 0.8, 1.2);
    // Table salon
    addBox(6, 0.4, 6, 1.5, 0.05, 0.8, WOOD_MAT, true, true, 'furniture');
    addBox(6, 0.2, 6, 0.1, 0.4, 0.1, WOOD_MAT, true, false);
    addBox(6.6, 0.2, 6.3, 0.1, 0.4, 0.1, WOOD_MAT, true, false);
    addCollider(6, 0.4, 6, 1.5, 0.8, 0.8);
    // Etagere salon
    addBox(11.3, 1, 6, 0.4, 2, 3, WOOD_MAT, true, true, 'furniture');
    addCollider(11.3, 1, 6, 0.4, 2, 3);

    // Cuisine - Plan de travail
    addBox(-9, 0.45, 9, 1.5, 0.9, 0.6, createMaterial(0x555555), true, true, 'furniture');
    addCollider(-9, 0.45, 9, 1.5, 0.9, 0.6);
    addBox(-9, 0.45, 6, 1.5, 0.9, 0.6, createMaterial(0x555555), true, true, 'furniture');
    addCollider(-9, 0.45, 6, 1.5, 0.9, 0.6);
    // Table cuisine
    addBox(-6, 0.4, 7, 1.8, 0.05, 1, WOOD_MAT, true, true, 'furniture');
    addCollider(-6, 0.4, 7, 1.8, 0.8, 1);

    // Salle de bain - Baignoire
    addBox(-7, 0.4, -6, 1.5, 0.8, 2.5, createMaterial(0xdddddd), true, true, 'furniture');
    addCollider(-7, 0.4, -6, 1.5, 0.8, 2.5);

    // ========================
    // ETAGE (y=3)
    // ========================
    const F1 = 3;

    // Sol etage
    addBox(6, F1+0.02, -6, 12, 0.04, 6, CARPET_MAT, false, true);
    addBox(6, F1+0.02, -12, 12, 0.04, 6, createMaterial(0x3a3020), false, true);
    addBox(-2, F1+0.02, -9, 6, 0.04, 6, FLOOR_MAT, false, true);

    // Plafond etage
    addBox(6, F1+WALL_H, -9, 18, 0.1, 12, CEIL_MAT, false, true);

    // Murs etage
    addBox(-3, F1+WALL_H/2, -9, WALL_THICK, WALL_H, 12, WALL_MAT, true, true);
    addBox(12, F1+WALL_H/2, -9, WALL_THICK, WALL_H, 12, WALL_MAT, true, true);
    addBox(6, F1+WALL_H/2, -3, 18, WALL_H, WALL_THICK, WALL_MAT, true, true);
    addBox(6, F1+WALL_H/2, -15, 18, WALL_H, WALL_THICK, WALL_MAT, true, true);

    addCollider(-3, F1+WALL_H/2, -9, WALL_THICK, WALL_H, 12);
    addCollider(12, F1+WALL_H/2, -9, WALL_THICK, WALL_H, 12);
    addCollider(6, F1+WALL_H/2, -3, 18, WALL_H, WALL_THICK);
    addCollider(6, F1+WALL_H/2, -15, 18, WALL_H, WALL_THICK);

    // Murs internes etage
    addBox(4, F1+WALL_H/2, -9, WALL_THICK, WALL_H, 6, WALL_MAT2, true, true);
    addCollider(4, F1+WALL_H/2, -9, WALL_THICK, WALL_H, 6);

    // Porte chambre 1
    createDoor(4, F1+WALL_H/2, -6.5, 1.2, 2.4, 0.1, 'door_bedroom', WOOD_MAT, CONFIG.DOORS.BEDROOM);

    // Meubles etage
    // Lit chambre 1
    addBox(1, F1+0.3, -12, 2, 0.6, 1.2, createMaterial(0x4a2a1a), true, true, 'bed1');
    addCollider(1, F1+0.3, -12, 2, 0.6, 1.2);
    hidingSpots.push({ x: 1, y: F1, z: -12, type: 'bed', label: 'Se cacher sous le lit' });

    // Lit chambre 2
    addBox(9, F1+0.3, -12, 2, 0.6, 1.2, createMaterial(0x4a2a1a), true, true, 'bed2');
    addCollider(9, F1+0.3, -12, 2, 0.6, 1.2);
    hidingSpots.push({ x: 9, y: F1, z: -12, type: 'bed', label: 'Se cacher sous le lit' });

    // Armoire
    addBox(3, F1+1, -14, 1.2, 2, 0.6, createMaterial(0x3a2510), true, true, 'closet1');
    addCollider(3, F1+1, -14, 1.2, 2, 0.6);
    hidingSpots.push({ x: 3, y: F1, z: -13.5, type: 'closet', label: 'Se cacher dans l\'armoire' });

    // Armoire 2
    addBox(10, F1+1, -14, 1.2, 2, 0.6, createMaterial(0x3a2510), true, true, 'closet2');
    addCollider(10, F1+1, -14, 1.2, 2, 0.6);
    hidingSpots.push({ x: 10, y: F1, z: -13.5, type: 'closet', label: 'Se cacher dans l\'armoire' });

    // ========================
    // SOUS-SOL (y=-3)
    // ========================
    const FB = -3;

    // Sol sous-sol
    addBox(-6, FB+0.02, 9, 12, 0.04, 8, createMaterial(0x222220), false, true);

    // Murs sous-sol
    addBox(-12, FB+WALL_H/2, 9, WALL_THICK, WALL_H, 8, createMaterial(0x2a2520), true, true);
    addBox(0, FB+WALL_H/2, 9, WALL_THICK, WALL_H, 8, createMaterial(0x2a2520), true, true);
    addBox(-6, FB+WALL_H/2, 5, 12, WALL_H, WALL_THICK, createMaterial(0x2a2520), true, true);
    addBox(-6, FB+WALL_H/2, 13, 12, WALL_H, WALL_THICK, createMaterial(0x2a2520), true, true);

    addCollider(-12, FB+WALL_H/2, 9, WALL_THICK, WALL_H, 8);
    addCollider(0, FB+WALL_H/2, 9, WALL_THICK, WALL_H, 8);
    addCollider(-6, FB+WALL_H/2, 5, 12, WALL_H, WALL_THICK);
    addCollider(-6, FB+WALL_H/2, 13, 12, WALL_H, WALL_THICK);

    // Plafond sous-sol
    addBox(-6, FB+WALL_H, 9, 12, 0.1, 8, createMaterial(0x1a1510), false, true);

    // Generateur
    addBox(-4, FB+0.6, 11, 1.5, 1.2, 1, createMaterial(0x444444), true, true, 'generator');
    addCollider(-4, FB+0.6, 11, 1.5, 1.2, 1);
    addInteractable(-4, FB+0.8, 11, 3, { type: 'generator', label: 'Reparer le generateur' });

    // Coffre sous-sol
    addBox(-8, FB+0.4, 7, 1, 0.8, 0.6, createMaterial(0x6a4a1a), true, true, 'chest_bs');
    addCollider(-8, FB+0.4, 7, 1, 0.8, 0.6);

    // ========================
    // EXTERIEUR - Porte principale
    // ========================
    addBox(8, WALL_H/2, 0, 2, WALL_H, 0.3, createMaterial(0x5a3a1a), true, true, 'front_door_ext');
    createDoor(8, WALL_H/2, 0, 1.2, 2.4, 0.15, 'door_front', createMaterial(0x5a3a1a), CONFIG.DOORS.FRONT);

    // Escalier exterieur
    for (let i = 0; i < 3; i++) {
        addBox(8, -i*0.3 - 0.15, 0.5 + i*0.4, 3, 0.25, 0.5, createMaterial(0x666660), false, true);
    }

    // Illumination de base
    const ambientLight = new THREE.AmbientLight(0x111118, 0.3);
    scene.add(ambientLight);

    // Lumieres de la maison (tres faibles)
    const roomLights = [
        { pos: [6, 2.7, 6], color: 0xffaa66, intensity: 0.4, dist: 8 },
        { pos: [-6, 2.7, 6], color: 0xffcc88, intensity: 0.3, dist: 7 },
        { pos: [6, 2.7, -6], color: 0xffaa66, intensity: 0.2, dist: 6 },
        { pos: [6, 5.7, -9], color: 0xffaa66, intensity: 0.2, dist: 7 },
        { pos: [-6, -0.3, 9], color: 0xaaaaff, intensity: 0.15, dist: 5 },
    ];
    roomLights.forEach(l => {
        const pl = new THREE.PointLight(l.color, l.intensity, l.dist);
        pl.position.set(...l.pos);
        pl.castShadow = false;
        scene.add(pl);
    });

    // Directional light faible (lune)
    const moonLight = new THREE.DirectionalLight(0x223355, 0.15);
    moonLight.position.set(-10, 20, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(1024, 1024);
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 50;
    moonLight.shadow.camera.left = -20;
    moonLight.shadow.camera.right = 20;
    moonLight.shadow.camera.top = 20;
    moonLight.shadow.camera.bottom = -20;
    scene.add(moonLight);
}

// ============================================
// SECTION 6: PORTES
// ============================================
function createDoor(x, y, z, w, h, d, id, material, config) {
    const doorMesh = addBox(x, y, z, w, h, d, material, true, true, id);
    const doorData = {
        mesh: doorMesh,
        id: id,
        config: config,
        open: false,
        locked: true,
        originalPos: { x, y, z },
    };
    doorObjects.push(doorData);

    addCollider(x, y, z, w, h, d);
    addInteractable(x, y, z, 3, { type: 'door', doorId: id, label: config.name + ' [E]' });
    return doorMesh;
}

function toggleDoor(doorId) {
    const door = doorObjects.find(d => d.id === doorId);
    if (!door) return false;

    if (door.locked) {
        const playerHasRequired = player.inventory.includes(door.config.required);
        if (playerHasRequired) {
            door.locked = false;
            audio.doorOpen();
            notify('Porte debloquee : ' + door.config.name, 'success');
            gameState.doorsOpened.push(doorId);
        } else {
            audio.doorLocked();
            notify('Verrouillee. Il faut : ' + door.config.name.replace('Porte du ', '').replace('Porte de la ', ''), 'warning');
            return false;
        }
    }

    door.open = !door.open;
    if (door.open) {
        door.mesh.position.y = door.originalPos.y + door.mesh.geometry.parameters.height;
        removeColliderAt(door.originalPos.x, door.originalPos.y, door.originalPos.z);
    } else {
        door.mesh.position.y = door.originalPos.y;
        addCollider(door.originalPos.x, door.originalPos.y, door.originalPos.z,
            door.mesh.geometry.parameters.width, door.mesh.geometry.parameters.height, door.mesh.geometry.parameters.depth);
    }
    audio.doorOpen();
    enemyOnNoise(door.open ? 6 : 4, door.originalPos.x, door.originalPos.z);
    return true;
}

function removeColliderAt(x, y, z) {
    colliders = colliders.filter(c => !(Math.abs((c.min.x+c.max.x)/2 - x) < 0.5 && Math.abs((c.min.z+c.max.z)/2 - z) < 0.5));
}

// ============================================
// SECTION 7: ITEMS
// ============================================
function spawnItems() {
    const itemDefs = Object.values(CONFIG.ITEMS);
    const spawnPoints = [
        { x: 9, y: 0.5, z: 9 },     // Salon - canape
        { x: 11, y: 1.5, z: 6 },     // Salon - etagere
        { x: -9, y: 1.2, z: 8 },     // Cuisine - plan
        { x: -6, y: 0.8, z: 7 },     // Cuisine - table
        { x: -7, y: 0.8, z: -5 },    // SdB - baignoire
        { x: 1, y: 3.5, z: -12 },    // Chambre 1 - lit
        { x: 9, y: 3.5, z: -12 },    // Chambre 2 - lit
        { x: 7, y: 3.5, z: -9 },     // Etage couloir
        { x: -4, y: -2.4, z: 11 },   // Sous-sol generateur
        { x: -8, y: -2.4, z: 7 },    // Sous-sol coffre
        { x: -2, y: 0.5, z: 8 },     // Pres escalier bas
        { x: 10, y: 0.5, z: -5 },    // Pres escalier haut
        { x: 3, y: 3.5, z: -14 },    // Etage armoire
        { x: 10, y: 3.5, z: -14 },   // Etage armoire 2
    ];

    // Shuffle spawn points
    for (let i = spawnPoints.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spawnPoints[i], spawnPoints[j]] = [spawnPoints[j], spawnPoints[i]];
    }

    // Always spawn these critical items
    const criticalItems = ['cellar_key', 'bedroom_key', 'basement_key', 'final_key', 'gen_part1', 'gen_part2', 'wire_cutter'];
    const otherItems = itemDefs.filter(d => !criticalItems.includes(d.id));

    let spawnIdx = 0;
    criticalItems.forEach(def => {
        if (spawnIdx >= spawnPoints.length) spawnIdx = 0;
        const sp = spawnPoints[spawnIdx++];
        createItem(sp.x, sp.y, sp.z, def);
    });

    // Spawn some random other items
    const extraCount = Math.min(4, otherItems.length, spawnPoints.length - spawnIdx);
    const shuffled = otherItems.sort(() => Math.random() - 0.5);
    for (let i = 0; i < extraCount; i++) {
        if (spawnIdx >= spawnPoints.length) break;
        const sp = spawnPoints[spawnIdx++];
        createItem(sp.x, sp.y, sp.z, shuffled[i]);
    }

    gameState.totalItems = itemObjects.length;
}

function createItem(x, y, z, itemDef) {
    const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const mat = new THREE.MeshStandardMaterial({
        color: itemDef.color,
        emissive: itemDef.color,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    scene.add(mesh);

    const itemObj = { mesh, def: itemDef, collected: false, glow: mesh };
    itemObjects.push(itemObj);
    addInteractable(x, y, z, 2.5, { type: 'item', itemObj, label: `${itemDef.icon} ${itemDef.name} [E]` });
}

function collectItem(itemObj) {
    if (itemObj.collected) return;
    itemObj.collected = true;
    scene.remove(itemObj.mesh);
    player.inventory.push(itemObj.def.id);
    gameState.itemsCollected++;
    audio.itemPickup();
    notify('Trouve : ' + itemObj.def.icon + ' ' + itemObj.def.name, 'success');
    updateInventoryUI();
}

// ============================================
// SECTION 8: JOUEUR
// ============================================
const player = {
    position: new THREE.Vector3(8, CONFIG.WORLD.PLAYER_HEIGHT, 2),
    velocity: new THREE.Vector3(),
    rotation: { x: 0, y: 0 },
    onGround: true,
    stamina: 100,
    health: 100,
    crouching: false,
    sprinting: false,
    hiding: false,
    hiddenType: null,
    inventory: [],
    selectedSlot: 0,
    flashlightOn: false,
    flashlight: null,
    noiseLevel: 0,
    footstepTimer: 0,
};

function initPlayer() {
    player.position.set(8, CONFIG.WORLD.PLAYER_HEIGHT, 2);
    player.velocity.set(0, 0, 0);
    player.rotation.x = 0;
    player.rotation.y = 0;
    player.stamina = 100;
    player.health = 100;
    player.crouching = false;
    player.sprinting = false;
    player.hiding = false;
    player.inventory = [];
    player.flashlightOn = false;

    // Flashlight
    if (player.flashlight) scene.remove(player.flashlight);
    const fl = new THREE.SpotLight(0xffffcc, 1.5, 18, 0.4, 0.6, 1.5);
    fl.castShadow = false;
    camera.add(fl);
    fl.position.set(0, 0, 0);
    fl.target.position.set(0, 0, -1);
    camera.add(fl.target);
    scene.add(camera);
    player.flashlight = fl;
    player.flashlight.visible = false;
}

// ============================================
// SECTION 9: ENNEMI — Machine a etats
// ============================================
const ENEMY_STATES = { IDLE: 'idle', PATROL: 'patrol', ALERT: 'alert', CHASE: 'chase', SEARCH: 'search', RETURN: 'return' };

const enemy = {
    mesh: null,
    body: null,
    state: ENEMY_STATES.IDLE,
    position: new THREE.Vector3(-6, 0, 6),
    targetPos: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    rotation: 0,
    stateTimer: 0,
    lastKnownPlayerPos: null,
    speed: CONFIG.ENEMY.SPEED_PATROL,
    canSeePlayer: false,
    alertLevel: 0,
    waypointIndex: 0,
    waypoints: [],
    growlTimer: 0,
    chaseMusicTimer: 0,
};

function createEnemy() {
    const group = new THREE.Group();

    // Corps
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x221a1a, roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);

    // Tete
    const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x332222, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.2;
    head.castShadow = true;
    group.add(head);

    // Yeux
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 4);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.8 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 2.24, -0.18);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 2.24, -0.18);
    group.add(eyeR);

    // Bras
    const armGeo = new THREE.CylinderGeometry(0.06, 0.08, 1, 6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x221a1a });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.4, 1.3, 0);
    armL.rotation.z = 0.2;
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.4, 1.3, 0);
    armR.rotation.z = -0.2;
    group.add(armR);

    // Jambes
    const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6);
    const legL = new THREE.Mesh(legGeo, armMat);
    legL.position.set(-0.15, 0.4, 0);
    group.add(legL);
    const legR = new THREE.Mesh(legGeo, armMat);
    legR.position.set(0.15, 0.4, 0);
    group.add(legR);

    // Lumiere des yeux
    const eyeLight = new THREE.PointLight(0xff2200, 0.3, 5);
    eyeLight.position.set(0, 2.2, -0.3);
    group.add(eyeLight);

    group.position.copy(enemy.position);
    scene.add(group);
    enemy.mesh = group;
    enemy.body = body;
    enemy.armL = armL;
    enemy.armR = armR;
    enemy.legL = legL;
    enemy.legR = legR;
    enemy.eyeLight = eyeLight;

    // Waypoints de patrouille (dans la maison)
    enemy.waypoints = [
        new THREE.Vector3(6, 0, 6),    // Salon
        new THREE.Vector3(-6, 0, 6),   // Cuisine
        new THREE.Vector3(6, 0, -5),   // Couloir
        new THREE.Vector3(-6, 0, -5),  // SdB
        new THREE.Vector3(6, 3, -9),   // Etage
        new THREE.Vector3(1, 3, -12),  // Chambre 1
        new THREE.Vector3(9, 3, -12),  // Chambre 2
        new THREE.Vector3(-6, -3, 9),  // Sous-sol
    ];

    enemy.targetPos.copy(enemy.waypoints[0]);
    enemy.state = ENEMY_STATES.PATROL;
}

function updateEnemy(dt) {
    if (!enemy.mesh || !gameState.running || gameState.paused) return;

    const distToPlayer = enemy.position.distanceTo(player.position);
    const dirToPlayer = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();

    // Vision check
    enemy.canSeePlayer = distToPlayer < CONFIG.ENEMY.DETECT_RANGE && hasLineOfSight(enemy.position, player.position);

    // Hearing check
    const hearRange = player.sprinting ? CONFIG.ENEMY.HEAR_RUN : CONFIG.ENEMY.HEAR_RANGE;
    const canHear = distToPlayer < hearRange && player.noiseLevel > 0.1;

    // State machine
    switch (enemy.state) {
        case ENEMY_STATES.IDLE:
            enemy.stateTimer -= dt;
            enemy.speed = 0;
            animateEnemyIdle(dt);
            if (enemy.stateTimer <= 0) {
                enemy.state = ENEMY_STATES.PATROL;
                pickNextWaypoint();
            }
            if (enemy.canSeePlayer || canHear) transitionToChase();
            break;

        case ENEMY_STATES.PATROL:
            enemy.speed = CONFIG.ENEMY.SPEED_PATROL;
            moveTowards(enemy.targetPos, enemy.speed, dt);
            animateEnemyWalk(dt);
            if (enemy.position.distanceTo(enemy.targetPos) < 1) {
                enemy.state = ENEMY_STATES.IDLE;
                enemy.stateTimer = 2 + Math.random() * 4;
                audio.creak();
            }
            if (enemy.canSeePlayer || canHear) transitionToChase();
            break;

        case ENEMY_STATES.ALERT:
            enemy.speed = CONFIG.ENEMY.SPEED_SEARCH;
            moveTowards(enemy.lastKnownPlayerPos, enemy.speed, dt);
            animateEnemyWalk(dt);
            if (enemy.position.distanceTo(enemy.lastKnownPlayerPos) < 2) {
                enemy.state = ENEMY_STATES.SEARCH;
                enemy.stateTimer = CONFIG.ENEMY.SEARCH_TIME;
            }
            if (enemy.canSeePlayer) transitionToChase();
            break;

        case ENEMY_STATES.CHASE:
            enemy.speed = CONFIG.ENEMY.SPEED_CHASE;
            moveTowards(player.position, enemy.speed, dt);
            animateEnemyRun(dt);
            enemy.stateTimer = CONFIG.ENEMY.CHASE_TIMEOUT;
            enemy.lastKnownPlayerPos = player.position.clone();

            if (enemy.chaseMusicTimer <= 0) {
                audio.chaseMusic();
                enemy.chaseMusicTimer = 2;
            }
            enemy.chaseMusicTimer -= dt;

            if (distToPlayer < 1.5 && !player.hiding) {
                attackPlayer();
            }

            if (!enemy.canSeePlayer && !canHear) {
                enemy.state = ENEMY_STATES.SEARCH;
                enemy.stateTimer = CONFIG.ENEMY.SEARCH_TIME;
            }
            break;

        case ENEMY_STATES.SEARCH:
            enemy.speed = CONFIG.ENEMY.SPEED_SEARCH;
            const searchPoint = enemy.lastKnownPlayerPos.clone();
            searchPoint.x += Math.sin(gameTime * 2) * 3;
            searchPoint.z += Math.cos(gameTime * 2) * 3;
            moveTowards(searchPoint, enemy.speed, dt);
            animateEnemyWalk(dt);
            enemy.stateTimer -= dt;
            if (enemy.stateTimer <= 0) {
                enemy.state = ENEMY_STATES.RETURN;
                pickNextWaypoint();
            }
            if (enemy.canSeePlayer || canHear) transitionToChase();
            break;

        case ENEMY_STATES.RETURN:
            enemy.speed = CONFIG.ENEMY.SPEED_PATROL;
            moveTowards(enemy.targetPos, enemy.speed, dt);
            animateEnemyWalk(dt);
            if (enemy.position.distanceTo(enemy.targetPos) < 1.5) {
                enemy.state = ENEMY_STATES.PATROL;
                pickNextWaypoint();
            }
            if (enemy.canSeePlayer || canHear) transitionToChase();
            break;
    }

    // Update mesh
    enemy.mesh.position.copy(enemy.position);
    if (enemy.state === ENEMY_STATES.CHASE) {
        enemy.mesh.lookAt(player.position.x, enemy.position.y, player.position.z);
    } else {
        enemy.mesh.lookAt(enemy.targetPos.x, enemy.position.y, enemy.targetPos.z);
    }

    // Growl
    enemy.growlTimer -= dt;
    if (enemy.growlTimer <= 0) {
        if (enemy.state === ENEMY_STATES.CHASE || distToPlayer < 8) {
            audio.enemyGrowl();
            enemy.growlTimer = 5 + Math.random() * 10;
        }
    }

    // Distance to player for UI
    enemy.distanceToPlayer = distToPlayer;
}

function transitionToChase() {
    if (player.hiding) return;
    enemy.state = ENEMY_STATES.CHASE;
    enemy.stateTimer = CONFIG.ENEMY.CHASE_TIMEOUT;
    enemy.lastKnownPlayerPos = player.position.clone();
    audio.enemyGrowl();
}

function pickNextWaypoint() {
    enemy.waypointIndex = (enemy.waypointIndex + 1) % enemy.waypoints.length;
    enemy.targetPos.copy(enemy.waypoints[enemy.waypointIndex]);
}

function moveTowards(target, speed, dt) {
    const dir = new THREE.Vector3().subVectors(target, enemy.position);
    dir.y = 0;
    if (dir.length() > 0.1) {
        dir.normalize();
        const newPos = enemy.position.clone().add(dir.clone().multiplyScalar(speed * dt));
        if (!checkCollision(newPos.x, enemy.position.y, newPos.z, 0.3)) {
            enemy.position.copy(newPos);
        } else {
            // Try to slide along walls
            const slideX = new THREE.Vector3(dir.x, 0, 0);
            const slideZ = new THREE.Vector3(0, 0, dir.z);
            const tryX = enemy.position.clone().add(slideX.multiplyScalar(speed * dt));
            const tryZ = enemy.position.clone().add(slideZ.multiplyScalar(speed * dt));
            if (!checkCollision(tryX.x, enemy.position.y, tryX.z, 0.3)) {
                enemy.position.x = tryX.x;
            } else if (!checkCollision(tryZ.x, enemy.position.y, tryZ.z, 0.3)) {
                enemy.position.z = tryZ.z;
            }
        }
    }
}

function animateEnemyWalk(dt) {
    const t = gameTime * 6;
    enemy.legL.rotation.x = Math.sin(t) * 0.5;
    enemy.legR.rotation.x = Math.sin(t + Math.PI) * 0.5;
    enemy.armL.rotation.x = Math.sin(t + Math.PI) * 0.3;
    enemy.armR.rotation.x = Math.sin(t) * 0.3;
    enemy.body.position.y = 1.2 + Math.abs(Math.sin(t)) * 0.03;
}

function animateEnemyRun(dt) {
    const t = gameTime * 10;
    enemy.legL.rotation.x = Math.sin(t) * 0.8;
    enemy.legR.rotation.x = Math.sin(t + Math.PI) * 0.8;
    enemy.armL.rotation.x = Math.sin(t + Math.PI) * 0.6;
    enemy.armR.rotation.x = Math.sin(t) * 0.6;
    enemy.body.position.y = 1.2 + Math.abs(Math.sin(t)) * 0.06;
}

function animateEnemyIdle(dt) {
    const t = gameTime * 1.5;
    enemy.body.position.y = 1.2 + Math.sin(t) * 0.02;
    enemy.armL.rotation.x = Math.sin(t) * 0.1;
    enemy.armR.rotation.x = Math.sin(t + 1) * 0.1;
}

function hasLineOfSight(from, to) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    dir.normalize();
    const raycaster = new THREE.Raycaster(from.clone().add(new THREE.Vector3(0, 1.5, 0)), dir, 0, dist);
    const intersects = raycaster.intersectObjects(scene.children.filter(c => c.isMesh), false);
    for (const hit of intersects) {
        if (hit.distance < dist - 0.5 && hit.object.name !== 'player') return false;
    }
    return true;
}

function attackPlayer() {
    if (player.health <= 0) return;
    player.health -= 34;
    audio.hit();
    screenFlash();
    enemy.state = ENEMY_STATES.SEARCH;
    enemy.stateTimer = 5;
    enemy.lastKnownPlayerPos = player.position.clone();

    if (player.health <= 0) {
        player.health = 0;
        gameOver('Le monstre vous a attrape...');
    }
}

// ============================================
// SECTION 10: COLLISIONS
// ============================================
function checkCollision(x, y, z, radius) {
    for (const c of colliders) {
        if (x + radius > c.min.x && x - radius < c.max.x &&
            y + 1.7 > c.min.y && y < c.max.y &&
            z + radius > c.min.z && z - radius < c.max.z) {
            return true;
        }
    }
    return false;
}

// ============================================
// SECTION 11: CONTROLES
// ============================================
const keys = {};
let mouseLocked = false;

function initControls() {
    document.addEventListener('keydown', e => { keys[e.code] = true; handleKeyDown(e); });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
    document.addEventListener('mousemove', e => {
        if (!mouseLocked || gameState.paused) return;
        const sens = settings.sensitivity * 0.0003;
        player.rotation.y -= e.movementX * sens;
        player.rotation.x -= e.movementY * sens;
        player.rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, player.rotation.x));
    });
    document.addEventListener('mousedown', e => { if (gameState.running && !gameState.paused && mouseLocked) handleAttack(); });
    document.addEventListener('pointerlockchange', () => {
        mouseLocked = !!document.pointerLockElement;
        if (!mouseLocked && gameState.running && !gameState.paused) pauseGame();
    });
}

function handleKeyDown(e) {
    if (e.code === 'Escape') {
        if (gameState.running) togglePause();
    }
    if (!gameState.running || gameState.paused) return;
    if (e.code === 'KeyE') handleInteraction();
    if (e.code === 'KeyI') toggleInventory();
    if (e.code === 'KeyC') toggleCraft();
    if (e.code === 'KeyF') handleConsume('food');
    if (e.code === 'KeyG') handleConsume('drink');
    if (e.code === 'KeyR') handleConsume('heal');
    if (e.code === 'KeyT') toggleFlashlight();
    if (e.code === 'KeyH') handleHide();
    if (e.code >= 'Digit1' && e.code <= 'Digit6') {
        player.selectedSlot = parseInt(e.code.replace('Digit', '')) - 1;
        updateInventoryUI();
    }
}

function updatePlayerMovement(dt) {
    if (gameState.paused || player.hiding) return;

    const forward = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
    const right = new THREE.Vector3(Math.cos(player.rotation.y), 0, -Math.sin(player.rotation.y));

    let moveDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right);

    player.sprinting = keys['ShiftLeft'] && moveDir.length() > 0 && player.stamina > 0;
    const speed = player.sprinting ? CONFIG.PLAYER.SPEED * CONFIG.PLAYER.SPRINT_MULT : CONFIG.PLAYER.SPEED;

    if (moveDir.length() > 0) {
        moveDir.normalize();
        player.noiseLevel = player.sprinting ? 1 : 0.3;

        const newX = player.position.x + moveDir.x * speed * dt;
        const newZ = player.position.z + moveDir.z * speed * dt;

        if (!checkCollision(newX, player.position.y, player.position.z, CONFIG.WORLD.PLAYER_RADIUS)) {
            player.position.x = newX;
        }
        if (!checkCollision(player.position.x, player.position.y, newZ, CONFIG.WORLD.PLAYER_RADIUS)) {
            player.position.z = newZ;
        }

        // Footstep sounds
        player.footstepTimer -= dt;
        if (player.footstepTimer <= 0) {
            audio.footstep(player.sprinting);
            enemyOnNoise(player.sprinting ? 3 : 1, player.position.x, player.position.z);
            player.footstepTimer = player.sprinting ? 0.3 : 0.5;
        }
    } else {
        player.noiseLevel *= 0.9;
    }

    // Sprint stamina
    if (player.sprinting) {
        player.stamina -= CONFIG.PLAYER.SPRINT_DRAIN * dt;
        if (player.stamina <= 0) { player.stamina = 0; player.sprinting = false; }
    } else {
        player.stamina = Math.min(100, player.stamina + CONFIG.PLAYER.STAMINA_REGEN * dt);
    }

    // Crouch
    player.crouching = keys['KeyC'];
    const targetHeight = player.crouching ? CONFIG.WORLD.CROUCH_HEIGHT : CONFIG.WORLD.PLAYER_HEIGHT;
    player.position.y += (targetHeight - player.position.y) * dt * 10;

    // Camera
    camera.position.copy(player.position);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.rotation.y;
    camera.rotation.x = player.rotation.x;
}

// ============================================
// SECTION 12: INTERACTIONS
// ============================================
function handleInteraction() {
    const nearInteract = getNearestInteractable();
    if (!nearInteract) return;

    const data = nearInteract.data;
    switch (data.type) {
        case 'door':
            toggleDoor(data.doorId);
            break;
        case 'item':
            collectItem(data.itemObj);
            break;
        case 'generator':
            fixGenerator();
            break;
        case 'alarm':
            cutAlarm();
            break;
        case 'hide':
            enterHideSpot(data);
            break;
    }
}

function getNearestInteractable() {
    let nearest = null;
    let nearestDist = Infinity;
    for (const ia of interactables) {
        const dist = player.position.distanceTo(new THREE.Vector3(ia.x, ia.y, ia.z));
        if (dist < ia.radius && dist < nearestDist) {
            nearest = ia;
            nearestDist = dist;
        }
    }
    return nearest;
}

function fixGenerator() {
    if (player.inventory.includes('gen_part1') && player.inventory.includes('gen_part2')) {
        gameState.generatorFixed = true;
        removeFromInventory('gen_part1');
        removeFromInventory('gen_part2');
        notify('Generateur repare !', 'success');
        audio.itemPickup();
        checkWinCondition();
    } else {
        notify('Il manque des pieces pour le generateur', 'warning');
        audio.doorLocked();
    }
}

function cutAlarm() {
    if (player.inventory.includes('wire_cutter')) {
        gameState.alarmCut = true;
        removeFromInventory('wire_cutter');
        notify('Alarme desactivee !', 'success');
        audio.itemPickup();
        checkWinCondition();
    } else {
        notify('Il faut un coupe-fil', 'warning');
    }
}

function checkWinCondition() {
    if (gameState.generatorFixed && gameState.alarmCut && player.inventory.includes('final_key')) {
        notify('Tout est pret ! Allez a la porte d\'entree !', 'success');
    }
}

function attemptEscape() {
    if (gameState.generatorFixed && gameState.alarmCut && player.inventory.includes('final_key')) {
        winGame();
        return true;
    }
    return false;
}

function handleConsume(type) {
    let itemId = null;
    if (type === 'food') {
        itemId = player.inventory.find(id => ITEMS_DATA[id] && ITEMS_DATA[id].food);
    } else if (type === 'drink') {
        itemId = 'medkit'; // placeholder
    } else if (type === 'heal') {
        itemId = player.inventory.find(id => id === 'medkit');
    }
    if (itemId) {
        removeFromInventory(itemId);
        if (type === 'heal') { player.health = Math.min(100, player.health + 40); notify('+40 PV', 'success'); }
        audio.itemPickup();
    }
}

function toggleFlashlight() {
    if (player.inventory.includes('flashlight')) {
        player.flashlightOn = !player.flashlightOn;
        player.flashlight.visible = player.flashlightOn;
        notify(player.flashlightOn ? 'Lampe torche : ON' : 'Lampe torche : OFF', 'info');
    } else {
        notify('Vous n\'avez pas de lampe torche', 'warning');
    }
}

function handleHide() {
    if (player.hiding) {
        exitHide();
        return;
    }
    for (const spot of hidingSpots) {
        const dist = player.position.distanceTo(new THREE.Vector3(spot.x, spot.y, spot.z));
        if (dist < 2.5) {
            enterHideSpot(spot);
            return;
        }
    }
    notify('Aucune cachette a proximite', 'info');
}

function enterHideSpot(data) {
    player.hiding = true;
    player.hiddenType = data.type;
    player.position.set(data.x, data.y + 0.5, data.z);
    audio.creak();
    notify('Vous vous cachez... (H pour sortir)', 'info');
}

function exitHide() {
    player.hiding = false;
    player.hiddenType = null;
    audio.creak();
}

// ============================================
// SECTION 13: BRUIT & ENNEMI REACTION
// ============================================
function enemyOnNoise(intensity, x, z) {
    if (enemy.state === ENEMY_STATES.CHASE) return;
    const dist = enemy.position.distanceTo(new THREE.Vector3(x, 0, z));
    const hearRange = intensity * 5;
    if (dist < hearRange) {
        enemy.lastKnownPlayerPos = new THREE.Vector3(x, 0, z);
        enemy.state = ENEMY_STATES.ALERT;
        enemy.stateTimer = 3;
    }
}

// ============================================
// SECTION 14: UI & MENUS
// ============================================
const ITEMS_DATA = {};
Object.values(CONFIG.ITEMS).forEach(d => ITEMS_DATA[d.id] = d);

function notify(text, type) {
    const container = document.getElementById('notifications');
    const div = document.createElement('div');
    div.className = 'notif ' + (type || '');
    div.textContent = text;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function screenFlash() {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
}

function updateHUD() {
    if (!gameState.running) return;
    document.getElementById('stamina-bar').style.width = player.stamina + '%';
    document.getElementById('health-val');

    // Health bar
    let healthBar = document.getElementById('health-bar-display');
    if (!healthBar) {
        const hb = document.createElement('div');
        hb.className = 'hud-bar';
        hb.innerHTML = '<span class="bar-icon">❤️</span><div class="bar-track"><div class="bar-fill" id="health-bar-display" style="background:linear-gradient(90deg,#a33,#f66);width:100%"></div></div>';
        document.getElementById('hud-left').prepend(hb);
    }
    document.getElementById('health-bar-display').style.width = player.health + '%';

    // Interaction prompt
    const prompt = document.getElementById('interact-prompt');
    const interactText = document.getElementById('interact-text');
    const near = getNearestInteractable();
    if (near) {
        prompt.classList.remove('hidden');
        interactText.textContent = near.data.label || '[E] Interagir';
    } else {
        prompt.classList.add('hidden');
    }

    // Held item
    const heldIcon = document.getElementById('held-item-icon');
    const heldDiv = document.getElementById('held-item');
    const slotItems = player.inventory.slice(0, 6);
    if (slotItems[player.selectedSlot]) {
        heldDiv.classList.remove('hidden');
        heldIcon.textContent = ITEMS_DATA[slotItems[player.selectedSlot]]?.icon || '';
    } else {
        heldDiv.classList.add('hidden');
    }

    // HUD hint for doors
    const hint = document.getElementById('hud-hint');
    if (gameState.generatorFixed && gameState.alarmCut && player.inventory.includes('final_key')) {
        hint.textContent = '➡️ La porte d\'entree est prete !';
    } else if (!gameState.generatorFixed) {
        hint.textContent = '🔧 Reparez le generateur (sous-sol)';
    } else if (!gameState.alarmCut) {
        hint.textContent = '✂️ Desactivez l\'alarme';
    } else {
        hint.textContent = '';
    }
}

function updateInventoryUI() {
    const slots = player.inventory.slice(0, 6);
    for (let i = 0; i < 6; i++) {
        const el = document.getElementById('slot-' + i);
        const slotDiv = el?.closest('.inv-slot');
        if (el) {
            el.textContent = slots[i] ? (ITEMS_DATA[slots[i]]?.icon || '') : '';
        }
        if (slotDiv) {
            slotDiv.classList.toggle('active', i === player.selectedSlot);
        }
    }
}

function toggleInventory() {
    document.getElementById('inventory-panel').classList.toggle('hidden');
    document.getElementById('craft-panel').classList.add('hidden');
    document.getElementById('build-panel')?.classList.add('hidden');
}

function toggleCraft() {
    document.getElementById('craft-panel').classList.toggle('hidden');
    document.getElementById('inventory-panel').classList.add('hidden');
}

function toggleBuild() {}

function showNotification(text, type) { notify(text, type); }

// ============================================
// SECTION 15: SAUVEGARDE / CHARGEMENT
// ============================================
function saveGame() {
    const save = {
        playerPos: { x: player.position.x, y: player.position.y, z: player.position.z },
        playerHealth: player.health,
        playerInventory: [...player.inventory],
        gameState: { ...gameState },
        collectedItems: itemObjects.filter(i => i.collected).map(i => i.def.id),
        settings: { ...settings },
    };
    localStorage.setItem('forgotten_house_save', JSON.stringify(save));
    notify('Partie sauvegardee', 'success');
}

function loadGame() {
    const raw = localStorage.getItem('forgotten_house_save');
    if (!raw) return false;
    try {
        const save = JSON.parse(raw);
        player.position.set(save.playerPos.x, save.playerPos.y, save.playerPos.z);
        player.health = save.playerHealth;
        player.inventory = save.playerInventory || [];
        Object.assign(gameState, save.gameState);
        // Restore collected items
        if (save.collectedItems) {
            save.collectedItems.forEach(id => {
                const item = itemObjects.find(i => i.def.id === id && !i.collected);
                if (item) { item.collected = true; scene.remove(item.mesh); }
            });
        }
        return true;
    } catch(e) { return false; }
}

function hasSaveGame() {
    return !!localStorage.getItem('forgotten_house_save');
}

// ============================================
// SECTION 16: MENUS & FLOW DU JEU
// ============================================
let gameTime = 0;

function initMenus() {
    document.getElementById('btn-new-game').onclick = () => startNewGame();
    document.getElementById('btn-continue').onclick = () => continueGame();
    document.getElementById('btn-options').onclick = () => showSubmenu('options-menu');
    document.getElementById('btn-credits').onclick = () => showSubmenu('credits-menu');
    document.getElementById('btn-options-back').onclick = () => hideSubmenu('options-menu');
    document.getElementById('btn-credits-back').onclick = () => hideSubmenu('credits-menu');
    document.getElementById('btn-resume').onclick = () => resumeGame();
    document.getElementById('btn-pause-options').onclick = () => showSubmenu('options-menu');
    document.getElementById('btn-quit').onclick = () => quitToMenu();
    document.getElementById('btn-retry').onclick = () => retryGame();
    document.getElementById('btn-death-quit').onclick = () => quitToMenu();
    document.getElementById('btn-win-menu').onclick = () => quitToMenu();

    // Options controls
    document.getElementById('opt-volume').oninput = e => {
        settings.volume = e.target.value / 100;
        document.getElementById('opt-volume-val').textContent = e.target.value + '%';
        audio.setVolume(settings.volume);
    };
    document.getElementById('opt-music').oninput = e => {
        settings.musicVolume = e.target.value / 100;
        document.getElementById('opt-music-val').textContent = e.target.value + '%';
        audio.setMusicVolume(settings.musicVolume);
    };
    document.getElementById('opt-sensitivity').oninput = e => {
        settings.sensitivity = parseInt(e.target.value);
        document.getElementById('opt-sens-val').textContent = e.target.value;
    };
    document.getElementById('opt-quality').onchange = e => { settings.quality = e.target.value; };
    document.getElementById('opt-fullscreen').onclick = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
    };

    if (hasSaveGame()) {
        document.getElementById('btn-continue').style.display = '';
    }
}

function showSubmenu(id) { document.getElementById(id).classList.remove('hidden'); }
function hideSubmenu(id) { document.getElementById(id).classList.add('hidden'); }

function startNewGame() {
    audio.init();
    audio.resume();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('loading-screen').classList.remove('hidden');
    gameState = { running: false, paused: false, time: 0, dayTime: 0, startTime: Date.now(), difficulty: 1, itemsCollected: 0, totalItems: 0, generatorFixed: false, alarmCut: false, doorsOpened: [], playerDead: false, hasWon: false };

    setTimeout(() => {
        document.getElementById('loading-fill').style.width = '30%';
        document.getElementById('loading-text').textContent = 'Construction de la maison...';
    }, 100);

    setTimeout(() => {
        initEngine();
        document.getElementById('loading-fill').style.width = '60%';
        document.getElementById('loading-text').textContent = 'Placement des objets...';
    }, 400);

    setTimeout(() => {
        colliders = []; interactables = []; itemObjects = []; doorObjects = []; hidingSpots = [];
        buildHouse();
        spawnItems();
        createEnemy();
        initPlayer();
        document.getElementById('loading-fill').style.width = '100%';
        document.getElementById('loading-text').textContent = 'Pret.';
    }, 800);

    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('forest-anger')?.classList.add('hidden');
        gameState.running = true;
        audio.ambientLoop();
        requestAnimationFrame(gameLoop);
        // Lock pointer
        document.getElementById('gameCanvas').requestPointerLock();
    }, 1200);
}

function continueGame() {
    audio.init();
    audio.resume();
    document.getElementById('main-menu').classList.add('hidden');
    initEngine();
    colliders = []; interactables = []; itemObjects = []; doorObjects = []; hidingSpots = [];
    buildHouse();
    spawnItems();
    createEnemy();
    initPlayer();
    loadGame();
    updateInventoryUI();
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('forest-anger')?.classList.add('hidden');
    gameState.running = true;
    gameState.paused = false;
    audio.ambientLoop();
    notify('Partie chargee', 'info');
    requestAnimationFrame(gameLoop);
    document.getElementById('gameCanvas').requestPointerLock();
}

function pauseGame() {
    if (!gameState.running || gameState.hasWon || gameState.playerDead) return;
    gameState.paused = true;
    document.getElementById('pause-menu').classList.remove('hidden');
    document.exitPointerLock();
}

function resumeGame() {
    gameState.paused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    hideSubmenu('options-menu');
    document.getElementById('gameCanvas').requestPointerLock();
}

function togglePause() {
    if (gameState.paused) resumeGame();
    else pauseGame();
}

function gameOver(reason) {
    gameState.running = false;
    gameState.playerDead = true;
    document.getElementById('death-screen').classList.remove('hidden');
    document.getElementById('death-cause').textContent = reason;
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    document.getElementById('death-time').textContent = `Temps: ${Math.floor(elapsed/60)}m ${elapsed%60}s | Objets: ${gameState.itemsCollected}/${gameState.totalItems}`;
    document.exitPointerLock();
}

function winGame() {
    gameState.running = false;
    gameState.hasWon = true;
    document.getElementById('win-screen').classList.remove('hidden');
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    document.getElementById('win-time').textContent = `Temps: ${Math.floor(elapsed/60)}m ${elapsed%60}s`;
    document.getElementById('win-stats').textContent = `Objets trouves: ${gameState.itemsCollected}/${gameState.totalItems}`;
    document.exitPointerLock();
}

function retryGame() {
    document.getElementById('death-screen').classList.add('hidden');
    startNewGame();
}

function quitToMenu() {
    gameState.running = false;
    gameState.paused = false;
    document.getElementById('death-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    hideSubmenu('options-menu');
    document.getElementById('main-menu').classList.remove('hidden');
    if (hasSaveGame()) document.getElementById('btn-continue').style.display = '';
    document.exitPointerLock();
    // Clean scene
    if (scene) {
        while(scene.children.length > 0) scene.remove(scene.children[0]);
    }
}

// ============================================
// SECTION 17: GAME LOOP
// ============================================
let lastChaseMusicTime = 0;

function gameLoop(timestamp) {
    if (!gameState.running) return;
    requestAnimationFrame(gameLoop);

    const dt = Math.min(clock.getDelta(), 0.05);
    if (gameState.paused) {
        renderer.render(scene, camera);
        return;
    }

    gameTime += dt;

    // Update systems
    updatePlayerMovement(dt);
    updateEnemy(dt);
    updateItemGlow(dt);
    updateHUD();

    // Check front door escape
    const distToDoor = player.position.distanceTo(new THREE.Vector3(8, player.position.y, 0));
    if (distToDoor < 2 && !player.hiding) {
        if (attemptEscape()) return;
        else if (player.inventory.includes('final_key') && (!gameState.generatorFixed || !gameState.alarmCut)) {
            // Handled by HUD hint
        }
    }

    // Auto-save every 30s
    if (Math.floor(gameTime) % 30 === 0 && Math.floor(gameTime) > 0 && Math.floor(gameTime * 10) % 10 === 0) {
        saveGame();
    }

    // Heartbeat when enemy is close
    if (enemy.distanceToPlayer && enemy.distanceToPlayer < 10 && enemy.state === ENEMY_STATES.CHASE) {
        if (Math.floor(gameTime * 2) % 2 === 0) audio.heartbeat(120);
    }

    renderer.render(scene, camera);
}

function updateItemGlow(dt) {
    itemObjects.forEach(item => {
        if (!item.collected && item.mesh) {
            item.mesh.rotation.y += dt * 2;
            item.mesh.position.y = item.mesh.position.y + Math.sin(gameTime * 3 + item.mesh.position.x) * 0.001;
        }
    });
}

// ============================================
// SECTION 18: INIT
// ============================================
window.onload = () => {
    initMenus();
    initControls();
};
