// =============================================================
//  게임 진행: 스테이지 · 웨이브 · 하트 · HUD · 버프 선택 · 화면 전환
// =============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = GAME_DATA.screen.width;
canvas.height = GAME_DATA.screen.height;
ctx.imageSmoothingEnabled = false;

const $ = id => document.getElementById(id);
const W = GAME_DATA.screen.width, H = GAME_DATA.screen.height;

// ---------------- 입력 ----------------
const input = { left: false, right: false, up: false, down: false };
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
};
addEventListener('keydown', e => {
  if (KEYMAP[e.code]) { input[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'KeyP' || e.code === 'Escape') game.togglePause();
  if (game.state === 'buff' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    const card = $('cards').children[Number(e.code.slice(-1)) - 1];
    if (card) card.click();
  }
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) input[KEYMAP[e.code]] = false; });
addEventListener('blur', () => {
  for (const k in input) input[k] = false;
  if (game.state === 'play') game.togglePause(true);
});

// ---------------- 게임 ----------------
// 좌표: 플레이어·몹·하트·투사체·설치물은 전부 월드(맵) 좌표.
//       화면 좌표 = 월드 좌표 - cam. HUD만 화면 좌표로 그린다.
const game = {
  state: 'loading',  // loading, title, intro, play, clear, buff, gameover, victory
  paused: false,
  stage: 1,
  zone: null,
  world: { w: W, h: H },
  cam: { x: 0, y: 0 },
  player: null,
  mobs: [],
  effects: [],
  shots: [],
  pickups: [],
  texts: [],
  shake: 0,
  timer: 0,

  // ----- 조회 도우미 -----
  aliveMobs() { return this.mobs.filter(m => m.alive); },
  isOnScreen(x, y, margin = 0) { return World.inView(x, y, this.cam, margin); },
  nearestMob(x, y, maxDist = Infinity) {
    let best = null, bd = maxDist;
    for (const m of this.mobs) {
      if (!m.alive || !m.entered) continue;
      const d = Math.hypot(m.x - x, m.y - y) - m.radius;
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  },
  zoneOf(stage) { return GAME_DATA.zones[Math.ceil(stage / GAME_DATA.rules.stagesPerZone) - 1]; },
  stageDef(stage) {
    const z = this.zoneOf(stage);
    return z && z.stages[(stage - 1) % GAME_DATA.rules.stagesPerZone];
  },
  get lastStage() { return GAME_DATA.zones.length * GAME_DATA.rules.stagesPerZone; },

  // ----- 진행 -----
  newRun() {
    this.player = new Player(this);
    this.mobs = []; this.effects = []; this.shots = []; this.pickups = []; this.texts = [];
    this.zone = null;
    this.paused = false;
    $('pause').classList.add('hidden');
    this.updateWeaponHud();
    this.startStage(1);
  },

  startStage(n) {
    this.stage = n;
    this.zone = this.zoneOf(n);
    const def = this.stageDef(n);
    this.def = def;
    // 맵 크기와, 맵 크기에 맞춰 늘린 웨이브
    this.world = World.sizeAt(n);
    this.waves = def.waves.map(w => World.scaledWave(w, n));
    // 하트 드랍 확률 = 기대치 / 그 스테이지 몹 수(늘린 뒤의 수, 보스 소환 몹은 제외)
    const total = this.waves.reduce((s, w) => s + Object.values(w).reduce((a, b) => a + b, 0), 0);
    this.heartChance = Math.min(1, GAME_DATA.heartDrop.expectedPerStage / total);
    this.waveIndex = -1;
    this.queue = [];
    this.state = 'intro';
    this.timer = GAME_DATA.rules.stageIntroTime;
    this.shots = [];
    this.player.x = this.world.w / 2; this.player.y = this.world.h / 2;
    this.player.invuln = Math.max(this.player.invuln, 0.5);
    this.player.rootTimer = 0; this.player.slowTimer = 0;   // 상태 이상은 다음 스테이지로 넘기지 않는다
    this.cam = World.cameraTarget(this.player.x, this.player.y, this.world);
  },

  startWave(i) {
    this.waveIndex = i;
    const wave = this.waves[i];
    // 보스는 먼저, 나머지는 섞어서 한 마리씩.
    // alt 스테이지는 전부 강화 개체, 아니면 strongRatio 확률로 강화 개체
    const strong = this.def.alt ? 1 : World.strongRatio(this.stage);
    const list = [];
    for (const [type, n] of Object.entries(wave)) for (let k = 0; k < n; k++) {
      list.push({ type, alt: !GAME_DATA.mobs[type].isBoss && Math.random() < strong });
    }
    list.sort(() => Math.random() - 0.5);
    list.sort((a, b) => (GAME_DATA.mobs[b.type].isBoss ? 1 : 0) - (GAME_DATA.mobs[a.type].isBoss ? 1 : 0));
    this.queue = list;
    this.spawnTimer = 0;
    // 몹이 많아지면 나오는 간격을 줄여서 웨이브 길이가 너무 늘어나지 않게
    this.spawnInterval = Math.max(GAME_DATA.scaling.spawnIntervalMin, GAME_DATA.rules.spawnInterval / World.countScale(this.stage));
  },

  // opt.alt 를 주지 않으면 스테이지 설정(alt: true)을 따른다
  spawnMob(type, x, y, opt = {}) {
    const alt = opt.alt != null ? opt.alt : (!!this.def.alt && !GAME_DATA.mobs[type].isBoss);
    const art = this.zone.mobs[type];
    const path = alt && art.alt ? art.alt : art.sprite;
    const mob = new Mob(this, type, path, x, y, Object.assign({}, opt, { alt }));
    World.clampInside(mob, this.world);  // 보스 소환처럼 맵 끝 근처에서 생겨도 맵 안에서 나타나게
    this.mobs.push(mob);
    return mob;
  },

  // look = { fx: fx id, scale, radius } (없으면 spit_projectile 그림, 반지름 8)
  spawnShot(x, y, angle, speed, damage, look = {}) {
    this.shots.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle, damage, time: 0,
      fx: look.fx, scale: look.scale || 1, radius: look.radius || 8 });
  },

  addEffect(e) { this.effects.push(e); },

  damageMob(m, dmg, fromX, fromY, kb = 1) {
    if (!m.alive) return;
    m.takeHit(dmg, fromX, fromY, kb);
    this.addEffect(makeImageEffect('hit_star', m.x + (Math.random() - 0.5) * m.radius, m.y + (Math.random() - 0.5) * m.radius, 0.15));
    this.texts.push({ x: m.x, y: m.y - m.radius - 6, text: String(dmg), time: 0 });
  },

  onMobKilled(m) {
    if (!m.summoned && Math.random() < this.heartChance) this.pickups.push({ x: m.x, y: m.y, time: 0 });
    // 보스가 죽으면 남은 소환 몹도 함께 쓰러진다
    if (m.isBoss) for (const o of this.mobs) if (o !== m && o.alive) { o.summoned = true; o.die(); }
  },

  // ----- 매 프레임 -----
  update(dt) {
    if (this.paused || ['loading', 'title', 'buff', 'gameover', 'victory'].includes(this.state)) return;
    const p = this.player;

    if (this.state === 'intro') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'play'; this.startWave(0); }
    }

    p.update(dt, this.state === 'play' || this.state === 'clear' || this.state === 'intro' ? input : {});

    // 카메라: 플레이어를 부드럽게 따라가고, 맵 끝에서는 멈춘다
    const ct = World.cameraTarget(p.x, p.y, this.world);
    const follow = 1 - Math.pow(0.0005, dt);
    this.cam.x += (ct.x - this.cam.x) * follow;
    this.cam.y += (ct.y - this.cam.y) * follow;

    // 웨이브 소환: 화면 바로 바깥(맵 안)에서 나온다. 동시에 살아 있는 수는 maxAlive까지
    const SC = GAME_DATA.scaling;
    if (this.state === 'play' && this.queue.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.mobs.filter(m => m.alive).length < SC.maxAlive) {
        this.spawnTimer = this.spawnInterval;
        const e = this.queue.shift();
        const pt = World.spawnPoint(this.cam, this.world, p);
        this.spawnMob(e.type, pt.x, pt.y, { alt: e.alt });
      }
    }

    for (const m of this.mobs) m.update(dt);
    this.mobs = this.mobs.filter(m => !m.removed);

    // 너무 멀어진 몹은 화면 근처로 다시 데려온다(넓은 맵에서 한참 안 오는 일 방지)
    for (const m of this.mobs) {
      if (m.alive && Math.hypot(m.x - p.x, m.y - p.y) > SC.leashDistance) {
        const pt = World.spawnPoint(this.cam, this.world, p);
        m.relocate(pt.x, pt.y);
      }
    }

    // 몸통 박치기
    if (!p.dead) for (const m of this.mobs) {
      if (m.alive && m.entered && Math.hypot(m.x - p.x, m.y - p.y) < m.radius + p.radius) p.hurt(m.st.contactDamage);
    }

    // 몹 투사체
    for (const s of this.shots) {
      s.time += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (!p.dead && Math.hypot(s.x - p.x, s.y - p.y) < p.radius + s.radius) { p.hurt(s.damage); s.time = 99; }
    }
    const ww = this.world.w, wh = this.world.h;
    this.shots = this.shots.filter(s => s.time < 5 && s.x > 0 && s.x < ww && s.y > 0 && s.y < wh);

    // 하트
    const HD = GAME_DATA.heartDrop;
    for (const h of this.pickups) {
      h.time += dt;
      if (!p.dead && p.hp < p.maxHp && Math.hypot(h.x - p.x, h.y - p.y) < HD.pickupRadius + p.radius) {
        p.hp = Math.min(p.maxHp, p.hp + HD.heal);
        h.time = 999;
        this.texts.push({ x: p.x, y: p.y - 50, text: '+♥', time: 0, color: '#ff5a7a' });
      }
    }
    this.pickups = this.pickups.filter(h => h.time < HD.lifetime);

    this.effects = this.effects.filter(e => e.update(dt) !== false);
    for (const t of this.texts) { t.time += dt; t.y -= 30 * dt; }
    this.texts = this.texts.filter(t => t.time < 0.7);
    this.shake = Math.max(0, this.shake - dt * 30);

    // 웨이브/스테이지 클리어 판정
    if (this.state === 'play' && !this.queue.length && !this.mobs.some(m => m.alive)) {
      if (this.waveIndex + 1 < this.waves.length) this.startWave(this.waveIndex + 1);
      else {
        this.state = 'clear'; this.timer = GAME_DATA.rules.stageClearTime; this.shots = [];
        this.effects = this.effects.filter(e => !e.hazard);   // 보스가 깐 함정 등 정리
      }
    }
    if (this.state === 'clear') {
      this.timer -= dt;
      if (this.timer <= 0) this.afterClear();
    }

    if (p.dead && p.fadeDone && this.state !== 'gameover') this.showGameOver();
  },

  afterClear() {
    // 바닥에 남은 하트는 클리어 보상으로 회수
    const p = this.player;
    p.hp = Math.min(p.maxHp, p.hp + this.pickups.length * GAME_DATA.heartDrop.heal);
    this.pickups = [];
    if (this.stage % GAME_DATA.rules.buffEvery === 0) this.showBuff();
    else this.nextStage();
  },

  nextStage() {
    if (this.stage >= this.lastStage) this.showVictory();
    else this.startStage(this.stage + 1);
  },

  togglePause(force) {
    if (!['play', 'intro', 'clear'].includes(this.state)) return;
    this.paused = force === undefined ? !this.paused : force;
    $('pause').classList.toggle('hidden', !this.paused);
  },

  // ----- 버프 선택 -----
  buffOptions() {
    const owned = this.player.weapons;
    const pool = Object.keys(GAME_DATA.weapons).filter(id => GAME_DATA.weapons[id].enabled);
    pool.sort(() => Math.random() - 0.5);
    return pool.slice(0, 3).map(id => {
      const w = owned.find(o => o.id === id);
      if (!w) return { type: 'new', id };
      const stats = Object.keys(GAME_DATA.weapons[id].upgrade);
      return { type: 'up', id, weapon: w, stat: stats[Math.floor(Math.random() * stats.length)] };
    });
  },

  showBuff() {
    this.state = 'buff';
    const box = $('cards');
    box.innerHTML = '';
    this.buffOptions().forEach((opt, i) => {
      const def = GAME_DATA.weapons[opt.id];
      const card = document.createElement('button');
      card.className = 'card ' + (opt.type === 'new' ? 'card-new' : 'card-up');
      let detail;
      if (opt.type === 'new') {
        detail = `<div class="card-tag">NEW</div><div class="card-desc">${def.desc}</div>`;
      } else {
        const st = GAME_DATA.upgradeStats[opt.stat];
        const amount = opt.stat === 'damage' ? '+' + def.upgrade.damage : '+' + Math.round(def.upgrade[opt.stat] * 100) + '%';
        detail = `<div class="card-tag">Lv.${opt.weapon.level} → Lv.${opt.weapon.level + 1}</div>
          <div class="card-stat"><img src="${iconPath(st.icon, 64)}" alt="">${st.label} ${amount}</div>`;
      }
      card.innerHTML = `<div class="card-key">${i + 1}</div>
        <img class="card-icon" src="${iconPath(opt.id, 128)}" alt="">
        <div class="card-name">${def.name}</div>${detail}`;
      card.onclick = () => this.pickBuff(opt);
      box.appendChild(card);
    });
    $('buff').classList.remove('hidden');
  },

  pickBuff(opt) {
    if (this.state !== 'buff') return;
    if (opt.type === 'new') this.player.weapons.push(new Weapon(opt.id));
    else opt.weapon.upgrade(opt.stat);
    $('buff').classList.add('hidden');
    this.updateWeaponHud();
    this.nextStage();
  },

  updateWeaponHud() {
    $('weapons').innerHTML = this.player.weapons.map(w =>
      `<div class="wslot" title="${w.def.name}"><img src="${iconPath(w.id, 64)}" alt=""><span>Lv.${w.level}</span></div>`).join('');
  },

  showGameOver() {
    this.state = 'gameover';
    $('gameover-stage').textContent = `STAGE ${this.stage}에서 쓰러졌다`;
    $('gameover').classList.remove('hidden');
  },

  showVictory() {
    this.state = 'victory';
    $('victory-text').textContent = `${this.zone.name} 클리어! (다음 구간은 준비 중)`;
    $('victory').classList.remove('hidden');
  },

  // ----- 그리기 -----
  draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1b2a1b';
    ctx.fillRect(0, 0, W, H);
    if (!this.player) return;

    // 여기부터 월드 좌표로 그린다(카메라만큼 옮김, 픽셀이 뭉개지지 않게 정수로)
    ctx.save();
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; }
    const camX = Math.round(this.cam.x), camY = Math.round(this.cam.y);
    ctx.translate(-camX + sx, -camY + sy);
    const view = { x: camX, y: camY };
    World.drawFloor(ctx, this.zone, view, this.world, this.stage);
    World.drawBorder(ctx, this.world);

    const p = this.player;
    if (!p.dead) for (const w of p.weapons) w.drawUnder(this, ctx);
    for (const e of this.effects) if (e.layer === 'under') e.draw(ctx);

    // 하트 아이템: heart_1/heart_2 깜빡임, 사라지기 3초 전부터 빠르게 깜빡
    const HD = GAME_DATA.heartDrop;
    for (const h of this.pickups) {
      const left = HD.lifetime - h.time;
      if (left < 3 && Math.floor(h.time * 10) % 2) continue;
      const img = Math.floor(h.time * 3) % 2 ? 'heart_2' : 'heart_1';
      drawEffect(ctx, img, h.x, h.y + Math.sin(h.time * 4) * 3, { scale: HD.drawScale });
    }

    // 캐릭터: 발 위치 기준으로 아래쪽이 앞에 오게
    // 화면 밖 캐릭터는 그리지 않는다
    const chars = [...this.mobs.filter(m => this.isOnScreen(m.x, m.y, 200)), p].sort((a, b) => a.footY - b.footY);
    for (const c of chars) c.draw(ctx);

    for (const s of this.shots) {
      if (s.fx) drawFx(ctx, s.fx, fxFrameAt(s.fx, s.time), s.x, s.y, { angle: s.angle, scale: s.scale, flipY: s.vx < 0 });
      else drawEffect(ctx, 'spit_projectile', s.x, s.y, { angle: s.angle, flipY: s.vx < 0 });
    }
    if (!p.dead) for (const w of p.weapons) w.drawOver(this, ctx);
    for (const e of this.effects) if (e.layer !== 'under') e.draw(ctx);

    ctx.font = 'bold 18px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = 1 - t.time / 0.7;
      ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color || '#fff';
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    this.drawHud();
  },

  drawHud() {
    const p = this.player;
    // 하트
    for (let i = 0; i < p.maxHp; i++) {
      drawEffect(ctx, i < p.hp ? 'heart_1' : 'heart_2', 34 + i * 44, 34, { scale: 1.7, alpha: i < p.hp ? 1 : 0.35 });
    }

    // 스테이지 정보
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Malgun Gothic", sans-serif';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#fff';
    const title = `STAGE ${this.stage}` + (this.def && this.def.boss ? ' · BOSS' : '');
    ctx.strokeText(title, W / 2, 34); ctx.fillText(title, W / 2, 34);
    if (this.def && this.state === 'play') {
      const left = this.queue.length + this.mobs.filter(m => m.alive).length;
      const sub = `웨이브 ${this.waveIndex + 1}/${this.waves.length} · 남은 벌레 ${left}`;
      ctx.font = '15px "Malgun Gothic", sans-serif';
      ctx.strokeText(sub, W / 2, 58); ctx.fillText(sub, W / 2, 58);
    }

    // 화면 밖 몹 방향 표시: 보스, 또는 남은 몹이 적을 때(넓은 맵에서 마지막 몹 찾기용)
    if (this.state === 'play') {
      const alive = this.mobs.filter(m => m.alive);
      const few = alive.length + this.queue.length <= 5;
      for (const m of alive) {
        if ((!few && !m.isBoss) || this.isOnScreen(m.x, m.y)) continue;
        const cx = W / 2, cy = H / 2;
        const a = Math.atan2(m.y - (this.cam.y + cy), m.x - (this.cam.x + cx));
        // 화면 가장자리(여백 28px)와 만나는 점
        const k = Math.min((cx - 28) / Math.abs(Math.cos(a) || 1e-6), (cy - 28) / Math.abs(Math.sin(a) || 1e-6));
        ctx.save();
        ctx.translate(cx + Math.cos(a) * k, cy + Math.sin(a) * k);
        ctx.rotate(a);
        ctx.fillStyle = m.isBoss ? '#ffcc33' : '#ff6b6b';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }

    // 보스 체력바
    const boss = this.mobs.find(m => m.isBoss && m.alive);
    if (boss) {
      const bw = 520, bx = (W - bw) / 2, by = H - 46;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx - 4, by - 4, bw + 8, 22);
      ctx.fillStyle = '#5a1c1c'; ctx.fillRect(bx, by, bw, 14);
      ctx.fillStyle = '#ffcc33'; ctx.fillRect(bx, by, bw * boss.hp / boss.maxHp, 14);
      ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
      ctx.strokeText(boss.st.name, W / 2, by - 10); ctx.fillStyle = '#fff'; ctx.fillText(boss.st.name, W / 2, by - 10);
    }

    // 가운데 큰 글자
    let big = null;
    if (this.state === 'intro') big = this.def.boss ? `STAGE ${this.stage} · 보스 등장!` : `STAGE ${this.stage}`;
    if (this.state === 'clear') big = 'CLEAR!';
    if (big) {
      ctx.font = 'bold 56px "Malgun Gothic", sans-serif';
      ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.75)';
      ctx.strokeText(big, W / 2, H / 2 - 90);
      ctx.fillStyle = this.state === 'clear' ? '#ffe066' : '#fff';
      ctx.fillText(big, W / 2, H / 2 - 90);
      if (this.state === 'intro' && (this.stage - 1) % GAME_DATA.rules.stagesPerZone === 0) {
        ctx.font = 'bold 24px "Malgun Gothic", sans-serif'; ctx.lineWidth = 5;
        ctx.strokeText(this.zone.name, W / 2, H / 2 - 44); ctx.fillStyle = '#cfe9a8'; ctx.fillText(this.zone.name, W / 2, H / 2 - 44);
      }
    }
  },
};

// ---------------- 시작 ----------------
let last = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0);
  last = t;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}

function show(id) { ['title', 'buff', 'gameover', 'victory'].forEach(x => $(x).classList.toggle('hidden', x !== id)); }

$('start-btn').onclick = () => { show(null); game.newRun(); };
$('retry-btn').onclick = () => { show(null); game.newRun(); };
$('again-btn').onclick = () => { show(null); game.newRun(); };

loadAllAssets(r => { $('loading-bar').style.width = Math.round(r * 100) + '%'; })
  .then(() => {
    $('loading').classList.add('hidden');
    game.state = 'title';
    show('title');
  })
  .catch(err => {
    console.error(err);
    $('loading-text').textContent = '불러오기 실패: ' + err.message;
  });

requestAnimationFrame(loop);
