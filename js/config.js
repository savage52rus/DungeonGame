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
// === Редкости предметов ===
const RARITIES = {
    common: { name: 'Обычный', color: '#c9ad8a', weight: 0.60, statMult: 1.0 },
    magic: { name: 'Магический', color: '#6af', weight: 0.28, statMult: 1.4 },
    rare: { name: 'Редкий', color: '#fc6', weight: 0.10, statMult: 1.9 },
    legendary: { name: 'Легендарный', color: '#f80', weight: 0.02, statMult: 2.6 },
};

// === Шаблоны предметов ===
const ITEM_TEMPLATES = [
    // Оружие
    { id: 'sword', type: 'weapon', icon: '🗡️', names: ['Клинок', 'Меч', 'Сабли'], stat: 'damageBonus', statName: 'Урон' },
    { id: 'axe', type: 'weapon', icon: '🪓', names: ['Топор', 'Секира', 'Колун'], stat: 'damageBonus', statName: 'Урон' },
    { id: 'bow', type: 'weapon', icon: '🏹', names: ['Лук', 'Арбалет', 'Тетива'], stat: 'damageBonus', statName: 'Урон' },
    { id: 'staff', type: 'weapon', icon: '🪄', names: ['Посох', 'Жезл', 'Скипетр'], stat: 'damageBonus', statName: 'Урон' },
    // Броня
    { id: 'armor', type: 'armor', icon: '🥋', names: ['Кираса', 'Доспех', 'Мантия'], stat: 'armorBonus', statName: 'Броня' },
    { id: 'helmet', type: 'armor', icon: '⛑️', names: ['Шлем', 'Каска', 'Венец'], stat: 'armorBonus', statName: 'Броня' },
    // Кольца
    { id: 'ring', type: 'ring', icon: '💍', names: ['Кольцо', 'Перстень', 'Печатка'], stat: 'hpBonus', statName: 'HP' },
    { id: 'amulet', type: 'ring', icon: '📿', names: ['Амулет', 'Оберег', 'Талисман'], stat: 'hpBonus', statName: 'HP' },
    // Зелья
    { id: 'potion', type: 'potion', icon: '🧪', names: ['Зелье лечения', 'Эликсир'], stat: 'heal', statName: 'Лечение' },
];

