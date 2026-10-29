// =============================================================
//  무기
//
//  무기 하나 = data.js의 weapons 항목(수치) + 여기 WEAPON_KINDS의 동작(kind).
//  새 무기 추가 방법:
//   1) data.js weapons에 항목을 넣는다 (base 수치, upgrade, fx, kind)
//   2) 같은 동작을 쓰면 kind만 맞추면 끝 (예: 물총·돋보기 → 같은 'beam')
//      새 동작이면 아래 WEAPON_KINDS에 { update, drawUnder? } 하나를 추가
//   3) enabled: true 로 바꾸면 버프 카드에 나온다
// =============================================================

class Weapon {
  constructor(id) {
    this.id = id;
    this.def = GAME_DATA.weapons[id];
    this.level = 1;
    this.ups = { damage: 0, range: 0, speed: 0 }; // 강화 횟수
    this.timer = 0;
    this.time = 0;
  }
  get kind() { return WEAPON_KINDS[this.def.kind]; }
  // 강화가 반영된 현재 수치
  get stats() {
    const b = this.def.base, u = this.def.upgrade;
    return Object.assign({}, b, {
      damage: b.damage + u.damage * this.ups.damage,
      range: b.range * (1 + u.range * this.ups.range),
      rangeScale: 1 + u.range * this.ups.range,
      cooldown: b.cooldown * Math.pow(1 - u.speed, this.ups.speed),
    });
  }
  upgrade(stat) { this.ups[stat]++; this.level++; }
  update(g, dt) { this.time += dt; this.kind.update(this, g, dt, this.stats); }
  drawUnder(g, ctx) { if (this.kind.drawUnder) this.kind.drawUnder(this, g, ctx, this.stats); }
  drawOver(g, ctx) { if (this.kind.drawOver) this.kind.drawOver(this, g, ctx, this.stats); }
  // 플레이어가 맞기 직전에 불린다. true를 돌려주면 피해를 막는다(모기장)
  onPlayerHurt(g) { return !!(this.kind.onPlayerHurt && this.kind.onPlayerHurt(this, g, this.stats)); }
}

// ---------------- 공용 도우미 ----------------
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}
// 부채꼴 안의 몹 전부
function mobsInCone(g, x, y, angle, range, arcDeg) {
  const half = (arcDeg * Math.PI / 180) / 2;
  return g.aliveMobs().filter(m => {
    const dx = m.x - x, dy = m.y - y;
    const d = Math.hypot(dx, dy);
    if (d - m.radius > range) return false;
    if (d < m.radius + 10) return true; // 몸에 붙어 있으면 무조건
    return angleDiff(Math.atan2(dy, dx), angle) <= half + Math.asin(Math.min(1, m.radius / d));
  });
}
function mobsInCircle(g, x, y, r) {
  return g.aliveMobs().filter(m => Math.hypot(m.x - x, m.y - y) <= r + m.radius);
}
// (x, y)에서 angle 방향으로 길이 len, 폭 width인 직선 위의 몹 전부(관통)
function mobsOnLine(g, x, y, angle, len, width) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return g.aliveMobs().filter(m => {
    const dx = m.x - x, dy = m.y - y;
    const along = dx * c + dy * s;
    if (along < -m.radius || along > len + m.radius) return false;
    return Math.abs(-dx * s + dy * c) <= width / 2 + m.radius;
  });
}
// 짧게 재생되고 사라지는 fx 하나(무기 공용). pos()는 매 프레임 그릴 위치를 돌려준다
function fxBurst(id, dur, pos, opt) {
  return {
    time: 0, layer: 'over',
    update(dt) { this.time += dt; return this.time < dur; },
    draw(ctx) {
      const at = pos();
      drawFx(ctx, id, fxFrameAt(id, this.time), at.x, at.y,
        Object.assign({}, opt, { alpha: Math.min(1, (dur - this.time) * 8) }));
    },
  };
}

