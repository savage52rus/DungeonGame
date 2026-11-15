// ========== ПРЕДМЕТЫ И ИНВЕНТАРЬ ==========
// Требует: CONFIG, State, RARITIES, ITEM_TEMPLATES

const Items = {
    generateItem(level = 1) {
        // Выбор редкости
        const rarityRoll = Math.random();
        let rarity = 'common';
        let cum = 0;
        for (const [key, r] of Object.entries(RARITIES)) {
            cum += r.weight;
            if (rarityRoll < cum) { rarity = key; break; }
        }

        // Выбор шаблона (кроме зелья — оно отдельно)
        const templates = ITEM_TEMPLATES.filter(t => t.type !== 'potion');
        const tmpl = templates[Math.floor(Math.random() * templates.length)];
        const baseName = tmpl.names[Math.floor(Math.random() * tmpl.names.length)];

        // Префикс по редкости
        const prefixes = {
            common: ['', 'Простой ', 'Старый '],
            magic: ['Светящийся ', 'Зачарованный ', 'Сияющий ', 'Рунный '],
            rare: ['Кровавый ', 'Древний ', 'Проклятый ', 'Драконий '],
            legendary: ['Божественный ', 'Вечный ', 'Легендарный ', 'Титанический '],
        };
        const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];

        // Значение характеристики
        const baseVal = {
            damageBonus: 4 + level * 2,
            armorBonus: 3 + level * 1.5,
            hpBonus: 10 + level * 5,
        }[tmpl.stat] || 5;
        const mult = RARITIES[rarity].statMult;
        const value = Math.floor(baseVal * mult * (0.8 + Math.random() * 0.4));

        // Бонусов может быть несколько у редких
        const bonusCount = rarity === 'legendary' ? 2 : (rarity === 'rare' ? 1 : 0);
        const extraStats = [];
        const allStats = ['damageBonus', 'armorBonus', 'hpBonus', 'speedBonus'];
        for (let i = 0; i < bonusCount; i++) {
            const st = allStats[Math.floor(Math.random() * allStats.length)];
            if (st === tmpl.stat) continue;
            const extraVal = st === 'speedBonus' ? 0.2 + Math.random() * 0.4 : Math.floor((5 + level * 3) * mult * 0.5);
            extraStats.push({ stat: st, value: extraVal, name: { damageBonus: 'Урон', armorBonus: 'Броня', hpBonus: 'HP', speedBonus: 'Скорость' }[st] });
        }

        return {
            id: 'item_' + Date.now() + '_' + Math.random(),
            template: tmpl,
            name: prefix + baseName,
            rarity,
            icon: tmpl.icon,
            stats: [{ stat: tmpl.stat, value, name: tmpl.statName }, ...extraStats],
            type: tmpl.type,
        };
    },

    generatePotion() {
        return {
            id: 'potion_' + Date.now() + '_' + Math.random(),
            template: ITEM_TEMPLATES.find(t => t.id === 'potion'),
            name: 'Зелье лечения',
            rarity: 'common',
            icon: '🧪',
            stats: [{ stat: 'heal', value: CONFIG.HEAL_AMOUNT, name: 'Лечение' }],
            type: 'potion',
        };
    },

    addToInventory(item) {
        if (State.player.inventory.length >= 16) {
            State.floatingTexts.push({ x: State.player.x, y: State.player.y - 40, text: 'Инвентарь полон!', color: '#f44', life: 1.5, vy: -1.5 });
            return false;
        }
        State.player.inventory.push(item);
        // Автоэкип, если слот пуст и лучше текущего
        if (item.type === 'weapon' && !State.player.equipment.weapon) {
            this.equip(item);
        } else if (item.type === 'armor' && !State.player.equipment.armor) {
            this.equip(item);
        } else if (item.type === 'ring' && !State.player.equipment.ring) {
            this.equip(item);
        }
        Audio.pickup();
        return true;
    },

    equip(item) {
        const p = State.player;
        const slot = item.type === 'weapon' ? 'weapon' : (item.type === 'armor' ? 'armor' : 'ring');
        // Снять старый (вернуть в инвентарь)
        const old = p.equipment[slot];
        if (old) {
            // Убрать бонусы старого
            this.applyStats(old, -1);
            p.inventory.push(old);
        }
        p.equipment[slot] = item;
        // Убрать из инвентаря
        const idx = p.inventory.indexOf(item);
        if (idx >= 0) p.inventory.splice(idx, 1);
        // Применить бонусы
        this.applyStats(item, 1);
        UI.update();
        UI.renderInventory();
    },

    unequip(slot) {
        const p = State.player;
        const item = p.equipment[slot];
        if (!item) return;
        this.applyStats(item, -1);
        p.equipment[slot] = null;
        p.inventory.push(item);
        UI.update();
        UI.renderInventory();
    },

    applyStats(item, sign) {
        const p = State.player;
        for (const s of item.stats) {
            if (s.stat === 'damageBonus') p.damageBonus = (p.damageBonus || 0) + s.value * sign;
            else if (s.stat === 'armorBonus') p.armorBonus = (p.armorBonus || 0) + s.value * sign;
            else if (s.stat === 'hpBonus') {
                p.maxHp += s.value * sign;
                if (sign > 0) p.hp += s.value;
                else p.hp = Math.min(p.hp, p.maxHp);
            } else if (s.stat === 'speedBonus') p.speedBonus = (p.speedBonus || 0) + s.value * sign;
        }
    },
};