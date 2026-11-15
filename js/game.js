// ========== ОСНОВНОЙ ЦИКЛ, СОБЫТИЯ, РЕНДЕР ==========
// Требует: все предыдущие модули

const Game = {
    canvas: null,
    ctx: null,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        document.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', () => this.startGame(card.dataset.class));
        });

        this.setupEvents();
        this.idleDraw();
    },

    startGame(className) {
        Player.create(className);
        State.dungeonLevel = 1;
        State.totalKills = 0;
        State.xp = 0; State.level = 1; State.xpToNext = 45;
        State.pendingUpgrades = 0; State.pausedForUpgrade = false;
        State.bestDungeon = parseInt(localStorage.getItem('d2_bestDungeon') || '0');

        MapModule.generateDungeon();
        State.enemies = []; State.items = []; State.effects = [];
        State.particles = []; State.floatingTexts = [];
        State.chests = [];

        document.getElementById('deathMessage').style.display = 'none';
        document.getElementById('victoryMessage').style.display = 'none';
        document.getElementById('charSelect').classList.add('hidden');
        document.getElementById('upgradeOverlay').classList.remove('active');
        UI.updateRoomIndicator();
        UI.update();

        State.gameRunning = true;
        if (State.animFrameId) cancelAnimationFrame(State.animFrameId);
        State.lastTime = 0;
        State.animFrameId = requestAnimationFrame(this.gameLoop);
    },

    nextDungeonLevel() {
        State.dungeonLevel++;
        State.xp = Math.max(0, State.xp - Math.floor(State.xpToNext * 0.3));
        if (State.dungeonLevel > (State.bestDungeon || 0)) {
            State.bestDungeon = State.dungeonLevel;
            localStorage.setItem('d2_bestDungeon', State.dungeonLevel);
        }
        MapModule.generateDungeon();
        State.enemies = []; State.items = []; State.effects = [];
        State.particles = []; State.floatingTexts = [];
        State.chests = [];
        State.player.hp = Math.min(State.player.maxHp, State.player.hp + 30);
        State.player.mana = Math.min(State.player.maxMana, State.player.mana + 20);
        UI.update();
    },

    showCharSelect() {
        State.gameRunning = false;
        State.pausedForUpgrade = false;
        if (State.animFrameId) { cancelAnimationFrame(State.animFrameId); State.animFrameId = null; }
        document.getElementById('charSelect').classList.remove('hidden');
        document.getElementById('deathMessage').style.display = 'none';
        document.getElementById('victoryMessage').style.display = 'none';
        document.getElementById('upgradeOverlay').classList.remove('active');
        document.getElementById('roomIndicator').classList.remove('visible');
        document.getElementById('inventoryPanel').classList.remove('open');
    },

    usePotion() {
        const p = State.player;
        if (!p.alive || !State.gameRunning || State.pausedForUpgrade) return;
        if (p.potions <= 0) {
            State.floatingTexts.push({ x: p.x, y: p.y - 40, text: 'Нет зелий!', color: '#f44', life: 1.0, vy: -1.5 });
            return;
        }
        if (p.hp >= p.maxHp) {
            State.floatingTexts.push({ x: p.x, y: p.y - 40, text: 'HP полное', color: '#8fc', life: 1.0, vy: -1.5 });
            return;
        }
        p.potions--;
        p.hp = Math.min(p.maxHp, p.hp + 40);
        State.floatingTexts.push({ x: p.x, y: p.y - 40, text: '+40 HP', color: '#8fc', life: 1.0, vy: -2 });
        Audio.pickup();
        UI.update();
    },

    flashDamage() {
        let flash = document.querySelector('.damage-flash');
        if (!flash) {
            flash = document.createElement('div');
            flash.className = 'damage-flash';
            document.querySelector('.game-container').appendChild(flash);
        }
        flash.classList.add('flash');
        clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(() => flash.classList.remove('flash'), 150);
    },

    setupEvents() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
                State.keys[key] = true; e.preventDefault();
            }
            if (key === 'e') { State.keys.e = true; e.preventDefault(); }
            if (key === ' ' || e.code === 'Space') {
                State.keys.space = true;
                if (State.player.alive && State.gameRunning && !State.pausedForUpgrade) Player.attack();
                e.preventDefault();
            }
            if (key === 'q') { this.usePotion(); e.preventDefault(); }
            if (key === 'i') { UI.toggleInventory(); e.preventDefault(); }
            if (e.key === 'Shift') {
                if (State.player.alive && State.gameRunning && !State.pausedForUpgrade) Skills.useSkill();
                e.preventDefault();
            }
            if (key === 'r' && !State.player.alive && State.gameRunning) {
                this.startGame(State.currentClass); e.preventDefault();
            }
            if (key === 'escape') {
                if (State.gameRunning && !State.pausedForUpgrade) this.showCharSelect();
                e.preventDefault();
            }
            if (['w','a','s','d','r','e','q','i','ц','ф','ы','в','к','у','й','ш'].includes(key)) e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
                State.keys[key] = false; e.preventDefault();
            }
            if (key === 'e') { State.keys.e = false; e.preventDefault(); }
            if (key === ' ' || e.code === 'Space') { State.keys.space = false; e.preventDefault(); }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            State.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            State.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                e.preventDefault();
                if (State.player.alive && State.gameRunning && !State.pausedForUpgrade) Player.attack();
            } else if (e.button === 2) {
                e.preventDefault();
                if (State.player.alive && State.gameRunning && !State.pausedForUpgrade) Skills.useSkill();
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow')) e.preventDefault(); });
    },

    updateEffects(dt) {
        for (let i = State.effects.length - 1; i >= 0; i--) {
            State.effects[i].life -= dt * 0.004;
            if (State.effects[i].life <= 0) State.effects.splice(i, 1);
        }
    },

    updateParticles(dt) {
        for (let i = State.particles.length - 1; i >= 0; i--) {
            const p = State.particles[i];
            p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06;
            p.vx *= 0.95; p.vy *= 0.95; p.vy += 0.05;
            p.life -= dt * 0.003;
            if (p.life <= 0) State.particles.splice(i, 1);
        }
        for (let i = State.floatingTexts.length - 1; i >= 0; i--) {
            const ft = State.floatingTexts[i];
            ft.y += ft.vy * dt * 0.06;
            ft.life -= dt * 0.003;
            if (ft.life <= 0) State.floatingTexts.splice(i, 1);
        }
    },

    updateItems(dt) {
        for (let item of State.items) item.bob += dt * 0.005;
    },

    gameLoop(now) {
        if (!State.gameRunning) return;
        if (!State.lastTime) State.lastTime = now;
        let dt = now - State.lastTime;
        if (!isFinite(dt) || dt <= 0) dt = 16.67;
        dt = Math.min(50, dt);
        State.lastTime = now;
        State.globalTime = now;

        if (!State.player) return;
        if (!isFinite(State.player.x)) State.player.x = CONFIG.W / 2;
        if (!isFinite(State.player.y)) State.player.y = CONFIG.H / 2;
        if (!isFinite(State.player.hp)) State.player.hp = State.player.maxHp;

        Player.update(dt);
        if (typeof Skills !== 'undefined') Skills.update(dt);
        Enemies.update(dt);
        Game.updateItems(dt);
        Game.updateEffects(dt);
        Game.updateParticles(dt);
        Game.draw();
        State.animFrameId = requestAnimationFrame(Game.gameLoop);
    },

    draw() {
        const ctx = this.ctx;
        const W = CONFIG.W, H = CONFIG.H;
        ctx.clearRect(0, 0, W, H);

        if (!State.player || !isFinite(State.player.x) || !isFinite(State.player.y)) {
            return;
        }

        // Безопасное создание градиента
        const safeGrad = (x, y, r1, r2) => {
            if (!isFinite(x) || !isFinite(y) || !isFinite(r1) || !isFinite(r2)) return null;
            return ctx.createRadialGradient(x, y, r1, x, y, r2);
        };

        const camX = Math.max(0, Math.min(State.MAP_W * CONFIG.TILE - W, State.player.x - W / 2));
        const camY = Math.max(0, Math.min(State.MAP_H * CONFIG.TILE - H, State.player.y - H / 2));
        
        ctx.save();
        ctx.translate(-camX, -camY);

        MapModule.draw(ctx, State.player);

        // 1. Сундуки
        for (const chest of State.chests) {
            if (chest.opened) continue;
            if (!isFinite(chest.x) || !isFinite(chest.y)) continue;

            const t = State.globalTime * 0.003;
            const glow = Math.sin(t) * 0.3 + 0.5;
            const grd = safeGrad(chest.x, chest.y, 5, 40);
            if (!grd) continue;
            
            grd.addColorStop(0, `rgba(255,200,80,${glow * 0.4})`);
            grd.addColorStop(1, 'rgba(255,150,0,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(chest.x, chest.y, 40, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(chest.x - 18, chest.y - 10, 36, 24);
            ctx.fillStyle = '#8a5a2a';
            ctx.fillRect(chest.x - 18, chest.y - 10, 36, 5);
            ctx.fillStyle = '#d4a040';
            ctx.beginPath(); ctx.arc(chest.x, chest.y + 2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ebca6b';
            ctx.beginPath(); ctx.arc(chest.x - 1, chest.y + 1, 1.5, 0, Math.PI * 2); ctx.fill();
        }

        // 2. Предметы
        for (let item of State.items) {
            if (!isFinite(item.x) || !isFinite(item.y)) continue;

            const bobY = Math.sin(item.bob) * 4;
            const iy = item.y + bobY;
            if (!isFinite(iy)) continue;

            if (item.pickupType === 'item') {
                const rarity = RARITIES[item.rarity];
                const grd = safeGrad(item.x, iy, 2, 20);
                if (grd) {
                    ctx.shadowColor = rarity.color;
                    ctx.shadowBlur = 15;
                    grd.addColorStop(0, rarity.color);
                    grd.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(item.x, iy, 20, 0, Math.PI * 2); ctx.fill();
                }
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.icon, item.x, iy);
                ctx.textBaseline = 'alphabetic';
                ctx.textAlign = 'left';
                ctx.shadowBlur = 0;
            } else if (item.type === 'gold') {
                ctx.shadowColor = '#ebca6b'; ctx.shadowBlur = 20;
                for (let k = 0; k < 3; k++) {
                    const cx = item.x + (k-1)*4;
                    const cy = iy + (k===1?-3:0);
                    const coinGrd = safeGrad(cx - 1, cy - 1, 1, 7);
                    if (coinGrd) {
                        coinGrd.addColorStop(0, '#fff8d0');
                        coinGrd.addColorStop(0.5, k === 0 ? '#ebca6b' : (k === 1 ? '#d4a845' : '#c49835'));
                        coinGrd.addColorStop(1, '#8a6a20');
                        ctx.fillStyle = coinGrd;
                    }
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, 6, 4, 0, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
            } else if (item.type === 'potion') {
                ctx.shadowColor = '#f44'; ctx.shadowBlur = 20;
                const flaskGrd = ctx.createLinearGradient(item.x - 5, 0, item.x + 5, 0);
                flaskGrd.addColorStop(0, '#5a2a2a'); flaskGrd.addColorStop(0.5, '#3a1a1a'); flaskGrd.addColorStop(1, '#1a0a0a');
                ctx.fillStyle = flaskGrd;
                ctx.beginPath();
                ctx.moveTo(item.x - 5, iy - 8);
                ctx.lineTo(item.x + 5, iy - 8);
                ctx.lineTo(item.x + 7, iy + 6);
                ctx.lineTo(item.x - 7, iy + 6);
                ctx.closePath(); ctx.fill();
                const potGrd = safeGrad(item.x - 1, iy + 1, 1, 8);
                if (potGrd) {
                    potGrd.addColorStop(0, '#ffaaaa'); potGrd.addColorStop(0.5, '#e04040'); potGrd.addColorStop(1, '#8a1010');
                    ctx.fillStyle = potGrd;
                    ctx.beginPath(); ctx.ellipse(item.x, iy + 2, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
                }
                ctx.fillStyle = '#8a6a3a';
                ctx.fillRect(item.x - 3, iy - 11, 6, 4);
                ctx.shadowBlur = 0;
            }
        }

        // 3. Враги
        for (let e of State.enemies) {
            if (!isFinite(e.x) || !isFinite(e.y)) continue;
            Sprites.drawEnemy(ctx, e);
            if (e.isElite) {
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#fc6'; ctx.shadowBlur = 10;
                ctx.fillStyle = '#fc6';
                ctx.fillText('👑', e.x, e.y - e.radius - 22);
                ctx.shadowBlur = 0;
                ctx.textAlign = 'left';
            }
        }

        // 4. Игрок
        Sprites.drawPlayer(ctx, State.player.x, State.player.y, State.player.facing);

        // 5. Эффекты удара
        for (let ef of State.effects) {
            if (!isFinite(ef.x) || !isFinite(ef.y)) continue;
            if (ef.type === 'slash') {
                ctx.save();
                ctx.translate(ef.x, ef.y);
                ctx.rotate(ef.angle);
                ctx.globalAlpha = ef.life;
                ctx.strokeStyle = ef.color;
                ctx.lineWidth = 7 * ef.life;
                ctx.shadowBlur = 30; ctx.shadowColor = ef.color;
                ctx.beginPath();
                ctx.arc(0, 0, Player.getEffectiveRange() * 0.85, -0.6, 0.6);
                ctx.stroke();
                ctx.lineWidth = 3 * ef.life;
                ctx.strokeStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, Player.getEffectiveRange() * 0.85, -0.5, 0.5);
                ctx.stroke();
                ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                ctx.restore();
            }
        }

        // 6. Частицы
        for (let p of State.particles) {
            if (!isFinite(p.x) || !isFinite(p.y)) continue;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 7. Всплывающий текст
        ctx.font = 'bold 16px Times New Roman';
        ctx.textAlign = 'center';
        for (let ft of State.floatingTexts) {
            if (!isFinite(ft.x) || !isFinite(ft.y)) continue;
            ctx.globalAlpha = ft.life;
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';

        ctx.restore();

        // 8. Индикатор радиуса атаки
        if (State.player.alive && State.player.classData && State.gameRunning) {
            ctx.globalAlpha = 0.06;
            ctx.strokeStyle = State.player.classData.weaponGlow;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20; ctx.shadowColor = State.player.classData.weaponGlow;
            ctx.beginPath();
            ctx.arc(State.player.x - camX, State.player.y - camY, Player.getEffectiveRange(), 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }

        // 9. Мини-карта
        MapModule.drawMinimap(ctx);
    },

    idleDraw() {
        const self = this;
        function loop() {
            State.globalTime = performance.now();
            if (!State.gameRunning) {
                self.ctx.fillStyle = '#1e1a14';
                self.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
            }
            requestAnimationFrame(loop);
        }
        loop();
    }
};

// Запуск
Game.init();