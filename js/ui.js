// ========== UI, ИНВЕНТАРЬ, УЛУЧШЕНИЯ ==========
// Требует: CONFIG, State, SKILLS, RARITIES, Items, TouchControls

const UI = {
    update() {
        const p = State.player;
        if (!p || !p.classData) return;
        document.getElementById('hpDisplay').textContent = `${Math.max(0, Math.floor(p.hp))} / ${p.maxHp}`;
        document.getElementById('manaDisplay').textContent = `${Math.floor(p.mana)} / ${p.maxMana}`;
        document.getElementById('goldDisplay').textContent = p.gold;
        document.getElementById('levelDisplay').textContent = State.level;
        document.getElementById('dungeonDisplay').textContent = State.dungeonLevel;
        document.getElementById('totalKillsDisplay').textContent = State.totalKills;
        document.getElementById('bestDisplay').textContent = State.bestDungeon || 0;
        document.getElementById('xpBar').style.width = Math.min(100, (State.xp / State.xpToNext) * 100) + '%';

        // Панель умений
        const skill = SKILLS[State.currentClass];
        if (skill) {
            const slot = document.getElementById('skillSlot0');
            if (slot) {
                const iconEl = slot.querySelector('.skill-icon');
                if (iconEl) iconEl.textContent = skill.icon;
                slot.title = `${skill.name} — ${skill.desc} (${skill.manaCost} маны)`;
            }
        }

        // Обновление счётчика зелий на мобильной кнопке
        if (typeof TouchControls !== 'undefined') TouchControls.updatePotionCount();

        // Перерисовка инвентаря, если открыт
        const panel = document.getElementById('inventoryPanel');
        if (panel && panel.classList.contains('open')) this.renderInventory();
    },

    addXP(amount) {
        State.xp += amount;
        let leveledUp = false;
        while (State.xp >= State.xpToNext) {
            State.xp -= State.xpToNext;
            State.level++;
            State.xpToNext = Math.floor(State.xpToNext * 1.35 + 20);
            State.pendingUpgrades++;
            leveledUp = true;
        }
        if (leveledUp) Audio.levelUp();
        this.update();
        if (State.pendingUpgrades > 0) this.showUpgrade();
    },

    showUpgrade() {
        if (State.pendingUpgrades <= 0) return;
        State.pausedForUpgrade = true;
        State.gameRunning = false;
        const options = [
            { icon: '❤️', name: 'ЖИЗНЕННАЯ СИЛА', desc: 'Увеличивает макс. здоровье и восстанавливает его.', apply: () => { State.player.maxHp += 25; State.player.hp = State.player.maxHp; }, value: '+25 HP' },
            { icon: '⚔️', name: 'МАСТЕРСТВО', desc: 'Увеличивает урон от атак.', apply: () => { State.player.damageBonus = (State.player.damageBonus || 0) + 8; }, value: '+8 УРОН' },
            { icon: '💨', name: 'ЛОВКОСТЬ', desc: 'Увеличивает скорость передвижения.', apply: () => { State.player.speedBonus = (State.player.speedBonus || 0) + 0.5; }, value: '+0.5 СКОР.' },
            { icon: '🎯', name: 'ДАЛЬНОСТЬ', desc: 'Увеличивает радиус атаки.', apply: () => { State.player.rangeBonus = (State.player.rangeBonus || 0) + 10; }, value: '+10 РАДИУС' },
            { icon: '💧', name: 'МУДРОСТЬ', desc: 'Увеличивает максимум и запас маны.', apply: () => { State.player.maxMana += 25; State.player.mana = State.player.maxMana; }, value: '+25 МАНЫ' },
            { icon: '🛡️', name: 'СТОЙКОСТЬ', desc: 'Увеличивает броню (поглощение урона).', apply: () => { State.player.armorBonus = (State.player.armorBonus || 0) + 5; }, value: '+5 БРОНЯ' },
        ];
        const shuffled = [...options].sort(() => Math.random() - 0.5).slice(0, 3);
        const cardsEl = document.getElementById('upgradeCards');
        cardsEl.innerHTML = '';
        shuffled.forEach(opt => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `<div class="up-icon">${opt.icon}</div><div class="up-name">${opt.name}</div><div class="up-desc">${opt.desc}</div><div class="up-value">${opt.value}</div>`;
            card.addEventListener('click', () => {
                opt.apply();
                State.pendingUpgrades--;
                this.update();
                document.getElementById('upgradeOverlay').classList.remove('active');
                if (State.pendingUpgrades > 0) {
                    setTimeout(() => this.showUpgrade(), 150);
                } else {
                    State.pausedForUpgrade = false;
                    State.gameRunning = true;
                    State.lastTime = 0;
                    State.animFrameId = requestAnimationFrame(Game.gameLoop);
                }
            });
            cardsEl.appendChild(card);
        });
        document.getElementById('upgradeOverlay').classList.add('active');
    },

    updateRoomIndicator() {
        if (!State.currentRoom) return;
        const el = document.getElementById('roomIndicator');
        el.textContent = `Комната ${State.rooms.indexOf(State.currentRoom) + 1} / ${State.rooms.length} · Уровень сложности ${State.dungeonLevel}`;
        el.classList.add('visible');
        if (State.currentRoom.hasBoss && !State.currentRoom.cleared) {
            el.textContent = `⚠ КОМНАТА БОССА ⚠`;
            el.classList.add('boss');
        } else el.classList.remove('boss');
    },

    // ========== ИНВЕНТАРЬ ==========
    renderInventory() {
        const panel = document.getElementById('inventoryPanel');
        if (!panel) return;
        const p = State.player;

        // Инициализируем сетку один раз
        let grid = document.getElementById('invGrid');
        if (!grid) {
            grid = document.createElement('div');
            grid.id = 'invGrid';
            grid.className = 'inv-grid';
            panel.appendChild(grid);
        }
        grid.innerHTML = '';

        // Слоты экипировки
        const eqSlots = [
            { key: 'weapon', icon: '🗡️', label: 'Оружие' },
            { key: 'armor', icon: '🥋', label: 'Броня' },
            { key: 'ring', icon: '💍', label: 'Кольцо' },
        ];
        for (const slot of eqSlots) {
            const item = p.equipment[slot.key];
            const cell = document.createElement('div');
            cell.className = 'inv-cell' + (item ? ' equipped' : '');
            cell.innerHTML = item
                ? `<span class="rarity-${item.rarity}">${item.icon}</span>`
                : `<span style="opacity:0.3">${slot.icon}</span>`;
            cell.title = slot.label;
            if (item) {
                cell.onmouseenter = (e) => UI.showTooltip(e, item);
                cell.onmouseleave = () => UI.hideTooltip();
                cell.onclick = () => { Items.unequip(slot.key); };
            }
            grid.appendChild(cell);
        }

        // Предметы в инвентаре (13 слотов)
        for (let i = 0; i < 13; i++) {
            const item = p.inventory[i];
            const cell = document.createElement('div');
            cell.className = 'inv-cell';
            cell.innerHTML = item ? `<span class="rarity-${item.rarity}">${item.icon}</span>` : '';
            if (item) {
                cell.onmouseenter = (e) => UI.showTooltip(e, item);
                cell.onmouseleave = () => UI.hideTooltip();
                cell.onclick = () => {
                    if (item.type === 'potion') {
                        p.hp = Math.min(p.maxHp, p.hp + item.stats[0].value);
                        p.inventory.splice(i, 1);
                        Audio.pickup();
                    } else {
                        Items.equip(item);
                    }
                    UI.update();
                };
            }
            grid.appendChild(cell);
        }

        // Статы
        let statsEl = document.getElementById('invStats');
        if (!statsEl) {
            statsEl = document.createElement('div');
            statsEl.id = 'invStats';
            statsEl.className = 'inv-stats';
            panel.appendChild(statsEl);
        }
        statsEl.innerHTML = `
            <div class="stat-row"><span>Урон</span><span class="stat-val">+${p.damageBonus || 0}</span></div>
            <div class="stat-row"><span>Броня</span><span class="stat-val">+${p.armorBonus || 0}</span></div>
            <div class="stat-row"><span>Скорость</span><span class="stat-val">+${(p.speedBonus || 0).toFixed(1)}</span></div>
            <div class="stat-row"><span>Радиус</span><span class="stat-val">+${p.rangeBonus || 0}</span></div>
            <div class="stat-row"><span>Зелий</span><span class="stat-val">${p.potions}</span></div>
        `;
    },

    showTooltip(e, item) {
        let tip = document.getElementById('itemTooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.className = 'item-tooltip';
            tip.id = 'itemTooltip';
            document.body.appendChild(tip);
        }
        const rarity = RARITIES[item.rarity];
        tip.innerHTML = `
            <div class="tooltip-name ${item.rarity}">${item.name}</div>
            <div style="color:${rarity.color};font-size:11px;">${rarity.name}</div>
            ${item.stats.map(s => `<div class="tooltip-stat">+${s.value} ${s.name}</div>`).join('')}
            <div class="tooltip-hint">Клик — ${item.type === 'potion' ? 'использовать' : 'экипировать'}</div>
        `;
        // Позиционирование с учётом размера экрана
        const tw = 240;
        let left = e.clientX + 15;
        let top = e.clientY + 15;
        if (left + tw > window.innerWidth) left = e.clientX - tw - 10;
        if (top + 150 > window.innerHeight) top = window.innerHeight - 160;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
        tip.classList.add('visible');
    },

    hideTooltip() {
        const tip = document.getElementById('itemTooltip');
        if (tip) tip.classList.remove('visible');
    },

    toggleInventory() {
        const panel = document.getElementById('inventoryPanel');
        if (!panel) return;
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) this.renderInventory();
    }
};
