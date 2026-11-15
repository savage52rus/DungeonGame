// ========== ВРАГИ, БОССЫ, ЭЛИТЫ, СУНДУКИ ==========
// Требует: CONFIG, State, ENEMY_TYPES, BOSS_TYPES, TILE_*, MapModule, Items, Audio

const Enemies = {
    spawnEnemiesForRoom(room) {
        if (room.id === 0 && State.dungeonLevel === 1) return;
        if (room.hasBoss && !room.bossSpawned) {
            room.bossSpawned = true;
            this.spawnBoss(room);
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const ex = room.center.x + Math.cos(angle) * 2 * CONFIG.TILE;
                const ey = room.center.y + Math.sin(angle) * 2 * CONFIG.TILE;
                if (MapModule.isWalkable(ex, ey) && !MapModule.circleHitsWall(ex, ey, CONFIG.ENEMY_RADIUS)) this.spawnEnemyAt(ex, ey);
            }
            return;
        }
        const count = 2 + Math.min(5, Math.floor(State.dungeonLevel / 2) + Math.floor(Math.random() * 2));
        const roomTilesX = room.maxX - room.minX + 1, roomTilesY = room.maxY - room.minY + 1;
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            while (attempts < 30) {
                const tx = room.minX + Math.floor(Math.random() * roomTilesX);
                const ty = room.minY + Math.floor(Math.random() * roomTilesY);
                if (State.map[ty] && State.map[ty][tx] === TILE_FLOOR) {
                    const ex = tx * CONFIG.TILE + CONFIG.TILE / 2, ey = ty * CONFIG.TILE + CONFIG.TILE / 2;
                    const dx = ex - State.player.x, dy = ey - State.player.y;
                    if (Math.sqrt(dx*dx + dy*dy) > 150) { this.spawnEnemyAt(ex, ey); break; }
                }
                attempts++;
            }
        }
        // Элита (25%)
        if (Math.random() < 0.25) {
            const ex = room.center.x + (Math.random() - 0.5) * 100;
            const ey = room.center.y + (Math.random() - 0.5) * 100;
            if (!MapModule.circleHitsWall(ex, ey, 24)) {
                this.spawnEnemyAt(ex, ey);
                const elite = State.enemies[State.enemies.length - 1];
                if (elite) {
                    elite.isElite = true;
                    elite.hp *= 2.5;
                    elite.maxHp = elite.hp;
                    elite.radius += 4;
                    elite.typeDef = { ...elite.typeDef, dmgMult: elite.typeDef.dmgMult * 1.4, xp: elite.typeDef.xp * 3 };
                }
            }
        }
        // Сундук (15%)
        if (Math.random() < 0.15) this.spawnChest(room);
    },

    spawnChest(room) {
        let cx, cy, attempts = 0;
        do {
            cx = room.center.x + (Math.random() - 0.5) * (room.maxX - room.minX - 2) * CONFIG.TILE;
            cy = room.center.y + (Math.random() - 0.5) * (room.maxY - room.minY - 2) * CONFIG.TILE;
            attempts++;
        } while (MapModule.circleHitsWall(cx, cy, 20) && attempts < 30);
        if (attempts >= 30) return;
        State.chests.push({ x: cx, y: cy, opened: false, roomId: room.id });
    },

    spawnEnemyAt(x, y, forceType = null) {
        let typeDef;
        if (forceType) typeDef = ENEMY_TYPES.find(t => t.id === forceType);
        else {
            const available = ENEMY_TYPES.filter(t => t.minDungeon <= State.dungeonLevel);
            let totalWeight = 0;
            for (const t of available) totalWeight += t.weight;
            let r = Math.random() * totalWeight;
            typeDef = available[0];
            for (const t of available) { r -= t.weight; if (r <= 0) { typeDef = t; break; } }
        }
        const diffMult = 1 + (State.dungeonLevel - 1) * 0.35 + State.totalKills * 0.005;
        let hp = Math.floor((30 + State.dungeonLevel * 12) * typeDef.hpMult * diffMult);
        const radius = typeDef.radius;
        if (MapModule.circleHitsWall(x, y, radius)) {
            let found = false;
            for (let ring = 1; ring <= 3 && !found; ring++)
                for (let dy = -ring; dy <= ring && !found; dy++)
                    for (let dx = -ring; dx <= ring && !found; dx++) {
                        const nx = x + dx * CONFIG.TILE, ny = y + dy * CONFIG.TILE;
                        if (!MapModule.circleHitsWall(nx, ny, radius)) { x = nx; y = ny; found = true; }
                    }
            if (!found) return;
        }
        State.enemies.push({
            x, y, hp, maxHp: hp, radius, lastAttack: 0,
            type: typeDef.id, typeDef, isBoss: false,
            roomId: State.currentRoom ? State.currentRoom.id : -1,
            poisoned: 0,
        });
    },

    spawnBoss(room) {
        const bossDef = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        const diffMult = 1 + (State.dungeonLevel - 1) * 0.5;
        const hp = Math.floor((200 + State.dungeonLevel * 80) * bossDef.hpMult / 3 * diffMult);
        State.enemies.push({
            x: room.center.x, y: room.center.y,
            hp, maxHp: hp, radius: bossDef.radius, lastAttack: 0,
            type: bossDef.id, typeDef: bossDef, isBoss: true, roomId: room.id,
            poisoned: 0,
        });
        room.boss = bossDef;
        Audio.boss();
    },

    update(dt) {
        if (!State.player.alive || !State.gameRunning) return;
        const now = performance.now();

        for (let i = State.enemies.length - 1; i >= 0; i--) {
            const e = State.enemies[i];

            // Отравление
            if (e.poisoned > 0) {
                e.poisoned -= dt * 0.001;
                if (Math.random() < 0.08) {
                    const dmg = Math.max(1, Math.floor(Player.getEffectiveDamage() * 0.08));
                    e.hp -= dmg;
                    State.floatingTexts.push({
                        x: e.x + (Math.random()-0.5)*20, y: e.y - e.radius,
                        text: '-' + dmg, color: '#8f6', life: 0.8, vy: -1.5,
                    });
                    if (e.hp <= 0) {
                        this.onEnemyKilled(i, e);
                        continue;
                    }
                }
            }

            const dx = State.player.x - e.x, dy = State.player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist > 0.1) {
                let spd = CONFIG.ENEMY_SPEED * (e.typeDef ? e.typeDef.spdMult : 1);
                if (e.isBoss) spd *= 0.9;
                if (e.isElite) spd *= 1.1;
                spd *= 1 + (State.dungeonLevel - 1) * 0.03;
                const speed = spd * dt * 0.06;
                const moveX = (dx/dist) * speed, moveY = (dy/dist) * speed;
                const newX = e.x + moveX;
                if (!MapModule.circleHitsWall(newX, e.y, e.radius)) e.x = newX;
                const newY = e.y + moveY;
                if (!MapModule.circleHitsWall(e.x, newY, e.radius)) e.y = newY;
            }

            if (dist < CONFIG.PLAYER_RADIUS + e.radius + 10 && now - e.lastAttack > CONFIG.ENEMY_ATTACK_COOLDOWN) {
                e.lastAttack = now;
                if (!State.player.invincible && State.player.alive) {
                    const baseDmg = e.isBoss ? 25 + State.dungeonLevel * 3 : (CONFIG.ENEMY_ATTACK_DAMAGE + Math.floor(State.dungeonLevel * 1.5));
                    const dmg = Math.floor(baseDmg * (e.typeDef ? e.typeDef.dmgMult : 1));
                    // Учитываем броню (поглощает до 50%)
                    const armor = State.player.armorBonus || 0;
                    const absorbed = Math.min(dmg * 0.5, armor);
                    const finalDmg = Math.max(1, Math.floor(dmg - absorbed));
                    State.player.hp -= finalDmg;
                    State.player.invincible = true;
                    State.player.invincibleTimer = 400;
                    Player.createHitEffect(State.player.x, State.player.y);
                    State.floatingTexts.push({
                        x: State.player.x, y: State.player.y - CONFIG.PLAYER_RADIUS - 10,
                        text: '-' + finalDmg, color: '#f44', life: 1.0, vy: -1.5,
                    });
                    if (typeof Game !== 'undefined') Game.flashDamage();
                    if (State.player.hp <= 0) {
                        State.player.hp = 0;
                        State.player.alive = false;
                        document.getElementById('deathMessage').style.display = 'block';
                    }
                    Audio.hurt();
                    UI.update();
                }
            }

            // Отталкивание
            for (let j = i - 1; j >= 0; j--) {
                const o = State.enemies[j];
                const ddx = e.x - o.x, ddy = e.y - o.y;
                const dd = Math.sqrt(ddx*ddx + ddy*ddy);
                const minD = e.radius + o.radius;
                if (dd < minD && dd > 0.01) {
                    const ov = (minD - dd) / 2;
                    const ang = Math.atan2(ddy, ddx);
                    const px = Math.cos(ang) * ov, py = Math.sin(ang) * ov;
                    if (!MapModule.circleHitsWall(e.x + px, e.y + py, e.radius)) { e.x += px; e.y += py; }
                    if (!MapModule.circleHitsWall(o.x - px, o.y - py, o.radius)) { o.x -= px; o.y -= py; }
                }
            }
        }

        if (State.currentRoom && !State.currentRoom.cleared) {
            const roomEnemies = State.enemies.filter(e => e.roomId === State.currentRoom.id);
            if (roomEnemies.length === 0 && State.currentRoom.enemiesSpawned) State.currentRoom.cleared = true;
        }
        MapModule.checkAllCleared();
    },

    onEnemyKilled(index, e) {
        const xpGain = e.isBoss ? CONFIG.XP_PER_BOSS * State.dungeonLevel
                    : (e.isElite ? (e.typeDef ? e.typeDef.xp * 3 : CONFIG.XP_PER_ENEMY * 3)
                    : (e.typeDef ? e.typeDef.xp : CONFIG.XP_PER_ENEMY));
        UI.addXP(xpGain);
        State.totalKills++;
        Audio.kill();

        // Золото
        const goldAmount = (e.isBoss ? 50 : (e.isElite ? 30 : CONFIG.GOLD_PER_ENEMY)) + Math.floor(Math.random() * 8);
        State.items.push({ x: e.x, y: e.y, type: 'gold', amount: goldAmount, radius: 12, bob: 0 });

        // Зелье
        if (Math.random() < (e.isBoss ? 1 : (e.isElite ? 0.5 : 0.3))) {
            State.items.push({
                x: e.x + (Math.random()-0.5)*30, y: e.y + (Math.random()-0.5)*30,
                type: 'potion', amount: CONFIG.HEAL_AMOUNT * (e.isBoss ? 3 : 1), radius: 12, bob: 0,
            });
        }

        // Предметы
        if (e.isBoss) {
            for (let k = 0; k < 2; k++) {
                const item = Items.generateItem(State.dungeonLevel + 3);
                item.x = e.x + (Math.random()-0.5)*50;
                item.y = e.y + (Math.random()-0.5)*50;
                item.pickupType = 'item';
                State.items.push(item);
            }
        } else if (e.isElite) {
            if (Math.random() < 0.7) {
                const item = Items.generateItem(State.dungeonLevel + 1);
                item.x = e.x + (Math.random()-0.5)*30;
                item.y = e.y + (Math.random()-0.5)*30;
                item.pickupType = 'item';
                State.items.push(item);
            }
        } else if (Math.random() < 0.08) {
            const item = Items.generateItem(State.dungeonLevel);
            item.x = e.x;
            item.y = e.y;
            item.pickupType = 'item';
            State.items.push(item);
        }

        // Частицы
        const pCount = e.isBoss ? 50 : (e.isElite ? 30 : 15);
        const pColor = e.isBoss ? '#f80' : (e.isElite ? '#fc6' : (e.type === 'brute' ? '#a33' : (e.type === 'mage' ? '#a6f' : '#ccc')));
        for (let k = 0; k < pCount; k++) {
            State.particles.push({
                x: e.x, y: e.y,
                vx: (Math.random()-0.5)*(e.isBoss ? 12 : 5),
                vy: (Math.random()-0.5)*(e.isBoss ? 12 : 5),
                life: 1.0, maxLife: 1.0, color: pColor,
                size: (e.isBoss ? 4 : 2) + Math.random()*4,
            });
        }
        State.enemies.splice(index, 1);
    }
};