// ============================================
// SURVIVAL: NATURE'S WRATH - Game Engine
// ============================================

const TILE_SIZE = 32;
const WORLD_WIDTH = 200;
const WORLD_HEIGHT = 200;
const VIEWPORT_TILES_X = 25;
const VIEWPORT_TILES_Y = 18;

// Biomes
const BIOME = {
    FOREST: 0,
    RIVER: 1,
    MOUNTAIN: 2,
    PRAIRIE: 3,
    CAVE: 4,
    SWAMP: 5,
    DEEP_FOREST: 6
};

// Tile types
const TILE = {
    GRASS: 0,
    DIRT: 1,
    WATER: 2,
    STONE: 3,
    SAND: 4,
    SWAMP_WATER: 5,
    CAVE_FLOOR: 6,
    DARK_GRASS: 7,
    DEEP_WATER: 8
};

// Resources on map
const RES_TYPE = {
    TREE: 0,
    ROCK: 1,
    BUSH: 2,
    FLOWER: 3,
    TALL_GRASS: 4,
    MUSHROOM: 5,
    IRON_ORE: 6,
    COAL: 7,
    DEAD_TREE: 8,
    REED: 9,
    CACTUS: 10,
    CRYSTAL: 11
};

// Dangerous plants
const DANGER_PLANT = {
    NETTLE: 0,
    TOXIC_IVY: 1,
    EXPLOSIVE_FLOWER: 2,
    TOXIC_MUSHROOM: 3,
    THORN_BUSH: 4,
    CARNIVOROUS_PLANT: 5,
    POISON_FLOWER: 6,
    SPORE_PLANT: 7
};

// Animals
const ANIMAL_TYPE = {
    RABBIT: 0,
    DEER: 1,
    TURTLE: 2,
    FISH: 3,
    BOAR: 4,
    FOX: 5,
    WOLF: 6,
    BEAR: 7,
    SNAKE: 8,
    SPIDER: 9,
    QUEEN_SPIDER: 10,
    ANCIENT_BEAR: 11,
    FOREST_SPIRIT: 12
};

const ANIMAL_BEHAVIOR = {
    PASSIVE: 0,
    NEUTRAL: 1,
    AGGRESSIVE: 2,
    BOSS: 3
};

const ANIMAL_DATA = {
    [ANIMAL_TYPE.RABBIT]: { name: 'Lapin', icon: '🐰', behavior: ANIMAL_BEHAVIOR.PASSIVE, hp: 15, speed: 2, damage: 0, drop: 'viande', dropAmount: 1, xp: 5 },
    [ANIMAL_TYPE.DEER]: { name: 'Cerf', icon: '🦌', behavior: ANIMAL_BEHAVIOR.PASSIVE, hp: 40, speed: 1.8, damage: 0, drop: 'viande', dropAmount: 3, xp: 10 },
    [ANIMAL_TYPE.TURTLE]: { name: 'Tortue', icon: '🐢', behavior: ANIMAL_BEHAVIOR.PASSIVE, hp: 30, speed: 0.5, damage: 0, drop: 'viande', dropAmount: 2, xp: 8 },
    [ANIMAL_TYPE.FISH]: { name: 'Poisson', icon: '🐟', behavior: ANIMAL_BEHAVIOR.PASSIVE, hp: 10, speed: 1.5, damage: 0, drop: 'viande', dropAmount: 1, xp: 5 },
    [ANIMAL_TYPE.BOAR]: { name: 'Sanglier', icon: '🐗', behavior: ANIMAL_BEHAVIOR.NEUTRAL, hp: 80, speed: 1.5, damage: 15, drop: 'viande', dropAmount: 4, xp: 25 },
    [ANIMAL_TYPE.FOX]: { name: 'Renard', icon: '🦊', behavior: ANIMAL_BEHAVIOR.NEUTRAL, hp: 50, speed: 2.2, damage: 10, drop: 'viande', dropAmount: 2, xp: 15 },
    [ANIMAL_TYPE.WOLF]: { name: 'Loup', icon: '🐺', behavior: ANIMAL_BEHAVIOR.AGGRESSIVE, hp: 70, speed: 2, damage: 20, drop: 'viande', dropAmount: 3, xp: 30 },
    [ANIMAL_TYPE.BEAR]: { name: 'Ours', icon: '🐻', behavior: ANIMAL_BEHAVIOR.AGGRESSIVE, hp: 150, speed: 1.3, damage: 35, drop: 'viande', dropAmount: 6, xp: 50 },
    [ANIMAL_TYPE.SNAKE]: { name: 'Serpent', icon: '🐍', behavior: ANIMAL_BEHAVIOR.AGGRESSIVE, hp: 30, speed: 1.8, damage: 25, drop: 'viande', dropAmount: 1, xp: 20, poison: true },
    [ANIMAL_TYPE.SPIDER]: { name: 'Araignée', icon: '🕷️', behavior: ANIMAL_BEHAVIOR.AGGRESSIVE, hp: 40, speed: 2.5, damage: 15, drop: 'fibre', dropAmount: 3, xp: 20, poison: true },
    [ANIMAL_TYPE.QUEEN_SPIDER]: { name: 'Araignée Reine', icon: '🕸️', behavior: ANIMAL_BEHAVIOR.BOSS, hp: 500, speed: 1.5, damage: 40, drop: 'cristal', dropAmount: 5, xp: 200 },
    [ANIMAL_TYPE.ANCIENT_BEAR]: { name: 'Ours Ancien', icon: '🐻‍❄️', behavior: ANIMAL_BEHAVIOR.BOSS, hp: 800, speed: 1.2, damage: 50, drop: 'relique', dropAmount: 1, xp: 300 },
    [ANIMAL_TYPE.FOREST_SPIRIT]: { name: 'Esprit de la Forêt', icon: '👻', behavior: ANIMAL_BEHAVIOR.BOSS, hp: 1000, speed: 1, damage: 60, drop: 'bois_magique', dropAmount: 3, xp: 500 }
};

// Items
const ITEMS = {
    bois: { name: 'Bois', icon: '🪵', stackable: true },
    pierre: { name: 'Pierre', icon: '🪨', stackable: true },
    fibres: { name: 'Fibres', icon: '🧵', stackable: true },
    branche: { name: 'Branche', icon: '🌿', stackable: true },
    feuilles: { name: 'Feuilles', icon: '🍃', stackable: true },
    baies: { name: 'Baies', icon: '🫐', stackable: true, food: 10 },
    eau: { name: 'Eau', icon: '💧', stackable: true, drink: 20 },
    minerai_fer: { name: 'Minerai de fer', icon: '⛏️', stackable: true },
    charbon: { name: 'Charbon', icon: '⚫', stackable: true },
    viande: { name: 'Viande', icon: '🥩', stackable: true, food: 20 },
    viande_cuite: { name: 'Viande cuite', icon: '🍖', stackable: true, food: 40 },
    planches: { name: 'Planches', icon: '📦', stackable: true },
    corde: { name: 'Corde', icon: '🪢', stackable: true },
    fer: { name: 'Fer', icon: '🔩', stackable: true },
    acier: { name: 'Acier', icon: '⚙️', stackable: true },
    cristal: { name: 'Cristal', icon: '💎', stackable: true },
    graine_rare: { name: 'Graine rare', icon: '🌱', stackable: true },
    relique: { name: 'Relique ancienne', icon: '🏺', stackable: true },
    fleur_legendaire: { name: 'Fleur légendaire', icon: '🌸', stackable: true },
    bois_magique: { name: 'Bois magique', icon: '✨', stackable: true },
    masque_spore: { name: 'Masque anti-spores', icon: '😷', stackable: false },
    // Tools
    hache: { name: 'Hache', icon: '🪓', stackable: false, tool: 'hache', power: 2 },
    pioche: { name: 'Pioche', icon: '⛏️', stackable: false, tool: 'pioche', power: 2 },
    pioche_fer: { name: 'Pioche en fer', icon: '⛏️', stackable: false, tool: 'pioche', power: 4 },
    lance: { name: 'Lance', icon: '🔱', stackable: false, weapon: true, damage: 15 },
    arc: { name: 'Arc', icon: '🏹', stackable: false, weapon: true, ranged: true, damage: 20 },
    torche: { name: 'Torche', icon: '🔥', stackable: true, light: 5 },
    gourde: { name: 'Gourde', icon: '🫗', stackable: false, waterCapacity: 50 },
    epee_fer: { name: 'Épée en fer', icon: '⚔️', stackable: false, weapon: true, damage: 30 },
    epee_acier: { name: 'Épée en acier', icon: '⚔️', stackable: false, weapon: true, damage: 45 },
    epee_legendaire: { name: 'Épée légendaire', icon: '🗡️', stackable: false, weapon: true, damage: 80 },
    armure_fibres: { name: 'Armure de fibres', icon: '👕', stackable: false, armor: 5 },
    armure_fer: { name: 'Armure en fer', icon: '🛡️', stackable: false, armor: 15 },
    // Potions
    potion_soin: { name: 'Potion de soin', icon: '🧪', stackable: true, heal: 50 },
    potion_poison: { name: 'Antidote', icon: '💊', stackable: true, curePoison: true },
    // Camp
    viande_grillee: { name: 'Viande grillée', icon: '🍢', stackable: true, food: 35 }
};

