// ========== КАРТА, КОМНАТЫ, ДВЕРИ ==========
// Требует: CONFIG, State, TILE_*, ENEMY_TYPES, BOSS_TYPES

const MapModule = {
    generateDungeon() {
        State.MAP_W = 32; State.MAP_H = 22;
        State.map = [];
        for (let y = 0; y < State.MAP_H; y++) {
            State.map[y] = [];
            for (let x = 0; x < State.MAP_W; x++) State.map[y][x] = TILE_WALL;
        }
        State.rooms = []; State.doors = [];
        const roomDefs = [
            { x: 1, y: 1, w: 7, h: 5 }, { x: 12, y: 1, w: 6, h: 5 }, { x: 22, y: 1, w: 8, h: 5 },
            { x: 1, y: 9, w: 5, h: 6 }, { x: 10, y: 8, w: 7, h: 7 }, { x: 21, y: 9, w: 9, h: 5 },
            { x: 2, y: 17, w: 6, h: 4 }, { x: 12, y: 17, w: 5, h: 4 }, { x: 22, y: 17, w: 7, h: 4 },
            { x: 8, y: 6, w: 3, h: 2 }, { x: 19, y: 7, w: 2, h: 2 },
        ];
        for (const def of roomDefs) {
            for (let y = def.y; y < def.y + def.h; y++)
                for (let x = def.x; x < def.x + def.w; x++)
                    if (y >= 0 && y < State.MAP_H && x >= 0 && x < State.MAP_W) State.map[y][x] = TILE_FLOOR;
        }
        for (let i = 0; i < roomDefs.length; i++) {
            const def = roomDefs[i];
            State.rooms.push({
                id: i, minX: def.x, minY: def.y, maxX: def.x + def.w - 1, maxY: def.y + def.h - 1,
                center: { x: (def.x + def.w / 2) * CONFIG.TILE, y: (def.y + def.h / 2) * CONFIG.TILE },
                visited: false, cleared: false, enemiesSpawned: false,
                hasLadder: false, hasBoss: false, boss: null, bossSpawned: false,
            });
        }
        const connections = [[0,1],[1,2],[0,3],[3,4],[1,4],[4,5],[2,5],[3,6],[6,7],[7,8],[5,8],[4,7],[0,9],[9,4],[1,9],[4,10],[10,2]];
        for (const [a, b] of connections) this.connectRooms(State.rooms[a], State.rooms[b]);

        const startRoom = State.rooms[0];
        startRoom.visited = true; startRoom.cleared = true;
        State.currentRoom = startRoom;
        State.player.x = startRoom.center.x; State.player.y = startRoom.center.y;

        if (State.dungeonLevel % 5 === 0) {
            const available = State.rooms.filter(r => r.id !== 0);
            const chosen = available[Math.floor(Math.random() * available.length)];
            chosen.hasBoss = true;
        }
        let farthestRoom = null, maxDist = -1;
        for (const room of State.rooms) {
            if (room.id === 0 || room.hasBoss) continue;
            const dx = room.center.x - startRoom.center.x;
            const dy = room.center.y - startRoom.center.y;
            const dist = dx*dx + dy*dy;
            if (dist > maxDist) { maxDist = dist; farthestRoom = room; }
        }
        if (!farthestRoom) {
            const avail = State.rooms.filter(r => r.id !== 0);
            farthestRoom = avail[Math.floor(Math.random() * avail.length)];
        }
        farthestRoom.hasLadder = true;
        State.ladderPos = { x: farthestRoom.center.x, y: farthestRoom.center.y, roomId: farthestRoom.id };

        State.allRoomsCleared = false;
        document.getElementById('victoryMessage').style.display = 'none';
        document.getElementById('roomIndicator').classList.remove('boss');
    },

    connectRooms(roomA, roomB) {
        const ax = Math.floor((roomA.minX + roomA.maxX) / 2);
        const ay = Math.floor((roomA.minY + roomA.maxY) / 2);
        const bx = Math.floor((roomB.minX + roomB.maxX) / 2);
        const by = Math.floor((roomB.minY + roomB.maxY) / 2);
        let x = ax, y = ay;
        while (x !== bx) {
            for (let dy = -1; dy <= 1; dy++)
                for (let dx = 0; dx <= 1; dx++) {
                    const tx = x + (bx > ax ? dx : -dx), ty = y + dy;
                    if (tx >= 0 && tx < State.MAP_W && ty >= 0 && ty < State.MAP_H && State.map[ty][tx] === TILE_WALL) State.map[ty][tx] = TILE_FLOOR;
                }
            x += bx > x ? 1 : -1;
        }
        while (y !== by) {
            for (let dx = -1; dx <= 1; dx++)
                for (let dy = 0; dy <= 1; dy++) {
                    const tx = x + dx, ty = y + (by > ay ? dy : -dy);
                    if (tx >= 0 && tx < State.MAP_W && ty >= 0 && ty < State.MAP_H && State.map[ty][tx] === TILE_WALL) State.map[ty][tx] = TILE_FLOOR;
                }
            y += by > y ? 1 : -1;
        }
        this.addDoorOnEntry(roomA, roomB);
        this.addDoorOnEntry(roomB, roomA);
    },

    addDoorOnEntry(room, otherRoom) {
        const candidates = [];
        for (let x = room.minX; x <= room.maxX; x++) {
            candidates.push({ tx: x, ty: room.minY, side: 'top' });
            candidates.push({ tx: x, ty: room.maxY, side: 'bottom' });
        }
        for (let y = room.minY; y <= room.maxY; y++) {
            candidates.push({ tx: room.minX, ty: y, side: 'left' });
            candidates.push({ tx: room.maxX, ty: y, side: 'right' });
        }
        for (const c of candidates) {
            if (c.tx < 0 || c.tx >= State.MAP_W || c.ty < 0 || c.ty >= State.MAP_H) continue;
            if (State.map[c.ty][c.tx] !== TILE_FLOOR) continue;
            let outsideX = c.tx, outsideY = c.ty;
            if (c.side === 'top') outsideY = c.ty - 1;
            else if (c.side === 'bottom') outsideY = c.ty + 1;
            else if (c.side === 'left') outsideX = c.tx - 1;
            else if (c.side === 'right') outsideX = c.tx + 1;
            if (outsideY < 0 || outsideY >= State.MAP_H || outsideX < 0 || outsideX >= State.MAP_W) continue;
            if (State.map[outsideY][outsideX] !== TILE_FLOOR) continue;
            if (State.doors.some(d => d.tx === c.tx && d.ty === c.ty)) continue;
            let floorCount = 1;
            if (c.side === 'top' || c.side === 'bottom') {
                if (c.tx - 1 >= room.minX && State.map[c.ty][c.tx - 1] === TILE_FLOOR) floorCount++;
                if (c.tx + 1 <= room.maxX && State.map[c.ty][c.tx + 1] === TILE_FLOOR) floorCount++;
            } else {
                if (c.ty - 1 >= room.minY && State.map[c.ty - 1][c.tx] === TILE_FLOOR) floorCount++;
                if (c.ty + 1 <= room.maxY && State.map[c.ty + 1][c.tx] === TILE_FLOOR) floorCount++;
            }
            if (floorCount >= 2) {
                State.doors.push({ tx: c.tx, ty: c.ty, hp: CONFIG.DOOR_HP, maxHp: CONFIG.DOOR_HP, orientation: (c.side === 'top' || c.side === 'bottom') ? 'h' : 'v', open: false });
                State.map[c.ty][c.tx] = TILE_DOOR_CLOSED;
            }
        }
    },

    isWalkable(x, y) {
        const tx = Math.floor(x / CONFIG.TILE), ty = Math.floor(y / CONFIG.TILE);
        if (tx < 0 || tx >= State.MAP_W || ty < 0 || ty >= State.MAP_H) return false;
        const t = State.map[ty][tx];
        return t === TILE_FLOOR || t === TILE_DOOR_OPEN;
    },

    circleHitsWall(cx, cy, radius) {
        const T = CONFIG.TILE;
        const minTX = Math.floor((cx - radius) / T), maxTX = Math.floor((cx + radius) / T);
        const minTY = Math.floor((cy - radius) / T), maxTY = Math.floor((cy + radius) / T);
        for (let ty = minTY; ty <= maxTY; ty++) {
            for (let tx = minTX; tx <= maxTX; tx++) {
                if (tx < 0 || tx >= State.MAP_W || ty < 0 || ty >= State.MAP_H) return true;
                const t = State.map[ty][tx];
                if (t !== TILE_FLOOR && t !== TILE_DOOR_OPEN) {
                    const rectX = tx * T, rectY = ty * T;
                    const closestX = Math.max(rectX, Math.min(cx, rectX + T));
                    const closestY = Math.max(rectY, Math.min(cy, rectY + T));
                    const dx = cx - closestX, dy = cy - closestY;
                    if (dx*dx + dy*dy < radius*radius) return true;
                }
            }
        }
        return false;
    },

    getRoomAtPos(x, y) {
        const tx = Math.floor(x / CONFIG.TILE), ty = Math.floor(y / CONFIG.TILE);
        for (const room of State.rooms)
            if (tx >= room.minX && tx <= room.maxX && ty >= room.minY && ty <= room.maxY) return room;
        return null;
    },

    updateRoomState() {
        const room = this.getRoomAtPos(State.player.x, State.player.y);
        if (!room) return;
        if (State.currentRoom && State.currentRoom.id === room.id && room.visited) return;
        State.currentRoom = room;
        if (!room.visited) {
            room.visited = true;
            if (!room.enemiesSpawned && !room.cleared) {
                room.enemiesSpawned = true;
                Enemies.spawnEnemiesForRoom(room);
            }
        }
        UI.updateRoomIndicator();
    },

    checkAllCleared() {
        if (State.rooms.some(r => !r.visited)) return;
        if (State.enemies.length > 0) return;
        State.allRoomsCleared = true;
        document.getElementById('victoryMessage').style.display = 'block';
    },

    // --- Отрисовка карты в стиле Diablo ---
    draw(ctx, player) {
        const W = CONFIG.W, H = CONFIG.H, T = CONFIG.TILE;
        
        // Определяем текущую комнату для освещения
        let activeRoom = null;
        for (const room of State.rooms) {
            if (player.x > room.minX * T && player.x < room.maxX * T && 
                player.y > room.minY * T && player.y < room.maxY * T) {
                activeRoom = room;
                break;
            }
        }

        for (let y = 0; y < State.MAP_H; y++) {
            for (let x = 0; x < State.MAP_W; x++) {
                const px = x * T, py = y * T;
                const t = State.map[y][x];
                
                if (t === TILE_FLOOR || t === TILE_DOOR_OPEN) {
                    const seed = (px * 73856093) ^ (py * 19349663);
                    const variation = (Math.abs(seed) % 14) - 7;
                    
                    let baseBright = 30;
                    if (activeRoom) {
                        if (activeRoom.cleared) baseBright = 45; 
                        else if (activeRoom.visited) baseBright = 35;
                    }
                    
                    const floorGrd = ctx.createRadialGradient(px + T/2, py + T/2, 2, px + T/2, py + T/2, T * 0.8);
                    floorGrd.addColorStop(0, `rgb(${baseBright + variation + 10},${baseBright - 4 + variation + 10},${baseBright - 14 + variation + 10})`);
                    floorGrd.addColorStop(1, `rgb(${baseBright - 10 + variation},${baseBright - 16 + variation},${baseBright - 24 + variation})`);
                    ctx.fillStyle = floorGrd;
                    ctx.fillRect(px, py, T, T);
                    
                    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 0.5, py + 0.5, T, T);
                    
                    if (seed % 9 === 0) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                        ctx.beginPath();
                        ctx.moveTo(px + 8, py + 8);
                        ctx.lineTo(px + 16, py + 18);
                        ctx.lineTo(px + 24, py + 26);
                        ctx.stroke();
                    }

                    if (t === TILE_DOOR_OPEN) {
                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx.fillRect(px, py, T, T);
                    }
                } else if (t === TILE_DOOR_CLOSED) {
                    ctx.fillStyle = `rgb(40,28,14)`;
                    ctx.fillRect(px, py, T, T);
                    const door = State.doors.find(d => d.tx === x && d.ty === y);
                    if (door) {
                        const doorGrd = ctx.createLinearGradient(px, py, px + T, py + T);
                        doorGrd.addColorStop(0, '#6a4a2a'); doorGrd.addColorStop(1, '#2a1a0a');
                        ctx.fillStyle = doorGrd;
                        ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
                        ctx.fillStyle = '#d4a040';
                        ctx.beginPath(); ctx.arc(px + T/2, py + T/2, 3.5, 0, Math.PI * 2); ctx.fill();
                    }
                } else {
                    const seed = (px * 92837111) ^ (py * 689287499);
                    const variation = (Math.abs(seed) % 10) - 5;
                    const wallGrd = ctx.createLinearGradient(px, py, px, py + T);
                    wallGrd.addColorStop(0, `rgb(${45 + variation},${35 + variation},${25 + variation})`);
                    wallGrd.addColorStop(1, `rgb(${15 + variation},${10 + variation},${5 + variation})`);
                    ctx.fillStyle = wallGrd;
                    ctx.fillRect(px, py, T, T);
                    
                    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px + T, py + 1); ctx.stroke();
                }
            }
        }

        if (State.ladderPos && State.allRoomsCleared) this.drawLadder(ctx, State.ladderPos.x, State.ladderPos.y);
        
        // Глобальная тьма (Виньетка)
        const vg = ctx.createRadialGradient(player.x, player.y, 150, player.x, player.y, 600);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        
        // Свет от игрока
        const lightGrd = ctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, 250);
        lightGrd.addColorStop(0, 'rgba(255,220,150,0.08)');
        lightGrd.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = lightGrd;
        ctx.beginPath(); ctx.arc(player.x, player.y, 250, 0, Math.PI * 2); ctx.fill();
    },

    drawLadder(ctx, x, y) {
        const t = State.globalTime * 0.005;
        const glowGrd = ctx.createRadialGradient(x, y, 5, x, y, 65);
        glowGrd.addColorStop(0, `rgba(255,220,100,${0.55 + Math.sin(t) * 0.2})`);
        glowGrd.addColorStop(0.5, 'rgba(255,180,50,0.25)');
        glowGrd.addColorStop(1, 'rgba(255,150,0,0)');
        ctx.fillStyle = glowGrd;
        ctx.beginPath(); ctx.arc(x, y, 65, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 5; i++) {
            const ly = y + 20 - i * 10;
            const stepGrd = ctx.createLinearGradient(x - 20, ly, x + 20, ly);
            stepGrd.addColorStop(0, '#3a2a1a'); stepGrd.addColorStop(0.5, '#7a5a3a'); stepGrd.addColorStop(1, '#3a2a1a');
            ctx.fillStyle = stepGrd;
            ctx.fillRect(x - 20, ly, 40, 6);
        }
        const beamGrd = ctx.createLinearGradient(x - 22, 0, x - 17, 0);
        beamGrd.addColorStop(0, '#5a3a1a'); beamGrd.addColorStop(1, '#3a2a1a');
        ctx.fillStyle = beamGrd;
        ctx.fillRect(x - 22, y - 30, 5, 55);
        ctx.fillRect(x + 17, y - 30, 5, 55);
        ctx.strokeStyle = '#d4a040';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 26, y - 34, 52, 60);
        ctx.fillStyle = `rgba(255,220,100,${0.7 + Math.sin(t * 2) * 0.3})`;
        ctx.shadowColor = '#ebca6b';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(x, y - 55); ctx.lineTo(x - 10, y - 42); ctx.lineTo(x + 10, y - 42);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 14px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('E', x, y + 40);
        ctx.textAlign = 'left';
    },

    drawMinimap(ctx) {
        const W = CONFIG.W, T = CONFIG.TILE;
        const mmW = 160, mmH = Math.floor(160 * State.MAP_H / State.MAP_W);
        const mmX = W - mmW - 10, mmY = 10;
        const scaleX = mmW / (State.MAP_W * T), scaleY = mmH / (State.MAP_H * T);
        
        // Рамка карты (как в Diablo)
        ctx.fillStyle = 'rgba(10,7,5,0.9)';
        ctx.fillRect(mmX - 4, mmY - 4, mmW + 8, mmH + 8);
        ctx.strokeStyle = '#5a3e1e';
        ctx.lineWidth = 2;
        ctx.strokeRect(mmX - 4, mmY - 4, mmW + 8, mmH + 8);
        
        for (let y = 0; y < State.MAP_H; y++) {
            for (let x = 0; x < State.MAP_W; x++) {
                const t = State.map[y][x];
                const px = mmX + x * T * scaleX, py = mmY + y * T * scaleY;
                if (t === TILE_FLOOR || t === TILE_DOOR_OPEN) {
                    let roomHere = null;
                    for (const room of State.rooms)
                        if (x >= room.minX && x <= room.maxX && y >= room.minY && y <= room.maxY) { roomHere = room; break; }
                    if (roomHere && roomHere.cleared) ctx.fillStyle = '#4a5a3a';
                    else if (roomHere && roomHere.visited) ctx.fillStyle = '#3a2a1a';
                    else ctx.fillStyle = '#1a1510';
                    ctx.fillRect(px, py, T * scaleX + 1, T * scaleY + 1);
                } else if (t === TILE_DOOR_CLOSED) {
                    ctx.fillStyle = '#8a6a3a';
                    ctx.fillRect(px, py, T * scaleX + 1, T * scaleY + 1);
                }
            }
        }
        
        // Галочки зачищенных комнат
        ctx.strokeStyle = '#8fc';
        ctx.lineWidth = 2;
        for (const room of State.rooms) {
            if (room.cleared && room.visited) {
                const cx = mmX + room.center.x * scaleX;
                const cy = mmY + room.center.y * scaleY;
                ctx.beginPath();
                ctx.moveTo(cx - 4, cy); ctx.lineTo(cx - 1, cy + 3); ctx.lineTo(cx + 5, cy - 4);
                ctx.stroke();
            }
        }
        
        // Лестница
        if (State.ladderPos && State.allRoomsCleared) {
            ctx.fillStyle = '#ebca6b';
            ctx.shadowColor = '#ebca6b'; ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(mmX + State.ladderPos.x * scaleX, mmY + State.ladderPos.y * scaleY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Враги
        for (const e of State.enemies) {
            ctx.fillStyle = e.isBoss ? '#f44' : (e.isElite ? '#fc6' : '#c44');
            ctx.beginPath();
            ctx.arc(mmX + e.x * scaleX, mmY + e.y * scaleY, e.isBoss ? 3.5 : (e.isElite ? 3 : 2), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Сундуки
        for (const chest of State.chests) {
            if (chest.opened) continue;
            ctx.fillStyle = '#fc6';
            ctx.fillRect(mmX + chest.x * scaleX - 1, mmY + chest.y * scaleY - 1, 3, 3);
        }
        
        // Игрок
        ctx.fillStyle = '#8fc';
        ctx.shadowColor = '#8fc'; ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(mmX + State.player.x * scaleX, mmY + State.player.y * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
};