/* ============================================
   THE FORGOTTEN HOUSE — Moteur 3D (v2)
   Jeu d'horreur FPS — Three.js r128
   ============================================ */

"use strict";

// ============================================
// 1. CONFIGURATION
// ============================================
const CFG = {
    CAM_H: 1.7,
    CAM_CROUCH: 0.9,
    RADIUS: 0.3,
    SPEED: 3.5,
    SPRINT_MULT: 1.8,
    SPRINT_DRAIN: 18,
    STAMINA_REGEN: 10,
    SENSITIVITY: 0.002,
    WALL_H: 3,
    WALL_T: 0.3,
    FLOOR_THICK: 0.15,

    ENEMY_SPEED_PATROL: 1.6,
    ENEMY_SPEED_CHASE: 4.0,
    ENEMY_SPEED_SEARCH: 2.2,
    ENEMY_DETECT: 12,
    ENEMY_HEAR: 9,
    ENEMY_HEAR_RUN: 16,
    ENEMY_CHASE_TIME: 7,
    ENEMY_SEARCH_TIME: 10,

    ITEM_DEFS: {
        cellar_key:   { name: 'Cle cave',       icon: '🔑', color: 0xaa7733, shape: 'key' },
        bedroom_key:  { name: 'Cle chambre',     icon: '🗝️', color: 0x6699cc, shape: 'key' },
        basement_key: { name: 'Cle sous-sol',    icon: '🔑', color: 0xcc4444, shape: 'key' },
        wire_cutter:  { name: 'Coupe-fil',       icon: '✂️', color: 0x999999, shape: 'tool' },
        gen_part1:    { name: 'Moteur (1/2)',     icon: '⚙️', color: 0xaaaaaa, shape: 'gear' },
        gen_part2:    { name: 'Moteur (2/2)',     icon: '⚙️', color: 0x999999, shape: 'gear' },
        flashlight:   { name: 'Lampe torche',    icon: '🔦', color: 0xffffaa, shape: 'cylinder' },
        crowbar:      { name: 'Pied-de-biche',   icon: '🔧', color: 0xcc6633, shape: 'tool' },
        final_key:    { name: 'Cle de sortie',   icon: '🔑', color: 0xff3333, shape: 'key' },
        medkit:       { name: 'Trousse soin',    icon: '🩹', color: 0xff4444, shape: 'box' },
    },
};

// ============================================
// 2. ETAT GLOBAL
// ============================================
let scene, camera, renderer, clock;
let gameTime = 0;
let colliders = [];
let interactables = [];
let itemObjects = [];
let doorObjects = [];
let hideSpots = [];
let gameRunning = false;
let gamePaused = false;
let startTime = 0;
let itemsFound = 0;
let totalItems = 0;
let generatorFixed = false;
let alarmCut = false;
let playerDead = false;
let hasWon = false;
let lastEscapeAttempt = 0;
let settings = { vol: 0.7, music: 0.5, sens: 8, quality: 'medium' };

// ============================================
// 3. AUDIO PROCEDURAL (Web Audio API)
// ============================================
let audioCtx = null;
let masterGain = null;
let musicGain = null;

function audioInit() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = settings.vol;
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = settings.music;
    musicGain.connect(masterGain);
}

function audioResume() { if (audioCtx?.state === 'suspended') audioCtx.resume(); }

function playTone(freq, dur, type, vol) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime((vol || 0.08) * settings.vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(masterGain);
    o.start(); o.stop(audioCtx.currentTime + dur);
}

function playNoise(dur, vol) {
    if (!audioCtx) return;
    const n = audioCtx.sampleRate * dur;
    const buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    const s = audioCtx.createBufferSource();
    s.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime((vol || 0.04) * settings.vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 600;
    s.connect(f); f.connect(g); g.connect(masterGain);
    s.start();
}

const SFX = {
    step(loud) {
        playTone(90 + Math.random() * 30, 0.07, 'triangle', loud ? 0.1 : 0.03);
        playNoise(0.04, loud ? 0.04 : 0.01);
    },
    door() { playTone(220, 0.25, 'sawtooth', 0.06); playTone(160, 0.35, 'square', 0.03); },
    lock() { playTone(440, 0.08, 'square', 0.07); setTimeout(() => playTone(330, 0.08, 'square', 0.07), 100); },
    pickup() {
        playTone(700, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(900, 0.12, 'sine', 0.1), 70);
        setTimeout(() => playTone(1100, 0.18, 'sine', 0.08), 140);
    },
    hit() { playTone(80, 0.3, 'sawtooth', 0.12); playNoise(0.2, 0.08); },
    creak() { playTone(350 + Math.random() * 200, 0.15, 'sawtooth', 0.025); },
    growl() { playTone(55, 0.5, 'sawtooth', 0.06); playTone(48, 0.6, 'square', 0.03); },
    heartbeat() { playTone(38, 0.12, 'sine', 0.1); setTimeout(() => playTone(32, 0.1, 'sine', 0.07), 140); },
    ambient() {
        if (!gameRunning) return;
        playNoise(3, 0.015);
        playTone(50 + Math.random() * 15, 4, 'sine', 0.01);
        setTimeout(() => SFX.ambient(), 3500 + Math.random() * 4000);
    },
    chase() {
        if (!audioCtx) return;
        [110, 130, 110, 146, 110, 130, 98, 110].forEach((n, i) => {
            setTimeout(() => {
                if (gameRunning && !gamePaused) {
                    playTone(n, 0.25, 'sawtooth', 0.05 * settings.music);
                    playTone(n * 0.5, 0.25, 'square', 0.025 * settings.music);
                }
            }, i * 220);
        });
    },
};

// ============================================
// 4. THREE.JS SETUP
// ============================================
function engineInit() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a12);
    scene.fog = new THREE.FogExp2(0x0c0a12, 0.012);

    camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 120);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.5;

    clock = new THREE.Clock();

    addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });
}

// ============================================
// 5. OUTILS GEOMETRIE
// ============================================
function mat(color, opts) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.05, ...opts });
}

function box(x, y, z, w, h, d, material, shadows, name) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    if (shadows) { m.castShadow = true; m.receiveShadow = true; }
    else { m.receiveShadow = true; }
    if (name) m.name = name;
    scene.add(m);
    return m;
}

function cyl(x, y, z, rTop, rBot, h, segs, material, shadows) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), material);
    m.position.set(x, y, z);
    if (shadows) { m.castShadow = true; m.receiveShadow = true; }
    scene.add(m);
    return m;
}

function addCol(x, y, z, w, h, d) {
    colliders.push({
        minX: x - w/2, maxX: x + w/2,
        minY: y - h/2, maxY: y + h/2,
        minZ: z - d/2, maxZ: z + d/2
    });
}

function addInteract(x, y, z, radius, data) {
    interactables.push({ x, y, z, radius, data });
}

function wallCollider(x, z, w, d) {
    addCol(x, CFG.WALL_H / 2, z, w, CFG.WALL_H, d);
}

// ============================================
// 6. GENERATION DE LA MAISON
// ============================================
// Layout: Maison 14m x 10m, 3 etages
// Ground (y=0): 4 pieces + couloir
// Upstairs (y=3): 3 pieces + couloir
// Basement (y=-3): 2 pieces

const M = {}; // Materials