// Crafting recipes
const RECIPES = [
    { result: 'planches', amount: 4, ingredients: { bois: 2 }, category: 'base' },
    { result: 'corde', amount: 1, ingredients: { fibres: 4 }, category: 'base' },
    { result: 'hache', amount: 1, ingredients: { bois: 3, pierre: 2, branche: 1 }, category: 'outil' },
    { result: 'pioche', amount: 1, ingredients: { bois: 3, pierre: 3, branche: 1 }, category: 'outil' },
    { result: 'lance', amount: 1, ingredients: { bois: 2, branche: 2, pierre: 1 }, category: 'arme' },
    { result: 'arc', amount: 1, ingredients: { bois: 3, corde: 1, branche: 2 }, category: 'arme' },
    { result: 'torche', amount: 4, ingredients: { branche: 1, charbon: 1 }, category: 'outil' },
    { result: 'gourde', amount: 1, ingredients: { fibres: 3, pierre: 2 }, category: 'outil' },
    { result: 'masque_spore', amount: 1, ingredients: { fibres: 5, feuilles: 8, charbon: 2 }, category: 'equipement' },
    { result: 'armure_fibres', amount: 1, ingredients: { fibres: 10, corde: 2 }, category: 'equipement' },
    { result: 'potion_soin', amount: 2, ingredients: { baies: 5, eau: 2 }, category: 'potion' },
    { result: 'potion_poison', amount: 1, ingredients: { baies: 3, fibres: 2, eau: 1 }, category: 'potion' },
    { result: 'fer', amount: 2, ingredients: { minerai_fer: 3, charbon: 2 }, category: 'base' },
    { result: 'acier', amount: 1, ingredients: { fer: 3, charbon: 4 }, category: 'base' },
    { result: 'pioche_fer', amount: 1, ingredients: { fer: 4, bois: 2, corde: 1 }, category: 'outil' },
    { result: 'epee_fer', amount: 1, ingredients: { fer: 5, bois: 2, corde: 1 }, category: 'arme' },
    { result: 'epee_acier', amount: 1, ingredients: { acier: 5, bois: 2, fer: 2 }, category: 'arme' },
    { result: 'viande_cuite', amount: 1, ingredients: { viande: 1 }, nearFire: true, category: 'nourriture' },
    { result: 'viande_grillee', amount: 1, ingredients: { viande: 1 }, nearFire: true, category: 'nourriture' },
];

// Building recipes
const BUILD_RECIPES = [
    { name: 'Feu de camp', icon: '🔥', ingredients: { bois: 5, pierre: 3, branche: 2 }, size: [2, 2], id: 'campfire' },
    { name: 'Coffre', icon: '📦', ingredients: { planches: 8 }, size: [1, 1], id: 'chest' },
    { name: 'Établi', icon: '🔨', ingredients: { planches: 6, pierre: 4 }, size: [2, 1], id: 'workbench' },
    { name: 'Mur', icon: '🧱', ingredients: { bois: 4 }, size: [1, 1], id: 'wall' },
    { name: 'Sol', icon: '🟫', ingredients: { planches: 2 }, size: [1, 1], id: 'floor' },
    { name: 'Toit', icon: '🔺', ingredients: { planches: 3, branch: 1 }, size: [1, 1], id: 'roof' },
    { name: 'Porte', icon: '🚪', ingredients: { planches: 4, fer: 1 }, size: [1, 1], id: 'door' },
    { name: 'Lit', icon: '🛏️', ingredients: { planches: 6, fibres: 8, feuilles: 4 }, size: [2, 1], id: 'bed' },
];

// ============================================
// GAME STATE
// ============================================
let canvas, ctx;
let gameRunning = false;
let gameTime = 0;
let lastTime = 0;
let deltaTime = 0;

// World
let world = [];
let biomeMap = [];
let resourceMap = [];
let dangerPlantMap = [];
let buildingMap = [];
let animalEntities = [];
let particles = [];
let floatingTexts = [];

// Camera
let camera = { x: 0, y: 0 };

// Player
let player = {
    x: 100 * TILE_SIZE,
    y: 100 * TILE_SIZE,
    width: 24,
    height: 24,
    speed: 120,
    sprintSpeed: 200,
    vx: 0,
    vy: 0,
    direction: 0,
    health: 100,
    maxHealth: 100,
    hunger: 100,
    thirst: 100,
    stamina: 100,
    temperature: 37,
    inventory: {},
    equipped: null,
    selectedSlot: 0,
    quickSlots: [null, null, null, null, null],
    attackCooldown: 0,
    invulnCooldown: 0,
    poisonTimer: 0,
    sprinting: false,
    lightRadius: 6,
    armor: 0
};

// Time system
let timeSystem = {
    hour: 12,
    minute: 0,
    day: 1,
    dayLength: 600, // seconds per day
    timeSpeed: 1,
    weather: 'clear',
    weatherTimer: 0,
    fogActive: false
};

// Forest anger system
let forestAnger = {
    level: 0,
    maxLevel: 100,
    treesCut: 0,
    aggressivenessMultiplier: 1,
    spawnRate: 1,
    lastEvent: 0
};

// Input
let keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// ============================================
// INITIALIZATION
// ============================================
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; handleKeyPress(e); });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', () => { mouseDown = true; handleMouseClick(); });
    canvas.addEventListener('mouseup', () => { mouseDown = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// ============================================
// WORLD GENERATION
// ============================================
function generateWorld() {
    // Generate biome map using simplex-like noise
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        biomeMap[y] = [];
        world[y] = [];
        resourceMap[y] = [];
        dangerPlantMap[y] = [];
        buildingMap[y] = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            let n = noise2D(x * 0.03, y * 0.03);
            let n2 = noise2D(x * 0.06 + 100, y * 0.06 + 100);

            // Determine biome
            if (n < -0.3) biomeMap[y][x] = BIOME.RIVER;
            else if (n > 0.4) biomeMap[y][x] = BIOME.MOUNTAIN;
            else if (n > 0.2 && n2 > 0.1) biomeMap[y][x] = BIOME.SWAMP;
            else if (n < -0.1 && n2 < -0.2) biomeMap[y][x] = BIOME.PRAIRIE;
            else if (n > 0.25) biomeMap[y][x] = BIOME.DEEP_FOREST;
            else biomeMap[y][x] = BIOME.FOREST;

            // Set base tile
            switch (biomeMap[y][x]) {
                case BIOME.RIVER: world[y][x] = n < -0.5 ? TILE.DEEP_WATER : TILE.WATER; break;
                case BIOME.MOUNTAIN: world[y][x] = TILE.STONE; break;
                case BIOME.SWAMP: world[y][x] = n2 > 0 ? TILE.SWAMP_WATER : TILE.DIRT; break;
                case BIOME.PRAIRIE: world[y][x] = TILE.GRASS; break;
                case BIOME.DEEP_FOREST: world[y][x] = TILE.DARK_GRASS; break;
                default: world[y][x] = TILE.GRASS;
            }

            // Resources
            resourceMap[y][x] = null;
            dangerPlantMap[y][x] = null;
            buildingMap[y][x] = null;

            let rn = noise2D(x * 0.15 + 50, y * 0.15 + 50);
            let spawnRes = Math.random();

            if (biomeMap[y][x] === BIOME.FOREST || biomeMap[y][x] === BIOME.DEEP_FOREST) {
                if (spawnRes < 0.12) resourceMap[y][x] = { type: RES_TYPE.TREE, hp: 20, growthStage: 2 };
                else if (spawnRes < 0.15) resourceMap[y][x] = { type: RES_TYPE.ROCK, hp: 30 };
                else if (spawnRes < 0.18) resourceMap[y][x] = { type: RES_TYPE.BUSH, hp: 5 };
                else if (spawnRes < 0.20) resourceMap[y][x] = { type: RES_TYPE.TALL_GRASS, hp: 3 };
                else if (spawnRes < 0.21) resourceMap[y][x] = { type: RES_TYPE.MUSHROOM, hp: 2, toxic: Math.random() < 0.3 };
                else if (spawnRes < 0.22 && biomeMap[y][x] === BIOME.DEEP_FOREST) resourceMap[y][x] = { type: RES_TYPE.IRON_ORE, hp: 40 };
                else if (spawnRes < 0.225 && biomeMap[y][x] === BIOME.DEEP_FOREST) resourceMap[y][x] = { type: RES_TYPE.COAL, hp: 25 };
                else if (spawnRes < 0.23) resourceMap[y][x] = { type: RES_TYPE.DEAD_TREE, hp: 15 };
                else if (spawnRes < 0.235 && biomeMap[y][x] === BIOME.DEEP_FOREST) resourceMap[y][x] = { type: RES_TYPE.CRYSTAL, hp: 50 };

                // Danger plants
                if (spawnRes > 0.24 && spawnRes < 0.26) {
                    let dpType = [DANGER_PLANT.NETTLE, DANGER_PLANT.TOXIC_IVY, DANGER_PLANT.THORN_BUSH][Math.floor(Math.random() * 3)];
                    dangerPlantMap[y][x] = { type: dpType, hp: 10, active: true, cooldown: 0 };
                }
                if (spawnRes > 0.26 && spawnRes < 0.265) {
                    dangerPlantMap[y][x] = { type: DANGER_PLANT.EXPLOSIVE_FLOWER, hp: 5, active: true, cooldown: 0 };
                }
                if (spawnRes > 0.265 && spawnRes < 0.27) {
                    dangerPlantMap[y][x] = { type: DANGER_PLANT.CARNIVOROUS_PLANT, hp: 20, active: true, cooldown: 0, grabbed: false };
                }
                if (spawnRes > 0.27 && spawnRes < 0.275) {
                    dangerPlantMap[y][x] = { type: DANGER_PLANT.SPORE_PLANT, hp: 8, active: true, cooldown: 0 };
                }
            } else if (biomeMap[y][x] === BIOME.PRAIRIE) {
                if (spawnRes < 0.05) resourceMap[y][x] = { type: RES_TYPE.BUSH, hp: 5 };
                else if (spawnRes < 0.08) resourceMap[y][x] = { type: RES_TYPE.TALL_GRASS, hp: 3 };
                else if (spawnRes < 0.09) resourceMap[y][x] = { type: RES_TYPE.FLOWER, hp: 2 };
            } else if (biomeMap[y][x] === BIOME.SWAMP) {
                if (spawnRes < 0.08) resourceMap[y][x] = { type: RES_TYPE.REED, hp: 3 };
                else if (spawnRes < 0.10) resourceMap[y][x] = { type: RES_TYPE.DEAD_TREE, hp: 15 };
                if (spawnRes > 0.12 && spawnRes < 0.14) {
                    dangerPlantMap[y][x] = { type: DANGER_PLANT.POISON_FLOWER, hp: 8, active: true, cooldown: 0 };
                }
            } else if (biomeMap[y][x] === BIOME.MOUNTAIN) {
                if (spawnRes < 0.06) resourceMap[y][x] = { type: RES_TYPE.ROCK, hp: 40 };
                else if (spawnRes < 0.09) resourceMap[y][x] = { type: RES_TYPE.IRON_ORE, hp: 50 };
                else if (spawnRes < 0.10) resourceMap[y][x] = { type: RES_TYPE.COAL, hp: 30 };
                else if (spawnRes < 0.11) resourceMap[y][x] = { type: RES_TYPE.CRYSTAL, hp: 60 };
            }
        }
    }

    // Spawn animals
    spawnAnimals(60);
}