// ---------------- 동작 종류 ----------------
const WEAPON_KINDS = {
  // 칼: 가장 가까운 적 쪽으로 휘두르기 (effects/slash_1~3)
  sword: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      const t = g.nearestMob(p.x, p.y, s.range + 30);
      if (!t) return;
      w.timer = s.cooldown;
      const ang = Math.atan2(t.y - p.y, t.x - p.x);
      p.attack(ang);
      // atk 첫 프레임은 칼을 드는 준비 자세라서, 마지막(휘두르는) 프레임이 시작될 때 궤적과 피해를 낸다.
      // 대기 시간은 플레이어 json의 atk frames·fps로 계산
      const atk = p.sprite.meta.anims.atk;
      const delay = (atk.frames - 1) / atk.fps;
      const left = Math.cos(ang) < 0;
      g.addEffect({
        time: -delay, dur: 0.24, hit: false, started: false, layer: 'over',
        update(dt) {
          // 플레이어 애니메이션은 다음 프레임부터 흐르므로 첫 프레임은 건너뛰어 맞춘다
          if (this.started) this.time += dt;
          this.started = true;
          if (!this.hit && this.time >= 0) {
            this.hit = true;
            for (const m of mobsInCone(g, p.x, p.y, ang, s.range, s.arc)) g.damageMob(m, s.damage, p.x, p.y);
          }
          return this.time < this.dur;
        },
        draw(ctx) {
          if (this.time < 0) return;
          const i = Math.min(2, Math.floor(this.time / this.dur * 3));
          const d = s.range * 0.45;
          drawEffect(ctx, 'slash_' + (i + 1), p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d,
            { angle: ang, flipY: left, scale: s.rangeScale });
        },
      });
    },
  },

  // 에프킬라: 조준 방향 부채꼴 분사
  spray: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      const t = g.nearestMob(p.x, p.y, s.range);
      if (!t) return;
      w.timer = s.cooldown;
      const ang = Math.atan2(t.y - p.y, t.x - p.x);
      for (const m of mobsInCone(g, p.x, p.y, ang, s.range, s.arc)) g.damageMob(m, s.damage, p.x, p.y);
      const id = w.def.fx, scale = s.range / fxLength(id);
      g.addEffect({
        time: 0, dur: fxDuration(id) + 0.1, layer: 'over',
        update(dt) { this.time += dt; return this.time < this.dur; },
        draw(ctx) {
          drawFx(ctx, id, fxFrameAt(id, this.time), p.x, p.y, {
            angle: ang, scale, alpha: Math.min(1, (this.dur - this.time) * 6),
          });
        },
      });
    },
  },

  // 홈매트: 내 주변 원 안에 주기적으로 피해
  aura: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      w.timer = s.cooldown;
      const p = g.player;
      for (const m of mobsInCircle(g, p.x, p.y, s.range)) g.damageMob(m, s.damage, p.x, p.y, 0.3);
    },
    drawUnder(w, g, ctx, s) {
      const id = w.def.fx, p = g.player;
      drawFx(ctx, id, fxFrameAt(id, w.time), p.x, p.y + 8,
        { scale: s.range / fxRadius(id), alpha: 0.55 });
    },
  },

  // 슬리퍼: 던지면 사거리 끝까지 날아갔다가 플레이어에게 돌아온다
  boomerang: {
    update(w, g, dt, s) {
      if (w.flying) return;            // 한 번에 하나만
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      const t = g.nearestMob(p.x, p.y, s.range);
      if (!t) return;
      const id = w.def.fx;
      const ang = Math.atan2(t.y - p.y, t.x - p.x);
      const scale = s.size * (1 + (s.rangeScale - 1) * 0.5);
      const hitR = fxRadius(id) * scale * 0.75;
      w.flying = true;
      g.addEffect({
        x: p.x, y: p.y, time: 0, out: true, traveled: 0, hit: new Set(), layer: 'over',
        update(dt) {
          this.time += dt;
          const sp = s.projectileSpeed * dt;
          if (this.out) {
            this.x += Math.cos(ang) * sp; this.y += Math.sin(ang) * sp;
            this.traveled += sp;
            if (this.traveled >= s.range) { this.out = false; this.hit.clear(); }
          } else {
            const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
            if (d < 24 || g.player.dead) { w.flying = false; w.timer = s.cooldown; return false; }
            this.x += dx / d * sp * 1.15; this.y += dy / d * sp * 1.15;
          }
          for (const m of mobsInCircle(g, this.x, this.y, hitR)) {
            if (this.hit.has(m)) continue;
            this.hit.add(m);
            g.damageMob(m, s.damage, this.x, this.y);
          }
          return true;
        },
        draw(ctx) { drawFx(ctx, id, fxFrameAt(id, this.time), this.x, this.y, { scale }); },
      });
    },
  },

  // 모기향: 근처에 적이 있으면 발밑에 설치. 일정 시간 동안 주변에 주기적으로 피해
  placed: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      if (!g.nearestMob(p.x, p.y, s.range * 3)) return;
      w.timer = s.cooldown;
      g.addEffect(makeZone(g, w.def.fx, p.x, p.y, s, s.size * s.rangeScale, 'rgba(120,200,120,0.14)', (g, x, y) => {
        for (const m of mobsInCircle(g, x, y, s.range)) g.damageMob(m, s.damage, x, y, 0);
      }, null));
    },
  },

  // 끈끈이 트랩: 가장 가까운 적의 발밑(또는 그쪽 방향 throwRange 지점)에 설치.
  // 밟고 있는 적은 느려지고, 주기적으로 약한 피해
  trap: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      const t = g.nearestMob(p.x, p.y, s.throwRange + s.range);
      if (!t) return;
      w.timer = s.cooldown;
      const d = Math.hypot(t.x - p.x, t.y - p.y) || 1, k = Math.min(1, s.throwRange / d);
      const x = p.x + (t.x - p.x) * k, y = p.y + (t.y - p.y) * k;
      const scale = (s.range * 2) / Assets.fx[w.def.fx].meta.frameSize[0];
      g.addEffect(makeZone(g, w.def.fx, x, y, s, scale, 'rgba(240,210,90,0.12)', (g, x, y) => {
        for (const m of mobsInCircle(g, x, y, s.range)) g.damageMob(m, s.damage, x, y, 0);
      }, (g, x, y) => {
        for (const m of mobsInCircle(g, x, y, s.range)) m.slow(s.slow, 0.2);
      }));
    },
  },
};