function buildHouse() {
    M.wall = mat(0x5a4a3a);
    M.wall2 = mat(0x4d3f32);
    M.floor = mat(0x3a3020);
    M.floorUp = mat(0x3a2818);
    M.ceiling = mat(0x2a2218);
    M.dark = mat(0x1a1510);
    M.wood = mat(0x6a4420);
    M.woodDark = mat(0x4a2a10);
    M.stone = mat(0x444440);
    M.metal = mat(0x666666, { metalness: 0.6, roughness: 0.4 });
    M.brick = mat(0x6a3a2a);
    M.carpet = mat(0x4a1818);
    M.tile = mat(0x888888, { roughness: 0.3 });

    const W = CFG.WALL_T;
    const H = CFG.WALL_H;
    const FH = CFG.FLOOR_THICK;

    // Helper: creates a wall from center, with optional door gaps
    // xz: 'x' means wall runs along X axis, 'z' means along Z axis
    function fullWall(cx, cy, cz, length, axis, mat) {
        const w = axis === 'x' ? length + W : W;
        const d = axis === 'z' ? length + W : W;
        box(cx, cy, cz, w, H, d, mat, true);
        addCol(cx, cy, cz, w, H, d);
    }

    // Wall with door gap
    function wallWithDoor(cx, cy, cz, length, axis, doorOffset, doorW, mat) {
        // doorOffset is position of door center along the wall axis from wall start
        const halfLen = length / 2;
        const doorStart = doorOffset - doorW / 2;
        const doorEnd = doorOffset + doorW / 2;

        // Segment before door
        const seg1Len = doorStart + halfLen;
        if (seg1Len > 0.1) {
            const seg1Center = -halfLen + seg1Len / 2;
            if (axis === 'z') {
                box(cx, cy, cz + seg1Center, W, H, seg1Len + W/2, mat, true);
                addCol(cx, cy, cz + seg1Center, W, H, seg1Len + W/2);
            } else {
                box(cx + seg1Center, cy, cz, seg1Len + W/2, H, W, mat, true);
                addCol(cx + seg1Center, cy, cz, seg1Len + W/2, H, W);
            }
        }

        // Segment after door
        const seg2Len = halfLen - doorEnd;
        if (seg2Len > 0.1) {
            const seg2Center = halfLen - seg2Len / 2;
            if (axis === 'z') {
                box(cx, cy, cz + seg2Center, W, H, seg2Len + W/2, mat, true);
                addCol(cx, cy, cz + seg2Center, W, H, seg2Len + W/2);
            } else {
                box(cx + seg2Center, cy, cz, seg2Len + W/2, H, W, mat, true);
                addCol(cx + seg2Center, cy, cz, seg2Len + W/2, H, W);
            }
        }

        // Lintel above door
        const lintelH = H * 0.3;
        const lintelY = cy + H/2 - lintelH/2;
        if (axis === 'z') {
            box(cx, lintelY, cz + doorOffset, W, lintelH, doorW + W, mat, true);
        } else {
            box(cx + doorOffset, lintelY, cz, doorW + W, lintelH, W, mat, true);
        }
    }

    // ==================================================
    // REZ-DE-CHausSEE (y = 0)
    // Maison 14x10, X: -7 a 7, Z: -5 a 5
    // ==================================================

    // --- Sol ---
    box(0, 0, 0, 14.5, FH, 10.5, M.floor, false, 'floor_g');

    // --- Plafond ---
    box(0, H, 0, 14.5, FH, 10.5, M.ceiling, false, 'ceil_g');

    // === MURS EXTERIEURS (pleins, sans trou sauf porte entree) ===

    // Mur arriere (Z = -5) - plein
    fullWall(0, H/2, -5, 14, 'x', M.wall);

    // Mur avant (Z = 5) - avec porte entree au centre
    wallWithDoor(0, H/2, 5, 14, 'x', 0, 2, M.wall);

    // Mur gauche (X = -7) - plein
    fullWall(-7, H/2, 0, 10, 'z', M.wall);

    // Mur droit (X = 7) - plein
    fullWall(7, H/2, 0, 10, 'z', M.wall);

    // === COINS (pour eviter les trous) ===
    box(-7, H/2, -5, W*2, H, W*2, M.wall, true);
    box(7, H/2, -5, W*2, H, W*2, M.wall, true);
    box(-7, H/2, 5, W*2, H, W*2, M.wall, true);
    box(7, H/2, 5, W*2, H, W*2, M.wall, true);

    // === MURS INTERIEURS ===

    // Mur vertical central X=0 (Z=-5 a Z=5) avec 2 portes
    wallWithDoor(0, H/2, -3, 4, 'z', 0, 1.2, M.wall2);  // Partie arriere (porte a Z=-3)
    wallWithDoor(0, H/2, 3, 4, 'z', 0, 1.2, M.wall2);   // Partie avant (porte a Z=3)

    // Mur horizontal Z=0 (X=-7 a X=7) avec 2 portes
    wallWithDoor(-3.5, H/2, 0, 7, 'x', 0, 1.2, M.wall2);  // Partie gauche (porte a X=-3.5)
    wallWithDoor(3.5, H/2, 0, 7, 'x', 0, 1.2, M.wall2);   // Partie droite (porte a X=3.5)

    // === PORTES ===
    createDoor(0, H/2, 5, 2, 2.4, 'door_front',  M.wood, { name: 'Porte d\'entree', required: 'final_key' });
    createDoor(0, H/2, -3, 1.2, 2.4, 'door_back_inner', M.woodDark, null);
    createDoor(0, H/2, 3, 1.2, 2.4, 'door_front_inner', M.woodDark, null);
    createDoor(-3.5, H/2, 0, 1.2, 2.4, 'door_left_inner', M.woodDark, null);
    createDoor(3.5, H/2, 0, 1.2, 2.4, 'door_right_inner', M.woodDark, null);

    // === ESCALIERS ===
    // Escalier vers etage (coin droit-avant)
    for (let i = 0; i < 7; i++) {
        box(5.5, i * (H/7) + 0.05, 3.5 - i * 0.4, 1.8, 0.15, 0.45, M.wood, true);
    }
    addCol(5.5, H/2, 2, 1.8, H, 3.5);

    // Escalier vers sous-sol (coin gauche-arriere)
    for (let i = 0; i < 7; i++) {
        box(-5.5, -i * (H/7) - 0.05, -3.5 + i * 0.4, 1.8, 0.15, 0.45, M.woodDark, true);
    }
    addCol(-5.5, H/2, -2, 1.8, H, 3.5);

    // ==================================================
    // ETAGE (y = 3)
    // ==================================================
    const FY = 3;

    // Sol
    box(0, FY, 0, 14.5, FH, 10.5, M.floorUp, false, 'floor_u');

    // Plafond
    box(0, FY + H, 0, 14.5, FH, 10.5, M.ceiling, false, 'ceil_u');

    // Murs exterieurs etage
    fullWall(0, FY + H/2, -5, 14, 'x', M.wall);
    wallWithDoor(0, FY + H/2, 5, 14, 'x', 0, 1.2, M.wall);
    fullWall(-7, FY + H/2, 0, 10, 'z', M.wall);
    fullWall(7, FY + H/2, 0, 10, 'z', M.wall);

    // Coins etage
    box(-7, FY + H/2, -5, W*2, H, W*2, M.wall, true);
    box(7, FY + H/2, -5, W*2, H, W*2, M.wall, true);
    box(-7, FY + H/2, 5, W*2, H, W*2, M.wall, true);
    box(7, FY + H/2, 5, W*2, H, W*2, M.wall, true);

    // Murs interieurs etage
    fullWall(0, FY + H/2, -3, 4, 'z', M.wall2);
    fullWall(0, FY + H/2, 3, 4, 'z', M.wall2);
    fullWall(-3.5, FY + H/2, 0, 7, 'x', M.wall2);
    fullWall(3.5, FY + H/2, 0, 7, 'x', M.wall2);

    // Portes etage
    createDoor(0, FY + H/2, -2, 1.2, 2.4, 'door_bed1', M.wood, { name: 'Chambre 1', required: 'bedroom_key' });
    createDoor(0, FY + H/2, 2, 1.2, 2.4, 'door_bed2', M.woodDark, null);

    // ==================================================
    // SOUS-SOL (y = -3)
    // ==================================================
    const FB = -3;

    // Sol
    box(0, FB, 0, 14.5, FH, 10.5, M.stone, false, 'floor_b');

    // Plafond
    box(0, FB + H, 0, 14.5, FH, 10.5, M.dark, false, 'ceil_b');

    // Murs exterieurs sous-sol
    fullWall(0, FB + H/2, -5, 14, 'x', M.stone);
    fullWall(0, FB + H/2, 5, 14, 'x', M.stone);
    fullWall(-7, FB + H/2, 0, 10, 'z', M.stone);
    fullWall(7, FB + H/2, 0, 10, 'z', M.stone);

    // Coins sous-sol
    box(-7, FB + H/2, -5, W*2, H, W*2, M.stone, true);
    box(7, FB + H/2, -5, W*2, H, W*2, M.stone, true);
    box(-7, FB + H/2, 5, W*2, H, W*2, M.stone, true);
    box(7, FB + H/2, 5, W*2, H, W*2, M.stone, true);

    // Mur central sous-sol
    fullWall(0, FB + H/2, 0, 10, 'z', M.stone);

    // Porte sous-sol
    createDoor(0, FB + H/2, 2, 1.2, 2.4, 'door_basement', M.metal, { name: 'Porte sous-sol', required: 'basement_key' });

    // ==================================================
    // ECLAIRAGE
    // ==================================================

    // Ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Hemisphere light for global fill
    scene.add(new THREE.HemisphereLight(0xffeedd, 0x443322, 0.6));

    // Lumieres par piece - REZ-DE-CHausSEE (intensite haute, portee grande)
    addLight(-3.5, 2.5, 2.5, 0xffcc88, 2.5, 14);   // Salon
    addLight(3.5, 2.5, 2.5, 0xffcc88, 2.2, 14);     // Cuisine
    addLight(-3.5, 2.5, -2.5, 0xffcc88, 2.0, 12);   // SdB
    addLight(3.5, 2.5, -2.5, 0xffcc88, 2.0, 12);    // Rangement
    addLight(0, 2.5, 0, 0xffddaa, 1.5, 10);          // Couloir

    // ETAGE
    addLight(-3.5, FY + 2.5, 2.5, 0xffcc88, 2.0, 12);  // Chambre 1
    addLight(3.5, FY + 2.5, 2.5, 0xffcc88, 2.0, 12);   // Chambre 2
    addLight(0, FY + 2.5, -2, 0xffccaa, 1.5, 10);       // Couloir etage

    // SOUS-SOL
    addLight(-3.5, FB + 2.5, 0, 0xbbccee, 1.5, 10);   // Stockage
    addLight(3.5, FB + 2.5, 0, 0x99bbdd, 1.2, 10);     // Generateur

    // Lumieres supplementaires pour eviter les angles morts
    addLight(-6, 2.5, 4, 0xffcc88, 1.0, 6);
    addLight(6, 2.5, 4, 0xffcc88, 1.0, 6);
    addLight(-6, 2.5, -4, 0xffcc88, 0.8, 5);
    addLight(6, 2.5, -4, 0xffcc88, 0.8, 5);
    addLight(-3.5, FY + 2.5, 4, 0xffcc88, 1.0, 6);
    addLight(3.5, FY + 2.5, 4, 0xffcc88, 1.0, 6);
    addLight(-3.5, FB + 2.5, 4, 0x99bbdd, 1.0, 6);
    addLight(3.5, FB + 2.5, 4, 0x99bbdd, 1.0, 6);

    // Lumiere lune (exterieur)
    const moon = new THREE.DirectionalLight(0x445577, 0.5);
    moon.position.set(-15, 25, -10);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    const sc = moon.shadow.camera;
    sc.near = 1; sc.far = 60; sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20;
    scene.add(moon);

    // ==================================================
    // SOL EXTERIEUR
    // ==================================================
    box(0, -0.05, 0, 50, 0.1, 50, mat(0x1a1a10), false, 'ground_out');

    // ==================================================
    // MEUBLES
    // ==================================================
    buildFurniture();
}

