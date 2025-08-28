@echo off
echo 🚀 PADOC Frontend Docker 배포 시작...

REM 환경 변수 파일 확인
if not exist .env (
    echo ⚠️  .env 파일이 없습니다. 기본값을 사용합니다.
    echo NEXT_PUBLIC_BE_API_URL=http://localhost:8080 > .env
)

REM 기존 컨테이너와 이미지 정리
echo 🧹 기존 컨테이너와 이미지 정리 중...
docker-compose down
docker system prune -f

REM Docker 이미지 빌드
echo 🔨 Docker 이미지 빌드 중...
docker-compose build --no-cache

REM 컨테이너 실행
echo 🚀 컨테이너 실행 중...
docker-compose up -d

REM 상태 확인
echo 📊 배포 상태 확인 중...
timeout /t 5 /nobreak > nul
docker-compose ps

echo ✅ 배포 완료!
echo 🌐 애플리케이션 접속: http://localhost:3000
echo 📝 로그 확인: docker-compose logs -f

pause
