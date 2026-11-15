// ========== СПРАЙТЫ ПЕРСОНАЖЕЙ И ВРАГОВ ==========
// Требует: CONFIG, State, CLASSES, ENEMY_TYPES, BOSS_TYPES

const Sprites = {
    // Помощник: объёмный круг
    shadedCircle(ctx, cx, cy, r, baseColor, lightColor, darkColor) {
        const grd = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.1);
        grd.addColorStop(0, lightColor);
        grd.addColorStop(0.5, baseColor);
        grd.addColorStop(1, darkColor);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    },
    shadedEllipse(ctx, cx, cy, rx, ry, rot, lightColor, baseColor, darkColor) {
        const grd = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.4, rx * 0.1, cx, cy, rx * 1.1);
        grd.addColorStop(0, lightColor);
        grd.addColorStop(0.5, baseColor);
        grd.addColorStop(1, darkColor);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
        ctx.fill();
    },

    // Отрисовка игрока
    drawPlayer(ctx, x, y, facing) {
        const player = State.player;
        if (!player.alive) { this.drawCorpse(ctx, x, y); return; }
        const cls = player.classData;
        const t = State.globalTime;
        const bob = Math.sin(t * 0.004) * 2;
        const walkBob = player.moving ? Math.sin(t * 0.012) * 3 : 0;
        const flicker = player.invincible && Math.floor(t / 80) % 2 === 0;
        if (flicker) ctx.globalAlpha = 0.5;

        // Тень
        const shadowGrd = ctx.createRadialGradient(x, y + CONFIG.PLAYER_RADIUS - 2, 2, x, y + CONFIG.PLAYER_RADIUS - 2, CONFIG.PLAYER_RADIUS * 1.3);
        shadowGrd.addColorStop(0, 'rgba(0,0,0,0.6)');
        shadowGrd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrd;
        ctx.beginPath();
        ctx.ellipse(x, y + CONFIG.PLAYER_RADIUS - 2, CONFIG.PLAYER_RADIUS * 1.2, CONFIG.PLAYER_RADIUS * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Аура
        const auraGrd = ctx.createRadialGradient(x, y + walkBob + bob, 5, x, y + walkBob + bob, CONFIG.PLAYER_RADIUS * 2);
        auraGrd.addColorStop(0, cls.auraColor);
        auraGrd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrd;
        ctx.beginPath();
        ctx.arc(x, y + walkBob + bob, CONFIG.PLAYER_RADIUS * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(x, y + walkBob + bob);
        if (facing === 'left') ctx.scale(-1, 1);

        // Плащ
        ctx.beginPath();
        ctx.moveTo(-15, -4);
        ctx.quadraticCurveTo(-24, 10, -19, 24);
        ctx.lineTo(19, 24);
        ctx.quadraticCurveTo(24, 10, 15, -4);
        ctx.closePath();
        const capeGrd = ctx.createLinearGradient(-20, -4, 20, 24);
        capeGrd.addColorStop(0, cls.cape);
        capeGrd.addColorStop(1, cls.capeDark);
        ctx.fillStyle = capeGrd;
        ctx.fill();

        // Ноги
        const legSwing = player.moving ? Math.sin(t * 0.012) * 6 : 0;
        this.shadedEllipse(ctx, -7, 18 + legSwing * 0.3, 5, 8, 0, '#5a4a2a', '#3a2a1a', '#1a0f05');
        this.shadedEllipse(ctx, 7, 18 - legSwing * 0.3, 5, 8, 0, '#5a4a2a', '#3a2a1a', '#1a0f05');
        this.shadedEllipse(ctx, -7, 25 + legSwing * 0.3, 6, 4, 0, '#3a2a1a', '#1a0f05', '#000');
        this.shadedEllipse(ctx, 7, 25 - legSwing * 0.3, 6, 4, 0, '#3a2a1a', '#1a0f05', '#000');

        // Торс
        ctx.beginPath();
        ctx.moveTo(-14, -6);
        ctx.lineTo(14, -6);
        ctx.quadraticCurveTo(16, 6, 12, 16);
        ctx.lineTo(-12, 16);
        ctx.quadraticCurveTo(-16, 6, -14, -6);
        ctx.closePath();
        const armorGrd = ctx.createLinearGradient(-14, -6, 14, 16);
        armorGrd.addColorStop(0, cls.armorLight);
        armorGrd.addColorStop(0.5, cls.armor);
        armorGrd.addColorStop(1, cls.armorDark);
        ctx.fillStyle = armorGrd;
        ctx.fill();
        // Блик
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(-6, 0, 5, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Наплечники
        this.shadedEllipse(ctx, -13, -3, 7, 9, -0.2, cls.armor2Light, cls.armor2, cls.armor2Dark);
        this.shadedEllipse(ctx, 13, -3, 7, 9, 0.2, cls.armor2Light, cls.armor2, cls.armor2Dark);

        // Ремень
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(-12, 10, 24, 4);
        ctx.fillStyle = cls.accent;
        ctx.fillRect(-3, 10, 6, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(-2, 10, 4, 1);

        // Голова
        this.shadedCircle(ctx, 0, -14, 11, cls.skin, cls.skin, cls.skinShadow);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(-3, -18, 4, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Волосы/шлем
        this.drawHeadgear(ctx, State.currentClass, cls);

        // Глаза
        ctx.fillStyle = '#1a0a00';
        ctx.beginPath(); ctx.ellipse(-4, -14, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, -14, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(-4.5, -14.5, 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.5, -14.5, 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6a2a1a'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(3, -8); ctx.stroke();

        // Руки
        const armSwing = player.moving ? Math.sin(t * 0.012 + Math.PI) * 5 : 0;
        this.shadedEllipse(ctx, -16, 2 + armSwing * 0.3, 4, 7, -0.3, cls.skin, cls.skin, cls.skinShadow);
        this.shadedEllipse(ctx, 16, 2 - armSwing * 0.3, 4, 7, 0.3, cls.skin, cls.skin, cls.skinShadow);

        // Оружие
        ctx.save();
        ctx.translate(16, 0 - armSwing * 0.3);
        this.drawWeapon(ctx, State.currentClass, cls);
        ctx.restore();

        ctx.restore();
        ctx.globalAlpha = 1;
    },

    drawHeadgear(ctx, classId, cls) {
        if (classId === 'barbarian') {
            const helmGrd = ctx.createLinearGradient(-12, -30, 12, -14);
            helmGrd.addColorStop(0, '#8a7a5a'); helmGrd.addColorStop(1, '#4a3a2a');
            ctx.fillStyle = helmGrd;
            ctx.beginPath(); ctx.arc(0, -18, 12, Math.PI, 0); ctx.fill();
            const hornGrd1 = ctx.createLinearGradient(-18, -36, -12, -24);
            hornGrd1.addColorStop(0, '#f0f0f8'); hornGrd1.addColorStop(1, '#808090');
            ctx.fillStyle = hornGrd1;
            ctx.beginPath();
            ctx.moveTo(-10, -24); ctx.quadraticCurveTo(-20, -34, -12, -38);
            ctx.quadraticCurveTo(-8, -32, -6, -24); ctx.fill();
            const hornGrd2 = ctx.createLinearGradient(18, -36, 12, -24);
            hornGrd2.addColorStop(0, '#f0f0f8'); hornGrd2.addColorStop(1, '#808090');
            ctx.fillStyle = hornGrd2;
            ctx.beginPath();
            ctx.moveTo(10, -24); ctx.quadraticCurveTo(20, -34, 12, -38);
            ctx.quadraticCurveTo(8, -32, 6, -24); ctx.fill();
        } else if (classId === 'amazon') {
            const hairGrd = ctx.createLinearGradient(-11, -30, 11, -14);
            hairGrd.addColorStop(0, '#a85a2a'); hairGrd.addColorStop(1, cls.hair);
            ctx.fillStyle = hairGrd;
            ctx.beginPath(); ctx.arc(0, -18, 11, Math.PI, 0); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-11, -16); ctx.quadraticCurveTo(-22, -8, -20, 4);
            ctx.quadraticCurveTo(-14, -4, -8, -12); ctx.fill();
            const bandGrd = ctx.createLinearGradient(-10, -16, 10, -16);
            bandGrd.addColorStop(0, '#f0c060'); bandGrd.addColorStop(1, '#a87a20');
            ctx.strokeStyle = bandGrd; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, -16, 10, Math.PI * 0.85, Math.PI * 0.15); ctx.stroke();
        } else if (classId === 'sorceress') {
            const hoodGrd = ctx.createLinearGradient(-13, -30, 13, -8);
            hoodGrd.addColorStop(0, cls.armorLight); hoodGrd.addColorStop(1, cls.armorDark);
            ctx.fillStyle = hoodGrd;
            ctx.beginPath(); ctx.arc(0, -16, 13, Math.PI * 0.9, Math.PI * 0.1); ctx.fill();
            ctx.fillStyle = cls.armor2;
            ctx.beginPath(); ctx.arc(0, -20, 11, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#f0e0ff';
            ctx.shadowColor = cls.weaponGlow; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(0, -16, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        } else if (classId === 'paladin') {
            const helmGrd = ctx.createLinearGradient(-12, -30, 12, -14);
            helmGrd.addColorStop(0, '#f0f8ff'); helmGrd.addColorStop(0.5, '#c0c8d8'); helmGrd.addColorStop(1, '#808898');
            ctx.fillStyle = helmGrd;
            ctx.beginPath(); ctx.arc(0, -18, 12, Math.PI, 0); ctx.fill();
            ctx.fillStyle = cls.accent;
            ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(-4, -22); ctx.lineTo(4, -22); ctx.closePath(); ctx.fill();
            ctx.fillStyle = cls.accent;
            ctx.shadowColor = cls.accent; ctx.shadowBlur = 8;
            ctx.fillRect(-2, 0, 4, 10);
            ctx.fillRect(-6, 3, 12, 4);
            ctx.shadowBlur = 0;
        } else if (classId === 'necromancer') {
            const hoodGrd = ctx.createLinearGradient(-13, -30, 13, -8);
            hoodGrd.addColorStop(0, '#4a4a2a'); hoodGrd.addColorStop(1, '#0a0a00');
            ctx.fillStyle = hoodGrd;
            ctx.beginPath(); ctx.arc(0, -18, 13, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#d0d0b8';
            ctx.beginPath(); ctx.arc(0, -16, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a1a0a';
            ctx.beginPath(); ctx.arc(-1.5, -16.5, 1, 0, Math.PI * 2); ctx.arc(1.5, -16.5, 1, 0, Math.PI * 2); ctx.fill();
        }
    },

    drawWeapon(ctx, classId, cls) {
        if (classId === 'barbarian') {
            ctx.rotate(-0.5);
            ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, -4, 4, 12);
            const guardGrd = ctx.createLinearGradient(-8, -6, 8, -6);
            guardGrd.addColorStop(0, '#f0c060'); guardGrd.addColorStop(1, '#8a6a20');
            ctx.fillStyle = guardGrd;
            ctx.fillRect(-8, -6, 16, 3);
            const bladeGrd = ctx.createLinearGradient(-4, -50, 4, -6);
            bladeGrd.addColorStop(0, '#ffffff'); bladeGrd.addColorStop(0.3, '#e8e8f0');
            bladeGrd.addColorStop(0.7, '#a0a0b0'); bladeGrd.addColorStop(1, '#5a5a6a');
            ctx.fillStyle = bladeGrd;
            ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(0, -50); ctx.lineTo(3, -6); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath(); ctx.moveTo(-1, -8); ctx.lineTo(0, -46); ctx.lineTo(1, -8); ctx.closePath(); ctx.fill();
            ctx.shadowColor = cls.weaponGlow; ctx.shadowBlur = 15;
            ctx.strokeStyle = 'rgba(255,240,180,0.7)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, -6); ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (classId === 'amazon') {
            ctx.rotate(-0.3);
            ctx.strokeStyle = '#5a3a1b'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, -14, 18, -1.0, 1.0); ctx.stroke();
            ctx.strokeStyle = '#c9a05a'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, -14, 15, -1.0, 1.0); ctx.stroke();
            ctx.strokeStyle = 'rgba(240,240,240,0.9)'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(-1.0)*18, -14 + Math.sin(-1.0)*18);
            ctx.lineTo(Math.cos(1.0)*18, -14 + Math.sin(1.0)*18);
            ctx.stroke();
            ctx.shadowColor = cls.weaponGlow; ctx.shadowBlur = 12;
            const arrowGrd = ctx.createLinearGradient(0, -14, 20, -14);
            arrowGrd.addColorStop(0, '#a87a4a'); arrowGrd.addColorStop(1, '#f0c060');
            ctx.strokeStyle = arrowGrd; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(16, -14); ctx.stroke();
            ctx.fillStyle = '#f0f0f8';
            ctx.beginPath(); ctx.moveTo(16, -17); ctx.lineTo(22, -14); ctx.lineTo(16, -11); ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
        } else if (classId === 'sorceress') {
            ctx.rotate(-0.2);
            const staffGrd = ctx.createLinearGradient(-2, 16, 2, -34);
            staffGrd.addColorStop(0, '#3a2a1a'); staffGrd.addColorStop(1, '#7a5a3a');
            ctx.strokeStyle = staffGrd; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -34); ctx.stroke();
            ctx.strokeStyle = '#5a3a8a'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 14); ctx.stroke();
            ctx.strokeStyle = '#6a4a8a'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -34); ctx.quadraticCurveTo(-8, -42, -6, -50);
            ctx.moveTo(0, -34); ctx.quadraticCurveTo(8, -42, 6, -50); ctx.stroke();
            const crystalGrd = ctx.createRadialGradient(-2, -42, 1, 0, -40, 10);
            crystalGrd.addColorStop(0, '#ffffff'); crystalGrd.addColorStop(0.3, '#e0c0ff');
            crystalGrd.addColorStop(0.7, '#a070e0'); crystalGrd.addColorStop(1, 'rgba(160,112,224,0)');
            ctx.fillStyle = crystalGrd;
            ctx.shadowColor = '#c9aaff'; ctx.shadowBlur = 25;
            ctx.beginPath(); ctx.arc(0, -40, 9, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 3; i++) {
                const a = State.globalTime * 0.003 + i * 2.1;
                const r = 10 + Math.sin(State.globalTime * 0.005 + i) * 3;
                ctx.fillStyle = '#e8d0ff';
                ctx.beginPath(); ctx.arc(Math.cos(a) * r, -40 + Math.sin(a) * r, 1.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.shadowBlur = 0;
        } else if (classId === 'paladin') {
            ctx.rotate(-0.5);
            const handleGrd = ctx.createLinearGradient(-2, -4, 2, 12);
            handleGrd.addColorStop(0, '#5a3a1a'); handleGrd.addColorStop(1, '#3a2a1a');
            ctx.fillStyle = handleGrd;
            ctx.fillRect(-2, -4, 4, 20);
            const hammerGrd = ctx.createRadialGradient(-4, -16, 2, 0, -14, 14);
            hammerGrd.addColorStop(0, '#f0f8ff'); hammerGrd.addColorStop(0.4, '#d0d8e8'); hammerGrd.addColorStop(1, '#808898');
            ctx.fillStyle = hammerGrd;
            ctx.beginPath();
            ctx.moveTo(-12, -8); ctx.lineTo(-12, -22); ctx.lineTo(12, -22); ctx.lineTo(12, -8);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = cls.accent;
            ctx.shadowColor = cls.accent; ctx.shadowBlur = 12;
            ctx.fillRect(-1, -20, 2, 10);
            ctx.fillRect(-5, -17, 10, 2);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(-10, -20, 6, 3);
        } else if (classId === 'necromancer') {
            ctx.rotate(-0.3);
            const scytheGrd = ctx.createLinearGradient(-2, 16, 2, -40);
            scytheGrd.addColorStop(0, '#2a1a0a'); scytheGrd.addColorStop(1, '#5a3a1a');
            ctx.strokeStyle = scytheGrd; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -38); ctx.stroke();
            const bladeGrd = ctx.createLinearGradient(-2, -46, 20, -46);
            bladeGrd.addColorStop(0, '#e0e0f0'); bladeGrd.addColorStop(0.5, '#a0a0b8'); bladeGrd.addColorStop(1, '#4a4a5a');
            ctx.strokeStyle = bladeGrd; ctx.lineWidth = 3;
            ctx.shadowColor = cls.weaponGlow; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(0, -38, 22, -Math.PI * 0.85, -Math.PI * 0.15); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#d0d0b8';
            ctx.beginPath(); ctx.arc(0, -42, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a1a0a';
            ctx.beginPath(); ctx.arc(-1.5, -42.5, 1.2, 0, Math.PI * 2); ctx.arc(1.5, -42.5, 1.2, 0, Math.PI * 2); ctx.fill();
        }
    },

    drawCorpse(ctx, x, y) {
        const grd = ctx.createRadialGradient(x, y + 20, 3, x, y + 20, 30);
        grd.addColorStop(0, 'rgba(0,0,0,0.6)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.ellipse(x, y + 20, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(x, y); ctx.rotate(0.4);
        this.shadedEllipse(ctx, 0, 5, 20, 10, 0, '#6a5a4a', '#4a3a2a', '#2a1a0a');
        ctx.fillStyle = 'rgba(120,10,10,0.7)';
        ctx.beginPath(); ctx.ellipse(-5, 10, 18, 6, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    },

    // Враг
    drawEnemy(ctx, e) {
        const t = State.globalTime;
        const bob = Math.sin(t * 0.003 + e.x * 0.01) * 1.5;
        const walk = Math.sin(t * 0.01 + e.x * 0.02) * 2;
        const ex = e.x, ey = e.y + bob;

        const shadowGrd = ctx.createRadialGradient(ex, ey + e.radius - 2, 2, ex, ey + e.radius - 2, e.radius * 1.3);
        shadowGrd.addColorStop(0, 'rgba(0,0,0,0.6)');
        shadowGrd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrd;
        ctx.beginPath();
        ctx.ellipse(ex, ey + e.radius - 2, e.radius * 1.1, e.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (e.isBoss) this.drawBoss(ctx, ex, ey, walk, e);
        else if (e.type === 'brute') this.drawBrute(ctx, ex, ey, walk, e);
        else if (e.type === 'mage') this.drawDarkMage(ctx, ex, ey, walk, e);
        else if (e.type === 'ghoul') this.drawGhoul(ctx, ex, ey, walk, e);
        else if (e.type === 'wraith') this.drawWraith(ctx, ex, ey, walk, e);
        else if (e.type === 'demonknight') this.drawDemonKnight(ctx, ex, ey, walk, e);
        else this.drawSkeleton(ctx, ex, ey, walk, e);

        // HP-бар
        const hpPercent = Math.max(0, e.hp / e.maxHp);
        const barWidth = e.isBoss ? 80 : 40;
        const barX = ex - barWidth / 2;
        const barY = ey - e.radius - 16;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, 8);
        ctx.fillStyle = '#300';
        ctx.fillRect(barX, barY, barWidth, 6);
        const barColor = hpPercent > 0.5 ? (e.isBoss ? '#fa0' : '#5a5') : (hpPercent > 0.25 ? '#ca5' : '#c44');
        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(barX, barY, barWidth * hpPercent, 2);
        if (e.isBoss) {
            ctx.font = 'bold 12px Times New Roman';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f44';
            ctx.fillText(e.typeDef.name, ex, barY - 4);
            ctx.textAlign = 'left';
        }
    },

    drawSkeleton(ctx, x, y, walk, e) {
        ctx.save(); ctx.translate(x, y);
        ctx.strokeStyle = '#c8c0a0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(-8 + walk * 0.5, 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(8 - walk * 0.5, 22); ctx.stroke();
        this.shadedEllipse(ctx, 0, 10, 7, 5, 0, '#e0d8b8', '#c8c0a0', '#8a8060');
        ctx.strokeStyle = '#d8d0b0'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -4); ctx.stroke();
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const ry = -2 + i * 4;
            ctx.beginPath(); ctx.moveTo(-6, ry); ctx.quadraticCurveTo(0, ry + 2, 6, ry); ctx.stroke();
        }
        this.shadedCircle(ctx, 0, -12, 9, '#e8e0c0', '#f8f0d8', '#a89870');
        ctx.fillStyle = '#c8c0a0';
        ctx.beginPath(); ctx.ellipse(0, -5, 6, 3, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#0a0505';
        ctx.beginPath(); ctx.ellipse(-3.5, -13, 2.8, 3.2, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3.5, -13, 2.8, 3.2, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f22'; ctx.shadowColor = '#f44'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(-3.5, -13, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.5, -13, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i += 2) { ctx.beginPath(); ctx.moveTo(i, -6); ctx.lineTo(i, -4); ctx.stroke(); }
        ctx.strokeStyle = '#d0c8b0'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-7, -1); ctx.lineTo(-12, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7, -1); ctx.lineTo(14, 5); ctx.stroke();
        ctx.save(); ctx.translate(14, 5); ctx.rotate(-0.6);
        const bladeGrd = ctx.createLinearGradient(-2, -16, 2, 0);
        bladeGrd.addColorStop(0, '#c8b898'); bladeGrd.addColorStop(0.5, '#8a7a5a'); bladeGrd.addColorStop(1, '#5a4a3a');
        ctx.strokeStyle = bladeGrd; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
        ctx.fillStyle = '#5a4a2a'; ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
        ctx.restore();
    },

    drawBrute(ctx, x, y, walk, e) {
        ctx.save(); ctx.translate(x, y);
        this.shadedEllipse(ctx, -8, 14 + walk * 0.3, 6, 9, 0.1, '#7a3e1e', '#4a1e0e', '#2a0e04');
        this.shadedEllipse(ctx, 8, 14 - walk * 0.3, 6, 9, -0.1, '#7a3e1e', '#4a1e0e', '#2a0e04');
        const bodyGrd = ctx.createRadialGradient(-4, -6, 4, 0, 0, 20);
        bodyGrd.addColorStop(0, '#a04e2e'); bodyGrd.addColorStop(0.5, '#6a2e14'); bodyGrd.addColorStop(1, '#3a1a08');
        ctx.fillStyle = bodyGrd;
        ctx.beginPath(); ctx.ellipse(0, 0, 17, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-10, -5); ctx.quadraticCurveTo(0, -1, 10, -5); ctx.stroke();
        this.shadedEllipse(ctx, -16, -2 + walk * 0.5, 6, 9, 0.3, '#7a3a1e', '#4a2010', '#2a0e04');
        this.shadedEllipse(ctx, 16, -2 - walk * 0.5, 6, 9, -0.3, '#7a3a1e', '#4a2010', '#2a0e04');
        ctx.save(); ctx.translate(18, -6 - walk * 0.5); ctx.rotate(-0.4);
        const clubGrd = ctx.createLinearGradient(-4, 0, 4, -30);
        clubGrd.addColorStop(0, '#3a2a1a'); clubGrd.addColorStop(1, '#6a4a2a');
        ctx.fillStyle = clubGrd;
        ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(3, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#9a8a6a';
        for (let i = 0; i < 4; i++) {
            const sy = -8 - i * 6;
            ctx.beginPath(); ctx.moveTo(-6, sy); ctx.lineTo(-10, sy - 3); ctx.lineTo(-6, sy - 5); ctx.fill();
            ctx.beginPath(); ctx.moveTo(6, sy); ctx.lineTo(10, sy - 3); ctx.lineTo(6, sy - 5); ctx.fill();
        }
        ctx.restore();
        this.shadedCircle(ctx, 0, -16, 12, '#8a3e20', '#c05a3a', '#4a1a08');
        ctx.fillStyle = '#1a0a04';
        ctx.beginPath();
        ctx.moveTo(-9, -24); ctx.quadraticCurveTo(-18, -34, -12, -38);
        ctx.quadraticCurveTo(-8, -30, -5, -24); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, -24); ctx.quadraticCurveTo(18, -34, 12, -38);
        ctx.quadraticCurveTo(8, -30, 5, -24); ctx.fill();
        ctx.fillStyle = '#ffaa00'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.ellipse(-4, -17, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, -17, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(-4, -17, 1.3, 1.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, -17, 1.3, 1.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8f8e8';
        ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(-3, -7); ctx.lineTo(-2, -10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(3, -7); ctx.lineTo(4, -10); ctx.fill();
        ctx.restore();
    },

    drawDarkMage(ctx, x, y, walk, e) {
        ctx.save(); ctx.translate(x, y);
        const auraGrd = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
        auraGrd.addColorStop(0, 'rgba(140,60,200,0.4)');
        auraGrd.addColorStop(1, 'rgba(140,60,200,0)');
        ctx.fillStyle = auraGrd;
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        const robeGrd = ctx.createLinearGradient(-12, -10, 12, 22);
        robeGrd.addColorStop(0, '#5a3a8a'); robeGrd.addColorStop(0.5, '#2a1a4a'); robeGrd.addColorStop(1, '#0a001a');
        ctx.fillStyle = robeGrd;
        ctx.beginPath();
        ctx.moveTo(-9, -7); ctx.lineTo(-13, 20);
        ctx.quadraticCurveTo(-8, 24, 0, 22);
        ctx.quadraticCurveTo(8, 24, 13, 20);
        ctx.lineTo(9, -7); ctx.closePath(); ctx.fill();
        const innerGrd = ctx.createRadialGradient(0, 8, 2, 0, 8, 14);
        innerGrd.addColorStop(0, 'rgba(160,100,240,0.6)');
        innerGrd.addColorStop(1, 'rgba(160,100,240,0)');
        ctx.fillStyle = innerGrd;
        ctx.beginPath(); ctx.ellipse(0, 8, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
        const hoodGrd = ctx.createLinearGradient(-12, -22, 12, -8);
        hoodGrd.addColorStop(0, '#4a2a7a'); hoodGrd.addColorStop(1, '#0a001a');
        ctx.fillStyle = hoodGrd;
        ctx.beginPath(); ctx.arc(0, -12, 12, Math.PI * 0.9, Math.PI * 0.1); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0, -10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a060ff'; ctx.shadowColor = '#c090ff'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.ellipse(-3, -11, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3, -11, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(14, 20); ctx.lineTo(14, -20); ctx.stroke();
        this.shadedCircle(ctx, 14, -24, 6, '#d8d0b8', '#f0e8d0', '#8a8060');
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(12, -25, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(16, -25, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a060ff'; ctx.shadowColor = '#c090ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(12, -25, 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(16, -25, 0.9, 0, Math.PI * 2); ctx.fill();
        const orbGrd = ctx.createRadialGradient(14, -36, 1, 14, -36, 10);
        orbGrd.addColorStop(0, '#fff'); orbGrd.addColorStop(0.4, '#c090ff'); orbGrd.addColorStop(1, 'rgba(160,96,255,0)');
        ctx.fillStyle = orbGrd;
        ctx.beginPath(); ctx.arc(14, -36, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    },

    drawGhoul(ctx, x, y, walk, e) {
        ctx.save(); ctx.translate(x, y);
        this.shadedEllipse(ctx, -7, 14 + walk * 0.3, 4, 7, 0.1, '#6a8a4a', '#4a6a2a', '#2a4a1a');
        this.shadedEllipse(ctx, 7, 14 - walk * 0.3, 4, 7, -0.1, '#6a8a4a', '#4a6a2a', '#2a4a1a');
        const bodyGrd = ctx.createRadialGradient(-3, -4, 3, 0, 0, 16);
        bodyGrd.addColorStop(0, '#8aaa6a'); bodyGrd.addColorStop(0.5, '#5a7a3a'); bodyGrd.addColorStop(1, '#2a4a1a');
        ctx.fillStyle = bodyGrd;
        ctx.beginPath(); ctx.ellipse(0, 2, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-19, 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-13, 2); ctx.lineTo(-21, 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(19, 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(13, 2); ctx.lineTo(21, 5); ctx.stroke();
        this.shadedCircle(ctx, 0, -10, 9, '#7a9a5a', '#9aba7a', '#4a6a2a');
        ctx.fillStyle = '#1a0a00';
        ctx.beginPath(); ctx.ellipse(0, -5, 5, 3, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#f0f0e0';
        ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(-2, -2); ctx.lineTo(-1, -5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1, -5); ctx.lineTo(2, -2); ctx.lineTo(3, -5); ctx.fill();
        ctx.fillStyle = '#ff4'; ctx.shadowColor = '#ff4'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(-3, -11, 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -11, 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    },

    drawWraith(ctx, x, y, walk, e) {
        ctx.save(); ctx.translate(x, y);
        const t = State.globalTime * 0.003;
        ctx.globalAlpha = 0.75;
        const auraGrd = ctx.createRadialGradient(0, -5, 3, 0, -5, 28);
        auraGrd.addColorStop(0, 'rgba(120,170,240,0.5)');
        auraGrd.addColorStop(1, 'rgba(120,170,240,0)');
        ctx.fillStyle = auraGrd;
        ctx.beginPath(); ctx.arc(0, -5, 28, 0, Math.PI * 2); ctx.fill();
        const bodyGrd = ctx.createLinearGradient(0, -12, 0, 22);
        bodyGrd.addColorStop(0, '#7a9aca'); bodyGrd.addColorStop(0.5, '#4a6a9a'); bodyGrd.addColorStop(1, 'rgba(74,106,154,0)');
        ctx.fillStyle = bodyGrd;
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.quadraticCurveTo(-12, 12, -5 + Math.sin(t) * 2, 20);
        ctx.quadraticCurveTo(0, 23, 5 + Math.sin(t + 1) * 2, 20);
        ctx.quadraticCurveTo(12, 12, 10, -5);
        ctx.closePath(); ctx.fill();
        this.shadedCircle(ctx, 0, -10, 9, '#c8dcf0', '#e0ecf8', '#8aa8c8');
        ctx.fillStyle = '#0a0a1a';
        ctx.beginPath(); ctx.ellipse(-3, -11, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3, -11, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8af'; ctx.shadowColor = '#8af'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(-3, -11, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -11, 1, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.6;
        this.shadedEllipse(ctx, -15, 4 + Math.sin(t) * 2, 4, 7, 0.3, '#8aa8d0', '#6a88b0', '#4a6a8a');
        this.shadedEllipse(ctx, 15, 4 - Math.sin(t) * 2, 4, 7, -0.3, '#8aa8d0', '#6a88b0', '#4a6a8a');
        ctx.restore();
    },

    drawDemonKnight(ctx, x, y, walk, e) {
        ctx.save(); ctx.translate(x, y);
        this.shadedEllipse(ctx, -8, 14 + walk * 0.3, 6, 9, 0.1, '#3a1a1a', '#1a0a0a', '#000');
        this.shadedEllipse(ctx, 8, 14 - walk * 0.3, 6, 9, -0.1, '#3a1a1a', '#1a0a0a', '#000');
        const bodyGrd = ctx.createRadialGradient(-3, -4, 3, 0, 0, 18);
        bodyGrd.addColorStop(0, '#6a2a2a'); bodyGrd.addColorStop(0.5, '#3a0a0a'); bodyGrd.addColorStop(1, '#0a0000');
        ctx.fillStyle = bodyGrd;
        ctx.beginPath(); ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2); ctx.fill();
        this.shadedEllipse(ctx, -14, -3, 7, 9, -0.2, '#6a3a3a', '#3a0a0a', '#0a0000');
        this.shadedEllipse(ctx, 14, -3, 7, 9, 0.2, '#6a3a3a', '#3a0a0a', '#0a0000');
        ctx.fillStyle = '#8a5a4a';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath(); ctx.moveTo(-18, -6 + i * 5); ctx.lineTo(-24, -9 + i * 5); ctx.lineTo(-18, -11 + i * 5); ctx.fill();
            ctx.beginPath(); ctx.moveTo(18, -6 + i * 5); ctx.lineTo(24, -9 + i * 5); ctx.lineTo(18, -11 + i * 5); ctx.fill();
        }
        const helmGrd = ctx.createLinearGradient(-11, -22, 11, -12);
        helmGrd.addColorStop(0, '#4a1a1a'); helmGrd.addColorStop(1, '#0a0000');
        ctx.fillStyle = helmGrd;
        ctx.beginPath(); ctx.arc(0, -16, 11, Math.PI, 0); ctx.fill();
        ctx.fillRect(-11, -16, 22, 5);
        ctx.fillStyle = '#8a5a4a';
        ctx.beginPath(); ctx.moveTo(-9, -24); ctx.quadraticCurveTo(-22, -34, -16, -40);
        ctx.quadraticCurveTo(-9, -32, -5, -24); ctx.fill();
        ctx.beginPath(); ctx.moveTo(9, -24); ctx.quadraticCurveTo(22, -34, 16, -40);
        ctx.quadraticCurveTo(9, -32, 5, -24); ctx.fill();
        ctx.fillStyle = '#f44'; ctx.shadowColor = '#f00'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.ellipse(-4, -13, 2.3, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, -13, 2.3, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.save(); ctx.translate(18, 4); ctx.rotate(-0.5);
        ctx.fillStyle = '#1a0a0a'; ctx.fillRect(-3, -3, 6, 12);
        ctx.fillStyle = '#5a2a1a'; ctx.fillRect(-6, -5, 12, 3);
        const bladeGrd = ctx.createLinearGradient(0, -44, 0, -5);
        bladeGrd.addColorStop(0, '#ff4040'); bladeGrd.addColorStop(0.4, '#c02020'); bladeGrd.addColorStop(1, '#3a0000');
        ctx.fillStyle = bladeGrd;
        ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(0, -44); ctx.lineTo(3, -5); ctx.closePath(); ctx.fill();
        ctx.shadowColor = '#f44'; ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(255,120,120,0.8)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, -5); ctx.stroke();
        ctx.restore();
        ctx.restore();
    },

    drawBoss(ctx, x, y, walk, e) {
        const type = e.typeDef.id;
        const t = State.globalTime * 0.003;
        ctx.save(); ctx.translate(x, y);
        const auraGrd = ctx.createRadialGradient(0, 0, 10, 0, 0, e.radius * 1.5);
        auraGrd.addColorStop(0, 'rgba(255,80,40,0.45)');
        auraGrd.addColorStop(1, 'rgba(255,80,40,0)');
        ctx.fillStyle = auraGrd;
        ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.5, 0, Math.PI * 2); ctx.fill();

        if (type === 'boss_skeleton_king') {
            ctx.strokeStyle = '#c8c0a0'; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(-10, 16); ctx.lineTo(-14 + walk, 32); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(10, 16); ctx.lineTo(14 - walk, 32); ctx.stroke();
            ctx.strokeStyle = '#e0d8b8'; ctx.lineWidth = 10;
            ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -8); ctx.stroke();
            ctx.lineWidth = 4;
            for (let i = 0; i < 4; i++) {
                const ry = 0 + i * 5;
                ctx.beginPath(); ctx.moveTo(-12, ry); ctx.quadraticCurveTo(0, ry + 3, 12, ry); ctx.stroke();
            }
            this.shadedCircle(ctx, 0, -22, 18, '#e8e0c0', '#f8f0d8', '#a89870');
            ctx.fillStyle = '#d0c8a8';
            ctx.beginPath(); ctx.ellipse(0, -8, 10, 5, 0, 0, Math.PI); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(-6, -24, 4.5, 5, 0.1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(6, -24, 4.5, 5, -0.1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f22'; ctx.shadowColor = '#f44'; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(-6, -24, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(6, -24, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            for (let i = -2; i <= 2; i++) ctx.fillRect(i * 5 - 1.5, -8, 3, 5);
            const crownGrd = ctx.createLinearGradient(-16, -50, 16, -36);
            crownGrd.addColorStop(0, '#f0c060'); crownGrd.addColorStop(0.5, '#ebca6b'); crownGrd.addColorStop(1, '#8a6a20');
            ctx.fillStyle = crownGrd;
            ctx.shadowColor = '#ebca6b'; ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(-16, -36); ctx.lineTo(-12, -46); ctx.lineTo(-6, -40);
            ctx.lineTo(0, -50); ctx.lineTo(6, -40); ctx.lineTo(12, -46); ctx.lineTo(16, -36);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#d0c8b0'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-28, 12 + Math.sin(t) * 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(28, 12 - Math.sin(t) * 3); ctx.stroke();
            ctx.save(); ctx.translate(-28, 12 + Math.sin(t) * 3); ctx.rotate(-0.8);
            const bladeGrd = ctx.createLinearGradient(-3, -50, 3, 0);
            bladeGrd.addColorStop(0, '#ffffff'); bladeGrd.addColorStop(0.4, '#d0d0e0'); bladeGrd.addColorStop(1, '#5a5a6a');
            ctx.strokeStyle = bladeGrd; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -50); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -50); ctx.stroke();
            ctx.restore();
        } else if (type === 'boss_demon_lord') {
            this.shadedEllipse(ctx, -14, 22 + walk * 0.3, 10, 15, 0.1, '#5a2a0a', '#3a1a0a', '#1a0a00');
            this.shadedEllipse(ctx, 14, 22 - walk * 0.3, 10, 15, -0.1, '#5a2a0a', '#3a1a0a', '#1a0a00');
            const bodyGrd = ctx.createRadialGradient(-6, -8, 6, 0, 0, 34);
            bodyGrd.addColorStop(0, '#c05030'); bodyGrd.addColorStop(0.5, '#7a2a10'); bodyGrd.addColorStop(1, '#2a0a00');
            ctx.fillStyle = bodyGrd;
            ctx.beginPath(); ctx.ellipse(0, 0, 30, 26, 0, 0, Math.PI * 2); ctx.fill();
            this.shadedEllipse(ctx, -32, -4 + Math.sin(t) * 3, 10, 15, 0.3, '#8a3a1a', '#5a1a0a', '#2a0a00');
            this.shadedEllipse(ctx, 32, -4 - Math.sin(t) * 3, 10, 15, -0.3, '#8a3a1a', '#5a1a0a', '#2a0a00');
            this.shadedCircle(ctx, 0, -32, 20, '#a04020', '#d06040', '#4a1a08');
            ctx.fillStyle = '#1a0a04';
            ctx.beginPath();
            ctx.moveTo(-15, -44); ctx.quadraticCurveTo(-36, -64, -24, -74);
            ctx.quadraticCurveTo(-15, -60, -7, -44); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(15, -44); ctx.quadraticCurveTo(36, -64, 24, -74);
            ctx.quadraticCurveTo(15, -60, 7, -44); ctx.fill();
            ctx.fillStyle = '#ffaa00'; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.ellipse(-7, -34, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(7, -34, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(-7, -34, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(7, -34, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a0000';
            ctx.beginPath(); ctx.ellipse(0, -20, 12, 6, 0, 0, Math.PI); ctx.fill();
            ctx.fillStyle = '#fff';
            for (let i = -2; i <= 2; i++) {
                if (i === 0) continue;
                ctx.beginPath();
                ctx.moveTo(i * 5 - 2, -20); ctx.lineTo(i * 5, -13); ctx.lineTo(i * 5 + 2, -20);
                ctx.fill();
            }
        } else {
            ctx.globalAlpha = 0.88;
            const darkAura = ctx.createRadialGradient(0, 0, 10, 0, 0, 50);
            darkAura.addColorStop(0, 'rgba(140,60,220,0.55)');
            darkAura.addColorStop(1, 'rgba(140,60,220,0)');
            ctx.fillStyle = darkAura;
            ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
            const robeGrd = ctx.createLinearGradient(-24, -10, 24, 42);
            robeGrd.addColorStop(0, '#4a2a7a'); robeGrd.addColorStop(0.5, '#1a0a3a'); robeGrd.addColorStop(1, '#000');
            ctx.fillStyle = robeGrd;
            ctx.beginPath();
            ctx.moveTo(-22, -10); ctx.lineTo(-28, 36);
            ctx.quadraticCurveTo(-14, 46, 0, 42);
            ctx.quadraticCurveTo(14, 46, 28, 36);
            ctx.lineTo(22, -10); ctx.closePath(); ctx.fill();
            const innerGrd = ctx.createRadialGradient(0, 15, 3, 0, 15, 25);
            innerGrd.addColorStop(0, 'rgba(180,120,255,0.7)');
            innerGrd.addColorStop(1, 'rgba(120,40,200,0)');
            ctx.fillStyle = innerGrd;
            ctx.beginPath(); ctx.ellipse(0, 15, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
            const hoodGrd = ctx.createLinearGradient(-20, -44, 20, -6);
            hoodGrd.addColorStop(0, '#3a1a6a'); hoodGrd.addColorStop(1, '#0a0020');
            ctx.fillStyle = hoodGrd;
            ctx.beginPath(); ctx.arc(0, -24, 20, Math.PI * 0.9, Math.PI * 0.1); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(0, -20, 13, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#c060ff'; ctx.shadowColor = '#c060ff'; ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.ellipse(-5, -22, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(5, -22, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#2a0a4a'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(24, 36); ctx.lineTo(24, -50); ctx.stroke();
            this.shadedCircle(ctx, 24, -56, 10, '#d0c0e0', '#e8d8f8', '#8a7aa0');
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(21, -58, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(27, -58, 2.5, 0, Math.PI * 2); ctx.fill();
            const orbGrd = ctx.createRadialGradient(24, -70, 2, 24, -70, 18);
            orbGrd.addColorStop(0, '#fff'); orbGrd.addColorStop(0.3, '#e0a0ff');
            orbGrd.addColorStop(0.7, '#a060ff'); orbGrd.addColorStop(1, 'rgba(160,96,255,0)');
            ctx.fillStyle = orbGrd;
            ctx.beginPath(); ctx.arc(24, -70, 16, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 5; i++) {
                const a = t * 2 + i * 1.26;
                const r = 20 + Math.sin(t * 3 + i) * 5;
                ctx.fillStyle = '#e8d0ff';
                ctx.beginPath(); ctx.arc(24 + Math.cos(a) * r, -70 + Math.sin(a) * r, 2, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }
};
