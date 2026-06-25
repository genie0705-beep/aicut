#network setup.ps1
Set-NetConnectionProfile -NetworkCategory Private
Set-NetFirewallRule -DisplayGroup "네트워크 검색" -Enabled True
Set-NetFirewallRule -DisplayGroup "파일 및 프린터 공유" -Enabled True

# 공유 폴더 생성
$sharePath = "C:\Users\paul\.openclaw\workspace"
New-Item -Path $sharePath -ItemType Directory -Force
Remove-SmbShare -Name "AICUT_Share" -Force -ErrorAction SilentlyContinue
New-SmbShare -Name "AICUT_Share" -Path $sharePath -FullAccess Everyone

# 방화벽 SMB 허용
New-NetFirewallRule -DisplayName "SMB-In-TCP" -Direction Inbound -Protocol TCP -LocalPort 445 -Action Allow

Write-Output "========================================="
Write-Output "✅ 네트워크 설정 완료!"
Write-Output "PC IP: 172.30.1.99"
Write-Output "공유폴더: \\172.30.1.99\AICUT_Share"
Write-Output "========================================="
pause
