// ========== МОБИЛЬНОЕ УПРАВЛЕНИЕ ==========
// Требует: CONFIG, State, Player, Skills, UI, Items

const TouchControls = {
    enabled: false,
    joystickActive: false,
    joystickTouchId: null,
    joystickOrigin: { x: 0, y: 0 },
    joystickMaxDistance: 50,
    joystickVector: { x: 0, y: 0 },
    moveVector: { x: 0, y: 0 },
    attackHeld: false,
    attackHoldInterval: null,

    init() {
        // Определяем тач-устройство
        this.enabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        // Всегда показываем кнопки, если экран узкий или есть тач
        const isMobile = window.innerWidth < 950 || this.enabled;
        if (isMobile) {
            document.getElementById('touchControls').classList.add('active');
            // Скрываем подсказки клавиатуры
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = 'none';
        }

        this.setupJoystick();
        this.setupButtons();
        this.setupWindowResize();
    },

    setupJoystick() {
        const zone = document.getElementById('joystickZone');
        const knob = document.getElementById('joystickKnob');
        if (!zone || !knob) return;

        // Начало касания
        const onStart = (e) => {
            e.preventDefault();
            const touch = e.changedTouches ? e.changedTouches[0] : e;
            this.joystickTouchId = touch.identifier !== undefined ? touch.identifier : 'mouse';
            const rect = zone.getBoundingClientRect();
            this.joystickOrigin.x = rect.left + rect.width / 2;
            this.joystickOrigin.y = rect.top + rect.height / 2;
            this.joystickActive = true;
            this.updateJoystick(touch.clientX, touch.clientY);
            Audio.init();
        };

        // Движение
        const onMove = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            const touch = this.findTouch(e, this.joystickTouchId);
            if (!touch) return;
            this.updateJoystick(touch.clientX, touch.clientY);
        };

        // Конец
        const onEnd = (e) => {
            if (!this.joystickActive) return;
            if (this.joystickTouchId === 'mouse') {
                this.resetJoystick();
                return;
            }
            const touch = this.findTouch(e, this.joystickTouchId);
            if (touch !== null) {
                this.resetJoystick();
            }
        };

        zone.addEventListener('touchstart', onStart, { passive: false });
        zone.addEventListener('touchmove', onMove, { passive: false });
        zone.addEventListener('touchend', onEnd, { passive: false });
        zone.addEventListener('touchcancel', onEnd, { passive: false });

        // Мышь для отладки на десктопе (ЛКМ по зоне)
        zone.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    },

    findTouch(e, id) {
        if (!e.touches) return null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === id) return e.touches[i];
        }
        return null;
    },

