#!/bin/bash

# Docker 배포 스크립트
echo "🚀 PADOC Frontend Docker 배포 시작..."

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. 기본값을 사용합니다."
    echo "NEXT_PUBLIC_BE_API_URL=${NEXT_PUBLIC_BE_API_URL}" > .env
fi

# 기존 컨테이너와 이미지 정리
echo "🧹 기존 컨테이너와 이미지 정리 중..."
docker-compose down
docker system prune -f

# Docker 이미지 빌드
echo "🔨 Docker 이미지 빌드 중..."
docker-compose build --no-cache

# 컨테이너 실행
echo "🚀 컨테이너 실행 중..."
docker-compose up -d

# 상태 확인
echo "📊 배포 상태 확인 중..."
sleep 5
docker-compose ps

echo "✅ 배포 완료!"
echo "🌐 애플리케이션 접속: http://localhost:3000"
echo "📝 로그 확인: docker-compose logs -f"
