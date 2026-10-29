// =============================================================
//  맵(월드) — 스테이지별 크기, 몹 수 배율, 카메라, 바닥 그리기, 출현 위치
//  수치는 data.js의 world / scaling 에 있다.
// =============================================================

const World = {
  // 스테이지의 맵 크기 { w, h }
  sizeAt(stage) {
    const C = GAME_DATA.world, S = GAME_DATA.screen;
    if (C.overrides[stage]) return { w: C.overrides[stage][0], h: C.overrides[stage][1] };
    let s = stage;
    if (C.bossSameAsPrevious && s > 1 && s % GAME_DATA.rules.stagesPerZone === 0) s -= 1;
    const t = Math.min(1, Math.max(0, (s - 1) / (C.lastStage - 1)));
    const k = 1 + (C.maxScale - 1) * Math.pow(t, C.curve);
    // 늘어나는 양만 snap 단위로 맞춘다(1스테이지는 baseSize 그대로)
    const grow = base => base + Math.round(base * (k - 1) / C.snap) * C.snap;
    // 맵이 화면보다 작아지지는 않게
    return { w: Math.max(S.width, grow(C.baseSize[0])), h: Math.max(S.height, grow(C.baseSize[1])) };
  },

  // 몹 수 배율 = (넓이 비) ^ countExponent
  countScale(stage) {
    const b = GAME_DATA.world.baseSize, z = this.sizeAt(stage);
    return Math.pow((z.w * z.h) / (b[0] * b[1]), GAME_DATA.scaling.countExponent);
  },

  // 일반 스테이지에서 강화 개체(_alt)가 나올 확률
  strongRatio(stage) {
    const r = GAME_DATA.scaling.strongRatio;
    return Math.min(r.max, (stage - 1) * r.perStage);
  },

  // 웨이브의 몹 수를 맵 크기에 맞게 늘린다(보스는 그대로)
  scaledWave(wave, stage) {
    const k = this.countScale(stage), out = {};
    for (const [type, n] of Object.entries(wave)) out[type] = GAME_DATA.mobs[type].isBoss ? n : Math.max(1, Math.round(n * k));
    return out;
  },

  // ---------------- 카메라 ----------------
  // 플레이어를 화면 가운데에 두되, 맵 밖은 비추지 않게 멈춘다
  cameraTarget(px, py, world) {
    const S = GAME_DATA.screen;
    return {
      x: Math.max(0, Math.min(world.w - S.width, px - S.width / 2)),
      y: Math.max(0, Math.min(world.h - S.height, py - S.height / 2)),
    };
  },

  // 엔티티가 다닐 수 있는 범위(테두리 안쪽)
  clampInside(e, world) {
    const pad = GAME_DATA.world.border + e.radius * 0.5;
    e.x = Math.max(pad, Math.min(world.w - pad, e.x));
    e.y = Math.max(pad, Math.min(world.h - pad, e.y));
  },

  inView(x, y, cam, margin = 0) {
    const S = GAME_DATA.screen;
    return x > cam.x - margin && x < cam.x + S.width + margin && y > cam.y - margin && y < cam.y + S.height + margin;
  },

  // ---------------- 바닥 ----------------
  // (tx, ty) 칸마다 항상 같은 타일이 나오도록 좌표로 만든 난수
  hash(tx, ty, seed) {
    let h = Math.imul(tx, 374761393) ^ Math.imul(ty, 668265263) ^ Math.imul(seed, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  },

  // 화면에 보이는 칸만 그린다(맵이 커져도 그리는 양은 화면 크기만큼)
  drawFloor(ctx, zone, cam, world, seed) {
    const S = GAME_DATA.screen;
    const tiles = zone.tiles.map(t => ({ img: Assets.images[t.file], weight: t.weight }));
    const total = tiles.reduce((s, t) => s + t.weight, 0);
    const size = tiles[0].img.width;
    const x0 = Math.floor(cam.x / size), x1 = Math.floor((Math.min(world.w, cam.x + S.width) - 1) / size);
    const y0 = Math.floor(cam.y / size), y1 = Math.floor((Math.min(world.h, cam.y + S.height) - 1) / size);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        let r = this.hash(tx, ty, seed) * total, pick = tiles[0];
        for (const t of tiles) { if ((r -= t.weight) < 0) { pick = t; break; } }
        // 맵 끝에 걸친 칸은 맵 안쪽만 그린다
        const w = Math.min(size, world.w - tx * size), h = Math.min(size, world.h - ty * size);
        ctx.drawImage(pick.img, 0, 0, w, h, tx * size, ty * size, w, h);
      }
    }
  },

  // 맵 가장자리: 안쪽으로 어두워지는 테두리 + 진한 선
  drawBorder(ctx, world) {
    const b = GAME_DATA.world.border;
    const edge = (x, y, w, h, x0, y0, x1, y1) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(10,18,8,0.9)');
      g.addColorStop(0.45, 'rgba(10,18,8,0.55)');
      g.addColorStop(1, 'rgba(10,18,8,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    };
    edge(0, 0, world.w, b, 0, 0, 0, b);                                 // 위
    edge(0, world.h - b, world.w, b, 0, world.h, 0, world.h - b);       // 아래
    edge(0, 0, b, world.h, 0, 0, b, 0);                                 // 왼쪽
    edge(world.w - b, 0, b, world.h, world.w, 0, world.w - b, 0);       // 오른쪽
    ctx.strokeStyle = '#0b1208';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, world.w - 8, world.h - 8);
  },

  // ---------------- 몹 출현 위치 ----------------
  // 화면 바로 바깥 띠에서 고르고, 맵 밖이면 다시 고른다.
  // 맵이 화면보다 별로 크지 않아 그런 자리가 없으면 맵 가장자리 안쪽에서 플레이어와 먼 곳을 고른다.
  spawnPoint(cam, world, player) {
    const S = GAME_DATA.screen, m = GAME_DATA.rules.spawnMargin;
    const pad = GAME_DATA.world.border + 30;
    const inside = (x, y) => x >= pad && x <= world.w - pad && y >= pad && y <= world.h - pad;
    for (let i = 0; i < 24; i++) {
      const d = m + Math.random() * 80;
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = cam.x - d + Math.random() * (S.width + 2 * d); y = cam.y - d; }
      else if (side === 1) { x = cam.x + S.width + d; y = cam.y - d + Math.random() * (S.height + 2 * d); }
      else if (side === 2) { x = cam.x - d + Math.random() * (S.width + 2 * d); y = cam.y + S.height + d; }
      else { x = cam.x - d; y = cam.y - d + Math.random() * (S.height + 2 * d); }
      if (inside(x, y)) return { x, y };
    }
    let best = null, bestD = -1;
    for (let i = 0; i < 16; i++) {
      const side = Math.floor(Math.random() * 4);
      const x = side === 1 ? world.w - pad : side === 3 ? pad : pad + Math.random() * (world.w - 2 * pad);
      const y = side === 0 ? pad : side === 2 ? world.h - pad : pad + Math.random() * (world.h - 2 * pad);
      const dist = Math.hypot(x - player.x, y - player.y);
      if (dist > 380) return { x, y };
      if (dist > bestD) { bestD = dist; best = { x, y }; }
    }
    return best;
  },
};