function spawnAnimals(count) {
    animalEntities = [];
    for (let i = 0; i < count; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.floor(Math.random() * WORLD_WIDTH);
            y = Math.floor(Math.random() * WORLD_HEIGHT);
            attempts++;
        } while ((biomeMap[y][x] === BIOME.RIVER || biomeMap[y][x] === BIOME.MOUNTAIN) && attempts < 50);

        let type;
        let biome = biomeMap[y][x];
        let roll = Math.random();

        if (biome === BIOME.RIVER) type = ANIMAL_TYPE.FISH;
        else if (biome === BIOME.SWAMP) type = roll < 0.4 ? ANIMAL_TYPE.SNAKE : ANIMAL_TYPE.TURTLE;
        else if (biome === BIOME.DEEP_FOREST) {
            if (roll < 0.3) type = ANIMAL_TYPE.WOLF;
            else if (roll < 0.5) type = ANIMAL_TYPE.BEAR;
            else if (roll < 0.7) type = ANIMAL_TYPE.SPIDER;
            else type = ANIMAL_TYPE.DEER;
        } else if (biome === BIOME.PRAIRIE) {
            if (roll < 0.4) type = ANIMAL_TYPE.RABBIT;
            else if (roll < 0.7) type = ANIMAL_TYPE.DEER;
            else type = ANIMAL_TYPE.FOX;
        } else {
            if (roll < 0.3) type = ANIMAL_TYPE.RABBIT;
            else if (roll < 0.5) type = ANIMAL_TYPE.DEER;
            else if (roll < 0.7) type = ANIMAL_TYPE.BOAR;
            else type = ANIMAL_TYPE.FOX;
        }

        let data = ANIMAL_DATA[type];
        animalEntities.push({
            type: type,
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
            hp: data.hp,
            maxHp: data.hp,
            speed: data.speed,
            vx: 0,
            vy: 0,
            state: 'idle',
            stateTimer: 0,
            targetX: 0,
            targetY: 0,
            wanderAngle: Math.random() * Math.PI * 2,
            aggroTarget: null,
            hitCooldown: 0,
            alive: true
        });
    }

    // Spawn bosses in deep forest / specific biomes
    spawnBoss(ANIMAL_TYPE.FOREST_SPIRIT, BIOME.DEEP_FOREST);
    spawnBoss(ANIMAL_TYPE.QUEEN_SPIDER, BIOME.DEEP_FOREST);
    spawnBoss(ANIMAL_TYPE.ANCIENT_BEAR, BIOME.SWAMP);
}

function spawnBoss(type, biome) {
    for (let attempt = 0; attempt < 100; attempt++) {
        let x = Math.floor(Math.random() * WORLD_WIDTH);
        let y = Math.floor(Math.random() * WORLD_HEIGHT);
        if (biomeMap[y][x] === biome) {
            let data = ANIMAL_DATA[type];
            animalEntities.push({
                type: type,
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                hp: data.hp,
                maxHp: data.hp,
                speed: data.speed,
                vx: 0,
                vy: 0,
                state: 'idle',
                stateTimer: 0,
                targetX: 0,
                targetY: 0,
                wanderAngle: Math.random() * Math.PI * 2,
                aggroTarget: null,
                hitCooldown: 0,
                alive: true,
                isBoss: true
            });
            return;
        }
    }
}

// Simple noise function
function noise2D(x, y) {
    let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    n = n - Math.floor(n);
    let n2 = Math.sin(x * 3.9898 + y * 5.233) * 23421.631;
    n2 = n2 - Math.floor(n2);

    let ix = Math.floor(x);
    let iy = Math.floor(y);
    let fx = x - ix;
    let fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);

    let a = pseudoRandom(ix, iy);
    let b = pseudoRandom(ix + 1, iy);
    let c = pseudoRandom(ix, iy + 1);
    let d = pseudoRandom(ix + 1, iy + 1);

    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy) * 0.5 + (n * 0.3 + n2 * 0.2);
}

function pseudoRandom(x, y) {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ============================================
// GAME LOOP
// ============================================
function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    generateWorld();
    player.x = 100 * TILE_SIZE;
    player.y = 100 * TILE_SIZE;
    addToInventory('baies', 5);
    addToInventory('eau', 3);
    addToInventory('branche', 3);
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    notify('Bienvenue dans la forêt... La forêt est vivante.', 'info');
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    gameTime += deltaTime;

    updateTime();
    updatePlayer();
    updateAnimals();
    updateDangerPlants();
    updateParticles();
    updateForestAnger();
    updateCamera();
    render();
    updateHUD();

    requestAnimationFrame(gameLoop);
}

// ============================================
// TIME SYSTEM
// ============================================
function updateTime() {
    timeSystem.minute += (deltaTime / timeSystem.dayLength) * 1440 * timeSystem.timeSpeed;
    if (timeSystem.minute >= 60) {
        timeSystem.minute -= 60;
        timeSystem.hour++;
    }
    if (timeSystem.hour >= 24) {
        timeSystem.hour = 0;
        timeSystem.day++;
        notify(`Jour ${timeSystem.day} se lève...`, 'info');
    }

    // Weather
    timeSystem.weatherTimer -= deltaTime;
    if (timeSystem.weatherTimer <= 0) {
        let roll = Math.random();
        if (roll < 0.4) timeSystem.weather = 'clear';
        else if (roll < 0.6) timeSystem.weather = 'fog';
        else if (roll < 0.8) timeSystem.weather = 'rain';
        else timeSystem.weather = 'storm';
        timeSystem.weatherTimer = 60 + Math.random() * 120;

        if (timeSystem.weather === 'storm') notify('Une tempête approche !', 'warning');
        if (timeSystem.weather === 'fog') {
            timeSystem.fogActive = Math.random() < 0.3;
            if (timeSystem.fogActive) notify('Brouillard toxique ! Un masque est nécessaire.', 'danger');
        }
    }
}

function isNight() {
    return timeSystem.hour < 6 || timeSystem.hour > 20;
}

function getDaylight() {
    let h = timeSystem.hour + timeSystem.minute / 60;
    if (h >= 6 && h <= 8) return (h - 6) / 2;
    if (h >= 8 && h <= 18) return 1;
    if (h >= 18 && h <= 20) return 1 - (h - 18) / 2;
    return 0.15;
}

// ============================================
// PLAYER
// ============================================
function updatePlayer() {
    // Movement
    let speed = player.sprinting && player.stamina > 0 ? player.sprintSpeed : player.speed;
    player.vx = 0;
    player.vy = 0;

    if (keys['z'] || keys['arrowup']) { player.vy = -speed; player.direction = 0; }
    if (keys['s'] || keys['arrowdown']) { player.vy = speed; player.direction = 2; }
    if (keys['q'] || keys['arrowleft']) { player.vx = -speed; player.direction = 3; }
    if (keys['d'] || keys['arrowright']) { player.vx = speed; player.direction = 1; }

    // Sprint
    player.sprinting = keys['shift'] && (player.vx !== 0 || player.vy !== 0);
    if (player.sprinting) {
        player.stamina -= deltaTime * 25;
        if (player.stamina <= 0) { player.stamina = 0; player.sprinting = false; }
    } else {
        player.stamina = Math.min(100, player.stamina + deltaTime * 10);
    }

    // Normalize diagonal
    if (player.vx !== 0 && player.vy !== 0) {
        player.vx *= 0.707;
        player.vy *= 0.707;
    }

    // Apply movement with collision
    let newX = player.x + player.vx * deltaTime;
    let newY = player.y + player.vy * deltaTime;

    if (!isBlocked(newX, player.y)) player.x = newX;
    if (!isBlocked(player.x, newY)) player.y = newY;

    // Bounds
    player.x = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH * TILE_SIZE - TILE_SIZE, player.x));
    player.y = Math.max(TILE_SIZE, Math.min(WORLD_HEIGHT * TILE_SIZE - TILE_SIZE, player.y));

    // Hunger and thirst
    player.hunger -= deltaTime * 1.2;
    player.thirst -= deltaTime * 1.5;
    if (player.hunger <= 0) { player.hunger = 0; player.health -= deltaTime * 5; }
    if (player.thirst <= 0) { player.thirst = 0; player.health -= deltaTime * 7; }

    // Temperature
    let biome = getBiomeAt(player.x, player.y);
    let targetTemp = 37;
    if (biome === BIOME.RIVER) targetTemp = 30;
    if (biome === BIOME.MOUNTAIN) targetTemp = 25;
    if (biome === BIOME.SWAMP) targetTemp = 34;
    if (isNight()) targetTemp -= 5;
    if (timeSystem.weather === 'rain') targetTemp -= 3;
    if (timeSystem.weather === 'storm') targetTemp -= 6;
    player.temperature += (targetTemp - player.temperature) * deltaTime * 0.5;
    if (player.temperature < 30 || player.temperature > 42) {
        player.health -= deltaTime * 3;
    }

    // Poison
    if (player.poisonTimer > 0) {
        player.poisonTimer -= deltaTime;
        player.health -= deltaTime * 8;
        if (Math.random() < 0.02) notify('Vous êtes empoisonné !', 'danger');
    }

    // Fog damage
    if (timeSystem.fogActive) {
        let hasMask = false;
        for (let slot of player.quickSlots) {
            if (slot && ITEMS[slot] && ITEMS[slot].name === 'Masque anti-spores') { hasMask = true; break; }
        }
        if (!hasMask) {
            player.health -= deltaTime * 4;
            if (Math.random() < 0.01) notify('Le brouillard toxique vous affecte ! Craft un masque.', 'danger');
        }
    }

    // Death
    if (player.health <= 0) {
        player.health = 0;
        gameOver('Vous avez péri dans la forêt...');
    }

    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown -= deltaTime;
    if (player.invulnCooldown > 0) player.invulnCooldown -= deltaTime;

    // Check danger plant contact
    checkDangerPlantContact();

    // Auto-eat when low
    if (player.hunger < 25 && Math.random() < 0.01) {
        tryEat();
    }
    if (player.thirst < 25 && Math.random() < 0.01) {
        tryDrink();
    }

    // Water standing
    let tile = getTileAt(player.x, player.y);
    if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
        player.thirst = Math.min(100, player.thirst + deltaTime * 10);
    }
}