function addLight(x, y, z, color, intensity, dist) {
    const l = new THREE.PointLight(color, intensity, dist);
    l.position.set(x, y, z);
    scene.add(l);
}

// ============================================
// 7. MEUBLES
// ============================================
function buildFurniture() {
    const Y = 0;
    const FY = 3;
    const BY = -3;

    // ---- SALON (X:-7 a 0, Z:0 a 5) ----
    // Canape (long, face mur arriere)
    box(-3.5, 0.35, 4.2, 3, 0.7, 0.9, mat(0x5a2020), true);
    addCol(-3.5, 0.35, 4.2, 3, 0.7, 0.9);
    // Accoudoirs
    box(-5, 0.55, 4.2, 0.3, 0.5, 0.9, mat(0x4a1818), true);
    box(-2, 0.55, 4.2, 0.3, 0.5, 0.9, mat(0x4a1818), true);

    // Table basse
    box(-3.5, 0.3, 2.5, 1.4, 0.06, 0.7, M.wood, true);
    cyl(-4.1, 0.15, 2.2, 0.04, 0.04, 0.3, 8, M.wood, false);
    cyl(-2.9, 0.15, 2.2, 0.04, 0.04, 0.3, 8, M.wood, false);
    cyl(-4.1, 0.15, 2.8, 0.04, 0.04, 0.3, 8, M.wood, false);
    cyl(-2.9, 0.15, 2.8, 0.04, 0.04, 0.3, 8, M.wood, false);

    // Etagere mur gauche
    box(-6.7, 1.2, 2, 0.35, 2, 2.5, M.woodDark, true);
    addCol(-6.7, 1.2, 2, 0.35, 2, 2.5);

    // Lampe sol (coin)
    cyl(-6.5, 0.7, 4.5, 0.08, 0.12, 1.4, 8, M.metal, true);
    box(-6.5, 1.5, 4.5, 0.4, 0.3, 0.4, mat(0xddcc88), true);
    addLight(-6.5, 1.8, 4.5, 0xffcc88, 0.3, 4);

    // ---- CUISINE (X:0 a 7, Z:0 a 5) ----
    // Plan de travail haut droit
    box(5.5, 0.45, 4.2, 2.5, 0.9, 0.65, M.metal, true);
    addCol(5.5, 0.45, 4.2, 2.5, 0.9, 0.65);

    // Plan de travail arriere
    box(5.5, 0.45, 1.5, 2.5, 0.9, 0.65, M.metal, true);
    addCol(5.5, 0.45, 1.5, 2.5, 0.9, 0.65);

    // Table cuisine
    box(3, 0.4, 3, 1.6, 0.06, 0.9, M.wood, true);
    cyl(2.5, 0.2, 2.7, 0.04, 0.04, 0.4, 8, M.wood, false);
    cyl(3.5, 0.2, 2.7, 0.04, 0.04, 0.4, 8, M.wood, false);
    cyl(2.5, 0.2, 3.3, 0.04, 0.04, 0.4, 8, M.wood, false);
    cyl(3.5, 0.2, 3.3, 0.04, 0.04, 0.4, 8, M.wood, false);

    // Chaises
    box(2.2, 0.25, 3, 0.4, 0.5, 0.4, M.woodDark, true);
    box(3.8, 0.25, 3, 0.4, 0.5, 0.4, M.woodDark, true);

    // ---- SALLE DE BAIN (X:-7 a 0, Z:-5 a 0) ----
    // Baignoire
    box(-3, 0.4, -3.5, 1.8, 0.8, 2.5, mat(0xdddddd), true);
    addCol(-3, 0.4, -3.5, 1.8, 0.8, 2.5);
    // Interior baignoire (plus sombre)
    box(-3, 0.4, -3.5, 1.5, 0.7, 2.2, mat(0xbbbbbb), false);

    // Lavabo
    box(-6, 0.7, -1.5, 0.6, 0.15, 0.5, mat(0xeeeeee), true);
    cyl(-6, 0.45, -1.5, 0.25, 0.3, 0.5, 8, mat(0xdddddd), true);
    addCol(-6, 0.7, -1.5, 0.6, 1, 0.5);

    // ---- RANGEMENT (X:0 a 7, Z:-5 a 0) ----
    // Grande armoire
    box(5, 1, -4, 1.5, 2, 0.7, M.woodDark, true);
    addCol(5, 1, -4, 1.5, 2, 0.7);

    // Etagere murale
    box(6.7, 1.5, -2.5, 0.3, 0.1, 2, M.wood, true);

    // Coffre
    box(2, 0.35, -4, 0.8, 0.7, 0.5, M.woodDark, true);
    addCol(2, 0.35, -4, 0.8, 0.7, 0.5);
    addInteract(2, 0.5, -4, 2.5, { type: 'container', label: 'Ouvrir le coffre [E]' });

    // ---- CHAMBRE 1 ETAGE (X:-7 a 0, Z:0 a 5, Y:3) ----

    // Lit
    box(-3.5, FY + 0.3, 3.5, 2, 0.6, 1.2, mat(0x5a3020), true);
    addCol(-3.5, FY + 0.3, 3.5, 2, 0.6, 1.2);
    // Oreiller
    box(-3.5, FY + 0.65, 4, 0.6, 0.12, 0.35, mat(0xddddcc), true);
    // Tete de lit
    box(-3.5, FY + 0.8, 2.8, 2, 0.8, 0.15, M.woodDark, true);

    hideSpots.push({ x: -3.5, y: FY, z: 3.5, type: 'bed', label: 'Se cacher sous le lit [H]' });

    // Table de nuit
    box(-5.5, FY + 0.35, 3.5, 0.5, 0.7, 0.4, M.wood, true);
    addCol(-5.5, FY + 0.35, 3.5, 0.5, 0.7, 0.4);
    // Lampe
    cyl(-5.5, FY + 0.85, 3.5, 0.05, 0.08, 0.3, 8, M.metal, true);
    box(-5.5, FY + 1.05, 3.5, 0.2, 0.18, 0.2, mat(0xddaa66), true);
    addLight(-5.5, FY + 1.2, 3.5, 0xffcc88, 0.25, 3);

    // Armoire
    box(-1, FY + 1, 4.5, 1, 2, 0.6, M.woodDark, true);
    addCol(-1, FY + 1, 4.5, 1, 2, 0.6);
    hideSpots.push({ x: -1, y: FY, z: 4.2, type: 'closet', label: 'Se cacher dans l\'armoire [H]' });

    // ---- CHAMBRE 2 ETAGE (X:0 a 7, Z:0 a 5, Y:3) ----
    // Lit
    box(3.5, FY + 0.3, 3.5, 2, 0.6, 1.2, mat(0x5a3020), true);
    addCol(3.5, FY + 0.3, 3.5, 2, 0.6, 1.2);
    box(3.5, FY + 0.65, 4, 0.6, 0.12, 0.35, mat(0xddddcc), true);
    box(3.5, FY + 0.8, 2.8, 2, 0.8, 0.15, M.woodDark, true);

    hideSpots.push({ x: 3.5, y: FY, z: 3.5, type: 'bed', label: 'Se cacher sous le lit [H]' });

    // Bureau
    box(6, FY + 0.4, 1.5, 1.2, 0.06, 0.7, M.wood, true);
    addCol(6, FY + 0.4, 1.5, 1.2, 0.8, 0.7);

    // Armoire
    box(1, FY + 1, 4.5, 1, 2, 0.6, M.woodDark, true);
    addCol(1, FY + 1, 4.5, 1, 2, 0.6);
    hideSpots.push({ x: 1, y: FY, z: 4.2, type: 'closet', label: 'Se cacher dans l\'armoire [H]' });

    // ---- COULOIR ETAGE (Z:-5 a 0) ----
    box(-1, FY + 1.2, -2.5, 0.4, 0.08, 1.5, M.wood, true);

    // ---- SOUS-SOL ----

    // Generateur
    box(4, BY + 0.7, 0, 1.5, 1.4, 1.2, M.metal, true);
    addCol(4, BY + 0.7, 0, 1.5, 1.4, 1.2);
    // Detail generateur
    cyl(4, BY + 1.5, 0, 0.15, 0.15, 0.4, 8, M.metal, true);
    addInteract(4, BY + 0.8, 0, 3, { type: 'generator', label: 'Reparer le generateur [E]' });

    // Caisses stockage
    box(-4, BY + 0.4, 2, 0.8, 0.8, 0.8, M.wood, true);
    addCol(-4, BY + 0.4, 2, 0.8, 0.8, 0.8);
    box(-3, BY + 0.4, 2.5, 0.7, 0.7, 0.7, M.woodDark, true);
    addCol(-3, BY + 0.4, 2.5, 0.7, 0.7, 0.7);
    box(-3.5, BY + 1.0, 2.2, 0.6, 0.6, 0.6, M.wood, true);

    // Etagere sous-sol
    box(-6.7, BY + 1, -2, 0.3, 2, 3, M.woodDark, true);
    addCol(-6.7, BY + 1, -2, 0.3, 2, 3);
}

