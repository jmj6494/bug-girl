// =============================================================
//  스프라이트 애니메이션 / 그리기
//  프레임 크기·피벗·fps·반복 여부는 전부 json(Assets.sprites)에서 온다.
// =============================================================

// 한 캐릭터의 현재 동작과 경과 시간을 들고 있는 작은 객체
class Animator {
  constructor(sprite) {
    this.sprite = sprite;
    this.name = 'move';
    this.time = 0;
  }
  play(name, restart = false) {
    if (!this.sprite.meta.anims[name]) return;
    if (this.name !== name || restart) { this.name = name; this.time = 0; }
  }
  update(dt) { this.time += dt; }
  get anim() { return this.sprite.meta.anims[this.name]; }
  // 반복하지 않는 동작이 끝났는지
  get finished() {
    const a = this.anim;
    return !a.loop && this.time >= a.frames / a.fps;
  }
  get frame() {
    const a = this.anim;
    // hold = 특정 프레임에 멈춰 두기(보스 웅크림 → 돌진처럼 길이가 로직에 따라 달라질 때)
    if (this.hold != null) return Math.min(this.hold, a.frames - 1);
    const f = Math.floor(this.time * a.fps);
    return a.loop ? f % a.frames : Math.min(f, a.frames - 1);
  }
}

// 피격 흰색 번쩍임용 임시 캔버스 하나를 돌려 쓴다
const flashCanvas = document.createElement('canvas');
const flashCtx = flashCanvas.getContext('2d');

// (x, y) = 피벗이 놓일 월드 좌표. flip = 왼쪽을 볼 때 true
function drawSprite(ctx, anim, x, y, opt = {}) {
  const s = anim.sprite, a = anim.anim;
  const sx = anim.frame * s.frameW, sy = a.row * s.frameH;
  const scale = opt.scale || 1;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (opt.flip) ctx.scale(-1, 1);
  if (scale !== 1) ctx.scale(scale, scale);
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;

  if (opt.flash > 0) {
    // 프레임을 임시 캔버스에 그리고, 그 모양 위에만 흰색을 덮는다
    if (flashCanvas.width !== s.frameW || flashCanvas.height !== s.frameH) {
      flashCanvas.width = s.frameW; flashCanvas.height = s.frameH;
    }
    flashCtx.imageSmoothingEnabled = false;
    flashCtx.globalCompositeOperation = 'source-over';
    flashCtx.clearRect(0, 0, s.frameW, s.frameH);
    flashCtx.drawImage(s.sheet, sx, sy, s.frameW, s.frameH, 0, 0, s.frameW, s.frameH);
    flashCtx.globalCompositeOperation = 'source-atop';
    flashCtx.fillStyle = `rgba(255,255,255,${Math.min(1, opt.flash)})`;
    flashCtx.fillRect(0, 0, s.frameW, s.frameH);
    ctx.drawImage(flashCanvas, -s.pivotX, -s.pivotY);
  } else {
    ctx.drawImage(s.sheet, sx, sy, s.frameW, s.frameH, -s.pivotX, -s.pivotY, s.frameW, s.frameH);
  }
  ctx.restore();
}

// 피벗 좌표 → 몸 중심 좌표까지의 차이 (충돌·조준은 몸 중심 기준)
function bodyOffset(sprite) {
  return { x: sprite.frameW / 2 - sprite.pivotX, y: sprite.frameH / 2 - sprite.pivotY };
}

// ---------------- 무기 fx (weapon_fx.json) ----------------
function fxDuration(id) { const m = Assets.fx[id].meta; return m.frames / m.fps; }
function fxFrameAt(id, time) {
  const m = Assets.fx[id].meta;
  const f = Math.floor(time * m.fps);
  return m.loop ? f % m.frames : Math.min(f, m.frames - 1);
}
// anchor가 (x, y)에 오도록, angle만큼 회전·scale배로 그린다
function drawFx(ctx, id, frame, x, y, opt = {}) {
  const { meta, sheet } = Assets.fx[id];
  const [w, h] = meta.frameSize;
  const [ax, ay] = meta.anchor;
  ctx.save();
  ctx.translate(x, y);
  if (opt.angle) ctx.rotate(opt.angle);
  if (opt.flipY) ctx.scale(1, -1);
  // scaleX/scaleY를 따로 주면 가로·세로를 다르게 늘린다(번개를 두 점 사이 길이에 맞출 때)
  const sc = opt.scale || 1;
  ctx.scale(opt.scaleX || sc, opt.scaleY || sc);
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.drawImage(sheet, frame * w, 0, w, h, -ax, -ay, w, h);
  ctx.restore();
}
// fx 그림의 가운데가 (x, y)에 오도록 그린다(바닥 설치형: anchor가 그림 아래쪽이라 그대로 두면 위로 떠 보임)
function drawFxCentered(ctx, id, frame, x, y, opt = {}) {
  const m = Assets.fx[id].meta, sc = opt.scale || 1;
  drawFx(ctx, id, frame, x + (m.anchor[0] - m.frameSize[0] / 2) * sc, y + (m.anchor[1] - m.frameSize[1] / 2) * sc, opt);
}
// fx 그림에서 anchor부터 오른쪽 끝까지 길이(방향형 fx를 사거리에 맞출 때 사용)
function fxLength(id) { const m = Assets.fx[id].meta; return m.frameSize[0] - m.anchor[0]; }
// fx 그림의 반지름(원형 fx를 범위에 맞출 때 사용)
function fxRadius(id) { const m = Assets.fx[id].meta; return Math.min(m.frameSize[0], m.frameSize[1]) / 2; }

// 공용 이펙트 이미지(effects/*.png)를 가운데 기준으로 그린다
function drawEffect(ctx, name, x, y, opt = {}) {
  const img = effectImage(name);
  ctx.save();
  ctx.translate(x, y);
  if (opt.angle) ctx.rotate(opt.angle);
  if (opt.flipY) ctx.scale(1, -1);
  const sc = opt.scale || 1;
  ctx.scale(sc, sc);
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}