function isBlocked(x, y) {
    let tiles = [
        getTileAt(x - 10, y - 10),
        getTileAt(x + 10, y - 10),
        getTileAt(x - 10, y + 10),
        getTileAt(x + 10, y + 10)
    ];
    for (let t of tiles) {
        if (t === TILE.DEEP_WATER || t === TILE.STONE) return true;
    }
    // Building collision
    let tx = Math.floor(x / TILE_SIZE);
    let ty = Math.floor(y / TILE_SIZE);
    if (ty >= 0 && ty < WORLD_HEIGHT && tx >= 0 && tx < WORLD_WIDTH) {
        let b = buildingMap[ty][tx];
        if (b && (b.id === 'wall' || b.id === 'door')) return true;
    }
    return false;
}

function getTileAt(x, y) {
    let tx = Math.floor(x / TILE_SIZE);
    let ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) return TILE.STONE;
    return world[ty][tx];
}

function getBiomeAt(x, y) {
    let tx = Math.floor(x / TILE_SIZE);
    let ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) return BIOME.MOUNTAIN;
    return biomeMap[ty][tx];
}

function checkDangerPlantContact() {
    let tx = Math.floor(player.x / TILE_SIZE);
    let ty = Math.floor(player.y / TILE_SIZE);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            let cx = tx + dx;
            let cy = ty + dy;
            if (cx < 0 || cx >= WORLD_WIDTH || cy < 0 || cy >= WORLD_HEIGHT) continue;
            let dp = dangerPlantMap[cy][cx];
            if (!dp || !dp.active) continue;

            let dist = Math.hypot(player.x - (cx * TILE_SIZE + TILE_SIZE / 2), player.y - (cy * TILE_SIZE + TILE_SIZE / 2));
            if (dist < 20) {
                switch (dp.type) {
                    case DANGER_PLANT.NETTLE:
                        if (player.invulnCooldown <= 0) {
                            damagePlayer(5, 'Des orties vous piquent !');
                            player.invulnCooldown = 1;
                        }
                        break;
                    case DANGER_PLANT.TOXIC_IVY:
                        if (player.invulnCooldown <= 0) {
                            player.poisonTimer = 5;
                            damagePlayer(3, 'Lierre toxique ! Vous êtes empoisonné.');
                            player.invulnCooldown = 2;
                        }
                        break;
                    case DANGER_PLANT.THORN_BUSH:
                        if (player.invulnCooldown <= 0) {
                            player.speed = 60;
                            setTimeout(() => { player.speed = 120; }, 2000);
                            damagePlayer(3, 'RONCE ! Vous êtes ralenti.');
                            player.invulnCooldown = 2;
                        }
                        break;
                    case DANGER_PLANT.CARNIVOROUS_PLANT:
                        if (!dp.grabbed && player.invulnCooldown <= 0) {
                            dp.grabbed = true;
                            player.speed = 0;
                            damagePlayer(10, 'Une plante carnivore vous attrape !');
                            setTimeout(() => { player.speed = 120; dp.grabbed = false; }, 3000);
                            player.invulnCooldown = 3;
                        }
                        break;
                    case DANGER_PLANT.EXPLOSIVE_FLOWER:
                        // Explodes when hit, not on contact
                        break;
                    case DANGER_PLANT.SPORE_PLANT:
                        if (!player.equipped || !ITEMS[player.equipped] || ITEMS[player.equipped].name !== 'Masque anti-spores') {
                            if (player.invulnCooldown <= 0) {
                                player.health -= deltaTime * 6;
                                if (Math.random() < 0.05) notify('Spores toxiques ! Besoin d\'un masque.', 'danger');
                            }
                        }
                        break;
                }
            }
        }
    }
}

function damagePlayer(amount, msg) {
    let reduced = Math.max(1, amount - player.armor);
    player.health -= reduced;
    if (msg) notify(msg, 'danger');
}

function tryEat() {
    if (player.hunger >= 80) return;
    let foods = ['baies', 'viande', 'viande_cuite', 'viande_grillee'];
    for (let f of foods) {
        if (player.inventory[f] && player.inventory[f] > 0) {
            let item = ITEMS[f];
            player.hunger = Math.min(100, player.hunger + item.food);
            player.inventory[f]--;
            if (player.inventory[f] <= 0) delete player.inventory[f];
            notify(`Vous mangez ${item.name} (+${item.food} faim)`, 'success');
            return;
        }
    }
}

function tryDrink() {
    if (player.thirst >= 80) return;
    if (player.inventory['eau'] && player.inventory['eau'] > 0) {
        player.thirst = Math.min(100, player.thirst + 20);
        player.inventory['eau']--;
        if (player.inventory['eau'] <= 0) delete player.inventory['eau'];
        notify('Vous buvez de l\'eau (+20 soif)', 'success');
    }
}

function tryUsePotion() {
    if (player.inventory['potion_soin'] && player.inventory['potion_soin'] > 0 && player.health < 80) {
        player.health = Math.min(player.maxHealth, player.health + 50);
        player.inventory['potion_soin']--;
        if (player.inventory['potion_soin'] <= 0) delete player.inventory['potion_soin'];
        notify('Potion utilisée ! (+50 PV)', 'success');
    }
    if (player.inventory['potion_poison'] && player.inventory['potion_poison'] > 0 && player.poisonTimer > 0) {
        player.poisonTimer = 0;
        player.inventory['potion_poison']--;
        if (player.inventory['potion_poison'] <= 0) delete player.inventory['potion_poison'];
        notify('Poison neutralisé !', 'success');
    }
}

// ============================================
// ANIMALS
// ============================================
function updateAnimals() {
    for (let animal of animalEntities) {
        if (!animal.alive) continue;

        let distToPlayer = Math.hypot(animal.x - player.x, animal.y - player.y);
        let data = ANIMAL_DATA[animal.type];

        animal.stateTimer -= deltaTime;
        if (animal.hitCooldown > 0) animal.hitCooldown -= deltaTime;

        // AI
        switch (animal.state) {
            case 'idle':
                animal.vx *= 0.9;
                animal.vy *= 0.9;
                if (animal.stateTimer <= 0) {
                    animal.state = 'wander';
                    animal.stateTimer = 2 + Math.random() * 4;
                    animal.wanderAngle = Math.random() * Math.PI * 2;
                }
                // Aggro check
                if (data.behavior === ANIMAL_BEHAVIOR.AGGRESSIVE && distToPlayer < 200) {
                    animal.state = 'chase';
                    animal.stateTimer = 5;
                }
                if (data.behavior === ANIMAL_BEHAVIOR.NEUTRAL && distToPlayer < 100) {
                    animal.state = 'chase';
                    animal.stateTimer = 3;
                }
                if (data.behavior === ANIMAL_BEHAVIOR.BOSS && distToPlayer < 300) {
                    animal.state = 'chase';
                    animal.stateTimer = 10;
                }
                break;

            case 'wander':
                animal.vx = Math.cos(animal.wanderAngle) * animal.speed * 30;
                animal.vy = Math.sin(animal.wanderAngle) * animal.speed * 30;
                if (animal.stateTimer <= 0) animal.state = 'idle';
                if (data.behavior === ANIMAL_BEHAVIOR.AGGRESSIVE && distToPlayer < 200) {
                    animal.state = 'chase';
                    animal.stateTimer = 5;
                }
                if (data.behavior === ANIMAL_BEHAVIOR.BOSS && distToPlayer < 300) {
                    animal.state = 'chase';
                }
                break;

            case 'chase':
                let angle = Math.atan2(player.y - animal.y, player.x - animal.x);
                animal.vx = Math.cos(angle) * animal.speed * 50;
                animal.vy = Math.sin(angle) * animal.speed * 50;
                if (distToPlayer > 400) { animal.state = 'idle'; animal.stateTimer = 3; }
                if (distToPlayer < 30 && animal.hitCooldown <= 0) {
                    damagePlayer(data.damage, `${data.name} vous attaque !`);
                    animal.hitCooldown = 1;
                }
                if (animal.stateTimer <= 0) { animal.state = 'idle'; animal.stateTimer = 2; }
                break;
        }

        // Move
        animal.x += animal.vx * deltaTime;
        animal.y += animal.vy * deltaTime;
        animal.x = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH * TILE_SIZE - TILE_SIZE, animal.x));
        animal.y = Math.max(TILE_SIZE, Math.min(WORLD_HEIGHT * TILE_SIZE - TILE_SIZE, animal.y));

        // Flee (passive)
        if (data.behavior === ANIMAL_BEHAVIOR.PASSIVE && distToPlayer < 80) {
            let angle = Math.atan2(animal.y - player.y, animal.x - player.x);
            animal.vx = Math.cos(angle) * animal.speed * 60;
            animal.vy = Math.sin(angle) * animal.speed * 60;
            animal.x += animal.vx * deltaTime;
            animal.y += animal.vy * deltaTime;
        }
    }
}