// ============================================
// 8. PORTES
// ============================================
function createDoor(x, y, z, w, h, id, material, config) {
    const mesh = box(x, y, z, w, h, 0.12, material, true, id);
    const door = { mesh, id, config, open: false, locked: !!config, origY: y, h };
    doorObjects.push(door);
    addCol(x, y, z, w, h, 0.2);
    addInteract(x, y, z, 3, { type: 'door', doorId: id, label: config ? config.name + ' [E]' : 'Porte [E]' });
    return mesh;
}

function toggleDoor(id) {
    const door = doorObjects.find(d => d.id === id);
    if (!door) return;

    if (door.locked) {
        const playerKey = playerInv.find(k => k === door.config.required);
        if (playerKey) {
            door.locked = false;
            removeFromInv(door.config.required);
            notify('Debloquee : ' + door.config.name, 'success');
        } else {
            SFX.lock();
            notify('Verrouillee ! Il faut : ' + (door.config.required.replace('_key', '').replace('_', ' ')), 'warning');
            return;
        }
    }

    door.open = !door.open;
    door.mesh.position.y = door.open ? door.origY + door.h + 0.1 : door.origY;
    SFX.door();

    if (!door.open) {
        addCol(door.mesh.position.x, door.origY, door.mesh.position.z, door.mesh.geometry.parameters.width, door.h, 0.2);
    } else {
        const cx = door.mesh.position.x;
        const cz = door.mesh.position.z;
        colliders = colliders.filter(c => {
            const mx = (c.minX + c.maxX) / 2;
            const mz = (c.minZ + c.maxZ) / 2;
            return !(Math.abs(mx - cx) < 1 && Math.abs(mz - cz) < 1 && c.maxY > 1);
        });
    }

    enemyNoise(door.open ? 5 : 3, door.mesh.position.x, door.mesh.position.z);
}

// ============================================
// 9. ITEMS
// ============================================
function spawnItems() {
    const defs = Object.entries(CFG.ITEM_DEFS);
    const FY = 3, BY = -3;

    const spots = [
        // Ground floor
        [-3.5, 0.6, 2.5],   // Table basse salon
        [-6.5, 2.2, 2],     // Etagere salon
        [5.5, 1.0, 4.2],    // Plan cuisine
        [3, 0.6, 3],        // Table cuisine
        [-3, 1.0, -3.5],    // Baignoire
        [2, 0.7, -4],       // Coffre rangement
        // Upstairs
        [-5.5, FY + 0.9, 3.5], // Table nuit chambre 1
        [-1, FY + 1.5, 4.5],   // Armoire chambre 1
        [6, FY + 0.5, 1.5],    // Bureau chambre 2
        [1, FY + 1.5, 4.5],    // Armoire chambre 2
        // Basement
        [4, BY + 1.0, 0],      // Pres generateur
        [-4, BY + 1.0, 2],     // Caisses
    ];

    // Shuffle spots
    for (let i = spots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spots[i], spots[j]] = [spots[j], spots[i]];
    }

    // Always spawn critical items first
    const critical = ['cellar_key', 'bedroom_key', 'basement_key', 'final_key', 'gen_part1', 'gen_part2', 'wire_cutter'];
    const others = defs.filter(([id]) => !critical.includes(id));

    let idx = 0;
    critical.forEach(([id, def]) => {
        if (idx < spots.length) {
            const [x, y, z] = spots[idx++];
            spawnItem(x, y, z, id, def);
        }
    });

    // Random extras
    const extra = others.sort(() => Math.random() - 0.5).slice(0, 3);
    extra.forEach(([id, def]) => {
        if (idx < spots.length) {
            const [x, y, z] = spots[idx++];
            spawnItem(x, y, z, id, def);
        }
    });

    totalItems = itemObjects.length;
}

