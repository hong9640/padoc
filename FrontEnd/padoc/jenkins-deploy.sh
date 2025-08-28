#!/bin/bash

# Jenkins 배포 스크립트
set -e  # 에러 발생 시 스크립트 중단

echo "🚀 PADOC Frontend Jenkins 배포 시작..."

# 1. 환경 설정
echo "📋 환경 설정 중..."
if [ ! -f .env ]; then
    echo "NEXT_PUBLIC_BE_API_URL=http://i13a106.p.ssafy.io:8000" > .env
    echo "✅ .env 파일 생성 완료"
fi

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm ci

# 3. 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리 중..."
docker stop padoc-container 2>/dev/null || true
docker rm padoc-container 2>/dev/null || true

# 4. Docker 시스템 정리
echo "🗑️ Docker 시스템 정리 중..."
docker system prune -f

# 5. 애플리케이션 빌드
echo "🔨 애플리케이션 빌드 중..."
npm run build

# 6. Docker 이미지 빌드
echo "🐳 Docker 이미지 빌드 중..."
docker build -t padoc .

# 7. 새 컨테이너 실행
echo "🚀 새 컨테이너 실행 중..."
docker run -d -p 3000:3000 --name padoc-container padoc

# 8. 컨테이너 상태 확인
echo "📊 컨테이너 상태 확인 중..."
sleep 10

if ! docker ps | grep -q padoc-container; then
    echo "❌ 컨테이너가 실행되지 않았습니다."
    docker logs padoc-container
    exit 1
fi

# 9. 헬스체크
echo "🏥 헬스체크 중..."
for i in {1..30}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ 애플리케이션이 정상적으로 응답합니다."
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 헬스체크 실패: 애플리케이션이 응답하지 않습니다."
        docker logs padoc-container
        exit 1
    fi
    echo "⏳ 애플리케이션 시작 대기 중... ($i/30)"
    sleep 2
done

# 10. 최종 상태 출력
echo "📈 배포 완료!"
echo "🌐 애플리케이션 URL: http://localhost:3000"
echo "📝 컨테이너 로그: docker logs padoc-container"
echo "🛑 컨테이너 중지: docker stop padoc-container"
