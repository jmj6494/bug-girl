# 벌레 퇴치녀 - 2구간(11~20스테이지) 에셋  (테마: 거미 / 동굴)

규격은 1구간(stage1_assets/README.md)과 같다. 모든 PNG는 배경 투명, 캐릭터는 오른쪽을 본다(왼쪽은 좌우 반전). 시트 행 순서 move → atk → hit → die, json의 `row`가 위치. 피벗은 모두 `bottom-center`(발 중앙, 가로는 몸통 중심 기준).

## 폴더
```
sprites/z02/{캐릭터}/frames/{캐릭터}_{동작}_{번호}.png, {캐릭터}_sheet.png, {캐릭터}.json
sprites/z02/{캐릭터}_alt/    색 변형(강화 개체, 18~20스테이지용)
effects/                      거미줄 효과 3종 + zone2_fx.json
tiles/z02/                    256x256 동굴 바닥 타일 3종 (이어 붙이기용)
preview.png                   한눈에 보기
```

## 캐릭터
| 폴더 | 역할 | 몸 크기(px) | 프레임 |
| --- | --- | --- | --- |
| spider_jumper | 돌진형(점프 거미) | 폭 60 | move 3, atk 1(웅크린 돌진 자세), hit 1, die 3 |
| spider_tank | 탱커형(바위 타란툴라) | 폭 60 | move 3, atk 1(앞다리 내려치기), hit 1, die 3 |
| spider_ranger | 원거리형(독침 거미) | 폭 60 | move 3, atk 2(① 배를 들어 올림 ② 발사 자세), hit 1, die 3 |
| boss_spider | 보스 거대 거미(20스테이지) | 폭 160 | move 3, atk 2(① 배를 높이 듦 ② 웅크려 공격), hit 1, die 3 |

- `_alt` 색 변형: jumper_alt = 주황 줄무늬가 청록색, tank_alt = 갈색 털이 이끼색, ranger_alt = 남청색 몸이 보라색.
- 피격·사망 일부 프레임에는 노란 별/충격 표시가 그림에 포함돼 있다(hit_1, die_1).
- 사망 3프레임은 휘청임 → 뒤집어짐 → 쓰러짐. 사라지는 효과는 코드에서 투명도로 처리.

## 이펙트 (effects/, 0.5배로 줄인 3프레임)
| 이름 | 용도 | 기준점 |
| --- | --- | --- |
| fx_web_shot | 독침 거미가 쏘는 거미줄 덩어리 투사체(오른쪽으로 날아감, 꼬리는 왼쪽) | 중심 |
| fx_web_trap | 보스가 바닥에 까는 거미줄 함정(작게 펼쳐짐 → 완성). 밟으면 이동 속박 | 중심 |
| fx_web_beam | 보스가 뿜는 거미줄 줄기 | 왼쪽 끝(조준 방향으로 회전해서 사용) |
프레임 크기·기준점은 `effects/zone2_fx.json`.

## 바닥 타일
`tiles/z02/cave_a`(기본), `cave_puddle`(물웅덩이 얼룩), `cave_moss`(이끼). 평균 색을 같게 맞춰서 섞어 깔아도 경계가 거의 안 보인다.
