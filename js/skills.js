// ========== СИСТЕМА УМЕНИЙ ==========
// Требует: CONFIG, State, SKILLS, Player, MapModule

const Skills = {
    useSkill() {
        const p = State.player;
        if (!p.alive || !State.gameRunning) return;
        const skill = SKILLS[State.currentClass];
        if (!skill) return;
        if (p.skillCooldown > 0) return;
        if (p.mana < skill.manaCost) {
            State.floatingTexts.push({ x: p.x, y: p.y - 40, text: 'Мало маны!', color: '#48c', life: 1.0, vy: -1.5 });
            return;
        }
        p.mana -= skill.manaCost;
        p.skillCooldown = skill.cooldown;
        p.skillCooldownMax = skill.cooldown;
        skill.execute(p, State);
        Audio.skill();
        UI.update();
    },

    update(dt) {
        const p = State.player;
        if (p.skillCooldown > 0) p.skillCooldown -= dt;
        // Регенерация маны
        if (p.mana < p.maxMana) {
            p.mana = Math.min(p.maxMana, p.mana + dt * 0.005);
        }
        // Обновить кулдаун в UI
        const cdEl = document.getElementById('skillCd0');
        if (cdEl && p.skillCooldownMax) {
            const percent = Math.max(0, p.skillCooldown / p.skillCooldownMax) * 100;
            cdEl.style.height = percent + '%';
        }
    }
};