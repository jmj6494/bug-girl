// =============================================================
//  에셋 로더 — json과 이미지를 읽어 Assets 객체에 모아 둔다.
//
//  json 읽기:
//   - http(s)로 열면(Live Server, GitHub Pages) fetch로 json을 직접 읽는다.
//   - index.html을 더블클릭(file://)으로 열면 브라우저가 fetch를 막기 때문에
//     js/json_bundle.js(= json 파일들을 그대로 복사해 둔 것)를 대신 쓴다.
//     json을 고쳤다면 tools/update_json_bundle.ps1 을 한 번 실행한다.
//   - 그래도 시트 이미지 크기가 json과 다르면 이미지 크기 기준으로 프레임 크기를 맞춘다
//     (플레이어 그림만 바꿔 넣고 번들을 안 갱신해도 깨지지 않게).
// =============================================================

const Assets = {
  json: {},      // 경로 → json 객체
  images: {},    // 경로 → Image
  sprites: {},   // json 경로 → { meta, sheet, frameW, frameH, pivotX, pivotY }
  fx: {},        // fx id → { meta, sheet }
  effectSizes: {},
};

function loadJSON(path) {
  const fromBundle = () => {
    const b = window.ASSET_JSON_BUNDLE && window.ASSET_JSON_BUNDLE[path];
    if (!b) throw new Error('json을 찾을 수 없음: ' + path + ' (tools/update_json_bundle.ps1 실행 필요)');
    return JSON.parse(JSON.stringify(b));
  };
  if (location.protocol === 'file:') return Promise.resolve(fromBundle());
  return fetch(path)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .catch(() => fromBundle())
    .then(j => (Assets.json[path] = j));
}

function loadImage(path) {
  if (Assets.images[path]) return Promise.resolve(Assets.images[path]);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { Assets.images[path] = img; resolve(img); };
    img.onerror = () => reject(new Error('이미지를 불러오지 못함: ' + path));
    img.src = path;
  });
}

function dirOf(path) { return path.slice(0, path.lastIndexOf('/') + 1); }

// 피벗 문자열("bottom-center", "center" 등) → 프레임 안의 px 좌표
// 그림의 몸이 프레임 가운데에 있지 않으면 json에 [x, y] 숫자로 직접 적어도 된다 (예: "pivot": [49, 76])
function parsePivot(pivot, w, h) {
  if (Array.isArray(pivot)) return { x: pivot[0], y: pivot[1] };
  const p = String(pivot || 'center');
  let x = w / 2, y = h / 2;
  if (p.includes('bottom')) y = h;
  if (p.includes('top')) y = 0;
  if (p.includes('left')) x = 0;
  if (p.includes('right')) x = w;
  return { x, y };
}

// 캐릭터 스프라이트 json + 시트 이미지
async function loadSprite(jsonPath) {
  if (Assets.sprites[jsonPath]) return Assets.sprites[jsonPath];
  const meta = await loadJSON(jsonPath);
  const sheet = await loadImage(dirOf(jsonPath) + meta.sheet.file);
  let [frameW, frameH] = meta.frameSize;
  const realW = sheet.width / meta.sheet.columns, realH = sheet.height / meta.sheet.rows;
  if (realW !== frameW || realH !== frameH) {
    console.warn(`${jsonPath}: json frameSize(${frameW}x${frameH})와 시트 크기가 달라 ${realW}x${realH}로 맞춤`);
    frameW = realW; frameH = realH;
  }
  const pv = parsePivot(meta.pivot, frameW, frameH);
  const s = { meta, sheet, frameW, frameH, pivotX: pv.x, pivotY: pv.y, bodySize: meta.bodySizePx || frameW };
  Assets.sprites[jsonPath] = s;
  return s;
}

// fx json(weapon_fx.json, zone2_fx.json 형식)을 읽어 Assets.fx[id]에 넣는다. 시트 파일은 json과 같은 폴더
function loadFxJson(path) {
  return loadJSON(path).then(j => Promise.all(Object.entries(j.effects).map(([id, meta]) =>
    loadImage(dirOf(path) + meta.sheet.file).then(sheet => { Assets.fx[id] = { meta, sheet }; }))));
}

async function loadAllAssets(onProgress) {
  const D = GAME_DATA, P = D.paths;
  const jobs = [];
  const track = p => { jobs.push(p); return p; };

  // 플레이어
  track(loadSprite(D.player.sprite));

  // 구간별 몹·타일
  for (const zone of D.zones) {
    for (const id in zone.mobs) {
      track(loadSprite(zone.mobs[id].sprite));
      if (zone.mobs[id].alt) track(loadSprite(zone.mobs[id].alt));
    }
    for (const t of zone.tiles) track(loadImage(t.file));
    for (const f of zone.fx || []) track(loadFxJson(f));
  }

  // 공용 이펙트
  track(loadJSON(P.effectsJson).then(j => {
    Assets.effectSizes = j.sizes;
    return Promise.all(Object.keys(j.sizes).map(n => loadImage(P.effectsDir + n + '.png')));
  }));

  // 무기 fx
  track(loadFxJson(P.weaponFxJson));

  // 무기 아이콘
  track(loadJSON(P.iconsJson).then(j => Promise.all([...j.weapons, ...j.stats].flatMap(id => [
    loadImage(P.icons128 + id + '.png'), loadImage(P.icons64 + id + '.png')]))));

  let done = 0;
  jobs.forEach(p => p.then(() => onProgress && onProgress(++done / jobs.length)));
  await Promise.all(jobs);
}

function effectImage(name) { return Assets.images[GAME_DATA.paths.effectsDir + name + '.png']; }
function iconPath(id, size) { return (size === 64 ? GAME_DATA.paths.icons64 : GAME_DATA.paths.icons128) + id + '.png'; }
