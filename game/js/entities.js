// =============================================================
//  플레이어와 몹
//  x, y = 몸 중심(충돌·조준 기준). 그릴 때는 json 피벗 위치로 바꿔서 그린다.
// =============================================================

const FADE_TIME = 0.6;     // 사망 애니메이션이 끝난 뒤 사라지는 시간(초)
const FLASH_TIME = 0.12;   // 피격 흰색 번쩍임 시간(초)
const SPAWN_FADE = 0.35;   // 몹이 나타날 때 서서히 보이는 시간(초)

function animDuration(sprite, name) {
  const a = sprite.meta.anims[name];
  return a ? a.frames / a.fps : 0;
}

// 공통 그리기: 그림자 + 스프라이트(좌우 반전·번쩍임·투명도)
function drawCharacter(ctx, e, alpha) {
  const s = e.anim.sprite;
  const px = e.x - e.off.x, py = e.y - e.off.y;          // 피벗 위치
  const footY = py + (s.frameH - s.pivotY);               // 프레임 바닥
  ctx.save();
  ctx.globalAlpha = 0.22 * alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(e.x, footY - 3, e.radius * 1.1, e.radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawSprite(ctx, e.anim, px, py, { flip: e.facingLeft, alpha, flash: e.flash / FLASH_TIME });
}

// ---------------- 플레이어 ----------------
class Player {
  constructor(g) {
    const D = GAME_DATA.player;
    this.g = g;
    this.sprite = Assets.sprites[D.sprite];
    this.anim = new Animator(this.sprite);
    this.off = bodyOffset(this.sprite);
    this.radius = this.sprite.bodySize * D.hitboxScale;
    this.x = GAME_DATA.screen.width / 2;
    this.y = GAME_DATA.screen.height / 2;
    this.speed = D.speed;
    this.maxHp = D.maxHp;
    this.hp = D.maxHp;
    this.invuln = 0;
    this.flash = 0;
    this.atkTimer = 0;
    this.hitTimer = 0;
    this.facingLeft = false;
    this.dead = false;
    this.deadTime = 0;
    // 상태 이상: 속박(이동 불가), 둔화(속도 배율)
    this.rootTimer = 0;
    this.rootFx = null;
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.weapons = D.startWeapons.map(id => new Weapon(id));
  }

  get footY() { return this.y - this.off.y + (this.sprite.frameH - this.sprite.pivotY); }

  update(dt, input) {
    this.anim.update(dt);
    this.flash = Math.max(0, this.flash - dt);
    if (this.dead) {
      this.anim.play('die');
      if (this.anim.finished) this.deadTime += dt;
      return;
    }
    this.invuln = Math.max(0, this.invuln - dt);
    this.atkTimer = Math.max(0, this.atkTimer - dt);
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    this.rootTimer = Math.max(0, this.rootTimer - dt);
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    const speed = this.rootTimer > 0 ? 0 : this.speed * (this.slowTimer > 0 ? this.slowFactor : 1);

    let mx = 0, my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    const moving = mx || my;
    if (moving) {
      const len = Math.hypot(mx, my);
      this.x += mx / len * speed * dt;
      this.y += my / len * speed * dt;
      if (mx && this.atkTimer <= 0) this.facingLeft = mx < 0;
    }
    World.clampInside(this, this.g.world);

    if (this.hitTimer > 0) this.anim.play('hit');
    else if (this.atkTimer > 0) this.anim.play('atk');
    else {
      this.anim.play('move');
      if (!moving) this.anim.time = 0; // 서 있을 땐 move 첫 프레임
    }

    for (const w of this.weapons) w.update(this.g, dt);
  }

  attack(angle) {
    this.facingLeft = Math.cos(angle) < 0;
    this.atkTimer = animDuration(this.sprite, 'atk');
    this.anim.play('atk', true);
  }

  // 실제로 피해를 입었으면 true (무적·방어막으로 막히면 false)
  hurt(dmg) {
    if (this.dead || this.invuln > 0) return false;
    // 방어막(모기장 등)이 막으면 피해 없음
    for (const w of this.weapons) if (w.onPlayerHurt(this.g)) return false;
    this.hp = Math.max(0, this.hp - dmg);
    this.invuln = GAME_DATA.player.invincibleTime;
    this.flash = FLASH_TIME;
    this.hitTimer = animDuration(this.sprite, 'hit');
    this.anim.play('hit', true);
    this.g.shake = 6;
    if (this.hp <= 0) { this.dead = true; this.anim.play('die', true); }
    return true;
  }

  // 속박: time초 동안 움직일 수 없다. fxId = 발밑에 그릴 그림(거미줄 등)
  root(time, fxId) {
    if (this.dead) return;
    if (this.rootTimer <= 0) this.g.texts.push({ x: this.x, y: this.y - 56, text: '속박!', time: 0, color: '#e8e8ff' });
    this.rootTimer = Math.max(this.rootTimer, time);
    this.rootFx = fxId;
  }

  // 둔화: time초 동안 이동 속도 ×factor
  slow(factor, time) {
    if (this.dead) return;
    if (this.slowTimer <= 0) this.g.texts.push({ x: this.x, y: this.y - 56, text: '둔화!', time: 0, color: '#c9b8ff' });
    this.slowFactor = this.slowTimer > 0 ? Math.min(this.slowFactor, factor) : factor;
    this.slowTimer = Math.max(this.slowTimer, time);
  }

  get fadeDone() { return this.deadTime >= FADE_TIME; }

  draw(ctx) {
    let alpha = 1;
    if (this.dead) alpha = Math.max(0, 1 - this.deadTime / FADE_TIME);
    else if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) alpha = 0.45;
    // 둔화 중: 발밑이 보랏빛
    if (!this.dead && this.slowTimer > 0 && this.rootTimer <= 0) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#9b7bff';
      ctx.beginPath();
      ctx.ellipse(this.x, this.footY - 4, this.radius * 1.4, this.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawCharacter(ctx, this, alpha);
    // 속박 중: 몸 위에 거미줄(fx 마지막 프레임 = 다 펼쳐진 모양)
    if (!this.dead && this.rootTimer > 0 && this.rootFx && Assets.fx[this.rootFx]) {
      const m = Assets.fx[this.rootFx].meta;
      drawFx(ctx, this.rootFx, m.frames - 1, this.x, this.footY - 14,
        { scale: (this.radius * 3.2) / m.frameSize[0], alpha: 0.85 });
    }
  }
}

// ---------------- 몹 ----------------
class Mob {
  // opt: { alt, summoned }
  constructor(g, type, spritePath, x, y, opt = {}) {
    const st = GAME_DATA.mobs[type];
    const mul = opt.alt ? GAME_DATA.altMultiplier : { hp: 1, speed: 1 };
    this.g = g;
    this.type = type;
    this.st = st;
    this.sprite = Assets.sprites[spritePath];
    this.anim = new Animator(this.sprite);
    this.off = bodyOffset(this.sprite);
    this.radius = this.sprite.bodySize * st.hitboxScale;
    this.x = x; this.y = y;
    this.maxHp = Math.round(st.hp * mul.hp);
    this.hp = this.maxHp;
    this.speed = st.speed * mul.speed;
    this.summoned = !!opt.summoned;
    this.isBoss = !!st.isBoss;
    this.state = 'move';
    this.stateTime = 0;
    this.cd = 1 + Math.random();       // 첫 공격까지 약간의 여유
    this.cd2 = st.summonCooldown || 0; // 보스 소환 쿨
    this.dir = 0;
    this.flash = 0;
    this.hitTimer = 0;
    this.kx = 0; this.ky = 0;          // 넉백 속도
    this.facingLeft = false;
    this.spawnTime = 0;                // 나타난 뒤 지난 시간(처음엔 서서히 나타남)
    this.slowTimer = 0;                // 끈끈이 등으로 느려진 남은 시간
    this.slowFactor = 1;
    this.dying = false;
    this.deadTime = 0;
    this.removed = false;
    this.strafe = Math.random() < 0.5 ? 1 : -1;
  }

  get alive() { return !this.dying; }
  // 다 나타난 뒤부터 공격·조준·몸통 박치기 대상이 된다
  get entered() { return this.spawnTime >= SPAWN_FADE; }
  get slowMul() { return this.slowTimer > 0 ? this.slowFactor : 1; }
  // 둔화: factor배 속도로 time초 동안
  slow(factor, time) {
    this.slowFactor = this.slowTimer > 0 ? Math.min(this.slowFactor, factor) : factor;
    this.slowTimer = Math.max(this.slowTimer, time);
  }
  get footY() { return this.y - this.off.y + (this.sprite.frameH - this.sprite.pivotY); }

  setState(s, time = 0) { this.state = s; this.stateTime = time; }

  takeHit(dmg, fromX, fromY, kbMul = 1) {
    if (this.dying) return;
    this.hp -= dmg;
    this.flash = FLASH_TIME;
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    const kb = 220 * kbMul * (1 - (this.st.knockbackResist || 0));
    if (this.state !== 'dash') { this.kx += (this.x - fromX) / d * kb; this.ky += (this.y - fromY) / d * kb; }
    if (this.hp <= 0) { this.die(); return; }
    if (this.state === 'move') {
      this.hitTimer = animDuration(this.sprite, 'hit');
      this.anim.play('hit', true);
    }
  }

  die() {
    this.dying = true;
    this.hp = 0;
    this.anim.hold = null;
    this.anim.play('die', true);
    this.g.onMobKilled(this);
  }

  update(dt) {
    const g = this.g, p = g.player;
    this.anim.update(dt);
    this.flash = Math.max(0, this.flash - dt);
    this.spawnTime += dt;
    this.slowTimer = Math.max(0, this.slowTimer - dt);

    if (this.dying) {
      if (this.anim.finished) this.deadTime += dt;
      if (this.deadTime >= FADE_TIME) this.removed = true;
      return;
    }

    // 넉백
    this.x += this.kx * dt; this.y += this.ky * dt;
    const damp = Math.pow(0.001, dt);
    this.kx *= damp; this.ky *= damp;

    this.cd -= dt;
    this.stateTime -= dt;
    const dx = p.x - this.x, dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const toP = Math.atan2(dy, dx);

    if (!this.entered) {
      // 나타나는 중에는 공격 없이 플레이어 쪽으로 걷기만 한다
      this.anim.play('move');
      this.moveAngle(toP, this.speed, dt);
    } else if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0) this.anim.play('move');
    } else {
      const ai = MOB_AI[this.st.ai];
      ai.call(this, dt, dist, toP, p);
    }

    // 맵 테두리 밖으로 못 나가게
    World.clampInside(this, g.world);
  }

  // 플레이어 쪽(또는 각도 a)으로 이동. 둔화 중이면 느려진다
  moveAngle(a, speed, dt) {
    const v = speed * this.slowMul;
    this.x += Math.cos(a) * v * dt;
    this.y += Math.sin(a) * v * dt;
    if (Math.abs(Math.cos(a)) > 0.15) this.facingLeft = Math.cos(a) < 0;
  }

  // 멀리 떨어진 몹을 새 자리로 옮기고 다시 서서히 나타나게
  relocate(x, y) {
    this.x = x; this.y = y;
    this.kx = this.ky = 0;
    this.spawnTime = 0;
    this.state = 'move';
    this.anim.hold = null;
  }

  draw(ctx) {
    let alpha = this.dying ? Math.max(0, 1 - this.deadTime / FADE_TIME) : 1;
    if (!this.dying) alpha = Math.min(1, this.spawnTime / SPAWN_FADE);
    drawCharacter(ctx, this, alpha);
  }
}

