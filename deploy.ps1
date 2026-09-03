$IP  = "43.202.61.75"
$PEM = "C:\Users\SBS\Downloads\LightsailDefaultKey-ap-northeast-2.pem"
$USER = "ubuntu"
$JAR_PATH = "build\libs\jobda-0.0.1-SNAPSHOT.jar"

Write-Host "=== [1/3] JAR 빌드 중..." -ForegroundColor Cyan
.\gradlew.bat bootJar
if ($LASTEXITCODE -ne 0) {
    Write-Host "빌드 실패!" -ForegroundColor Red
    exit 1
}

Write-Host "=== [2/3] 서버에 JAR 업로드 중..." -ForegroundColor Cyan
scp -i $PEM -o StrictHostKeyChecking=no $JAR_PATH "${USER}@${IP}:~/jobda.jar"
if ($LASTEXITCODE -ne 0) {
    Write-Host "업로드 실패!" -ForegroundColor Red
    exit 1
}

Write-Host "=== [3/3] 서비스 재시작 중..." -ForegroundColor Cyan
ssh -i $PEM -o StrictHostKeyChecking=no "${USER}@${IP}" "sudo systemctl restart jobda && sudo systemctl status jobda --no-pager"

Write-Host ""
Write-Host "배포 완료! http://$IP:8080" -ForegroundColor Green
