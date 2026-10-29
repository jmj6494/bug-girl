# 벌레 퇴치녀 - 1구간(1~10스테이지) 에셋

모든 PNG는 배경이 투명하고, 모든 캐릭터는 **오른쪽을 보고 있다**. 왼쪽으로 가거나 공격할 때는 `ctx.scale(-1, 1)`로 좌우 반전해서 그린다(4방향 스프라이트 없음).

## 폴더 구조
```
sprites/z01/{캐릭터}/
    frames/{캐릭터}_{동작}_{번호}.png   프레임 한 장씩
    {캐릭터}_sheet.png                   스프라이트 시트 (행 = move, atk, hit, die / 열 = 프레임 번호)
    {캐릭터}.json                        프레임 크기, 피벗, 동작별 프레임 수·fps·반복 여부
sprites/z01/{캐릭터}_alt/                색 변형(강화 개체). json은 기본형과 같은 형식
effects/                                 이펙트 이미지 + effects.json(크기)
tiles/z01/                               256x256 바닥 타일 3종(상하좌우 이어 붙이기용)
preview.png                              전체 한눈에 보기
```

## 캐릭터
| 폴더 | 설명 | 몸 크기 기준(px) | 피벗(기준점) | 동작(프레임 수) |
| --- | --- | --- | --- | --- |
| player | 주인공 | 높이 64 | bottom-center (발 중앙) | move 3, atk 2, hit 1, die 3 |
| ant | 개미 (돌진형) | 폭 60 | bottom-center | move 3, atk 1, hit 1, die 3 |
| ladybug | 무당벌레 (탱커형) | 폭 60 | bottom-center | move 3, atk 1, hit 1, die 3 |
| fly | 파리 (원거리형) | 폭 60 | center (몸 중심) | move 3, atk 2, hit 1, die 3 |
| boss_bee | 벌레왕 (1구간 보스) | 날개 포함 폭 160 | center | move 3, atk 2, hit 1, die 3 |

- 프레임 파일 크기(frameSize)는 캐릭터마다 다르고 json에 적혀 있다. 한 캐릭터의 모든 프레임은 같은 크기이고 피벗 위치가 같게 정렬돼 있다.
- 파리는 발표 자료의 64px 대신 60px로 맞췄다(잡몹 크기 통일).
- `_alt` 색 변형은 기본형과 같은 프레임 크기·애니메이션을 그대로 쓰고, 이미지만 바꿔 끼우면 된다(8~10스테이지 강화 개체).
  ant_alt = 짙은 갈색, ladybug_alt = 보라색, fly_alt = 어두운 색.

## 이펙트 (effects/)
| 파일 | 용도 |
| --- | --- |
| slash_1~3.png | 플레이어 검 휘두르는 궤적 (점점 커지는 3프레임) |
| heart_1~2.png | 회복 아이템 (밝음/어두움 깜빡임) |
| hit_star.png | 모든 몹 공용 피격 반짝임 |
| mob_slash.png | 무당벌레 공격 궤적 |
| spit_projectile.png | 파리가 뱉는 투사체 (코드로 날려 보냄) |

피격 때 하얗게 번쩍이는 효과는 그림에 없다. 코드에서 몸 위에 흰색을 잠깐 덮어서 처리한다.
사망 연출의 서서히 사라지는 효과도 그림에 없다. 코드에서 투명도를 줄여서 처리한다.

## 알려진 사항
- 시트 행 순서는 항상 move → atk → hit → die 이고, json의 `row`가 그 위치다.
- 파리 `atk`는 2프레임(① 침을 모으는 자세 ② 뱉는 자세)이고, 투사체는 두 번째 프레임에서 `spit_projectile.png`를 발사하면 된다.
- 개미는 `atk` 1프레임이 돌진 자세이며 돌진 궤적 이펙트는 없다.
- 벌레왕의 `atk` 2프레임은 근접 돌진(① 웅크림 ② 앞으로 돌진)이다. 지팡이는 없앴다.
- 바닥 타일은 이음새를 보정했지만 `grass_clover`는 꽃·클로버가 희미하게 겹쳐 보일 수 있다.
- 주인공은 임시 디자인(갈색 단발머리, 주황 옷, 파란 바지, 파란 검)이다.
- 프레임 크기는 GPT 원본을 규격에 맞게 줄인 것이라 도트가 아주 약간 부드럽다. 캔버스에서 확대할 때는 `imageSmoothingEnabled = false`와 CSS `image-rendering: pixelated`를 쓴다.

---

## 무기 (weapons/) — 추가분

- `weapons/icons_128/*.png`, `weapons/icons_64/*.png` : 무기 13개 + 능력 강화 3개 아이콘 (카드용 128px / HUD용 64px). ids는 `weapons/icons.json`.
  - 무기: sword, fkiller(에프킬라), homemat, slipper, mosquito_coil, glue_trap, zapper(전기 모기채), smoke_bomb, magnifier, watergun, fan, vacuum, mosquito_net
  - 능력: stat_damage, stat_range, stat_speed
- `weapons/fx/frames/{fx_name}_{1..3}.png`, `weapons/fx/{fx_name}_sheet.png`(가로 3프레임), `weapons/fx/weapon_fx.json` : 무기 공격 효과 12종 3프레임. `anchor` 좌표를 플레이어/설치 위치에 맞춰 그리면 됨.
  - 오른쪽으로 나가는 효과(fx_spray, fx_watergun, fx_magnifier, fx_zapper)는 anchor가 왼쪽 끝 → 조준 방향으로 회전해서 사용.
  - 같은 무기를 또 골랐을 때의 강화는 그림 교체가 아니라 코드에서 크기·숫자를 키우는 방식.
  - fx_net 2번째 프레임은 1번째를 반투명하게 만든 깜빡임용.
- 칼 효과는 `effects/slash_1~3.png` 그대로 사용.