// ---------------- 몹 AI ----------------
// this = Mob. 새 몹 행동은 여기 함수 하나를 추가하고 data.js의 ai 이름을 맞추면 된다.
const MOB_AI = {
  // 개미: 다가가다가 가까우면 잠깐 멈췄다가 돌진
  charger(dt, dist, toP) {
    const st = this.st;
    if (this.state === 'move') {
      this.anim.play('move');
      this.moveAngle(toP, this.speed, dt);
      if (this.entered && dist < st.chargeRange && this.cd <= 0) {
        this.dir = toP;
        this.facingLeft = Math.cos(toP) < 0;
        this.anim.play('atk', true);
        this.setState('windup', st.chargeWindup);
      }
    } else if (this.state === 'windup') {
      if (this.stateTime <= 0) this.setState('dash', st.chargeTime);
    } else if (this.state === 'dash') {
      this.moveAngle(this.dir, st.chargeSpeed * (this.speed / st.speed), dt);
      if (this.stateTime <= 0) { this.setState('move'); this.cd = st.chargeCooldown; }
    }
  },

  // 무당벌레: 느리게 다가가서 근접 공격(mob_slash)
  melee(dt, dist, toP, p) {
    const st = this.st;
    if (this.state === 'move') {
      this.anim.play('move');
      if (dist > st.attackRange * 0.7) this.moveAngle(toP, this.speed, dt);
      if (dist < st.attackRange + p.radius && this.cd <= 0) {
        this.dir = toP;
        this.facingLeft = Math.cos(toP) < 0;
        this.anim.play('atk', true);
        this.setState('windup', st.attackWindup);
      }
    } else if (this.state === 'windup') {
      if (this.stateTime <= 0) {
        const a = this.dir, sx = this.x + Math.cos(a) * this.radius * 1.4, sy = this.y + Math.sin(a) * this.radius * 1.4;
        this.g.addEffect(makeImageEffect(st.attackFx || 'mob_slash', sx, sy, 0.22,
          { angle: a, flipY: Math.cos(a) < 0, scale: st.attackFxScale || 1.3 }));
        if (Math.hypot(p.x - this.x, p.y - this.y) < st.attackRange + p.radius) p.hurt(st.attackDamage);
        this.setState('recover', 0.3);
      }
    } else if (this.state === 'recover') {
      if (this.stateTime <= 0) { this.setState('move'); this.cd = st.attackCooldown; }
    }
  },

  // 파리: 거리를 유지하며 맴돌다가 침 발사(atk 2번째 프레임에서 발사)
  ranged(dt, dist, toP) {
    const st = this.st;
    if (this.state === 'move') {
      this.anim.play('move');
      if (dist > st.keepDistance + 30) this.moveAngle(toP, this.speed, dt);
      else if (dist < st.keepDistance - 50) this.moveAngle(toP + Math.PI, this.speed * 0.7, dt);
      else this.moveAngle(toP + this.strafe * Math.PI / 2, this.speed * 0.5, dt);
      this.facingLeft = Math.cos(toP) < 0;
      // 화면 밖에서 쏘는 건 불공평하니 화면 안에 있을 때만 쏜다
      if (this.cd <= 0 && dist < st.keepDistance + 160 && this.g.isOnScreen(this.x, this.y)) {
        this.anim.play('atk', true);
        this.fired = false;
        this.setState('shoot');
      }
    } else if (this.state === 'shoot') {
      this.facingLeft = Math.cos(toP) < 0;
      if (!this.fired && this.anim.frame === this.anim.anim.frames - 1) {
        this.fired = true;
        this.g.spawnShot(this.x + Math.cos(toP) * this.radius, this.y + Math.sin(toP) * this.radius, toP, st.shotSpeed, st.shotDamage,
          { fx: st.shotFx, scale: st.shotScale, radius: st.shotRadius });
      }
      if (this.anim.finished) {
        this.setState('move'); this.cd = st.shotCooldown * (0.8 + Math.random() * 0.4);
        if (Math.random() < 0.3) this.strafe *= -1;
      }
    }
  },

  // 벌레왕: 따라오다가 웅크림(atk 1프레임) → 돌진(atk 2프레임), 가끔 개미 소환
  boss_bee(dt, dist, toP) {
    const st = this.st;
    bossSummon(this, dt);
    if (this.state === 'move') {
      this.anim.hold = null;
      this.anim.play('move');
      this.moveAngle(toP, this.speed, dt);
      if (this.entered && this.cd <= 0 && dist < 520) {
        this.dir = toP;
        this.facingLeft = Math.cos(toP) < 0;
        this.anim.play('atk', true);
        this.anim.hold = 0;
        this.setState('windup', st.dashWindup);
      }
    } else if (this.state === 'windup') {
      // 웅크린 채 조준을 살짝 따라간다
      this.dir = toP;
      this.facingLeft = Math.cos(toP) < 0;
      if (this.stateTime <= 0) { this.anim.hold = 1; this.setState('dash', st.dashTime); }
    } else if (this.state === 'dash') {
      this.moveAngle(this.dir, st.dashSpeed, dt);
      if (this.stateTime <= 0) { this.anim.hold = null; this.setState('move'); this.cd = st.dashCooldown; }
    }
  },

  // 거대 거미: 거리를 두고 맴돌며
  //  ① 거미줄 함정 — 배를 듦(atk 1프레임) → 플레이어 발밑·주변에 함정 설치(밟으면 속박)
  //  ② 거미줄 줄기 — 웅크려 조준(atk 1프레임) → 발사(atk 2프레임), 맞으면 피해 + 둔화
  //  가끔 점프 거미 소환
  boss_spider(dt, dist, toP, p) {
    const st = this.st, g = this.g;
    bossSummon(this, dt);
    if (this.cd3 == null) this.cd3 = st.trapCooldown * 0.4;   // 첫 함정은 조금 일찍
    this.cd3 -= dt;
    if (this.state === 'move') {
      this.anim.hold = null;
      this.anim.play('move');
      if (dist > st.keepDistance) this.moveAngle(toP, this.speed, dt);
      else this.moveAngle(toP + this.strafe * Math.PI / 2, this.speed * 0.6, dt);
      this.facingLeft = Math.cos(toP) < 0;
      if (this.cd3 <= 0) {
        this.anim.play('atk', true); this.anim.hold = 0;
        this.setState('trapWindup', st.trapWindup);
      } else if (this.cd <= 0 && dist < st.beamRange) {
        this.dir = toP;
        this.anim.play('atk', true); this.anim.hold = 0;
        this.setState('beamWindup', st.beamWindup);
        g.addEffect(makeBeamWarning(this));
      }
    } else if (this.state === 'trapWindup') {
      if (this.stateTime <= 0) {
        this.anim.hold = 1;
        // 첫 함정은 플레이어 발밑, 나머지는 주변 무작위
        for (let i = 0; i < st.trapCount; i++) {
          const a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : st.trapSpread * (0.5 + Math.random() * 0.5);
          g.addEffect(makeWebTrap(g, p.x + Math.cos(a) * r, p.footY - 4 + Math.sin(a) * r, st));
        }
        this.cd3 = st.trapCooldown;
        this.setState('recover', 0.4);
      }
    } else if (this.state === 'beamWindup') {
      // 앞 60% 동안은 플레이어를 따라 조준, 나머지는 고정(피할 틈)
      if (this.stateTime > st.beamWindup * 0.4) this.dir = toP;
      this.facingLeft = Math.cos(this.dir) < 0;
      if (this.stateTime <= 0) {
        this.anim.hold = 1;
        g.addEffect(makeWebBeam(g, this.x, this.y, this.dir, st));
        this.cd = st.beamCooldown;
        this.setState('recover', 0.5);
      }
    } else if (this.state === 'recover') {
      if (this.stateTime <= 0) { this.anim.hold = null; this.setState('move'); }
    }
  },
};