function spawnItem(x, y, z, id, def) {
    const group = new THREE.Group();

    // Modeles 3D differents selon le type
    switch (def.shape) {
        case 'key': {
            // Cle: manche + tete
            const handle = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.18, 0.03),
                new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.7, roughness: 0.3 })
            );
            handle.position.y = 0;
            group.add(handle);
            const head = new THREE.Mesh(
                new THREE.TorusGeometry(0.06, 0.015, 6, 8),
                new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.7, roughness: 0.3 })
            );
            head.position.y = 0.12;
            group.add(head);
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.12, 0.02),
                new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.7, roughness: 0.3 })
            );
            blade.position.y = -0.12;
            group.add(blade);
            break;
        }
        case 'gear': {
            // Engrenage
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.08, 0.02, 6, 12),
                new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.8, roughness: 0.3 })
            );
            group.add(ring);
            const center = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8),
                new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.8, roughness: 0.3 })
            );
            group.add(center);
            for (let i = 0; i < 6; i++) {
                const tooth = new THREE.Mesh(
                    new THREE.BoxGeometry(0.025, 0.04, 0.02),
                    new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.8, roughness: 0.3 })
                );
                const a = (i / 6) * Math.PI * 2;
                tooth.position.set(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
                tooth.rotation.y = a;
                group.add(tooth);
            }
            break;
        }
        case 'tool': {
            // Outil (pied-de-biche / coupe-fil)
            const handle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.02, 0.25, 6),
                new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 })
            );
            handle.rotation.z = Math.PI / 2;
            group.add(handle);
            const head = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.04, 0.03),
                new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.7, roughness: 0.3 })
            );
            head.position.x = 0.15;
            group.add(head);
            break;
        }
        case 'cylinder': {
            // Lampe torche
            const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.03, 0.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.4 })
            );
            group.add(body);
            const lens = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.025, 0.04, 8),
                new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffff88, emissiveIntensity: 0.5 })
            );
            lens.position.y = 0.12;
            group.add(lens);
            break;
        }
        case 'box': {
            // Trousse de soin
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.1, 0.08),
                new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6 })
            );
            group.add(body);
            const cross1 = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.02, 0.01),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            cross1.position.z = 0.045;
            group.add(cross1);
            const cross2 = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.06, 0.01),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            cross2.position.z = 0.045;
            group.add(cross2);
            break;
        }
    }

    // Halo lumineux
    const glow = new THREE.PointLight(def.color, 0.3, 2);
    glow.position.y = 0.15;
    group.add(glow);

    group.position.set(x, y, z);
    scene.add(group);

    const obj = { group, id, def, collected: false };
    itemObjects.push(obj);
    addInteract(x, y, z, 2.5, { type: 'item', obj, label: def.icon + ' ' + def.name + ' [E]' });
}

function collectItem(obj) {
    if (obj.collected) return;
    obj.collected = true;
    scene.remove(obj.group);
    playerInv.push(obj.id);
    itemsFound++;
    SFX.pickup();
    notify('Trouve : ' + obj.def.icon + ' ' + obj.def.name, 'success');
    updateInvUI();
}

// ============================================
// 10. JOUEUR
// ============================================
const playerInv = [];
let playerPos = new THREE.Vector3(0, CFG.CAM_H, 4);
let playerVel = new THREE.Vector3();
let playerRotX = 0, playerRotY = 0;
let playerStamina = 100;
let playerHealth = 100;
let playerCrouch = false;
let playerSprint = false;
let playerHiding = false;
let playerHideType = null;
let playerFlashlightOn = false;
let playerFlashlight = null;
let playerNoise = 0;
let footstepCD = 0;
let selectedSlot = 0;

function initPlayer() {
    playerPos.set(-2, CFG.CAM_H, 2);
    playerVel.set(0, 0, 0);
    playerRotX = 0; playerRotY = 0;
    playerStamina = 100;
    playerHealth = 100;
    playerCrouch = false;
    playerSprint = false;
    playerHiding = false;
    playerFlashlightOn = false;
    playerInv.length = 0;

    // Flashlight
    if (playerFlashlight) { scene.remove(playerFlashlight); playerFlashlight = null; }
    const fl = new THREE.SpotLight(0xffffcc, 1.8, 20, 0.35, 0.5, 1.5);
    fl.position.set(0, 0, 0);
    fl.target.position.set(0, 0, -1);
    camera.add(fl);
    camera.add(fl.target);
    scene.add(camera);
    playerFlashlight = fl;
    fl.visible = false;
}

// ============================================
// 11. ENNEMI
// ============================================
const EST = { IDLE: 0, PATROL: 1, ALERT: 2, CHASE: 3, SEARCH: 4, RETURN: 5 };

const enemy = {
    mesh: null,
    state: EST.PATROL,
    pos: new THREE.Vector3(-3.5, 0, -2.5),
    target: new THREE.Vector3(),
    speed: CFG.ENEMY_SPEED_PATROL,
    timer: 0,
    lastKnown: null,
    seePlayer: false,
    wpIdx: 0,
    wps: [],
    growlCD: 0,
    chaseCD: 0,
    distToPlayer: 999,
    armL: null, armR: null, legL: null, legR: null, torso: null,
};

function createEnemy() {
    const g = new THREE.Group();
    const skin = mat(0x1a1015);
    const cloth = mat(0x221518);

    // Torso
    enemy.torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 8), cloth);
    enemy.torso.position.y = 1.2;
    enemy.torso.castShadow = true;
    g.add(enemy.torso);

    // Tete
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), skin);
    head.position.y = 2.1;
    head.castShadow = true;
    g.add(head);

    // Yeux
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 1 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), eyeMat);
    eyeL.position.set(-0.07, 2.14, -0.17);
    g.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), eyeMat);
    eyeR.position.set(0.07, 2.14, -0.17);
    g.add(eyeR);

    // Lumiere yeux
    const el = new THREE.PointLight(0xff2200, 0.4, 6);
    el.position.set(0, 2.1, -0.3);
    g.add(el);

    // Bras
    enemy.armL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6), skin);
    enemy.armL.position.set(-0.35, 1.25, 0);
    g.add(enemy.armL);
    enemy.armR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6), skin);
    enemy.armR.position.set(0.35, 1.25, 0);
    g.add(enemy.armR);

    // Jambes
    enemy.legL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.8, 6), cloth);
    enemy.legL.position.set(-0.13, 0.4, 0);
    g.add(enemy.legL);
    enemy.legR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.8, 6), cloth);
    enemy.legR.position.set(0.13, 0.4, 0);
    g.add(enemy.legR);

    g.position.copy(enemy.pos);
    scene.add(g);
    enemy.mesh = g;

    // Waypoints
    enemy.wps = [
        new THREE.Vector3(-3.5, 0, 2.5),   // Salon
        new THREE.Vector3(3.5, 0, 2.5),     // Cuisine
        new THREE.Vector3(-3.5, 0, -2.5),   // SdB
        new THREE.Vector3(3.5, 0, -2.5),    // Rangement
        new THREE.Vector3(-3.5, 3, 2.5),    // Chambre 1
        new THREE.Vector3(3.5, 3, 2.5),     // Chambre 2
        new THREE.Vector3(-3.5, -3, 0),     // Sous-sol stockage
        new THREE.Vector3(3.5, -3, 0),      // Sous-sol generateur
    ];
    enemy.target.copy(enemy.wps[0]);
}

