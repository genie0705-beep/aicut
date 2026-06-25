# Warp-Plus Proxy Startup Script
# Starts WARP-based SOCKS5 proxy for Telegram bypass (KT blocking workaround)

$warpPath = "$env:TEMP\warp-plus\warp-plus.exe"
$configPath = "$env:USERPROFILE\.openclaw\workspace\wgcf-profile.conf"
$logPath = "$env:TEMP\warp-plus.log"
$errLogPath = "$env:TEMP\warp-plus-err.log"

# Kill any existing instance
Get-Process -Name "warp-plus" -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 1

# Start with scan mode for best endpoint
Start-Process -NoNewWindow -FilePath $warpPath -ArgumentList "--wgconf `"$configPath`" -b 127.0.0.1:8086 --scan --test-url https://www.google.com -v" -RedirectStandardOutput $logPath -RedirectStandardError $errLogPath

# Wait for proxy to be ready
$timeout = 30
$ready = $false
for ($i = 0; $i -lt $timeout; $i++) {
    Start-Sleep -Seconds 1
    $listening = netstat -an 2>&1 | Select-String "127.0.0.1:8086.*LISTENING"
    if ($listening) {
        $ready = $true
        break
    }
}

if ($ready) {
    Write-Output "WARP Proxy ready on socks5://127.0.0.1:8086 (took ${i}s)"
} else {
    Write-Output "WARP Proxy failed to start within ${timeout}s"
    Get-Content $logPath -Tail 5
}