// 보스 공통: summonCooldown마다 summonMob을 summonCount마리 주변에 소환
function bossSummon(boss, dt) {
  const st = boss.st;
  if (!st.summonCooldown) return;
  boss.cd2 -= dt;
  if (boss.cd2 > 0) return;
  boss.cd2 = st.summonCooldown;
  for (let i = 0; i < st.summonCount; i++) {
    const a = Math.random() * Math.PI * 2;
    boss.g.spawnMob(st.summonMob, boss.x + Math.cos(a) * 90, boss.y + Math.sin(a) * 90, { summoned: true });
  }
}

// ---------------- 보스가 남기는 위험물 ----------------
// hazard: true 인 효과는 스테이지 클리어 때 지워진다

// 거미줄 함정(fx_web_trap): trapArm초 동안 펼쳐진 뒤부터 밟으면 속박. 한 번 걸리면 사라진다
function makeWebTrap(g, x, y, st) {
  const id = 'fx_web_trap', m = Assets.fx[id].meta;
  const scale = (st.trapRadius * 2.3) / m.frameSize[0];
  let time = 0;
  return {
    layer: 'under', hazard: true,
    update(dt) {
      time += dt;
      const p = g.player;
      if (time >= st.trapArm && !p.dead && Math.hypot(p.x - x, p.footY - y) < st.trapRadius) {
        p.root(st.rootTime, id);
        return false;
      }
      return time < st.trapLife;
    },
    draw(ctx) {
      // 펼쳐지는 동안 프레임 1→3, 다 펼쳐지면 마지막 프레임 유지
      const f = Math.min(m.frames - 1, Math.floor(time / st.trapArm * m.frames));
      const armed = time >= st.trapArm;
      const fade = Math.min(1, (st.trapLife - time) / 0.8);
      drawFx(ctx, id, f, x, y, { scale, alpha: (armed ? 0.9 : 0.55) * fade });
    },
  };
}