// === Умения по классам ===
const SKILLS = {
    barbarian: {
        name: 'Рывок',
        icon: '💨',
        cooldown: 4000,
        manaCost: 20,
        desc: 'Быстрый бросок вперёд, сбивает врагов',
        execute: function(player, state) {
            const dx = Math.cos(player.facing === 'right' ? 0 : Math.PI) * 200;
            const dist = 150;
            // Телепортация вперёд с проверкой стен
            const targetX = player.x + (player.facing === 'right' ? dist : -dist);
            const steps = 20;
            for (let i = 1; i <= steps; i++) {
                const nx = player.x + ((targetX - player.x) * i / steps);
                if (!MapModule.circleHitsWall(nx, player.y, CONFIG.PLAYER_RADIUS)) {
                    player.x = nx;
                } else break;
            }
            // Урон врагам в радиусе 60
            const r = 60;
            for (const e of state.enemies) {
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d < r + e.radius) {
                    e.hp -= Player.getEffectiveDamage() * 1.5;
                    Player.createHitEffect(e.x, e.y);
                    state.floatingTexts.push({ x: e.x, y: e.y - e.radius - 5, text: '-' + Math.floor(Player.getEffectiveDamage() * 1.5), color: '#fa0', life: 1.0, vy: -1.5 });
                }
            }
            // Эффект
            for (let i = 0; i < 20; i++) {
                state.particles.push({
                    x: player.x + (Math.random()-0.5)*40,
                    y: player.y + (Math.random()-0.5)*40,
                    vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                    life: 0.6, maxLife: 0.6, color: '#fa0', size: 3 + Math.random()*3,
                });
            }
        }
    },
    amazon: {
        name: 'Залп',
        icon: '🎯',
        cooldown: 3500,
        manaCost: 25,
        desc: 'Стрелы по всем врагам вокруг',
        execute: function(player, state) {
            const range = Player.getEffectiveRange() * 1.2;
            const dmg = Player.getEffectiveDamage() * 0.8;
            for (const e of state.enemies) {
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d < range + e.radius) {
                    e.hp -= dmg;
                    Player.createHitEffect(e.x, e.y);
                    state.floatingTexts.push({ x: e.x, y: e.y - e.radius - 5, text: '-' + Math.floor(dmg), color: '#8fc', life: 1.0, vy: -1.5 });
                }
            }
            for (let i = 0; i < 25; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * range;
                state.particles.push({
                    x: player.x + Math.cos(a) * r, y: player.y + Math.sin(a) * r,
                    vx: Math.cos(a) * 3, vy: Math.sin(a) * 3,
                    life: 0.7, maxLife: 0.7, color: '#8fc', size: 3 + Math.random()*3,
                });
            }
        }
    },
    sorceress: {
        name: 'Огненный шар',
        icon: '🔥',
        cooldown: 5000,
        manaCost: 30,
        desc: 'Взрыв огня по площади',
        execute: function(player, state) {
            const r = 180;
            const dmg = Player.getEffectiveDamage() * 2;
            for (const e of state.enemies) {
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d < r + e.radius) {
                    e.hp -= dmg * (1 - d / r * 0.4);
                    Player.createHitEffect(e.x, e.y);
                    state.floatingTexts.push({ x: e.x, y: e.y - e.radius - 5, text: '-' + Math.floor(dmg), color: '#f80', life: 1.0, vy: -1.5 });
                }
            }
            for (let i = 0; i < 40; i++) {
                const a = Math.random() * Math.PI * 2;
                const r2 = Math.random() * r;
                state.particles.push({
                    x: player.x + Math.cos(a) * r2, y: player.y + Math.sin(a) * r2,
                    vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 - 2,
                    life: 0.9, maxLife: 0.9, color: i % 2 ? '#f80' : '#f44', size: 4 + Math.random()*4,
                });
            }
        }
    },
    paladin: {
        name: 'Исцеление',
        icon: '✨',
        cooldown: 6000,
        manaCost: 35,
        desc: 'Восстанавливает 40 HP',
        execute: function(player, state) {
            const heal = 40;
            player.hp = Math.min(player.maxHp, player.hp + heal);
            state.floatingTexts.push({ x: player.x, y: player.y - 40, text: '+' + heal + ' HP', color: '#8fc', life: 1.5, vy: -2 });
            for (let i = 0; i < 30; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 20 + Math.random() * 40;
                state.particles.push({
                    x: player.x + Math.cos(a) * r, y: player.y + Math.sin(a) * r,
                    vx: Math.cos(a) * 1.5, vy: -2 - Math.random(),
                    life: 1.0, maxLife: 1.0, color: '#ffe9a0', size: 3 + Math.random()*3,
                });
            }
            UI.update();
        }
    },
    necromancer: {
        name: 'Ядовитое облако',
        icon: '☠️',
        cooldown: 4500,
        manaCost: 28,
        desc: 'Отравляет врагов в радиусе',
        execute: function(player, state) {
            const r = 160;
            const dmg = Player.getEffectiveDamage() * 0.6;
            for (const e of state.enemies) {
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d < r + e.radius) {
                    e.hp -= dmg * 2;
                    e.poisoned = 3.0; // тикающий урон
                    Player.createHitEffect(e.x, e.y);
                    state.floatingTexts.push({ x: e.x, y: e.y - e.radius - 5, text: '-' + Math.floor(dmg * 2), color: '#8f6', life: 1.0, vy: -1.5 });
                }
            }
            for (let i = 0; i < 50; i++) {
                const a = Math.random() * Math.PI * 2;
                const r2 = Math.random() * r;
                state.particles.push({
                    x: player.x + Math.cos(a) * r2, y: player.y + Math.sin(a) * r2,
                    vx: (Math.random()-0.5)*2, vy: -1 - Math.random()*2,
                    life: 1.5, maxLife: 1.5, color: '#8f6', size: 5 + Math.random()*5,
                });
            }
        }
    }
};

