// =============================================================
//  벌레 퇴치녀 — 게임 데이터 (밸런스·스테이지·구간·무기)
//  수치를 바꾸고 싶으면 이 파일만 고치면 된다.
//  프레임 크기·피벗·fps는 여기 없다. 각 에셋의 json에서 읽는다.
// =============================================================

const GAME_DATA = {
  // 캔버스 내부 해상도(화면에는 창 크기에 맞춰 늘려서 보여 준다)
  screen: { width: 1280, height: 720 },

  rules: {
    stagesPerZone: 10,     // 구간 = ceil(stage / 10)
    buffEvery: 5,          // 5스테이지마다 버프 선택
    stageIntroTime: 1.4,   // "STAGE n" 글자 표시 시간(초)
    stageClearTime: 1.2,   // "CLEAR" 표시 후 다음으로 넘어가기까지(초)
    spawnInterval: 0.55,   // 웨이브 안에서 몹이 한 마리씩 나오는 간격(초)
    spawnMargin: 60,       // 화면 밖 몇 px에서 나타날지
  },

  // ---------------- 맵(월드) 크기 ----------------
  // 화면(캔버스)은 screen 크기 그대로이고, 맵은 스테이지마다 커진다. 카메라가 플레이어를 따라간다.
  // 가로·세로 배율 = 1 + (maxScale - 1) × ((stage - 1) / (lastStage - 1)) ^ curve
  world: {
    baseSize: [1280, 720],     // 1스테이지 맵 크기(= 화면 크기)
    maxScale: 4.5,             // lastStage에서 가로·세로 배율 (넓이는 4.5² ≈ 20배)
    lastStage: 100,
    curve: 1,                  // 1 = 일정하게 커짐, 1보다 크면 초반엔 천천히·후반에 빠르게
    bossSameAsPrevious: true,  // 보스 스테이지(10, 20…)는 직전 스테이지와 같은 크기
    snap: 32,                  // 크기를 32px 단위로 맞춤
    border: 48,                // 맵 가장자리 어두운 테두리 두께(이 안쪽으로는 못 들어감)
    overrides: {},             // 특정 스테이지만 직접 지정: { 15: [2400, 1350] }
  },

  // 맵이 넓어진 만큼 몹 수·강한 몹 비율을 늘린다
  scaling: {
    // 몹 수 배율 = (그 스테이지 맵 넓이 / 1스테이지 맵 넓이) ^ countExponent
    //   1.0 = 넓이에 정비례(밀도 완전히 동일), 0.8 = 조금 덜 늘림(몹이 플레이어 근처에서 나오므로)
    //   보스는 늘어나지 않는다
    countExponent: 0.8,
    // 일반 스테이지에서 몹이 _alt(강화 개체)로 나올 확률 = (stage - 1) × perStage, 최대 max
    //   stages에 alt: true 가 있는 스테이지는 전부 강화 개체
    strongRatio: { perStage: 0.012, max: 0.6 },
    spawnIntervalMin: 0.15,    // 몹 수가 늘면 나오는 간격도 줄인다(이보다 짧아지지는 않음)
    maxAlive: 60,              // 동시에 살아 있는 몹 최대 수(성능·난이도 안전장치)
    leashDistance: 1100,       // 플레이어와 이보다 멀어진 몹은 화면 근처로 다시 데려온다
  },

  // ---------------- 플레이어 ----------------
  player: {
    // 그림 교체: 이 폴더의 player.json / player_sheet.png 만 바꾸면 된다
    sprite: 'assets/sprites/z01/player/player.json',
    maxHp: 5,               // 하트 개수
    speed: 200,             // px/초
    invincibleTime: 1.0,    // 맞은 뒤 무적 시간(초)
    hitboxScale: 0.32,      // 충돌 반지름 = json bodySizePx × 이 값
    startWeapons: ['sword'],
  },

  // ---------------- 하트 드랍 ----------------
  heartDrop: {
    expectedPerStage: 1.5,  // 확률 = 1.5 / 그 스테이지 몹 수
    heal: 1,
    lifetime: 12,           // 바닥에 남아 있는 시간(초)
    pickupRadius: 34,
    drawScale: 1.5,
  },

  // ---------------- 몹 능력치 ----------------
  // ai 종류: charger(돌진), melee(근접 공격), ranged(원거리), boss_bee·boss_spider(보스)
  //   melee는 attackFx(공격 이펙트 이름)를, ranged는 shotFx(투사체 fx id)를 지정할 수 있다(없으면 mob_slash, spit_projectile)
  // 새 몹은 여기 능력치를 넣고, zones의 mobs에 그림 폴더를 연결하면 된다.
  mobs: {
    ant: {
      name: '개미', ai: 'charger',
      hp: 4, speed: 75, contactDamage: 1, hitboxScale: 0.38,
      chargeRange: 210, chargeWindup: 0.35, chargeSpeed: 320, chargeTime: 0.45, chargeCooldown: 2.6,
    },
    ladybug: {
      name: '무당벌레', ai: 'melee',
      hp: 12, speed: 45, contactDamage: 1, hitboxScale: 0.42, knockbackResist: 0.6,
      attackRange: 62, attackWindup: 0.25, attackCooldown: 1.6, attackDamage: 1,
    },
    fly: {
      name: '파리', ai: 'ranged',
      hp: 4, speed: 95, contactDamage: 1, hitboxScale: 0.32,
      keepDistance: 210, shotCooldown: 2.6, shotSpeed: 230, shotDamage: 1,
    },
    boss_bee: {
      name: '벌레왕', ai: 'boss_bee', isBoss: true,
      hp: 180, speed: 70, contactDamage: 1, hitboxScale: 0.3, knockbackResist: 0.95,
      dashCooldown: 3.4, dashWindup: 0.7, dashSpeed: 500, dashTime: 0.55,
      summonCooldown: 9, summonMob: 'ant', summonCount: 3,
    },

    // ----- 2구간(동굴) : 1구간보다 체력 약 1.7배, 속도 약 1.1배 -----
    spider_jumper: {
      name: '점프 거미', ai: 'charger',
      hp: 7, speed: 85, contactDamage: 1, hitboxScale: 0.38,
      chargeRange: 230, chargeWindup: 0.3, chargeSpeed: 360, chargeTime: 0.45, chargeCooldown: 2.3,
    },
    spider_tank: {
      name: '바위 타란툴라', ai: 'melee',
      hp: 20, speed: 50, contactDamage: 1, hitboxScale: 0.42, knockbackResist: 0.7,
      attackRange: 64, attackWindup: 0.3, attackCooldown: 1.5, attackDamage: 1,
      attackFx: 'hit_star', attackFxScale: 2.4,   // 앞다리로 내려찍는 충격(그림 없음 → 공용 별 이펙트를 크게)
    },
    spider_ranger: {
      name: '독침 거미', ai: 'ranged',
      hp: 7, speed: 100, contactDamage: 1, hitboxScale: 0.32,
      keepDistance: 230, shotCooldown: 2.2, shotSpeed: 260, shotDamage: 1,
      shotFx: 'fx_web_shot', shotScale: 0.38, shotRadius: 11,   // 투사체 그림(zone2_fx.json)과 크기·충돌 반지름
    },
    boss_spider: {
      name: '거대 거미', ai: 'boss_spider', isBoss: true,
      hp: 320, speed: 65, contactDamage: 1, hitboxScale: 0.3, knockbackResist: 0.95,
      keepDistance: 220,                 // 이 거리 안에서는 다가오지 않고 옆으로 돈다
      // 거미줄 함정: 배를 들었다가(trapWindup) 플레이어 발밑과 주변에 trapCount개 설치.
      //   trapArm초 뒤부터 밟으면 rootTime초 동안 이동 불가(속박). trapLife초 뒤 사라짐
      trapCooldown: 6, trapWindup: 0.5, trapCount: 3, trapSpread: 140, trapRadius: 45,
      trapArm: 0.5, trapLife: 9, rootTime: 1.1,
      // 거미줄 줄기: 웅크려 조준(beamWindup, 앞 60%는 플레이어를 따라 조준하고 나머지는 고정) 후 발사.
      //   맞으면 beamDamage 피해 + beamSlowTime초 동안 이동 속도 ×beamSlow
      beamCooldown: 4, beamWindup: 0.7, beamRange: 440, beamWidth: 36, beamDamage: 1,
      beamSlow: 0.45, beamSlowTime: 2.5,
      summonCooldown: 11, summonMob: 'spider_jumper', summonCount: 2,
    },
  },

  // _alt(색 변형 강화 개체)일 때 곱하는 값
  altMultiplier: { hp: 1.6, speed: 1.15 },

  // ---------------- 구간(zone) ----------------
  // 구간을 추가할 때: 아래 배열에 항목을 하나 더 넣고
  // 그림(sprites/zNN, tiles/zNN)과 몹 능력치(mobs)만 추가하면 된다. 구간 전용 이펙트는 fx에 json 경로.
  zones: [
    {
      id: 'z01',
      name: '1구간 · 풀밭',
      // 바닥 타일(weight = 나올 비율)
      tiles: [
        { file: 'assets/tiles/z01/grass_a.png', weight: 45 },
        { file: 'assets/tiles/z01/grass_b.png', weight: 45 },
        { file: 'assets/tiles/z01/grass_clover.png', weight: 10 },
      ],
      // 몹 id → 그림 json (alt = 강화 개체 색 변형, 없으면 기본 그림 사용)
      mobs: {
        ant:      { sprite: 'assets/sprites/z01/ant/ant.json',           alt: 'assets/sprites/z01/ant_alt/ant_alt.json' },
        ladybug:  { sprite: 'assets/sprites/z01/ladybug/ladybug.json',   alt: 'assets/sprites/z01/ladybug_alt/ladybug_alt.json' },
        fly:      { sprite: 'assets/sprites/z01/fly/fly.json',           alt: 'assets/sprites/z01/fly_alt/fly_alt.json' },
        boss_bee: { sprite: 'assets/sprites/z01/boss_bee/boss_bee.json' },
      },
      // 스테이지 1~10. waves = 순서대로 나오는 웨이브(웨이브를 다 잡으면 다음 웨이브)
      // alt: true 이면 그 스테이지 몹은 _alt 그림 + altMultiplier 능력치
      stages: [
        /* 1 */ { waves: [{ ant: 6 }] },
        /* 2 */ { waves: [{ ant: 6 }, { ant: 4, ladybug: 2 }] },
        /* 3 */ { waves: [{ ant: 6, ladybug: 2 }, { fly: 3 }] },
        /* 4 */ { waves: [{ ant: 8 }, { ladybug: 3, fly: 3 }] },
        /* 5 */ { waves: [{ ant: 8, fly: 2 }, { ladybug: 4, fly: 4 }] },
        /* 6 */ { waves: [{ ant: 10, ladybug: 2 }, { fly: 6 }] },
        /* 7 */ { waves: [{ ant: 10, ladybug: 4 }, { ant: 6, fly: 6 }] },
        /* 8 */ { alt: true, waves: [{ ant: 8, ladybug: 2 }, { ladybug: 3, fly: 4 }] },
        /* 9 */ { alt: true, waves: [{ ant: 10, fly: 4 }, { ant: 6, ladybug: 4, fly: 4 }] },
        /* 10 보스 */ { alt: true, boss: true, waves: [{ boss_bee: 1, ant: 4 }] },
      ],
    },
    {
      id: 'z02',
      name: '2구간 · 동굴',
      tiles: [
        { file: 'assets/tiles/z02/cave_a.png', weight: 50 },
        { file: 'assets/tiles/z02/cave_puddle.png', weight: 25 },
        { file: 'assets/tiles/z02/cave_moss.png', weight: 25 },
      ],
      // 이 구간에서 쓰는 이펙트 json(형식은 weapon_fx.json과 같음)
      fx: ['assets/effects/zone2_fx.json'],
      mobs: {
        spider_jumper: { sprite: 'assets/sprites/z02/spider_jumper/spider_jumper.json', alt: 'assets/sprites/z02/spider_jumper_alt/spider_jumper_alt.json' },
        spider_tank:   { sprite: 'assets/sprites/z02/spider_tank/spider_tank.json',     alt: 'assets/sprites/z02/spider_tank_alt/spider_tank_alt.json' },
        spider_ranger: { sprite: 'assets/sprites/z02/spider_ranger/spider_ranger.json', alt: 'assets/sprites/z02/spider_ranger_alt/spider_ranger_alt.json' },
        boss_spider:   { sprite: 'assets/sprites/z02/boss_spider/boss_spider.json' },
      },
      // 스테이지 11~20. 1구간 같은 자리 스테이지보다 몹 수 약 1.3배
      stages: [
        /* 11 */ { waves: [{ spider_jumper: 8 }] },
        /* 12 */ { waves: [{ spider_jumper: 8 }, { spider_jumper: 5, spider_tank: 3 }] },
        /* 13 */ { waves: [{ spider_jumper: 8, spider_tank: 3 }, { spider_ranger: 4 }] },
        /* 14 */ { waves: [{ spider_jumper: 10 }, { spider_tank: 4, spider_ranger: 4 }] },
        /* 15 */ { waves: [{ spider_jumper: 10, spider_ranger: 3 }, { spider_tank: 5, spider_ranger: 5 }] },
        /* 16 */ { waves: [{ spider_jumper: 12, spider_tank: 3 }, { spider_ranger: 7 }] },
        /* 17 */ { waves: [{ spider_jumper: 12, spider_tank: 5 }, { spider_jumper: 8, spider_ranger: 7 }] },
        /* 18 */ { alt: true, waves: [{ spider_jumper: 10, spider_tank: 3 }, { spider_tank: 4, spider_ranger: 5 }] },
        /* 19 */ { alt: true, waves: [{ spider_jumper: 12, spider_ranger: 5 }, { spider_jumper: 8, spider_tank: 5, spider_ranger: 5 }] },
        /* 20 보스 */ { alt: true, boss: true, waves: [{ boss_spider: 1, spider_jumper: 5 }] },
      ],
    },
  ],

  // ---------------- 무기 ----------------
  // kind = weapons.js 의 WEAPON_KINDS 에 있는 동작 이름
  // enabled: false 로 바꾸면 버프 카드에 나오지 않는다(무기를 잠시 빼고 싶을 때).
  // upgrade = 같은 무기를 또 골랐을 때 오르는 양
  //   damage: +값, range: +비율(0.12 = 12%), speed: 쿨타임 감소 비율
  weapons: {
    sword: {
      name: '칼', kind: 'sword', enabled: true,
      desc: '가까운 적을 향해 휘두른다',
      base: { damage: 2, range: 85, cooldown: 0.7, arc: 130 },
      upgrade: { damage: 1, range: 0.12, speed: 0.1 },
    },
    fkiller: {
      name: '에프킬라', kind: 'spray', fx: 'fx_spray', enabled: true,
      desc: '조준 방향으로 부채꼴 분사',
      base: { damage: 3, range: 190, cooldown: 1.8, arc: 50 },
      upgrade: { damage: 1, range: 0.12, speed: 0.1 },
    },
    homemat: {
      name: '홈매트', kind: 'aura', fx: 'fx_homemat', enabled: true,
      desc: '내 주변에 계속 독 피해',
      base: { damage: 1, range: 95, cooldown: 0.9 },   // cooldown = 피해 주기
      upgrade: { damage: 1, range: 0.15, speed: 0.12 },
    },
    slipper: {
      name: '슬리퍼', kind: 'boomerang', fx: 'fx_slipper', enabled: true,
      desc: '던지면 부메랑처럼 돌아온다',
      base: { damage: 3, range: 280, cooldown: 2.2, projectileSpeed: 430, size: 0.45 },
      upgrade: { damage: 1, range: 0.12, speed: 0.1 },
    },

    mosquito_coil: {
      name: '모기향', kind: 'placed', fx: 'fx_coil', enabled: true,
      desc: '발밑에 설치, 주변에 지속 피해',
      base: { damage: 1, range: 90, cooldown: 4, duration: 6, tick: 0.5, size: 0.55 },
      upgrade: { damage: 1, range: 0.15, speed: 0.12 },
    },
    glue_trap: {
      name: '끈끈이 트랩', kind: 'trap', fx: 'fx_glue', enabled: true,
      desc: '적 쪽에 던져 설치, 밟은 적 둔화',
      base: { damage: 1, range: 70, cooldown: 4.5, duration: 7, tick: 1, slow: 0.35, throwRange: 260 },
      upgrade: { damage: 1, range: 0.15, speed: 0.12 },
    },

    // ----- 물총·돋보기·전기 모기채·연막 훈증탄·선풍기·청소기·모기장 -----
    watergun: {
      name: '물총', kind: 'beam', fx: 'fx_watergun', enabled: true,
      desc: '멀리 관통하는 물줄기, 맞은 적을 밀어냄',
      // width = 맞는 폭(px), hits = 한 번 쏠 때 맞히는 횟수, tick = 그 간격(초)
      base: { damage: 3, range: 300, cooldown: 1.6, width: 30, hits: 1, tick: 0, knockback: 1.6 },
      upgrade: { damage: 1, range: 0.12, speed: 0.1 },
    },
    magnifier: {
      name: '돋보기', kind: 'beam', fx: 'fx_magnifier', enabled: true,
      desc: '가늘고 긴 레이저로 여러 번 지진다',
      base: { damage: 1, range: 340, cooldown: 2.4, width: 18, hits: 5, tick: 0.1, knockback: 0 },
      upgrade: { damage: 1, range: 0.12, speed: 0.1 },
    },
    zapper: {
      name: '전기 모기채', kind: 'chain', fx: 'fx_zapper', enabled: true,
      desc: '가까운 적에게 번개, 근처 적으로 튄다',
      // chains = 첫 대상 뒤로 더 튀는 횟수, chainRange = 튈 수 있는 거리(범위 강화 시 함께 늘어남)
      base: { damage: 3, range: 200, cooldown: 1.8, chains: 3, chainRange: 180 },
      upgrade: { damage: 1, range: 0.12, speed: 0.1 },
    },
    smoke_bomb: {
      name: '연막 훈증탄', kind: 'bomb', fx: 'fx_smoke', enabled: true,
      desc: '던지면 터져서 넓은 연기가 퍼진다',
      // range = 연기 반지름, throwRange = 던지는 거리, duration 동안 tick마다 damage
      base: { damage: 2, range: 110, cooldown: 3.5, throwRange: 300, flightTime: 0.5, duration: 3, tick: 0.75 },
      upgrade: { damage: 1, range: 0.15, speed: 0.1 },
    },
    fan: {
      name: '선풍기', kind: 'push', fx: 'fx_fan', enabled: true,
      desc: '주변 적을 바람으로 밀어낸다',
      // knockback = 밀어내는 세기(1 = 일반 피격 넉백), showTime = 바람 그림 표시 시간
      base: { damage: 1, range: 130, cooldown: 2.2, knockback: 3, showTime: 0.6 },
      upgrade: { damage: 1, range: 0.12, speed: 0.12 },
    },
    vacuum: {
      name: '청소기', kind: 'pull', fx: 'fx_vacuum', enabled: true,
      desc: '주변 적을 끌어당겨 한데 모은다',
      // duration 동안 pullSpeed(px/초)로 끌어당기고 tick마다 damage
      base: { damage: 1, range: 220, cooldown: 4.5, duration: 1.6, tick: 0.4, pullSpeed: 160 },
      upgrade: { damage: 1, range: 0.12, speed: 0.12 },
    },
    mosquito_net: {
      name: '모기장', kind: 'shield', fx: 'fx_net', enabled: true,
      desc: '몸을 감싸는 방어막, 피격 1회를 막는다',
      // range = 그물 반지름, cooldown = 깨진 뒤 다시 생기는 시간, charges = 막는 횟수
      // 그물에 닿은 적은 tick마다 damage, 막을 때 주변 적을 knockback으로 밀어냄
      base: { damage: 1, range: 55, cooldown: 7, tick: 0.6, charges: 1, blockInvuln: 0.8, knockback: 2.5 },
      upgrade: { damage: 1, range: 0.12, speed: 0.12 },
    },
  },

  // 강화 카드에 표시할 능력 이름/아이콘
  upgradeStats: {
    damage: { label: '데미지', icon: 'stat_damage' },
    range:  { label: '범위',   icon: 'stat_range' },
    speed:  { label: '공격속도', icon: 'stat_speed' },
  },

  // 공용 에셋 경로
  paths: {
    effectsJson: 'assets/effects/effects.json',
    effectsDir: 'assets/effects/',
    weaponFxJson: 'assets/weapons/fx/weapon_fx.json',
    weaponFxDir: 'assets/weapons/fx/',
    iconsJson: 'assets/weapons/icons.json',
    icons128: 'assets/weapons/icons_128/',
    icons64: 'assets/weapons/icons_64/',
  },
};
