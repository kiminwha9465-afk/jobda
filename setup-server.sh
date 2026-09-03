#!/bin/bash
# Lightsail 서버 최초 1회 실행

set -e

echo "=== Java 21 설치 중..."
sudo apt update
sudo apt install -y openjdk-21-jre-headless

echo "=== systemd 서비스 등록 중..."
sudo tee /etc/systemd/system/jobda.service > /dev/null <<EOF
[Unit]
Description=Jobda Spring Boot App
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/java -jar /home/ubuntu/jobda.jar
SuccessExitStatus=143
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable jobda

echo "=== 완료! 이제 deploy.ps1 을 실행하세요."