updateJoystick(x, y) {
    const dx = x - this.joystickOrigin.x;
    const dy = y - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.joystickMaxDistance;
    
    let normX = 0, normY = 0;
    if (dist > 0 && dist !== Infinity) { // <-- ДОБАВИТЬ ПРОВЕРКУ
        normX = (dx / dist) * Math.min(dist, maxDist);
        normY = (dy / dist) * Math.min(dist, maxDist);
    }
    // ... дальше без изменений
    if (dist > 10) {
        this.moveVector.x = (dx / dist) * Math.min(1, dist / maxDist);
        this.moveVector.y = (dy / dist) * Math.min(1, dist / maxDist);
    } else {
        this.moveVector.x = 0;
        this.moveVector.y = 0;
    }
}
        
        // Визуал
        const knob = document.getElementById('joystickKnob');
        if (knob) {
            knob.style.transform = `translate(${normX}px, ${normY}px)`;
        }
        
        // Вектор движения (нормализованный)
        if (dist > 10) {
            this.moveVector.x = dx / dist;
            this.moveVector.y = dy / dist;
            // Масштаб скорости по дальности
            const scale = Math.min(1, dist / maxDist);
            this.moveVector.x *= scale;
            this.moveVector.y *= scale;
        } else {
            this.moveVector.x = 0;
            this.moveVector.y = 0;
        }
    },

    resetJoystick() {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.moveVector.x = 0;
        this.moveVector.y = 0;
        const knob = document.getElementById('joystickKnob');
        if (knob) {
            knob.style.transition = 'transform 0.15s';
            knob.style.transform = 'translate(0, 0)';
            setTimeout(() => { knob.style.transition = 'transform 0.05s'; }, 150);
        }
    },

    setupButtons() {
        // Атака
        const btnAttack = document.getElementById('btnAttack');
        if (btnAttack) {
            const startAttack = (e) => {
                e.preventDefault();
                btnAttack.classList.add('pressed');
                if (State.player.alive && State.gameRunning && !State.pausedForUpgrade) {
                    Player.attack();
                }
                Audio.init();
                // Автоповтор при удержании
                this.attackHeld = true;
                if (this.attackHoldInterval) clearInterval(this.attackHoldInterval);
                this.attackHoldInterval = setInterval(() => {
                    if (this.attackHeld && State.player.alive && State.gameRunning && !State.pausedForUpgrade) {
                        Player.attack();
                    }
                }, 180);
            };
            const endAttack = (e) => {
                e.preventDefault();
                btnAttack.classList.remove('pressed');
                this.attackHeld = false;
                if (this.attackHoldInterval) {
                    clearInterval(this.attackHoldInterval);
                    this.attackHoldInterval = null;
                }
            };
            btnAttack.addEventListener('touchstart', startAttack, { passive: false });
            btnAttack.addEventListener('touchend', endAttack, { passive: false });
            btnAttack.addEventListener('touchcancel', endAttack, { passive: false });
            btnAttack.addEventListener('mousedown', startAttack);
            btnAttack.addEventListener('mouseup', endAttack);
            btnAttack.addEventListener('mouseleave', endAttack);
        }

        // Умение
        const btnSkill = document.getElementById('btnSkill');
        if (btnSkill) {
            const useSkill = (e) => {
                e.preventDefault();
                btnSkill.classList.add('pressed');
                setTimeout(() => btnSkill.classList.remove('pressed'), 120);
                if (State.player.alive && State.gameRunning && !State.pausedForUpgrade) {
                    Skills.useSkill();
                }
                Audio.init();
            };
            btnSkill.addEventListener('touchstart', useSkill, { passive: false });
            btnSkill.addEventListener('mousedown', useSkill);
        }

        // Зелье
        const btnPotion = document.getElementById('btnPotion');
        if (btnPotion) {
            const usePotion = (e) => {
                e.preventDefault();
                btnPotion.classList.add('pressed');
                setTimeout(() => btnPotion.classList.remove('pressed'), 120);
                Game.usePotion();
                Audio.init();
            };
            btnPotion.addEventListener('touchstart', usePotion, { passive: false });
            btnPotion.addEventListener('mousedown', usePotion);
        }

        // Инвентарь
        const btnInventory = document.getElementById('btnInventory');
        if (btnInventory) {
            const openInv = (e) => {
                e.preventDefault();
                btnInventory.classList.add('pressed');
                setTimeout(() => btnInventory.classList.remove('pressed'), 120);
                UI.toggleInventory();
                Audio.init();
            };
            btnInventory.addEventListener('touchstart', openInv, { passive: false });
            btnInventory.addEventListener('mousedown', openInv);
        }

        // Обновляем счётчик зелий на кнопке
        this.updatePotionCount();
    },

    updatePotionCount() {
        const btn = document.getElementById('btnPotion');
        if (!btn) return;
        const label = btn.querySelector('.btn-label');
        if (label) {
            label.textContent = `×${State.player.potions || 0}`;
        }
        btn.style.opacity = (State.player.potions > 0) ? '1' : '0.4';
    },

    setupWindowResize() {
        window.addEventListener('resize', () => {
            const isMobile = window.innerWidth < 950 || this.enabled;
            const tc = document.getElementById('touchControls');
            if (tc) {
                if (isMobile) tc.classList.add('active');
                else tc.classList.remove('active');
            }
        });
    },

    // Возвращает вектор движения от джойстика для интеграции в Player.update
    getMoveVector() {
        return this.moveVector;
    }
};

// Инициализация после загрузки
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TouchControls.init());
} else {
    setTimeout(() => TouchControls.init(), 50);
}