// ============================================
// DANGER PLANTS UPDATE
// ============================================
function updateDangerPlants() {
    let tx = Math.floor(player.x / TILE_SIZE);
    let ty = Math.floor(player.y / TILE_SIZE);

    for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
            let cx = tx + dx;
            let cy = ty + dy;
            if (cx < 0 || cx >= WORLD_WIDTH || cy < 0 || cy >= WORLD_HEIGHT) continue;
            let dp = dangerPlantMap[cy][cx];
            if (!dp || !dp.active) continue;

            dp.cooldown -= deltaTime;

            // Carnivorous plant grab
            if (dp.type === DANGER_PLANT.CARNIVOROUS_PLANT && dp.grabbed) {
                if (Math.random() < 0.02) {
                    damagePlayer(5, 'La plante vous broie...');
                }
            }
        }
    }
}

// ============================================
// FOREST ANGER SYSTEM
// ============================================
function updateForestAnger() {
    forestAnger.level = Math.min(forestAnger.maxLevel, forestAnger.treesCut * 2);
    forestAnger.aggressivenessMultiplier = 1 + forestAnger.level / 50;
    forestAnger.spawnRate = 1 + forestAnger.level / 30;

    // Events based on anger
    if (forestAnger.level > 20 && gameTime - forestAnger.lastEvent > 60) {
        if (Math.random() < 0.005 * forestAnger.aggressivenessMultiplier) {
            triggerForestEvent();
            forestAnger.lastEvent = gameTime;
        }
    }
}

function triggerForestEvent() {
    let events = [
        () => { notify('🌿 Des lianes se déploient sur les chemins...', 'warning'); },
        () => { notify('🍄 Des spores toxiques se propagent !', 'danger'); timeSystem.fogActive = true; setTimeout(() => { timeSystem.fogActive = false; }, 15000); },
        () => { notify('🌸 Les fleurs libèrent du pollen toxique...', 'warning'); player.poisonTimer = Math.max(player.poisonTimer, 3); },
        () => { notify('🌪️ Un arbre mort menace de tomber !', 'warning'); },
        () => { notify('🐺 La forêt envoie ses prédateurs...', 'danger'); for (let i = 0; i < 3; i++) { spawnWolfNear(); } },
        () => { notify('🌿 La forêt se défend... Des plantes agressives apparaissent !', 'danger'); spawnDangerPlantsNear(); }
    ];
    events[Math.floor(Math.random() * events.length)]();
}

function spawnWolfNear() {
    let angle = Math.random() * Math.PI * 2;
    let dist = 300 + Math.random() * 200;
    let x = player.x + Math.cos(angle) * dist;
    let y = player.y + Math.sin(angle) * dist;
    x = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH * TILE_SIZE - TILE_SIZE, x));
    y = Math.max(TILE_SIZE, Math.min(WORLD_HEIGHT * TILE_SIZE - TILE_SIZE, y));
    let data = ANIMAL_DATA[ANIMAL_TYPE.WOLF];
    animalEntities.push({
        type: ANIMAL_TYPE.WOLF,
        x: x, y: y,
        hp: data.hp, maxHp: data.hp,
        speed: data.speed,
        vx: 0, vy: 0,
        state: 'chase',
        stateTimer: 8,
        targetX: player.x,
        targetY: player.y,
        wanderAngle: 0,
        aggroTarget: player,
        hitCooldown: 0,
        alive: true
    });
}

function spawnDangerPlantsNear() {
    let tx = Math.floor(player.x / TILE_SIZE);
    let ty = Math.floor(player.y / TILE_SIZE);
    for (let i = 0; i < 5; i++) {
        let cx = tx + Math.floor(Math.random() * 10 - 5);
        let cy = ty + Math.floor(Math.random() * 10 - 5);
        if (cx >= 0 && cx < WORLD_WIDTH && cy >= 0 && cy < WORLD_HEIGHT) {
            if (!dangerPlantMap[cy][cx] && !resourceMap[cy][cx]) {
                let types = [DANGER_PLANT.NETTLE, DANGER_PLANT.TOXIC_IVY, DANGER_PLANT.CARNIVOROUS_PLANT, DANGER_PLANT.SPORE_PLANT];
                dangerPlantMap[cy][cx] = { type: types[Math.floor(Math.random() * types.length)], hp: 15, active: true, cooldown: 0 };
            }
        }
    }
}

// ============================================
// PARTICLES & EFFECTS
// ============================================
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.life -= deltaTime;
        if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y -= 30 * deltaTime;
        ft.life -= deltaTime;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function addParticle(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100 - 50,
            life: 0.5 + Math.random() * 0.5,
            color: color,
            size: 2 + Math.random() * 3
        });
    }
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.5 });
}

// ============================================
// INVENTORY
// ============================================
function addToInventory(itemId, amount) {
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += amount;
    let item = ITEMS[itemId];
    if (item) notify(`+${amount} ${item.name}`, 'success');
}

function removeFromInventory(itemId, amount) {
    if (!player.inventory[itemId]) return false;
    if (player.inventory[itemId] < amount) return false;
    player.inventory[itemId] -= amount;
    if (player.inventory[itemId] <= 0) delete player.inventory[itemId];
    return true;
}

function hasItem(itemId, amount) {
    return player.inventory[itemId] && player.inventory[itemId] >= amount;
}

// ============================================
// INTERACTIONS
// ============================================
function handleInteract() {
    let tx = Math.floor(player.x / TILE_SIZE);
    let ty = Math.floor(player.y / TILE_SIZE);

    // Check surrounding tiles
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            let cx = tx + dx;
            let cy = ty + dy;
            if (cx < 0 || cx >= WORLD_WIDTH || cy < 0 || cy >= WORLD_HEIGHT) continue;

            // Resources
            let res = resourceMap[cy][cx];
            if (res) {
                harvestResource(cx, cy, res);
                return;
            }

            // Danger plants
            let dp = dangerPlantMap[cy][cx];
            if (dp && dp.active) {
                attackDangerPlant(cx, cy, dp);
                return;
            }

            // Animals
            for (let animal of animalEntities) {
                if (!animal.alive) continue;
                let aTx = Math.floor(animal.x / TILE_SIZE);
                let aTy = Math.floor(animal.y / TILE_SIZE);
                if (aTx === cx && aTy === cy) {
                    attackAnimal(animal);
                    return;
                }
            }

            // Buildings
            let building = buildingMap[cy][cx];
            if (building) {
                interactBuilding(cx, cy, building);
                return;
            }
        }
    }
}

