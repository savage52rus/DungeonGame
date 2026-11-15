draw(ctx, player) {
        const W = CONFIG.W, H = CONFIG.H, T = CONFIG.TILE;
        
        // Находим текущую комнату для освещения
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
                    // Пол — каменная плитка с градиентом
                    const seed = (px * 73856093) ^ (py * 19349663);
                    const variation = (Math.abs(seed) % 14) - 7;
                    
                    let baseBright = 30; // Темнее, чем было
                    if (activeRoom) {
                        if (activeRoom.cleared) baseBright = 45; 
                        else if (activeRoom.visited) baseBright = 35;
                    }
                    
                    const floorGrd = ctx.createRadialGradient(px + T/2, py + T/2, 2, px + T/2, py + T/2, T * 0.8);
                    floorGrd.addColorStop(0, `rgb(${baseBright + variation + 10},${baseBright - 4 + variation + 10},${baseBright - 14 + variation + 10})`);
                    floorGrd.addColorStop(1, `rgb(${baseBright - 10 + variation},${baseBright - 16 + variation},${baseBright - 24 + variation})`);
                    ctx.fillStyle = floorGrd;
                    ctx.fillRect(px, py, T, T);
                    
                    // Швы плитки
                    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 0.5, py + 0.5, T, T);
                    
                    // Случайные трещины
                    if (seed % 9 === 0) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                        ctx.beginPath();
                        ctx.moveTo(px + 8, py + 8);
                        ctx.lineTo(px + 16, py + 18);
                        ctx.lineTo(px + 24, py + 26);
                        ctx.stroke();
                    }

                    // Открытая дверь (тёмный проём)
                    if (t === TILE_DOOR_OPEN) {
                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx.fillRect(px, py, T, T);
                    }
                } else if (t === TILE_DOOR_CLOSED) {
                    // Закрытая дверь
                    ctx.fillStyle = `rgb(40,28,14)`;
                    ctx.fillRect(px, py, T, T);
                    const door = State.doors.find(d => d.tx === x && d.ty === y);
                    if (door) {
                        const doorGrd = ctx.createLinearGradient(px, py, px + T, py + T);
                        doorGrd.addColorStop(0, '#6a4a2a'); doorGrd.addColorStop(1, '#2a1a0a');
                        ctx.fillStyle = doorGrd;
                        ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
                        // Замок
                        ctx.fillStyle = '#d4a040';
                        ctx.beginPath(); ctx.arc(px + T/2, py + T/2, 3.5, 0, Math.PI * 2); ctx.fill();
                    }
                } else {
                    // Стены — массивные, с объёмом
                    const seed = (px * 92837111) ^ (py * 689287499);
                    const variation = (Math.abs(seed) % 10) - 5;
                    const wallGrd = ctx.createLinearGradient(px, py, px, py + T);
                    // Верхняя часть светлее, нижняя темнее (эффект 3D)
                    wallGrd.addColorStop(0, `rgb(${45 + variation},${35 + variation},${25 + variation})`);
                    wallGrd.addColorStop(1, `rgb(${15 + variation},${10 + variation},${5 + variation})`);
                    ctx.fillStyle = wallGrd;
                    ctx.fillRect(px, py, T, T);
                    
                    // Кладка (кирпичи)
                    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px + T, py + 1); ctx.stroke();
                }
            }
        }

        // Лестница и виньетка
        if (State.ladderPos && State.allRoomsCleared) this.drawLadder(ctx, State.ladderPos.x, State.ladderPos.y);
        
        // ГЛОБАЛЬНАЯ ВИНЬЕТКА (тьма по краям экрана)
        const vg = ctx.createRadialGradient(player.x, player.y, 150, player.x, player.y, 600);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        
        // Свет от игрока (тёплый ореол)
        const lightGrd = ctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, 250);
        lightGrd.addColorStop(0, 'rgba(255,220,150,0.08)');
        lightGrd.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = lightGrd;
        ctx.beginPath(); ctx.arc(player.x, player.y, 250, 0, Math.PI * 2); ctx.fill();
    },