function updateEnemy(dt) {
    if (!enemy.mesh || !gameRunning || gamePaused) return;

    const pp = playerPos.clone();
    pp.y = 0;
    const ep = enemy.pos.clone();
    ep.y = 0;
    enemy.distToPlayer = ep.distanceTo(pp);

    const dir = new THREE.Vector3().subVectors(pp, ep).normalize();
    enemy.seePlayer = enemy.distToPlayer < CFG.ENEMY_DETECT && !playerHiding && lineOfSight(enemy.pos, playerPos);

    const hearRange = playerSprint ? CFG.ENEMY_HEAR_RUN : CFG.ENEMY_HEAR;
    const canHear = enemy.distToPlayer < hearRange && playerNoise > 0.1 && !playerHiding;

    switch (enemy.state) {
        case EST.IDLE:
            enemy.timer -= dt;
            enemy.speed = 0;
            animIdle(dt);
            if (enemy.timer <= 0) { enemy.state = EST.PATROL; nextWP(); }
            if (enemy.seePlayer || canHear) toChase();
            break;

        case EST.PATROL:
            enemy.speed = CFG.ENEMY_SPEED_PATROL;
            moveEnemy(enemy.target, enemy.speed, dt);
            animWalk(dt);
            if (enemy.pos.distanceTo(enemy.target) < 1.2) {
                enemy.state = EST.IDLE;
                enemy.timer = 2 + Math.random() * 3;
                SFX.creak();
            }
            if (enemy.seePlayer || canHear) toChase();
            break;

        case EST.ALERT:
            enemy.speed = CFG.ENEMY_SPEED_SEARCH;
            moveEnemy(enemy.lastKnown, enemy.speed, dt);
            animWalk(dt);
            if (enemy.pos.distanceTo(enemy.lastKnown) < 2) {
                enemy.state = EST.SEARCH;
                enemy.timer = CFG.ENEMY_SEARCH_TIME;
            }
            if (enemy.seePlayer) toChase();
            break;

        case EST.CHASE:
            enemy.speed = CFG.ENEMY_SPEED_CHASE;
            moveEnemy(playerPos, enemy.speed, dt);
            animRun(dt);
            enemy.timer = CFG.ENEMY_CHASE_TIME;
            enemy.lastKnown = playerPos.clone();

            enemy.chaseCD -= dt;
            if (enemy.chaseCD <= 0) { SFX.chase(); enemy.chaseCD = 2; }

            if (enemy.distToPlayer < 1.5 && !playerHiding) attackPlayer();

            if (!enemy.seePlayer && !canHear) {
                enemy.state = EST.SEARCH;
                enemy.timer = CFG.ENEMY_SEARCH_TIME;
            }
            break;

        case EST.SEARCH: {
            enemy.speed = CFG.ENEMY_SPEED_SEARCH;
            const sp = enemy.lastKnown.clone();
            sp.x += Math.sin(gameTime * 1.5) * 4;
            sp.z += Math.cos(gameTime * 1.5) * 4;
            moveEnemy(sp, enemy.speed, dt);
            animWalk(dt);
            enemy.timer -= dt;
            if (enemy.timer <= 0) { enemy.state = EST.RETURN; nextWP(); }
            if (enemy.seePlayer || canHear) toChase();
            break;
        }

        case EST.RETURN:
            enemy.speed = CFG.ENEMY_SPEED_PATROL;
            moveEnemy(enemy.target, enemy.speed, dt);
            animWalk(dt);
            if (enemy.pos.distanceTo(enemy.target) < 1.5) {
                enemy.state = EST.PATROL;
                nextWP();
            }
            if (enemy.seePlayer || canHear) toChase();
            break;
    }

    enemy.mesh.position.copy(enemy.pos);
    const lookTarget = enemy.state === EST.CHASE ? playerPos : enemy.target;
    enemy.mesh.lookAt(lookTarget.x, enemy.pos.y, lookTarget.z);

    enemy.growlCD -= dt;
    if (enemy.growlCD <= 0 && enemy.distToPlayer < 10) {
        SFX.growl();
        enemy.growlCD = 6 + Math.random() * 8;
    }
}

function toChase() {
    if (playerHiding) return;
    enemy.state = EST.CHASE;
    enemy.timer = CFG.ENEMY_CHASE_TIME;
    enemy.lastKnown = playerPos.clone();
    SFX.growl();
}

function nextWP() {
    enemy.wpIdx = (enemy.wpIdx + 1) % enemy.wps.length;
    enemy.target.copy(enemy.wps[enemy.wpIdx]);
}

function moveEnemy(target, speed, dt) {
    const dir = new THREE.Vector3().subVectors(target, enemy.pos);
    dir.y = 0;
    if (dir.length() < 0.2) return;
    dir.normalize();
    const np = enemy.pos.clone().add(dir.clone().multiplyScalar(speed * dt));
    if (!colCheck(np.x, enemy.pos.y, np.z, 0.3)) {
        enemy.pos.copy(np);
    }
}

function lineOfSight(from, to) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    dir.normalize();
    const rc = new THREE.Raycaster(from.clone().add(new THREE.Vector3(0, 1.5, 0)), dir, 0, dist);
    const hits = rc.intersectObjects(scene.children.filter(c => c.isMesh), false);
    for (const h of hits) {
        if (h.distance < dist - 0.5) return false;
    }
    return true;
}

function attackPlayer() {
    if (playerHealth <= 0) return;
    playerHealth -= 35;
    SFX.hit();
    screenFlash();
    enemy.state = EST.SEARCH;
    enemy.timer = 5;
    enemy.lastKnown = playerPos.clone();
    if (playerHealth <= 0) {
        playerHealth = 0;
        gameOver('Le monstre vous a attrape...');
    }
}

function animIdle(dt) {
    const t = gameTime * 1.5;
    enemy.torso.position.y = 1.2 + Math.sin(t) * 0.015;
    enemy.armL.rotation.x = Math.sin(t) * 0.08;
    enemy.armR.rotation.x = Math.sin(t + 1) * 0.08;
    enemy.legL.rotation.x = 0;
    enemy.legR.rotation.x = 0;
}

function animWalk(dt) {
    const t = gameTime * 5;
    enemy.legL.rotation.x = Math.sin(t) * 0.5;
    enemy.legR.rotation.x = Math.sin(t + Math.PI) * 0.5;
    enemy.armL.rotation.x = Math.sin(t + Math.PI) * 0.3;
    enemy.armR.rotation.x = Math.sin(t) * 0.3;
    enemy.torso.position.y = 1.2 + Math.abs(Math.sin(t)) * 0.02;
}

function animRun(dt) {
    const t = gameTime * 9;
    enemy.legL.rotation.x = Math.sin(t) * 0.8;
    enemy.legR.rotation.x = Math.sin(t + Math.PI) * 0.8;
    enemy.armL.rotation.x = Math.sin(t + Math.PI) * 0.6;
    enemy.armR.rotation.x = Math.sin(t) * 0.6;
    enemy.torso.position.y = 1.2 + Math.abs(Math.sin(t)) * 0.05;
}

// ============================================
// 12. COLLISIONS
// ============================================
function colCheck(x, y, z, r) {
    for (const c of colliders) {
        if (x + r > c.minX && x - r < c.maxX &&
            y + CFG.CAM_H > c.minY && y - 0.1 < c.maxY &&
            z + r > c.minZ && z - r < c.maxZ) {
            return true;
        }
    }
    return false;
}

// ============================================
// 13. CONTROLES
// ============================================
const keys = {};
let ptrLocked = false;

function initControls() {
    addEventListener('keydown', e => { keys[e.code] = true; onKey(e); });
    addEventListener('keyup', e => { keys[e.code] = false; });

    addEventListener('mousemove', e => {
        if (!ptrLocked || gamePaused || !gameRunning) return;
        const s = settings.sens * 0.0003;
        playerRotY -= e.movementX * s;
        playerRotX = Math.max(-1.4, Math.min(1.4, playerRotX - e.movementY * s));
    });

    addEventListener('mousedown', e => {
        if (!gameRunning || gamePaused) return;
        if (ptrLocked && e.button === 0) { onInteract(); return; }
        if (!ptrLocked) {
            document.getElementById('gameCanvas').requestPointerLock();
        }
    });

    document.getElementById('gameCanvas').addEventListener('click', () => {
        if (gameRunning && !gamePaused && !ptrLocked) {
            document.getElementById('gameCanvas').requestPointerLock();
        }
    });

    addEventListener('pointerlockchange', () => {
        ptrLocked = !!document.pointerLockElement;
        if (ptrLocked) {
            hideClickToPlay();
        } else if (gameRunning && !gamePaused && !playerDead && !hasWon) {
            showClickToPlay();
        }
    });
}

function showClickToPlay() {
    const overlay = document.getElementById('click-to-play');
    if (!overlay) return;
    overlay.classList.remove('hidden');
}

function hideClickToPlay() {
    const overlay = document.getElementById('click-to-play');
    if (overlay) overlay.classList.add('hidden');
}

function onKey(e) {
    if (e.code === 'Escape' && gameRunning) { togglePause(); return; }
    if (!gameRunning || gamePaused) return;

    switch (e.code) {
        case 'KeyE': onInteract(); break;
        case 'KeyI': togglePanel('inventory-panel'); break;
        case 'KeyC': togglePanel('craft-panel'); break;
        case 'KeyH': handleHide(); break;
        case 'KeyT': toggleFlashlight(); break;
        case 'KeyF': useMedkit(); break;
        case 'KeyR': useMedkit(); break;
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5': case 'Digit6':
            selectedSlot = parseInt(e.code.replace('Digit', '')) - 1;
            updateInvUI();
            break;
    }
}

