// ========== КОНСТАНТЫ И КОНФИГУРАЦИЯ ==========
const CONFIG = {
    W: 900, H: 600,
    PLAYER_RADIUS: 20,
    ENEMY_RADIUS: 18,
    ENEMY_ATTACK_DAMAGE: 10,
    ENEMY_SPEED: 1.5,
    ENEMY_ATTACK_COOLDOWN: 600,
    GOLD_PER_ENEMY: 12,
    HEAL_AMOUNT: 15,
    XP_PER_ENEMY: 15,
    XP_PER_BOSS: 100,
    LADDER_RADIUS: 28,
    TILE: 40,
    DOOR_HP: 30,
};

const TILE_WALL = 0;
const TILE_FLOOR = 1;
const TILE_DOOR_CLOSED = 2;
const TILE_DOOR_OPEN = 3;

// Классы персонажей
const CLASSES = {
    barbarian: {
        name: 'Варвар', hp: 140, damage: 30, speed: 3.0, attackRange: 85,
        skin: '#e8b888', skinShadow: '#a87a50',
        armor: '#8a2e1a', armorLight: '#b84228', armorDark: '#5a1a0a',
        armor2: '#c33', armor2Light: '#e55', armor2Dark: '#821a1a',
        weapon: '#d0d0d8', weaponLight: '#ffffff', weaponGlow: '#ffe9a0',
        cape: '#4a1a0a', capeDark: '#2a0a00', hair: '#5a4a3a',
        accent: '#d4a040', auraColor: 'rgba(255,200,100,0.15)'
    },
    amazon: {
        name: 'Амазонка', hp: 90, damage: 20, speed: 4.2, attackRange: 110,
        skin: '#f0c898', skinShadow: '#b08858',
        armor: '#2a6b3a', armorLight: '#3a8b4a', armorDark: '#1a4a1a',
        armor2: '#4a9b5a', armor2Light: '#6abb7a', armor2Dark: '#2a6b3a',
        weapon: '#8b5a2b', weaponLight: '#c08050', weaponGlow: '#ffe9a0',
        cape: '#1a3a1a', capeDark: '#0a1a0a', hair: '#8a4a1a',
        accent: '#d4a040', auraColor: 'rgba(120,255,150,0.15)'
    },
    sorceress: {
        name: 'Волшебница', hp: 80, damage: 45, speed: 3.2, attackRange: 100,
        skin: '#f8dcc0', skinShadow: '#c0a080',
        armor: '#3a2a6b', armorLight: '#5a3a9b', armorDark: '#1a0a4a',
        armor2: '#6a4aab', armor2Light: '#8a6acb', armor2Dark: '#3a2a6b',
        weapon: '#8a6ab0', weaponLight: '#c0a0e0', weaponGlow: '#c9aaff',
        cape: '#1a0a3a', capeDark: '#0a0020', hair: '#e0e0ff',
        accent: '#c9aaff', auraColor: 'rgba(180,120,255,0.18)'
    },
    paladin: {
        name: 'Паладин', hp: 120, damage: 26, speed: 3.4, attackRange: 90,
        skin: '#f0d0b0', skinShadow: '#b89070',
        armor: '#c0c8d8', armorLight: '#e8f0ff', armorDark: '#808898',
        armor2: '#d4a040', armor2Light: '#f0c060', armor2Dark: '#8a6a20',
        weapon: '#e8e8f0', weaponLight: '#ffffff', weaponGlow: '#ffffff',
        cape: '#4a5a8a', capeDark: '#2a3a5a', hair: '#d4c040',
        accent: '#f0d050', auraColor: 'rgba(255,255,200,0.2)'
    },
    necromancer: {
        name: 'Некромант', hp: 100, damage: 22, speed: 3.6, attackRange: 120,
        skin: '#c8d0b8', skinShadow: '#889078',
        armor: '#2a2a1a', armorLight: '#4a4a2a', armorDark: '#0a0a00',
        armor2: '#5a6a3a', armor2Light: '#7a8a5a', armor2Dark: '#2a3a1a',
        weapon: '#6a4a2a', weaponLight: '#9a7a5a', weaponGlow: '#8aff6a',
        cape: '#1a1a0a', capeDark: '#0a0a00', hair: '#3a4a2a',
        accent: '#8aff6a', auraColor: 'rgba(120,255,100,0.18)'
    }
};

// Типы врагов, открывающиеся по мере прохождения
const ENEMY_TYPES = [
    { id: 'skeleton', name: 'Скелет', minDungeon: 1, weight: 1, hpMult: 1, dmgMult: 1, spdMult: 1, radius: 18, xp: 15, color: '#d0c8b0' },
    { id: 'brute', name: 'Демон', minDungeon: 1, weight: 0.7, hpMult: 1.8, dmgMult: 1.3, spdMult: 0.75, radius: 24, xp: 25, color: '#8a3e1e' },
    { id: 'mage', name: 'Тёмный маг', minDungeon: 2, weight: 0.6, hpMult: 1.2, dmgMult: 1.5, spdMult: 1.1, radius: 20, xp: 30, color: '#2a1a4a' },
    { id: 'ghoul', name: 'Упырь', minDungeon: 3, weight: 0.7, hpMult: 1.4, dmgMult: 1.2, spdMult: 1.4, radius: 20, xp: 28, color: '#5a7a3a' },
    { id: 'wraith', name: 'Призрак', minDungeon: 4, weight: 0.5, hpMult: 1.1, dmgMult: 1.8, spdMult: 1.5, radius: 18, xp: 35, color: '#3a5a8a' },
    { id: 'demonknight', name: 'Рыцарь тьмы', minDungeon: 6, weight: 0.4, hpMult: 2.5, dmgMult: 2, spdMult: 0.9, radius: 24, xp: 50, color: '#6a1a1a' },
];

// Боссы
const BOSS_TYPES = [
    { id: 'boss_skeleton_king', name: 'Король Скелетов', radius: 40, color: '#a89870', xp: 200, hpMult: 6 },
    { id: 'boss_demon_lord', name: 'Повелитель Демонов', radius: 42, color: '#a03010', xp: 250, hpMult: 7 },
    { id: 'boss_archmage', name: 'Архимаг Тьмы', radius: 38, color: '#5a2a8a', xp: 300, hpMult: 8 },
];

// Глобальное состояние игры
const State = {
    player: {},
    enemies: [],
    items: [],
    effects: [],
    particles: [],
    floatingTexts: [],
    keys: { w: false, a: false, s: false, d: false, e: false, space: false },
    mouse: { x: 0, y: 0 },
    gameRunning: false,
    animFrameId: null,
    lastTime: 0,
    globalTime: 0,
    pausedForUpgrade: false,
    currentClass: null,
    dungeonLevel: 1,
    totalKills: 0,
    xp: 0, level: 1, xpToNext: 45, pendingUpgrades: 0,
    // Карта
    map: [],
    rooms: [],
    doors: [],
    ladderPos: null,
    currentRoom: null,
    allRoomsCleared: false,
    MAP_W: 0, MAP_H: 0,
};