function harvestResource(tx, ty, res) {
    let power = 1;
    if (player.equipped && ITEMS[player.equipped]) {
        power = ITEMS[player.equipped].power || 1;
    }

    res.hp -= power * 5;
    addParticle(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#8B4513', 5);

    if (res.hp <= 0) {
        switch (res.type) {
            case RES_TYPE.TREE:
                addToInventory('bois', 3 + Math.floor(Math.random() * 3));
                addToInventory('branche', 1 + Math.floor(Math.random() * 2));
                if (Math.random() < 0.3) addToInventory('feuilles', 2);
                forestAnger.treesCut++;
                addParticle(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#228B22', 15);
                break;
            case RES_TYPE.ROCK:
                addToInventory('pierre', 3 + Math.floor(Math.random() * 3));
                addParticle(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#888', 10);
                break;
            case RES_TYPE.BUSH:
                addToInventory('baies', 2 + Math.floor(Math.random() * 3));
                addToInventory('fibres', 1);
                break;
            case RES_TYPE.TALL_GRASS:
                addToInventory('fibres', 2 + Math.floor(Math.random() * 2));
                if (Math.random() < 0.2) addToInventory('graine_rare', 1);
                break;
            case RES_TYPE.MUSHROOM:
                if (res.toxic) {
                    player.poisonTimer = 4;
                    notify('Ce champignon est toxique !', 'danger');
                } else {
                    player.hunger = Math.min(100, player.hunger + 15);
                    notify('Champignon nourrissant (+15 faim)', 'success');
                }
                break;
            case RES_TYPE.IRON_ORE:
                addToInventory('minerai_fer', 2 + Math.floor(Math.random() * 2));
                addToInventory('pierre', 1);
                addParticle(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#CD853F', 8);
                break;
            case RES_TYPE.COAL:
                addToInventory('charbon', 2 + Math.floor(Math.random() * 2));
                break;
            case RES_TYPE.DEAD_TREE:
                addToInventory('bois', 2);
                addToInventory('branche', 2);
                addToInventory('charbon', 1);
                break;
            case RES_TYPE.REED:
                addToInventory('fibres', 3);
                addToInventory('bois', 1);
                break;
            case RES_TYPE.CRYSTAL:
                addToInventory('cristal', 1 + Math.floor(Math.random() * 2));
                notify('Vous avez trouvé un cristal !', 'success');
                addParticle(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#00FFFF', 20);
                break;
            case RES_TYPE.FLOWER:
                addToInventory('baies', 1);
                break;
        }
        resourceMap[ty][tx] = null;
    }
}

function attackDangerPlant(tx, ty, dp) {
    let damage = 5;
    if (player.equipped && ITEMS[player.equipped] && ITEMS[player.equipped].damage) {
        damage = ITEMS[player.equipped].damage;
    }
    dp.hp -= damage;

    addParticle(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#FF00FF', 5);

    if (dp.hp <= 0) {
        switch (dp.type) {
            case DANGER_PLANT.NETTLE:
                addToInventory('fibres', 2);
                break;
            case DANGER_PLANT.TOXIC_IVY:
                addToInventory('fibres', 1);
                addToInventory('baies', 1);
                break;
            case DANGER_PLANT.EXPLOSIVE_FLOWER:
                // Explosion!
                addParticle(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#FF4400', 30);
                damagePlayer(20, 'La fleur explose !');
                // Damage nearby
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        let nx = tx + dx;
                        let ny = ty + dy;
                        if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                            if (resourceMap[ny][nx]) resourceMap[ny][nx] = null;
                            if (dangerPlantMap[ny][nx]) dangerPlantMap[ny][nx] = null;
                        }
                    }
                }
                break;
            case DANGER_PLANT.THORN_BUSH:
                addToInventory('fibres', 3);
                addToInventory('branche', 2);
                break;
            case DANGER_PLANT.CARNIVOROUS_PLANT:
                addToInventory('fibres', 4);
                addToInventory('baies', 3);
                notify('Plante carnivore détruite !', 'success');
                break;
            case DANGER_PLANT.POISON_FLOWER:
                addToInventory('fibres', 2);
                addToInventory('potion_poison', 1);
                break;
            case DANGER_PLANT.SPORE_PLANT:
                addToInventory('fibres', 2);
                addToInventory('champignon_spore', 1);
                break;
        }
        dangerPlantMap[ty][tx] = null;
    }
}

function attackAnimal(animal) {
    if (player.attackCooldown > 0) return;

    let damage = 5;
    let range = 35;
    if (player.equipped && ITEMS[player.equipped]) {
        if (ITEMS[player.equipped].damage) damage = ITEMS[player.equipped].damage;
        if (ITEMS[player.equipped].ranged) range = 200;
    }

    let dist = Math.hypot(animal.x - player.x, animal.y - player.y);
    if (dist > range) {
        notify('Trop loin !', 'warning');
        return;
    }

    animal.hp -= damage;
    animal.hitCooldown = 0.5;
    addFloatingText(animal.x, animal.y - 20, `-${damage}`, '#FF4444');
    addParticle(animal.x, animal.y, '#FF0000', 5);

    player.attackCooldown = 0.4;

    // Aggro passive/neutral
    let data = ANIMAL_DATA[animal.type];
    if (data.behavior === ANIMAL_BEHAVIOR.PASSIVE || data.behavior === ANIMAL_BEHAVIOR.NEUTRAL) {
        animal.state = 'chase';
        animal.stateTimer = 5;
    }

    if (animal.hp <= 0) {
        animal.alive = false;
        let drop = ANIMAL_DATA[animal.type].drop;
        let amount = ANIMAL_DATA[animal.type].dropAmount;
        addToInventory(drop, amount);
        addParticle(animal.x, animal.y, '#FF0000', 15);
        notify(`${ANIMAL_DATA[animal.type].name} vaincu !`, 'success');

        if (animal.isBoss) {
            notify('BOSS vaincu ! Loot spécial obtenu !', 'success');
            addToInventory(ANIMAL_DATA[animal.type].drop, ANIMAL_DATA[animal.type].dropAmount);
        }
    }
}

function interactBuilding(tx, ty, building) {
    if (building.id === 'campfire') {
        // Cook meat nearby
        if (hasItem('viande', 1)) {
            removeFromInventory('viande', 1);
            addToInventory('viande_cuite', 1);
            notify('Viande cuite au feu de camp !', 'success');
        }
    }
    if (building.id === 'chest') {
        notify('Coffre ouvert !', 'info');
    }
}

// ============================================
// CRAFTING
// ============================================
function craftItem(recipeIndex) {
    let recipe = RECIPES[recipeIndex];
    if (!recipe) return;

    // Check ingredients
    for (let [item, amount] of Object.entries(recipe.ingredients)) {
        if (!hasItem(item, amount)) {
            notify('Ressources insuffisantes !', 'warning');
            return;
        }
    }

    // Check near fire if needed
    if (recipe.nearFire) {
        let nearFire = false;
        let tx = Math.floor(player.x / TILE_SIZE);
        let ty = Math.floor(player.y / TILE_SIZE);
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                let cx = tx + dx;
                let cy = ty + dy;
                if (cx >= 0 && cx < WORLD_WIDTH && cy >= 0 && cy < WORLD_HEIGHT) {
                    if (buildingMap[cy][cx] && buildingMap[cy][cx].id === 'campfire') nearFire = true;
                }
            }
        }
        if (!nearFire) {
            notify('Il faut être près d\'un feu de camp !', 'warning');
            return;
        }
    }

    // Remove ingredients
    for (let [item, amount] of Object.entries(recipe.ingredients)) {
        removeFromInventory(item, amount);
    }

    // Add result
    addToInventory(recipe.result, recipe.amount);
    notify(`Craft: ${ITEMS[recipe.result].name} x${recipe.amount}`, 'success');
}

// ============================================
// BUILDING
// ============================================
function buildItem(recipeIndex) {
    let recipe = BUILD_RECIPES[recipeIndex];
    if (!recipe) return;

    // Check ingredients
    for (let [item, amount] of Object.entries(recipe.ingredients)) {
        if (!hasItem(item, amount)) {
            notify('Ressources insuffisantes !', 'warning');
            return;
        }
    }

    // Place near player
    let tx = Math.floor(player.x / TILE_SIZE) + 1;
    let ty = Math.floor(player.y / TILE_SIZE);

    if (ty >= 0 && ty < WORLD_HEIGHT && tx >= 0 && tx < WORLD_WIDTH) {
        if (!buildingMap[ty][tx]) {
            for (let [item, amount] of Object.entries(recipe.ingredients)) {
                removeFromInventory(item, amount);
            }
            buildingMap[ty][tx] = { id: recipe.id, name: recipe.name, health: 100 };
            notify(`${recipe.name} construit !`, 'success');
        } else {
            notify('Emplacement occupé !', 'warning');
        }
    }
}

// ============================================
// CAMERA
// ============================================
function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

// ============================================
// RENDERING
// ============================================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    let startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    let endX = Math.min(WORLD_WIDTH, startX + VIEWPORT_TILES_X + 3);
    let endY = Math.min(WORLD_HEIGHT, startY + VIEWPORT_TILES_Y + 3);

    let daylight = getDaylight();

    // Draw tiles
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            let screenX = x * TILE_SIZE - camera.x;
            let screenY = y * TILE_SIZE - camera.y;

            // Base tile
            let color = getTileColor(world[y][x], biomeMap[y][x]);
            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE + 1, TILE_SIZE + 1);

            // Resources
            let res = resourceMap[y][x];
            if (res) {
                drawResource(screenX, screenY, res);
            }

            // Danger plants
            let dp = dangerPlantMap[y][x];
            if (dp && dp.active) {
                drawDangerPlant(screenX, screenY, dp);
            }

            // Buildings
            let building = buildingMap[y][x];
            if (building) {
                drawBuilding(screenX, screenY, building);
            }
        }
    }

    // Draw animals
    for (let animal of animalEntities) {
        if (!animal.alive) continue;
        let screenX = animal.x - camera.x;
        let screenY = animal.y - camera.y;
        if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) continue;

        let data = ANIMAL_DATA[animal.type];
        ctx.font = animal.isBoss ? '28px serif' : '22px serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.icon, screenX, screenY + 8);

        // HP bar for aggressive/boss
        if (data.behavior === ANIMAL_BEHAVIOR.AGGRESSIVE || data.behavior === ANIMAL_BEHAVIOR.BOSS) {
            if (animal.hp < animal.maxHp) {
                let barWidth = 30;
                let barHeight = 4;
                ctx.fillStyle = '#300';
                ctx.fillRect(screenX - barWidth / 2, screenY - 18, barWidth, barHeight);
                ctx.fillStyle = '#f00';
                ctx.fillRect(screenX - barWidth / 2, screenY - 18, barWidth * (animal.hp / animal.maxHp), barHeight);
            }
        }

        // Aggro indicator
        if (animal.state === 'chase') {
            ctx.fillStyle = '#FF0000';
            ctx.font = '12px sans-serif';
            ctx.fillText('!', screenX, screenY - 20);
        }
    }

    // Draw player
    let playerScreenX = player.x - camera.x;
    let playerScreenY = player.y - camera.y;

    // Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(playerScreenX, playerScreenY + 12, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player body
    ctx.fillStyle = player.invulnCooldown > 0 && Math.floor(gameTime * 10) % 2 === 0 ? '#FF8888' : '#4488FF';
    ctx.fillRect(playerScreenX - 10, playerScreenY - 14, 20, 28);

    // Player head
    ctx.fillStyle = '#FFD4A0';
    ctx.fillRect(playerScreenX - 7, playerScreenY - 22, 14, 12);

    // Eyes
    ctx.fillStyle = '#000';
    if (player.direction === 0) { ctx.fillRect(playerScreenX - 3, playerScreenY - 18, 2, 2); ctx.fillRect(playerScreenX + 1, playerScreenY - 18, 2, 2); }
    else if (player.direction === 1) { ctx.fillRect(playerScreenX + 2, playerScreenY - 18, 2, 2); ctx.fillRect(playerScreenX + 6, playerScreenY - 18, 2, 2); }
    else if (player.direction === 2) { ctx.fillRect(playerScreenX - 3, playerScreenY - 16, 2, 2); ctx.fillRect(playerScreenX + 1, playerScreenY - 16, 2, 2); }
    else { ctx.fillRect(playerScreenX - 6, playerScreenY - 18, 2, 2); ctx.fillRect(playerScreenX - 2, playerScreenY - 18, 2, 2); }

    // Equipped item
    if (player.equipped && ITEMS[player.equipped]) {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.fillText(ITEMS[player.equipped].icon, playerScreenX + (player.direction === 1 ? 16 : -16), playerScreenY);
    }

    // Particles
    for (let p of particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camera.x - p.size / 2, p.y - camera.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Floating texts
    for (let ft of floatingTexts) {
        ctx.globalAlpha = Math.max(0, ft.life / 1.5);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x - camera.x, ft.y - camera.y);
    }
    ctx.globalAlpha = 1;

    // Day/night overlay
    let nightAlpha = 1 - daylight;
    if (nightAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 30, ${nightAlpha * 0.7})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Player light
    if (daylight < 0.5 || isNight()) {
        let gradient = ctx.createRadialGradient(playerScreenX, playerScreenY, 10, playerScreenX, playerScreenY, player.lightRadius * TILE_SIZE);
        gradient.addColorStop(0, `rgba(255, 200, 100, ${(0.5 - daylight) * 0.4})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, player.lightRadius * TILE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // Fog overlay
    if (timeSystem.fogActive) {
        ctx.fillStyle = 'rgba(100, 150, 50, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Rain
    if (timeSystem.weather === 'rain' || timeSystem.weather === 'storm') {
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 100; i++) {
            let rx = Math.random() * canvas.width;
            let ry = Math.random() * canvas.height;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 5, ry + 15);
            ctx.stroke();
        }
    }

    // Minimap
    drawMinimap(startX, startY, endX, endY);
}

function getTileColor(tile, biome) {
    switch (tile) {
        case TILE.GRASS: return '#3a7a3a';
        case TILE.DIRT: return '#8B7355';
        case TILE.WATER: return '#3366AA';
        case TILE.DEEP_WATER: return '#1a3366';
        case TILE.STONE: return '#777777';
        case TILE.SAND: return '#D4C088';
        case TILE.SWAMP_WATER: return '#2a4a2a';
        case TILE.CAVE_FLOOR: return '#444444';
        case TILE.DARK_GRASS: return '#1a4a1a';
        default: return '#333';
    }
}

function drawResource(x, y, res) {
    ctx.textAlign = 'center';
    switch (res.type) {
        case RES_TYPE.TREE:
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(x + 12, y + 18, 8, 14);
            ctx.fillStyle = '#1a6a1a';
            ctx.beginPath();
            ctx.arc(x + 16, y + 14, 12, 0, Math.PI * 2);
            ctx.fill();
            break;
        case RES_TYPE.ROCK:
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(x + 16, y + 20, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(x + 14, y + 18, 6, 0, Math.PI * 2);
            ctx.fill();
            break;
        case RES_TYPE.BUSH:
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(x + 16, y + 20, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(x + 12, y + 18, 2, 0, Math.PI * 2);
            ctx.arc(x + 20, y + 16, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case RES_TYPE.TALL_GRASS:
            ctx.fillStyle = '#5a9a3a';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(x + 6 + i * 5, y + 8, 2, 20);
            }
            break;
        case RES_TYPE.MUSHROOM:
            ctx.fillStyle = res.toxic ? '#AA33AA' : '#DDAA55';
            ctx.beginPath();
            ctx.arc(x + 16, y + 20, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#DDCCAA';
            ctx.fillRect(x + 14, y + 22, 4, 8);
            break;
        case RES_TYPE.IRON_ORE:
            ctx.fillStyle = '#777';
            ctx.beginPath();
            ctx.arc(x + 16, y + 20, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#CD853F';
            ctx.beginPath();
            ctx.arc(x + 14, y + 18, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
        case RES_TYPE.COAL:
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x + 16, y + 20, 7, 0, Math.PI * 2);
            ctx.fill();
            break;
        case RES_TYPE.DEAD_TREE:
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(x + 14, y + 10, 4, 22);
            ctx.fillRect(x + 10, y + 14, 4, 2);
            ctx.fillRect(x + 20, y + 16, 4, 2);
            break;
        case RES_TYPE.REED:
            ctx.fillStyle = '#4a7a2a';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + 8 + i * 6, y + 5, 2, 25);
            }
            break;
        case RES_TYPE.CRYSTAL:
            ctx.fillStyle = '#00FFCC';
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 6);
            ctx.lineTo(x + 22, y + 20);
            ctx.lineTo(x + 10, y + 20);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,255,200,0.3)';
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
            ctx.fill();
            break;
        case RES_TYPE.FLOWER:
            ctx.fillStyle = '#FF69B4';
            for (let i = 0; i < 5; i++) {
                let a = (i / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(x + 16 + Math.cos(a) * 4, y + 18 + Math.sin(a) * 4, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x + 16, y + 18, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

function drawDangerPlant(x, y, dp) {
    ctx.textAlign = 'center';
    switch (dp.type) {
        case DANGER_PLANT.NETTLE:
            ctx.fillStyle = '#44AA44';
            ctx.fillRect(x + 14, y + 8, 4, 22);
            ctx.fillStyle = '#66CC66';
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(x + 8 + (i % 2) * 12, y + 10 + i * 3, 6, 2);
            }
            break;
        case DANGER_PLANT.TOXIC_IVY:
            ctx.fillStyle = '#884488';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(x + 8 + i * 5, y + 20 - i * 2, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case DANGER_PLANT.EXPLOSIVE_FLOWER:
            let pulse = Math.sin(gameTime * 3) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 68, 68, ${pulse})`;
            ctx.beginPath();
            ctx.arc(x + 16, y + 18, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF8800';
            for (let i = 0; i < 6; i++) {
                let a = (i / 6) * Math.PI * 2 + gameTime;
                ctx.beginPath();
                ctx.arc(x + 16 + Math.cos(a) * 6, y + 18 + Math.sin(a) * 6, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case DANGER_PLANT.THORN_BUSH:
            ctx.fillStyle = '#446622';
            ctx.beginPath();
            ctx.arc(x + 16, y + 20, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#884422';
            for (let i = 0; i < 8; i++) {
                let a = (i / 8) * Math.PI * 2;
                ctx.fillRect(x + 16 + Math.cos(a) * 8 - 1, y + 20 + Math.sin(a) * 8 - 1, 3, 3);
            }
            break;
        case DANGER_PLANT.CARNIVOROUS_PLANT:
            ctx.fillStyle = '#228B22';
            ctx.fillRect(x + 14, y + 18, 4, 14);
            ctx.fillStyle = dp.grabbed ? '#FF0000' : '#44AA44';
            ctx.beginPath();
            ctx.arc(x + 16, y + 14, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(x + 16, y + 14, 5, 0, Math.PI);
            ctx.fill();
            break;
        case DANGER_PLANT.POISON_FLOWER:
            ctx.fillStyle = '#AA44CC';
            for (let i = 0; i < 5; i++) {
                let a = (i / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(x + 16 + Math.cos(a) * 5, y + 18 + Math.sin(a) * 5, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#FF00FF';
            ctx.beginPath();
            ctx.arc(x + 16, y + 18, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
        case DANGER_PLANT.SPORE_PLANT:
            let sporeAlpha = (Math.sin(gameTime * 2) + 1) / 2;
            ctx.fillStyle = `rgba(100, 200, 50, ${0.5 + sporeAlpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + 16, y + 18, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(150, 255, 100, ${sporeAlpha * 0.6})`;
            for (let i = 0; i < 4; i++) {
                let ox = Math.cos(gameTime + i) * 10;
                let oy = Math.sin(gameTime + i) * 10 - 5;
                ctx.beginPath();
                ctx.arc(x + 16 + ox, y + 18 + oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
}

function drawBuilding(x, y, building) {
    switch (building.id) {
        case 'campfire':
            let flicker = Math.sin(gameTime * 10) * 2;
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(x + 16, y + 18 + flicker, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFAA00';
            ctx.beginPath();
            ctx.arc(x + 16, y + 16 + flicker, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#555';
            ctx.fillRect(x + 8, y + 26, 16, 4);
            break;
        case 'chest':
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 6, y + 16, 20, 14);
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(x + 14, y + 18, 4, 4);
            break;
        case 'workbench':
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 4, y + 18, 24, 12);
            ctx.fillStyle = '#6B4914';
            ctx.fillRect(x + 6, y + 24, 4, 8);
            ctx.fillRect(x + 22, y + 24, 4, 8);
            break;
        case 'wall':
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(x + 2, y + 4, 28, 28);
            ctx.fillStyle = '#6B5335';
            ctx.fillRect(x + 4, y + 6, 12, 12);
            ctx.fillRect(x + 18, y + 18, 12, 12);
            break;
        case 'floor':
            ctx.fillStyle = '#A0844A';
            ctx.fillRect(x + 1, y + 1, 30, 30);
            ctx.strokeStyle = '#806430';
            ctx.strokeRect(x + 1, y + 1, 30, 30);
            break;
        case 'roof':
            ctx.fillStyle = '#6B3A14';
            ctx.beginPath();
            ctx.moveTo(x, y + 20);
            ctx.lineTo(x + 16, y + 4);
            ctx.lineTo(x + 32, y + 20);
            ctx.fill();
            break;
        case 'door':
            ctx.fillStyle = '#6B3A14';
            ctx.fillRect(x + 8, y + 4, 16, 28);
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.arc(x + 20, y + 18, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'bed':
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 2, y + 20, 28, 10);
            ctx.fillStyle = '#DDDDFF';
            ctx.fillRect(x + 4, y + 14, 24, 8);
            ctx.fillStyle = '#6B3A14';
            ctx.fillRect(x + 4, y + 12, 8, 4);
            break;
    }
}

function drawMinimap() {
    let mc = document.getElementById('minimap');
    let mctx = mc.getContext('2d');
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, 150, 150);

    let scale = 150 / WORLD_WIDTH;
    let px = player.x / TILE_SIZE;
    let py = player.y / TILE_SIZE;

    // Draw biomes
    for (let y = 0; y < WORLD_HEIGHT; y += 4) {
        for (let x = 0; x < WORLD_WIDTH; x += 4) {
            let biome = biomeMap[y][x];
            switch (biome) {
                case BIOME.FOREST: mctx.fillStyle = '#2a5a2a'; break;
                case BIOME.DEEP_FOREST: mctx.fillStyle = '#0a3a0a'; break;
                case BIOME.RIVER: mctx.fillStyle = '#3366AA'; break;
                case BIOME.MOUNTAIN: mctx.fillStyle = '#666'; break;
                case BIOME.PRAIRIE: mctx.fillStyle = '#4a8a4a'; break;
                case BIOME.SWAMP: mctx.fillStyle = '#3a5a2a'; break;
            }
            mctx.fillRect(x * scale, y * scale, 3, 3);
        }
    }

    // Player dot
    mctx.fillStyle = '#FFFF00';
    mctx.beginPath();
    mctx.arc(px * scale, py * scale, 3, 0, Math.PI * 2);
    mctx.fill();
}

// ============================================
// HUD
// ============================================
function updateHUD() {
    document.querySelector('.bar-fill.health').style.width = `${player.health}%`;
    document.querySelector('.bar-fill.hunger').style.width = `${player.hunger}%`;
    document.querySelector('.bar-fill.thirst').style.width = `${player.thirst}%`;
    document.querySelector('.bar-fill.stamina').style.width = `${player.stamina}%`;
    document.querySelector('.bar-fill.temp').style.width = `${((player.temperature - 25) / 25) * 100}%`;

    document.getElementById('health-val').textContent = Math.round(player.health);
    document.getElementById('hunger-val').textContent = Math.round(player.hunger);
    document.getElementById('thirst-val').textContent = Math.round(player.thirst);
    document.getElementById('stamina-val').textContent = Math.round(player.stamina);
    document.getElementById('temp-val').textContent = `${Math.round(player.temperature)}°`;

    document.getElementById('day-count').textContent = `Jour ${timeSystem.day}`;
    let h = Math.floor(timeSystem.hour);
    let m = Math.floor(timeSystem.minute);
    let icon = isNight() ? '🌙' : '☀️';
    document.getElementById('time-of-day').textContent = `${icon} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    let weatherIcons = { clear: '☀️ Clair', fog: '🌫️ Brouillard', rain: '🌧️ Pluie', storm: '⛈️ Tempête' };
    document.getElementById('weather-display').textContent = weatherIcons[timeSystem.weather] || '☀️';

    // Forest anger
    document.getElementById('forest-anger') || createForestAngerUI();
    let angerFill = document.querySelector('.anger-fill');
    if (angerFill) angerFill.style.width = `${forestAnger.level}%`;
}

function createForestAngerUI() {
    let div = document.createElement('div');
    div.id = 'forest-anger';
    div.innerHTML = `
        <span>🌿 Colère de la forêt</span>
        <div class="anger-bar"><div class="anger-fill"></div></div>
    `;
    document.getElementById('game-container').appendChild(div);
}

// ============================================
// INPUT HANDLING
// ============================================
function handleKeyPress(e) {
    switch (e.key.toLowerCase()) {
        case 'e': handleInteract(); break;
        case 'i': toggleInventory(); break;
        case 'c': toggleCraft(); break;
        case 'b': toggleBuild(); break;
        case 'r': tryUsePotion(); break;
        case 'f': tryEat(); break;
        case 'g': tryDrink(); break;
        case '1': case '2': case '3': case '4': case '5':
            let slot = parseInt(e.key) - 1;
            player.selectedSlot = slot;
            break;
    }
}

function handleMouseClick() {
    handleInteract();
}

// ============================================
// UI PANELS
// ============================================
function toggleInventory() {
    let panel = document.getElementById('inventory-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderInventory();
    document.getElementById('craft-panel').classList.add('hidden');
    document.getElementById('build-panel').classList.add('hidden');
}

function toggleCraft() {
    let panel = document.getElementById('craft-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderCraftList();
    document.getElementById('inventory-panel').classList.add('hidden');
    document.getElementById('build-panel').classList.add('hidden');
}

function toggleBuild() {
    let panel = document.getElementById('build-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderBuildList();
    document.getElementById('inventory-panel').classList.add('hidden');
    document.getElementById('craft-panel').classList.add('hidden');
}

function renderInventory() {
    let grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    let items = Object.entries(player.inventory);
    for (let i = 0; i < 24; i++) {
        let slot = document.createElement('div');
        slot.className = 'inv-slot';
        if (i < items.length) {
            let [id, count] = items[i];
            let item = ITEMS[id];
            if (item) {
                slot.innerHTML = `${item.icon}<span class="count">${count}</span>`;
                slot.title = `${item.name} x${count}`;
                slot.onclick = () => {
                    if (item.food) {
                        player.hunger = Math.min(100, player.hunger + item.food);
                        removeFromInventory(id, 1);
                        notify(`Mangé ${item.name} (+${item.food} faim)`, 'success');
                        renderInventory();
                    } else if (item.drink) {
                        player.thirst = Math.min(100, player.thirst + item.drink);
                        removeFromInventory(id, 1);
                        notify(`Bu ${item.name} (+${item.drink} soif)`, 'success');
                        renderInventory();
                    } else if (item.heal) {
                        player.health = Math.min(player.maxHealth, player.health + item.heal);
                        removeFromInventory(id, 1);
                        notify(`${item.name} utilisé (+${item.heal} PV)`, 'success');
                        renderInventory();
                    } else if (item.curePoison) {
                        player.poisonTimer = 0;
                        removeFromInventory(id, 1);
                        notify('Poison neutralisé !', 'success');
                        renderInventory();
                    } else if (item.weapon || item.tool) {
                        player.equipped = player.equipped === id ? null : id;
                        notify(player.equipped ? `${item.name} équipé` : 'Déséquipé', 'info');
                        renderInventory();
                    } else if (item.armor) {
                        player.armor = player.armor > 0 ? 0 : item.armor;
                        player.equipped = player.equipped === id ? null : id;
                        notify(player.armor ? `Armure activée (+${item.armor})` : 'Armure retirée', 'info');
                        renderInventory();
                    }
                };
            }
        }
        grid.appendChild(slot);
    }
}

function renderCraftList() {
    let list = document.getElementById('craft-list');
    list.innerHTML = '';

    RECIPES.forEach((recipe, index) => {
        let item = ITEMS[recipe.result];
        let canCraft = true;
        let costText = '';

        for (let [res, amount] of Object.entries(recipe.ingredients)) {
            let have = player.inventory[res] || 0;
            let needed = amount;
            if (have < needed) canCraft = false;
            costText += `${ITEMS[res].icon}${have}/${needed} `;
        }

        if (recipe.nearFire) costText += '🔥 ';

        let div = document.createElement('div');
        div.className = `craft-item ${canCraft ? '' : 'disabled'}`;
        div.innerHTML = `
            <span class="craft-icon">${item.icon}</span>
            <div class="craft-info">
                <div class="craft-name">${item.name} x${recipe.amount}</div>
                <div class="craft-cost">${costText}</div>
            </div>
        `;
        if (canCraft) div.onclick = () => { craftItem(index); renderCraftList(); };
        list.appendChild(div);
    });
}

function renderBuildList() {
    let list = document.getElementById('build-list');
    list.innerHTML = '';

    BUILD_RECIPES.forEach((recipe, index) => {
        let canBuild = true;
        let costText = '';

        for (let [res, amount] of Object.entries(recipe.ingredients)) {
            let have = player.inventory[res] || 0;
            let needed = amount;
            if (have < needed) canBuild = false;
            costText += `${ITEMS[res] ? ITEMS[res].icon : res}${have}/${needed} `;
        }

        let div = document.createElement('div');
        div.className = `build-item ${canBuild ? '' : 'disabled'}`;
        div.innerHTML = `
            <span class="craft-icon">${recipe.icon}</span>
            <div class="craft-info">
                <div class="craft-name">${recipe.name}</div>
                <div class="craft-cost">${costText}</div>
            </div>
        `;
        if (canBuild) div.onclick = () => { buildItem(index); renderBuildList(); };
        list.appendChild(div);
    });
}

// ============================================
// NOTIFICATIONS
// ============================================
function notify(message, type) {
    let container = document.getElementById('notifications');
    let div = document.createElement('div');
    div.className = `notification ${type || ''}`;
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ============================================
// GAME OVER
// ============================================
function gameOver(reason) {
    gameRunning = false;
    document.getElementById('death-screen').classList.remove('hidden');
    document.getElementById('death-reason').textContent = reason;
    document.getElementById('death-stats').textContent = `Jour ${timeSystem.day} | Colère: ${forestAnger.level}%`;
}

function restartGame() {
    document.getElementById('death-screen').classList.add('hidden');
    player = {
        x: 100 * TILE_SIZE, y: 100 * TILE_SIZE,
        width: 24, height: 24, speed: 120, sprintSpeed: 200,
        vx: 0, vy: 0, direction: 0,
        health: 100, maxHealth: 100, hunger: 100, thirst: 100,
        stamina: 100, temperature: 37,
        inventory: {}, equipped: null, selectedSlot: 0,
        quickSlots: [null, null, null, null, null],
        attackCooldown: 0, invulnCooldown: 0, poisonTimer: 0,
        sprinting: false, lightRadius: 6, armor: 0
    };
    timeSystem = { hour: 12, minute: 0, day: 1, dayLength: 600, timeSpeed: 1, weather: 'clear', weatherTimer: 60, fogActive: false };
    forestAnger = { level: 0, maxLevel: 100, treesCut: 0, aggressivenessMultiplier: 1, spawnRate: 1, lastEvent: 0 };
    generateWorld();
    addToInventory('baies', 5);
    addToInventory('eau', 3);
    addToInventory('branche', 3);
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// ============================================
// START
// ============================================
window.onload = init;
