# assets 폴더의 모든 .json을 js/json_bundle.js 한 파일로 복사한다.
# index.html을 더블클릭(file://)으로 열 때는 브라우저가 json 읽기를 막기 때문에 이 복사본을 쓴다.
# json을 고치거나 그림(json 포함)을 바꿔 넣었으면 이 스크립트를 한 번 실행한다.
#   실행: 이 파일을 우클릭 → "PowerShell에서 실행"
#   또는: powershell -ExecutionPolicy Bypass -File tools\update_json_bundle.ps1

$game = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $game 'assets'
$out = Join-Path $game 'js\json_bundle.js'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$lines = @('// 자동 생성 파일 - 직접 고치지 말 것 (tools/update_json_bundle.ps1 로 다시 만든다)', 'window.ASSET_JSON_BUNDLE = {')
Get-ChildItem -Path $assets -Recurse -Filter *.json | Sort-Object FullName | ForEach-Object {
  $rel = $_.FullName.Substring($game.Length + 1).Replace('\', '/')
  $text = [System.IO.File]::ReadAllText($_.FullName, $utf8).Trim()
  $lines += "  `"$rel`": $text,"
}
$lines += '};'
[System.IO.File]::WriteAllText($out, ($lines -join "`n") + "`n", $utf8)
Write-Host "완료: $out"
