param(
    [string]$Title = "ClaudeAutoRun"
)

Start-Sleep -Milliseconds 300

$sh = New-Object -ComObject WScript.Shell
$activated = $sh.AppActivate($Title)

if ($activated) {
    Start-Sleep -Milliseconds 400
    $sh.SendKeys('{DOWN}')
    Start-Sleep -Milliseconds 200
    $sh.SendKeys('~')
    Write-Host "[autoaccept.ps1] 자동입력 완료"
} else {
    Write-Host "[autoaccept.ps1] '$Title' 창을 찾지 못했습니다. 창 제목을 확인하세요."
}