function updateMovement(dt) {
    if (gamePaused || playerHiding || !gameRunning) return;

    const fwd = new THREE.Vector3(-Math.sin(playerRotY), 0, -Math.cos(playerRotY));
    const rgt = new THREE.Vector3(Math.cos(playerRotY), 0, -Math.sin(playerRotY));

    let move = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) move.add(fwd);
    if (keys['KeyS'] || keys['ArrowDown']) move.sub(fwd);
    if (keys['KeyA'] || keys['ArrowLeft']) move.sub(rgt);
    if (keys['KeyD'] || keys['ArrowRight']) move.add(rgt);

    playerSprint = keys['ShiftLeft'] && move.length() > 0 && playerStamina > 0;
    const spd = playerSprint ? CFG.SPEED * CFG.SPRINT_MULT : CFG.SPEED;

    if (move.lengthSq() > 0) {
        move.normalize();
        playerNoise = playerSprint ? 1 : 0.25;

        const nx = playerPos.x + move.x * spd * dt;
        const nz = playerPos.z + move.z * spd * dt;

        if (!colCheck(nx, playerPos.y, playerPos.z, CFG.RADIUS)) playerPos.x = nx;
        if (!colCheck(playerPos.x, playerPos.y, nz, CFG.RADIUS)) playerPos.z = nz;

        footstepCD -= dt;
        if (footstepCD <= 0) {
            SFX.step(playerSprint);
            enemyNoise(playerSprint ? 3 : 1, playerPos.x, playerPos.z);
            footstepCD = playerSprint ? 0.28 : 0.45;
        }
    } else {
        playerNoise *= 0.85;
    }

    if (playerSprint) {
        playerStamina -= CFG.SPRINT_DRAIN * dt;
        if (playerStamina <= 0) { playerStamina = 0; playerSprint = false; }
    } else {
        playerStamina = Math.min(100, playerStamina + CFG.STAMINA_REGEN * dt);
    }

    playerCrouch = keys['KeyC'];
    const tgtH = playerCrouch ? CFG.CAM_CROUCH : CFG.CAM_H;
    playerPos.y += (tgtH - playerPos.y) * dt * 12;

    camera.position.copy(playerPos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerRotY;
    camera.rotation.x = playerRotX;
}

function enemyNoise(intensity, x, z) {
    if (enemy.state === EST.CHASE) return;
    const d = enemy.pos.distanceTo(new THREE.Vector3(x, 0, z));
    if (d < intensity * 5) {
        enemy.lastKnown = new THREE.Vector3(x, 0, z);
        enemy.state = EST.ALERT;
        enemy.timer = 3;
    }
}

// ============================================
// 14. INTERACTIONS
// ============================================
function getNearestInteract() {
    let best = null, bestD = Infinity;
    for (const ia of interactables) {
        const d = playerPos.distanceTo(new THREE.Vector3(ia.x, ia.y, ia.z));
        if (d < ia.radius && d < bestD) { best = ia; bestD = d; }
    }
    return best;
}

function onInteract() {
    const ia = getNearestInteract();
    if (!ia) return;
    const d = ia.data;
    switch (d.type) {
        case 'door': toggleDoor(d.doorId); break;
        case 'item': collectItem(d.obj); break;
        case 'generator': fixGenerator(); break;
        case 'hide': enterHide(d); break;
    }
}

function fixGenerator() {
    if (playerInv.includes('gen_part1') && playerInv.includes('gen_part2')) {
        generatorFixed = true;
        removeFromInv('gen_part1');
        removeFromInv('gen_part2');
        notify('Generateur repare !', 'success');
        SFX.pickup();
    } else {
        notify('Il manque des pieces moteur', 'warning');
        SFX.lock();
    }
}

function handleHide() {
    if (playerHiding) { exitHide(); return; }
    for (const s of hideSpots) {
        if (playerPos.distanceTo(new THREE.Vector3(s.x, s.y, s.z)) < 2.5) {
            enterHide(s);
            return;
        }
    }
    notify('Aucune cachette a proximite', 'info');
}

function enterHide(s) {
    playerHiding = true;
    playerHideType = s.type;
    playerPos.set(s.x, s.y + (s.type === 'bed' ? 0.4 : CFG.CAM_H), s.z);
    SFX.creak();
    notify('Cache ! (H pour sortir)', 'info');
}

function exitHide() {
    playerHiding = false;
    playerHideType = null;
    SFX.creak();
}

function toggleFlashlight() {
    if (playerInv.includes('flashlight')) {
        playerFlashlightOn = !playerFlashlightOn;
        if (playerFlashlight) playerFlashlight.visible = playerFlashlightOn;
        notify(playerFlashlightOn ? 'Lampe : ON' : 'Lampe : OFF', 'info');
    } else {
        notify('Pas de lampe torche', 'warning');
    }
}

function useMedkit() {
    const idx = playerInv.indexOf('medkit');
    if (idx >= 0 && playerHealth < 100) {
        playerInv.splice(idx, 1);
        playerHealth = Math.min(100, playerHealth + 40);
        SFX.pickup();
        notify('+40 PV', 'success');
        updateInvUI();
    }
}

function attemptEscape() {
    if (generatorFixed && playerInv.includes('final_key')) {
        winGame();
    } else {
        const missing = [];
        if (!generatorFixed) missing.push('generateur');
        if (!playerInv.includes('final_key')) missing.push('cle de sortie');
        notify('Manque : ' + missing.join(', '), 'warning');
        SFX.lock();
    }
}

// ============================================
// 15. UI
// ============================================
function notify(text, type) {
    const c = document.getElementById('notifications');
    const d = document.createElement('div');
    d.className = 'notif ' + (type || '');
    d.textContent = text;
    c.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}

function screenFlash() {
    const f = document.createElement('div');
    f.className = 'screen-flash';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 400);
}

function updateHUD() {
    if (!gameRunning) return;

    // Stamina
    const sf = document.querySelector('.stamina-fill');
    if (sf) sf.style.width = playerStamina + '%';

    // Health
    let hb = document.getElementById('hp-bar');
    if (!hb) {
        const bar = document.createElement('div');
        bar.className = 'hud-bar';
        bar.innerHTML = '<span class="bar-icon">❤️</span><div class="bar-track"><div class="bar-fill" id="hp-bar" style="background:linear-gradient(90deg,#a33,#f66);width:100%"></div></div>';
        document.getElementById('hud-left').prepend(bar);
        hb = document.getElementById('hp-bar');
    }
    hb.style.width = playerHealth + '%';

    // Interaction prompt
    const prompt = document.getElementById('interact-prompt');
    const ia = getNearestInteract();
    if (ia) {
        prompt.classList.remove('hidden');
        document.getElementById('interact-text').textContent = ia.data.label || '[E]';
    } else {
        prompt.classList.add('hidden');
    }

    // Held item icon
    const slotItems = playerInv.slice(0, 6);
    const hi = document.getElementById('held-item');
    const hiIcon = document.getElementById('held-item-icon');
    if (slotItems[selectedSlot]) {
        hi.classList.remove('hidden');
        hiIcon.textContent = CFG.ITEM_DEFS[slotItems[selectedSlot]]?.icon || '';
    } else {
        hi.classList.add('hidden');
    }

    // Hint
    const hint = document.getElementById('hud-hint');
    if (generatorFixed && playerInv.includes('final_key')) {
        hint.textContent = '➡ Porte d\'entree prete !';
        hint.style.color = '#4a4';
    } else if (!generatorFixed) {
        hint.textContent = '🔧 Reparer le generateur (sous-sol)';
    } else if (!playerInv.includes('final_key')) {
        hint.textContent = '🔑 Trouver la cle de sortie';
    } else {
        hint.textContent = '';
    }
}

