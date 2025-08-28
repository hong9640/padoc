# Gitlab 소스 클론 이후 빌드 및 배포할 수 있도록 정리한 문서

## 사용한 jvm, 웹서버, was 제품 등의 종류와 설정 값, 버전(IDE버전 포함)
- Python 인터프리터 : Python 3.11.9
- 웹서버 (Web Server): Nginx 1.29.1
- WAS : Uvicorn 0.35.0
- 컨테이너 : Docker Engine 28.3.2
- IDE : Visual Studio Code 1.103.1

## 빌드 시 사용되는 환경 변수 등의 내용
### 서비스 환경 세팅
1. **프로젝트 세팅**  
    ```
    .
    ├── docker
    │   ├── auth
    │   │   └── htpasswd
    │   ├── model
    │   │   └── savemodel_101_all_Dense_32.h5
    │   ├── registry
    │   │   └── v2
    │   └── secure
    │       └── .env
    ├── docker-compose.yml
    ├── docs
    │   └── padoc_api.json
    ├── proxy
    │   └── nginx.conf
    └── .env
    ```

    프로젝트를 실행할 공간을 위와 같이 설정해주세요.
2. **환경 변수 설정**
    - `./.env`
        ```
        # 프로젝트를 세팅한 폴더 경로
        BASE_DIR=/home/ubuntu/PaDocService
        ```
    - `./docker/secure/.env`
        ```
        MODEL_SERV_URL="음성 분석하는 서버의 주소"
        SECRET_KEY="JWT 토큰 생성 관련 비밀키"

        #S3 사용을 위한 인증정보
        AWS_ACCESS_KEY_ID=""
        AWS_SECRET_ACCESS_KEY=""
        AWS_REGION=""
        S3_BUCKET_NAME=""

        #DB 사용을 위한 인증정보
        DB_HOST = ""
        DB_PORT = ""
        DB_USERNAME = ""
        DB_PASSWORD = ""
        DB_NAME = ""
        DB_SSL_CONFIG = ''

        #파킨슨 가능성 추론 모델 파일 경로
        MODEL_PATH = "/resource/savemodel_101_all_Dense_32.h5"

        #서비스에서 사용하는 각종 포트 정보
        MAIN_SERV_PORT=8001 # app 서버 포트
        VOICE_ANALYSIS_SERV_PORT = 8002 # 음성 분석 서버 포트
        FRONT_END_SERV_PORT = 3000 # 프론트 배포 서버 포트
        ```
## 배포 시 특이사항
1. **서비스 배포**
    1. 도커 이미지 빌드를 통해 서비스에 필요한 도커 이미지를 생성합니다.
        
        ```
        docker build -t i13a106.p.ssafy.io:5000/padoc_backend -f ./BackEnd/Dockerfile.app ./BackEnd
        docker build -t i13a106.p.ssafy.io:5000/padoc_voice_analysis -f ./BackEnd/Dockerfile.VAS ./BackEnd
        docker build -t i13a106.p.ssafy.io:5000/padoc_frontend:latest -f ./FrontEnd/padoc/Dockerfile ./FrontEnd/padoc
        ```
        
        - 주의!
            
            프론트 엔드 이미지는 빌드 전 리액트 빌드를 로컬에서 해주세요.
            
    2. 도커 컴포즈를 통해 서비스를 실행합니다.
        
        ```
        sudo docker compose --profile dev-util up -d
        sudo docker compose --profile service-component up -d
        ```
        
        nginx 설정에 개발 관련 유틸 서비스를 분리하지 않아서 두 개 다 실행해야 서버가 제대로 동작합니다.
        
        - 주요 서비스만 실행하고 싶다면 도커 컴포즈와 nginx 설정에서 dev-util과 관련된 부분을 지우고 실행하시면 됩니다.
2. **iot 기기 프로그램 빌드 가이드**
    1. Qt Creator 설치 (6.7.3 버전)

    2. 프로젝트 클론

    3. 파이썬 가상환경 생성(Python 3.10) 및 라이브러리 설치

        - Python 3.10 버전으로 생성
        - Python venv(홈 디렉토리에 생성 필요)와 micromamba 지원
        - requirements.txt로 라이브러리 설치

    4. AI 모델 다운로드 (AI Hub: 파킨슨병 및 관련 질환 진단 음성데이터)

    5. `~/padoc/ai/AI_MODEL.h5` 경로에 AI 모델 추가

    6. Qt Creator에서 Debug Mode로 Build

## DB 접속 정보 등 프로젝트(ERD)에 활용되는 주요 계정 및 프로퍼티가 정의된 파일 목록
### .env
- 데이터베이스 접속 정보(사용자, 비밀번호, 호스트, 포트), JWT 시크릿 키, 외부 서비스 키 등 모든 민감 정보를 정의하는 파일입니다. 이 파일은 .gitignore에 추가하여 Git 저장소에 포함되지 않도록 관리합니다.

### app/db.py
- .env 파일의 DB 관련 변수를 읽어 데이터베이스 엔진과 세션을 생성하고, 앱 전체에 DB 연결을 제공하는 파일 입니다.

### docker-compose.yml
- env_file 속성을 사용하여 .env 파일의 내용을 각 서비스 컨테이너의 환경 변수로 주입하는 파일입니다. Docker 환경에서도 안전하게 설정값을 사용할 수 있도록 합니다.

### Dockerfile
- 컨테이너 이미지를 생성하기 위한 설계도 또는 레시피 파일입니다. 각 서비스(프론트엔드, 백엔드)가 독립된 환경에서 일관되게 동작할 수 있도록 필요한 모든 설정과 명령을 정의합니다.

### nginx.conf
- 프로젝트의 리버스 프록시 역할을 수행하며, 모든 외부 HTTP 요청(port 80)을 최초로 받아 적절한 내부 서비스 컨테이너로 전달하는 게이트웨이입니다.