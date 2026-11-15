// ========== ИГРОК ==========
// Требует: CONFIG, State, CLASSES, TILE_*, MapModule

const Player = {
    create(className) {
    const cls = CLASSES[className];
    State.currentClass = className;
    State.player = {
        x: 0, y: 0, hp: cls.hp, maxHp: cls.hp, gold: 0,
        mana: 50, maxMana: 50,
        alive: true, invincible: false, invincibleTimer: 0,
        classData: cls, attackCooldown: 0, facing: 'right', moving: false,
        damageBonus: 0, speedBonus: 0, rangeBonus: 0, armorBonus: 0,
        skillCooldown: 0, skillCooldownMax: 1,
        inventory: [],
        equipment: { weapon: null, armor: null, ring: null },
        potions: 3,
    };
},
    getEffectiveDamage() { return State.player.classData.damage + (State.player.damageBonus || 0); },
    getEffectiveSpeed() { return State.player.classData.speed + (State.player.speedBonus || 0); },
    getEffectiveRange() { return State.player.classData.attackRange + (State.player.rangeBonus || 0); },

    update(dt) {
        const p = State.player;
        if (!p.alive || !State.gameRunning) return;
        const speed = this.getEffectiveSpeed();
        const keys = State.keys;

        let mx = 0, my = 0;
        if (keys.w) my -= 1;
        if (keys.s) my += 1;
        if (keys.a) mx -= 1;
        if (keys.d) mx += 1;
        p.moving = (mx !== 0 || my !== 0);

        if (p.moving) {
            const len = Math.sqrt(mx*mx + my*my);
            mx = (mx/len) * speed * dt * 0.06;
            my = (my/len) * speed * dt * 0.06;
            if (Math.abs(mx) > 0.1) p.facing = mx > 0 ? 'right' : 'left';
            if (Math.random() < 0.15) {
                State.particles.push({
                    x: p.x + (Math.random()-0.5)*15,
                    y: p.y + CONFIG.PLAYER_RADIUS - 2,
                    vx: (Math.random()-0.5)*1.5, vy: -0.5 - Math.random(),
                    life: 0.4, maxLife: 0.4, color: '#6a5a3a', size: 2 + Math.random()*2,
                });
            }
        }

        const newX = p.x + mx;
        if (!MapModule.circleHitsWall(newX, p.y, CONFIG.PLAYER_RADIUS)) p.x = newX;
        const newY = p.y + my;
        if (!MapModule.circleHitsWall(p.x, newY, CONFIG.PLAYER_RADIUS)) p.y = newY;
        p.x = Math.max(CONFIG.PLAYER_RADIUS, Math.min(State.MAP_W * CONFIG.TILE - CONFIG.PLAYER_RADIUS, p.x));
        p.y = Math.max(CONFIG.PLAYER_RADIUS, Math.min(State.MAP_H * CONFIG.TILE - CONFIG.PLAYER_RADIUS, p.y));

        if (p.invincible) {
            p.invincibleTimer -= dt;
            if (p.invincibleTimer <= 0) p.invincible = false;
        }
        if (p.attackCooldown > 0) p.attackCooldown--;

        // Аура паладина
        if (State.currentClass === 'paladin' && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + dt * 0.003);
        }

        MapModule.updateRoomState();

        // Лестница
        if (State.ladderPos && State.allRoomsCleared) {
            const dx = p.x - State.ladderPos.x, dy = p.y - State.ladderPos.y;
            if (Math.sqrt(dx*dx + dy*dy) < CONFIG.PLAYER_RADIUS + CONFIG.LADDER_RADIUS && keys.e) {
                keys.e = false;
                Game.nextDungeonLevel();
            }
        }
    },

    attack() {
        const p = State.player;
        if (!p.alive || !State.gameRunning || p.attackCooldown > 0) return;
        p.attackCooldown = 15;
        const dmg = this.getEffectiveDamage();
        const range = this.getEffectiveRange();
        let attacked = false;

        for (let i = State.enemies.length - 1; i >= 0; i--) {
            const e = State.enemies[i];
            const dx = e.x - p.x, dy = e.y - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < range + e.radius) {
                e.hp -= dmg;
                attacked = true;
                this.createHitEffect(e.x, e.y);
                State.floatingTexts.push({
                    x: e.x, y: e.y - e.radius - 5,
                    text: '-' + dmg, color: e.isBoss ? '#ff0' : '#ff6', life: 1.0, vy: -1.5,
                });
                if (e.hp <= 0) {
                    const xpGain = e.isBoss ? CONFIG.XP_PER_BOSS * State.dungeonLevel : (e.typeDef ? e.typeDef.xp : CONFIG.XP_PER_ENEMY);
                    UI.addXP(xpGain);
                    State.totalKills++;
                    const goldAmount = (e.isBoss ? 50 : CONFIG.GOLD_PER_ENEMY) + Math.floor(Math.random() * 8);
                    State.items.push({ x: e.x, y: e.y, type: 'gold', amount: goldAmount, radius: 12, bob: 0 });
                    if (Math.random() < (e.isBoss ? 1 : 0.3)) {
                        State.items.push({ x: e.x + (Math.random()-0.5)*30, y: e.y + (Math.random()-0.5)*30, type: 'potion', amount: CONFIG.HEAL_AMOUNT * (e.isBoss ? 3 : 1), radius: 12, bob: 0 });
                    }
                    const pCount = e.isBoss ? 50 : 15;
                    const pColor = e.isBoss ? '#f80' : (e.type === 'brute' ? '#a33' : (e.type === 'mage' ? '#a6f' : '#ccc'));
                    for (let k = 0; k < pCount; k++) {
                        State.particles.push({
                            x: e.x, y: e.y,
                            vx: (Math.random()-0.5)*(e.isBoss ? 12 : 5),
                            vy: (Math.random()-0.5)*(e.isBoss ? 12 : 5),
                            life: 1.0, maxLife: 1.0, color: pColor,
                            size: (e.isBoss ? 4 : 2) + Math.random()*4,
                        });
                    }
                    State.enemies.splice(i, 1);
                }
            }
        }

        // Двери
        for (const door of State.doors) {
            if (door.open) continue;
            const doorX = door.tx * CONFIG.TILE + CONFIG.TILE / 2, doorY = door.ty * CONFIG.TILE + CONFIG.TILE / 2;
            const dx = doorX - p.x, dy = doorY - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < range + CONFIG.TILE * 0.6) {
                door.hp -= dmg;
                attacked = true;
                this.createHitEffect(doorX, doorY);
                State.floatingTexts.push({ x: doorX, y: doorY - 15, text: '-' + dmg, color: '#da5', life: 1.0, vy: -1.5 });
                if (door.hp <= 0) {
                    door.open = true;
                    State.map[door.ty][door.tx] = TILE_DOOR_OPEN;
                    for (let k = 0; k < 20; k++) {
                        State.particles.push({
                            x: doorX, y: doorY,
                            vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
                            life: 0.9, maxLife: 0.9, color: '#a87a4a', size: 2 + Math.random()*3,
                        });
                    }
                }
            }
        }

        // Подбор
        for (let i = State.items.length - 1; i >= 0; i--) {
            const item = State.items[i];
            const dx = item.x - p.x, dy = item.y - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < CONFIG.PLAYER_RADIUS + item.radius + 10) {
                if (item.type === 'gold') {
                    p.gold += item.amount;
                    State.floatingTexts.push({ x: item.x, y: item.y, text: '+' + item.amount + 'g', color: '#ebca6b', life: 1.0, vy: -1.5 });
                } else {
                    p.hp = Math.min(p.maxHp, p.hp + item.amount);
                    State.floatingTexts.push({ x: item.x, y: item.y, text: '+' + item.amount + 'hp', color: '#f66', life: 1.0, vy: -1.5 });
                }
                State.items.splice(i, 1);
            }
        }

        if (attacked) {
            State.effects.push({
                x: p.x, y: p.y,
                angle: Math.atan2(State.mouse.y - p.y, State.mouse.x - p.x),
                life: 1.0, type: 'slash', color: p.classData.weaponGlow,
            });
        }

        if (State.currentRoom && State.enemies.length === 0) {
            const room = MapModule.getRoomAtPos(p.x, p.y);
            if (room && room.visited && !room.cleared) {
                const roomEnemies = State.enemies.filter(e => e.roomId === room.id);
                if (roomEnemies.length === 0) room.cleared = true;
            }
        }
        MapModule.checkAllCleared();
        UI.update();
    },

    createHitEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            State.particles.push({
                x, y,
                vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
                life: 0.7, maxLife: 0.7, color: '#f44', size: 3 + Math.random()*4,
            });
        }
    }
};