// 거미줄 줄기(fx_web_beam): 그림이 1→3프레임으로 뻗어 나가는 동안 닿으면 피해 + 둔화(한 번만)
function makeWebBeam(g, x, y, ang, st) {
  const id = 'fx_web_beam', scale = st.beamRange / fxLength(id);
  const reachTime = fxDuration(id) * 0.8;   // 끝까지 뻗는 데 걸리는 시간
  let time = 0, hit = false;
  const dur = fxDuration(id) + 0.25;
  return {
    layer: 'over', hazard: true,
    update(dt) {
      time += dt;
      const p = g.player;
      if (!hit && !p.dead && time < reachTime + 0.1) {
        const len = st.beamRange * Math.min(1, time / reachTime);
        const dx = p.x - x, dy = p.y - y, c = Math.cos(ang), s = Math.sin(ang);
        const along = dx * c + dy * s, perp = Math.abs(-dx * s + dy * c);
        if (along > 0 && along < len + p.radius && perp < st.beamWidth / 2 + p.radius) {
          hit = true;
          if (p.hurt(st.beamDamage)) p.slow(st.beamSlow, st.beamSlowTime);
        }
      }
      return time < dur;
    },
    draw(ctx) {
      drawFx(ctx, id, fxFrameAt(id, time), x, y, { angle: ang, scale, alpha: Math.min(1, (dur - time) * 5) });
    },
  };
}

// 거미줄 줄기 예고선: 보스가 조준하는 동안 옅은 선을 보여 준다
function makeBeamWarning(boss) {
  return {
    layer: 'under', hazard: true,
    update() { return boss.alive && boss.state === 'beamWindup'; },
    draw(ctx) {
      const st = boss.st, locked = boss.stateTime <= st.beamWindup * 0.4;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.rotate(boss.dir);
      ctx.fillStyle = locked ? 'rgba(255,80,80,0.35)' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, -st.beamWidth / 2, st.beamRange, st.beamWidth);
      ctx.restore();
    },
  };
}

// 이미지 하나짜리 짧은 이펙트(effects/*.png)
function makeImageEffect(name, x, y, dur, opt = {}) {
  return {
    time: 0, layer: 'over',
    update(dt) { this.time += dt; return this.time < dur; },
    draw(ctx) { drawEffect(ctx, name, x, y, Object.assign({}, opt, { alpha: 1 - (this.time / dur) * 0.5 })); },
  };
}
