$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$profile = "C:\Users\paul\AppData\Local\Temp\chrome_normal_profile"
if (!(Test-Path $profile)) { New-Item -ItemType Directory -Force -Path $profile | Out-Null }
Start-Process -FilePath $chrome -ArgumentList "--remote-debugging-port=9224","--user-data-dir=$profile","--no-first-run","--no-default-browser-check","--window-size=1400,900","about:blank"
Start-Sleep -Seconds 5
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:9224/json/version" -UseBasicParsing -TimeoutSec 5
  Write-Output "CDP_READY"
} catch {
  Write-Output "CDP_NOT_READY"
}