// ---------------- 무기 동작 추가분 (BRIEF 무기표 나머지) ----------------
Object.assign(WEAPON_KINDS, {
  // 물총·돋보기: 가장 가까운 적 쪽으로 직선. 경로 위의 적을 전부 관통한다.
  //   hits번 맞히고(tick초 간격), 맞을 때마다 knockback만큼 밀어낸다.
  //   물총 = 1번 세게 + 넉백, 돋보기 = 여러 번 지지는 레이저
  beam: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      const t = g.nearestMob(p.x, p.y, s.range);
      if (!t) return;
      w.timer = s.cooldown;
      const id = w.def.fx, ang = Math.atan2(t.y - p.y, t.x - p.x);
      const scale = s.range / fxLength(id);
      const dur = Math.max(fxDuration(id), s.hits * s.tick) + 0.1;
      let done = 0, time = 0;
      g.addEffect({
        time: 0, layer: 'over',
        update(dt) {
          time += dt;
          // 쏘는 동안 시작점은 플레이어를 따라가고 방향은 그대로
          while (done < s.hits && time >= done * s.tick) {
            done++;
            for (const m of mobsOnLine(g, p.x, p.y, ang, s.range, s.width)) g.damageMob(m, s.damage, p.x, p.y, s.knockback);
          }
          return time < dur;
        },
        draw(ctx) {
          drawFx(ctx, id, fxFrameAt(id, time), p.x, p.y, { angle: ang, scale, alpha: Math.min(1, (dur - time) * 8) });
        },
      });
    },
  },

  // 전기 모기채: 가장 가까운 적에게 번개 → 그 근처 적으로 chains번까지 튄다
  chain: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      let cur = g.nearestMob(p.x, p.y, s.range);
      if (!cur) return;
      w.timer = s.cooldown;
      const id = w.def.fx, hit = new Set();
      let from = { x: p.x, y: p.y };
      for (let i = 0; i <= s.chains && cur; i++) {
        hit.add(cur);
        const a = { x: from.x, y: from.y }, b = { x: cur.x, y: cur.y };
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        g.addEffect(fxBurst(id, fxDuration(id) + 0.05, () => a, {
          angle: Math.atan2(b.y - a.y, b.x - a.x), scaleX: Math.max(0.2, len / fxLength(id)), scaleY: 0.7,
        }));
        g.damageMob(cur, s.damage, a.x, a.y, 0.3);
        from = b;
        // 다음 대상: 아직 안 맞은 적 중 가장 가까운 것
        let next = null, best = s.chainRange * s.rangeScale;
        for (const m of g.aliveMobs()) {
          if (hit.has(m) || !m.entered) continue;
          const d = Math.hypot(m.x - b.x, m.y - b.y);
          if (d < best) { best = d; next = m; }
        }
        cur = next;
      }
    },
  },

  // 연막 훈증탄: 가까운 적 쪽으로 던짐 → 떨어진 곳에서 연기가 퍼지고 duration초 동안 tick마다 피해
  bomb: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      const t = g.nearestMob(p.x, p.y, s.throwRange);
      if (!t) return;
      w.timer = s.cooldown;
      const id = w.def.fx, icon = Assets.images[iconPath(w.id, 64)];
      const sx = p.x, sy = p.y, tx = t.x, ty = t.y;
      const scale = s.range / fxRadius(id);
      let time = 0, landed = false, tick = 0;
      g.addEffect({
        layer: 'over',
        update(dt) {
          time += dt;
          if (!landed && time >= s.flightTime) { landed = true; time = 0; }
          if (landed) {
            tick -= dt;
            if (tick <= 0) { tick = s.tick; for (const m of mobsInCircle(g, tx, ty, s.range)) g.damageMob(m, s.damage, tx, ty, 0.2); }
            return time < s.duration;
          }
          return true;
        },
        draw(ctx) {
          if (!landed) {
            // 포물선으로 날아가는 훈증탄(아이콘 그림 사용)
            const k = time / s.flightTime;
            const x = sx + (tx - sx) * k, y = sy + (ty - sy) * k - Math.sin(k * Math.PI) * 70;
            ctx.save();
            ctx.translate(x, y); ctx.rotate(k * Math.PI * 3);
            ctx.drawImage(icon, -16, -16, 32, 32);
            ctx.restore();
          } else {
            drawFx(ctx, id, fxFrameAt(id, time), tx, ty,
              { scale, alpha: 0.55 * Math.min(1, (s.duration - time) / 0.6) });
          }
        },
      });
    },
  },

  // 선풍기: cooldown마다 주변 적을 밀어내며 약한 피해
  push: {
    update(w, g, dt, s) {
      w.timer -= dt;
      if (w.timer > 0) return;
      const p = g.player;
      const targets = mobsInCircle(g, p.x, p.y, s.range);
      if (!targets.length) return;
      w.timer = s.cooldown;
      for (const m of targets) g.damageMob(m, s.damage, p.x, p.y, s.knockback);
      w.showUntil = w.time + s.showTime;
    },
    drawUnder(w, g, ctx, s) {
      if (!(w.time < w.showUntil)) return;
      const id = w.def.fx, p = g.player;
      drawFx(ctx, id, fxFrameAt(id, w.time), p.x, p.y,
        { scale: s.range / fxRadius(id), alpha: 0.8 * Math.min(1, (w.showUntil - w.time) / 0.2) });
    },
  },

  // 청소기: cooldown마다 duration초 동안 주변 적을 플레이어 쪽으로 끌어당긴다(몸에 닿기 직전까지).
  //   끌려오는 동안 tick마다 약한 피해
  pull: {
    update(w, g, dt, s) {
      const p = g.player;
      w.timer -= dt;   // 끌어당기는 동안에도 쿨타임은 흐른다
      if (w.active > 0) {
        w.active -= dt;
        w.tick -= dt;
        const hitNow = w.tick <= 0;
        if (hitNow) w.tick = s.tick;
        for (const m of mobsInCircle(g, p.x, p.y, s.range)) {
          const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
          const stop = p.radius + m.radius + 20;
          if (d > stop) {
            const v = Math.min(d - stop, s.pullSpeed * (1 - (m.st.knockbackResist || 0)) * dt);
            m.x += dx / d * v; m.y += dy / d * v;
          }
          if (hitNow) g.damageMob(m, s.damage, p.x, p.y, 0);
        }
        return;
      }
      if (w.timer > 0) return;
      if (!mobsInCircle(g, p.x, p.y, s.range).length) return;
      w.timer = s.cooldown;
      w.active = s.duration;
      w.tick = 0;
    },
    drawUnder(w, g, ctx, s) {
      if (!(w.active > 0)) return;
      const id = w.def.fx, p = g.player;
      drawFx(ctx, id, fxFrameAt(id, w.time), p.x, p.y,
        { scale: s.range / fxRadius(id), alpha: 0.55 * Math.min(1, w.active / 0.3) });
    },
  },

  // 모기장: 몸을 감싸는 방어막. 있으면 피격을 charges번 막고, 막을 때 주변 적을 밀어낸다.
  //   방어막이 있는 동안 그물에 닿은 적은 tick마다 약한 피해. 깨지면 cooldown초 뒤 다시 생긴다.
  shield: {
    update(w, g, dt, s) {
      if (w.charges == null) { w.charges = s.charges; w.timer = s.cooldown; }
      if (w.charges < s.charges) {
        w.timer -= dt;
        if (w.timer <= 0) { w.charges++; w.timer = s.cooldown; }
      }
      if (w.charges > 0) {
        w.tick = (w.tick || 0) - dt;
        if (w.tick <= 0) {
          w.tick = s.tick;
          const p = g.player;
          for (const m of mobsInCircle(g, p.x, p.y, s.range)) g.damageMob(m, s.damage, p.x, p.y, 0.5);
        }
      }
    },
    onPlayerHurt(w, g, s) {
      if (!(w.charges > 0)) return false;
      const p = g.player;
      w.charges--;
      w.timer = s.cooldown;
      w.brokeAt = w.time;
      p.invuln = s.blockInvuln;
      for (const m of mobsInCircle(g, p.x, p.y, s.range * 1.8)) g.damageMob(m, s.damage, p.x, p.y, s.knockback);
      g.texts.push({ x: p.x, y: p.y - 56, text: '막음!', time: 0, color: '#9fe3ff' });
      return true;
    },
    drawOver(w, g, ctx, s) {
      const id = w.def.fx, p = g.player, scale = s.range / fxRadius(id);
      if (w.charges > 0) {
        // 새로 생긴 직후 0.3초는 커지면서 나타난다
        const grow = Math.min(1, (w.time - (w.readyAt || 0)) / 0.3);
        drawFx(ctx, id, fxFrameAt(id, w.time), p.x, p.y, { scale: scale * (0.6 + 0.4 * grow), alpha: 0.85 });
      } else {
        w.readyAt = w.time + w.timer;
        // 깨진 직후 0.3초: 크게 퍼지며 사라진다
        const t = w.time - (w.brokeAt || -9);
        if (t < 0.3) drawFx(ctx, id, 2, p.x, p.y, { scale: scale * (1 + t * 2), alpha: 1 - t / 0.3 });
      }
    },
  },
});

// 바닥에 놓이는 지속 효과(모기향·끈끈이 공용). 좌표는 전부 월드 좌표.
//  onTick  = s.tick 초마다 한 번, onFrame = 매 프레임
function makeZone(g, fxId, x, y, s, scale, ringColor, onTick, onFrame) {
  return {
    x, y, time: 0, tick: 0, layer: 'under',
    update(dt) {
      this.time += dt;
      this.tick -= dt;
      if (onFrame) onFrame(g, x, y);
      if (this.tick <= 0) { this.tick = s.tick; onTick(g, x, y); }
      return this.time < s.duration;
    },
    draw(ctx) {
      const alpha = Math.min(1, (s.duration - this.time) / 0.5, this.time / 0.15);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ringColor;
      ctx.beginPath();
      ctx.arc(x, y, s.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawFxCentered(ctx, fxId, fxFrameAt(fxId, this.time), x, y, { scale, alpha });
    },
  };
}