function updateInvUI() {
    const items = playerInv.slice(0, 6);
    for (let i = 0; i < 6; i++) {
        const icon = document.getElementById('slot-' + i);
        const slot = icon?.closest('.inv-slot');
        if (icon) icon.textContent = items[i] ? (CFG.ITEM_DEFS[items[i]]?.icon || '') : '';
        if (slot) slot.classList.toggle('active', i === selectedSlot);
    }
}

function togglePanel(id) {
    const el = document.getElementById(id);
    const wasHidden = el.classList.contains('hidden');
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    if (wasHidden) el.classList.remove('hidden');
}

function updateItemGlow(dt) {
    itemObjects.forEach(item => {
        if (!item.collected && item.group) {
            item.group.rotation.y += dt * 1.5;
            item.group.children[0].position.y = Math.sin(gameTime * 2.5 + item.group.position.x * 3) * 0.03;
        }
    });
}

// ============================================
// 16. MENUS & FLOW
// ============================================
function initMenus() {
    document.getElementById('btn-new-game').onclick = newGame;
    document.getElementById('btn-continue').onclick = continueGame;
    document.getElementById('btn-options').onclick = () => document.getElementById('options-menu').classList.remove('hidden');
    document.getElementById('btn-credits').onclick = () => document.getElementById('credits-menu').classList.remove('hidden');
    document.getElementById('btn-options-back').onclick = () => document.getElementById('options-menu').classList.add('hidden');
    document.getElementById('btn-credits-back').onclick = () => document.getElementById('credits-menu').classList.add('hidden');
    document.getElementById('btn-resume').onclick = resumeGame;
    document.getElementById('btn-quit').onclick = quitMenu;
    document.getElementById('btn-retry').onclick = () => { document.getElementById('death-screen').classList.add('hidden'); newGame(); };
    document.getElementById('btn-death-quit').onclick = quitMenu;
    document.getElementById('btn-win-menu').onclick = quitMenu;

    document.getElementById('opt-volume').oninput = e => {
        settings.vol = e.target.value / 100;
        document.getElementById('opt-volume-val').textContent = e.target.value + '%';
        if (masterGain) masterGain.gain.value = settings.vol;
    };
    document.getElementById('opt-music').oninput = e => {
        settings.music = e.target.value / 100;
        document.getElementById('opt-music-val').textContent = e.target.value + '%';
        if (musicGain) musicGain.gain.value = settings.music;
    };
    document.getElementById('opt-sensitivity').oninput = e => {
        settings.sens = parseInt(e.target.value);
        document.getElementById('opt-sens-val').textContent = e.target.value;
    };
    document.getElementById('opt-fullscreen').onclick = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
    };

    if (localStorage.getItem('fh_save')) {
        document.getElementById('btn-continue').style.display = '';
    }
}

function resetState() {
    colliders = []; interactables = []; itemObjects = []; doorObjects = []; hideSpots = [];
    gameTime = 0; startTime = Date.now();
    itemsFound = 0; totalItems = 0;
    generatorFixed = false; alarmCut = false;
    playerDead = false; hasWon = false; gamePaused = false;
    lastEscapeAttempt = 0;
    if (enemy.mesh) { scene.remove(enemy.mesh); enemy.mesh = null; }
}

function newGame() {
    audioInit(); audioResume();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('loading-screen').classList.remove('hidden');

    resetState();

    const loadFill = document.getElementById('loading-fill');
    const loadText = document.getElementById('loading-text');

    loadFill.style.width = '20%';
    loadText.textContent = 'Initialisation...';

    setTimeout(() => {
        engineInit();
        loadFill.style.width = '50%';
        loadText.textContent = 'Construction de la maison...';
    }, 200);

    setTimeout(() => {
        buildHouse();
        loadFill.style.width = '70%';
        loadText.textContent = 'Placement des objets...';
    }, 500);

    setTimeout(() => {
        spawnItems();
        createEnemy();
        initPlayer();
        loadFill.style.width = '100%';
        loadText.textContent = 'Pret.';
    }, 800);

    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        gameRunning = true;
        updateInvUI();
        SFX.ambient();
        requestAnimationFrame(gameLoop);
        showClickToPlay();
    }, 1100);
}

function continueGame() {
    audioInit(); audioResume();
    document.getElementById('main-menu').classList.add('hidden');
    resetState();
    engineInit();
    buildHouse();
    spawnItems();
    createEnemy();
    initPlayer();
    loadSave();
    updateInvUI();
    document.getElementById('hud').classList.remove('hidden');
    gameRunning = true;
    SFX.ambient();
    notify('Partie chargee', 'info');
    requestAnimationFrame(gameLoop);
    showClickToPlay();
}

function pauseGame() {
    if (!gameRunning || hasWon || playerDead) return;
    gamePaused = true;
    document.getElementById('pause-menu').classList.remove('hidden');
    document.exitPointerLock();
}

function resumeGame() {
    gamePaused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('options-menu').classList.add('hidden');
    showClickToPlay();
}

function togglePause() { gamePaused ? resumeGame() : pauseGame(); }

function gameOver(reason) {
    gameRunning = false;
    playerDead = true;
    document.getElementById('death-screen').classList.remove('hidden');
    document.getElementById('death-cause').textContent = reason;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('death-time').textContent =
        `Temps: ${Math.floor(elapsed/60)}m${elapsed%60}s | Objets: ${itemsFound}/${totalItems}`;
    document.exitPointerLock();
}

function winGame() {
    gameRunning = false;
    hasWon = true;
    document.getElementById('win-screen').classList.remove('hidden');
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('win-time').textContent = `Temps: ${Math.floor(elapsed/60)}m${elapsed%60}s`;
    document.getElementById('win-stats').textContent = `Objets: ${itemsFound}/${totalItems}`;
    document.exitPointerLock();
}

function quitMenu() {
    gameRunning = false;
    document.querySelectorAll('.submenu, #pause-menu, #death-screen, #win-screen, #hud')
        .forEach(el => el.classList.add('hidden'));
    document.getElementById('main-menu').classList.remove('hidden');
    if (localStorage.getItem('fh_save')) document.getElementById('btn-continue').style.display = '';
    document.exitPointerLock();
    if (scene) { while (scene.children.length) scene.remove(scene.children[0]); }
}

function saveGame() {
    const save = {
        pos: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
        health: playerHealth,
        inv: [...playerInv],
        gen: generatorFixed,
        alarm: alarmCut,
        collected: itemObjects.filter(i => i.collected).map(i => i.id),
    };
    localStorage.setItem('fh_save', JSON.stringify(save));
}

function loadSave() {
    const raw = localStorage.getItem('fh_save');
    if (!raw) return;
    try {
        const s = JSON.parse(raw);
        playerPos.set(s.pos.x, s.pos.y, s.pos.z);
        playerHealth = s.health;
        playerInv.length = 0;
        s.inv.forEach(i => playerInv.push(i));
        generatorFixed = s.gen;
        alarmCut = s.alarm;
        s.collected.forEach(id => {
            const item = itemObjects.find(i => i.id === id && !i.collected);
            if (item) { item.collected = true; scene.remove(item.group); }
        });
    } catch(e) { console.warn('Save corrupted'); }
}

// ============================================
// 17. GAME LOOP
// ============================================
function gameLoop() {
    if (!gameRunning) return;
    requestAnimationFrame(gameLoop);

    const dt = Math.min(clock.getDelta(), 0.05);
    if (gamePaused) { renderer.render(scene, camera); return; }

    gameTime += dt;

    updateMovement(dt);
    updateEnemy(dt);
    updateItemGlow(dt);
    updateHUD();

    // Front door check
    if (playerPos.distanceTo(new THREE.Vector3(0, playerPos.y, 5)) < 2 && gameTime - lastEscapeAttempt > 3) {
        lastEscapeAttempt = gameTime;
        attemptEscape();
    }

    // Auto-save
    if (Math.floor(gameTime) > 0 && Math.floor(gameTime) % 30 === 0) saveGame();

    // Heartbeat
    if (enemy.distToPlayer < 10 && enemy.state === EST.CHASE) {
        if (Math.floor(gameTime * 2) % 2 === 0) SFX.heartbeat();
    }

    renderer.render(scene, camera);
}

// ============================================
// 18. INIT
// ============================================
window.onload = () => { initMenus(); initControls(); };
