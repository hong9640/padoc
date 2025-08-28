/**
 * @file ultrasoundcontroller.cpp
 * @brief UltrasoundController 클래스의 구현을 정의합니다.
 */
#include "ultrasoundcontroller.h"

#include <QCoreApplication>
#include <QFileInfo>
#include <QProcessEnvironment>
#include <QDir>
#include <QDebug>

// --- 공용 유틸: 후보들 중 존재하는 경로 하나 선택 ---
/**
 * @brief 주어진 경로 후보 리스트에서 실제 파일 시스템에 존재하는 첫 번째 경로를 찾아 반환합니다.
 * @param candidates 확인할 파일/디렉토리 경로 리스트
 * @return 존재하는 첫 번째 경로. 없으면 빈 QString을 반환합니다.
 */
static QString pickExisting(const QStringList& candidates) {
    for (const auto& p : candidates) {
        if (QFileInfo::exists(p))
            return p;
    }
    return QString();
}

// --- 플랫폼별 파이썬 경로 자동 탐색 ---
/**
 * @brief 현재 운영체제(OS) 환경에 맞는 Python 실행 파일을 자동으로 탐색합니다.
 * @details 일반적인 (ana)conda, venv 가상환경 경로 및 시스템 기본 경로 순으로 탐색하여
 * 가장 가능성 높은 Python 실행 파일 경로를 반환합니다.
 * @return 찾은 Python 실행 파일 경로. 찾지 못하면 OS별 기본값("python" 또는 "python3")을 반환합니다.
 */
static QString resolvePythonAuto() {
#if defined(Q_OS_WIN)
    QString found = pickExisting({
        QDir::homePath() + "/micromamba/envs/padoc/python.exe",
        QDir::homePath() + "/miniconda3/envs/padoc/python.exe",
        QDir::homePath() + "/venv/Scripts/python.exe",
        "python.exe",
        "python" // 일부 환경
    });
    if (!found.isEmpty()) return found;
    return "python";
#elif defined(Q_OS_LINUX)
    QString found = pickExisting({
        QDir::homePath() + "/micromamba/envs/padoc/bin/python",
        QDir::homePath() + "/venv/bin/python",
        "/usr/bin/python3",
        "python3"
    });
    if (!found.isEmpty()) return found;
    return "python3";
#elif defined(Q_OS_MACOS) || defined(Q_OS_DARWIN)
    QString found = pickExisting({
        QDir::homePath() + "/micromamba/envs/padoc/bin/python",
        QDir::homePath() + "/venv/bin/python",
        "/usr/bin/python3",
        "python3"
    });
    if (!found.isEmpty()) return found;
    return "python3";
#else
    return "python3";
#endif
}

// --- 스크립트 경로 기본값 ---
/**
 * @brief 실행할 Python 스크립트의 경로를 자동으로 탐색합니다.
 * @details 배포 환경과 개발 환경의 서로 다른 디렉토리 구조를 모두 고려하여 탐색을 시도합니다.
 * @return 찾은 스크립트의 절대 경로. 최종적으로 찾지 못하면 빈 QString을 반환합니다.
 */
static QString resolveScriptAuto() {
    const QString baseDir = QCoreApplication::applicationDirPath();

    // 배포 구조: <appDir>/scripts/ultrasound_cli.py
    QString p1 = QDir(baseDir).absoluteFilePath("ultrasound/esp32_ultrasound_control.py");
    if (QFileInfo::exists(p1)) return p1;

    // 개발 구조(빌드/디버그에서 상대): <appDir>/../padoc/src/scripts/ultrasound_cli.py
    QString p2 = QDir(baseDir).absoluteFilePath("../padoc/src/ultrasound/esp32_ultrasound_control.py");
    if (QFileInfo::exists(p2)) return p2;

    // 개인 개발기(윈도우) 하드코딩 폴백 — 필요 시 경로 수정
    QString hardcodedWin = "C:/Users/SSAFY/_dev/S13P11A106/AIot/padoc/src/ultrasound/esp32_ultrasound_control.py";
    if (QFileInfo::exists(hardcodedWin)) return hardcodedWin;

    return QString(); // 최종 실패
}

UltrasoundController::UltrasoundController(QObject* parent)
    : QObject(parent)
{
}

UltrasoundController::~UltrasoundController()
{
    stopProcess();
}

void UltrasoundController::setPython(const QString& pythonExe)
{
    m_pythonExe = pythonExe;
}

void UltrasoundController::setScript(const QString& scriptPath)
{
    m_scriptPath = scriptPath;
}

bool UltrasoundController::processRunning() const
{
    return m_process && (m_process->state() == QProcess::Running);
}

void UltrasoundController::startProcess()
{
    ensureProcess();
}

/**
 * @brief Python 프로세스를 단계적으로 안전하게 종료합니다.
 * @details 1. "exit" 명령어 전송 (Graceful Shutdown)
 * 2. 응답 없으면 terminate() (SIGTERM)
 * 3. 그래도 종료되지 않으면 kill() (SIGKILL)
 */
void UltrasoundController::stopProcess()
{
    if (!m_process) return;

    if (m_process->state() == QProcess::Running) {
        // 파이썬에 정상 종료 명령
        writeLine("exit");
        if (!m_process->waitForFinished(2000)) {
            m_process->terminate();
            if (!m_process->waitForFinished(1000)) {
                m_process->kill();
                m_process->waitForFinished(1000);
            }
        }
    }

    m_process->deleteLater();
    m_process = nullptr;
    setUltraRunning(false);
    emit processRunningChanged();
}

void UltrasoundController::startUltrasound()
{
    ensureProcess();
    if (!processRunning()) {
        emit logLine("Cannot start: Python process is not running");
        return;
    }
    writeLine("start\n");
    // 파이썬 로그에서 다시 보정되지만, UX 위해 선반영
    setUltraRunning(true);
}

void UltrasoundController::stopUltrasound()
{
    if (!processRunning()) return;
    writeLine("stop\n");
    setUltraRunning(false);
}

void UltrasoundController::sendRaw(const QString& line)
{
    ensureProcess();
    if (!processRunning()) return;
    writeLine(line);
}

/**
 * @brief Python 프로세스가 실행 중인지 확인하고, 아니면 새로 시작합니다.
 * @details 이 함수는 프로세스 시작에 필요한 모든 준비(경로 탐색, 환경 변수 설정,
 * 시그널-슬롯 연결)를 수행하는 핵심 로직입니다.
 */
void UltrasoundController::ensureProcess()
{
    if (processRunning()) return;

    // 1) 파이썬 경로 결정: setPython()으로 지정했으면 그걸 쓰고,
    //    비워두었거나 "auto"로 뒀다면 자동 탐색.
    QString pythonPath = m_pythonExe.trimmed();
    if (pythonPath.isEmpty() || pythonPath.compare("auto", Qt::CaseInsensitive) == 0) {
        pythonPath = resolvePythonAuto();
    }

    // 2) 스크립트 경로 결정: setScript()가 없다면 자동
    QString scriptPath = m_scriptPath.trimmed();
    if (scriptPath.isEmpty()) {
        scriptPath = resolveScriptAuto();
    }

    if (scriptPath.isEmpty() || !QFileInfo::exists(scriptPath)) {
        m_lastError = QString("UltrasoundController: script not found: %1").arg(scriptPath);
        emit lastErrorChanged();
        emit logLine(m_lastError);
        return;
    }

    if (m_process) {
        m_process->deleteLater();
        m_process = nullptr;
    }

    m_process = new QProcess(this);

    // 표준 출력/에러를 합침
    m_process->setProcessChannelMode(QProcess::MergedChannels);

    // 파이썬 버퍼링 해제
    QProcessEnvironment env = QProcessEnvironment::systemEnvironment();
    env.insert("PYTHONUNBUFFERED", "1");
    m_process->setProcessEnvironment(env);

    // 인자 구성: -u <script>
    QStringList args;
    args << "-u" << scriptPath;

    // 작업 디렉토리는 스크립트 위치로(상대 리소스 접근 시 유리)
    QFileInfo fi(scriptPath);
    m_process->setWorkingDirectory(fi.absolutePath());

    // 시그널 연결
    connect(m_process, &QProcess::readyReadStandardOutput, this, &UltrasoundController::onReadyRead);
    connect(m_process, &QProcess::readyReadStandardError,  this, &UltrasoundController::onReadyRead);
    connect(m_process, &QProcess::errorOccurred, this, &UltrasoundController::onErrorOccurred);
    connect(m_process, qOverload<int,QProcess::ExitStatus>(&QProcess::finished),
            this, &UltrasoundController::onFinished);
    connect(m_process, &QProcess::started, this, &UltrasoundController::onStarted);

    // 실행
    // qDebug() << "[Ultrasound] pythonPath:" << pythonPath;
    // qDebug() << "[Ultrasound] scriptPath:" << scriptPath;
    // qDebug() << "[Ultrasound] args:" << args;

    m_process->start(pythonPath, args);

    // VoiceAnalyzer 스타일로 시작 확인(선택)
    if (!m_process->waitForStarted(10000)) {
        m_lastError = QStringLiteral("Failed to start python: %1").arg(pythonPath);
        emit lastErrorChanged();
        emit logLine(m_lastError);
        m_process->deleteLater();
        m_process = nullptr;
        return;
    }
}

/**
 * @brief 주어진 문자열에 개행 문자를 추가하여 프로세스의 표준 입력으로 전송합니다.
 * @param line 전송할 명령어 문자열
 */
void UltrasoundController::writeLine(const QString& line)
{
    if (!processRunning()) return;

    QByteArray data = line.toUtf8();
    data.append('\n'); // 파이썬 stdin.readline()/input()용 개행 필수

    const qint64 n = m_process->write(data);
    if (n == -1) {
        emit logLine("write() failed");
        return;
    }

    // flush() 대신 실제로 쓰일 때까지 잠깐 대기
    // (타임아웃은 상황에 맞춰 50~500ms 정도; 너무 길게 잡을 필요는 없음)
    m_process->waitForBytesWritten(100);
}

/**
 * @brief Python 프로세스로부터 출력(stdout/stderr)이 있을 때 호출됩니다.
 * @details 수신된 로그를 한 줄씩 읽어 logLine 시그널로 전달하고, 특정 로그 패턴을 감지하여
 * 내부 상태(m_ultraRunning)를 실제 스크립트 동작과 동기화합니다.
 */
void UltrasoundController::onReadyRead()
{
    if (!m_process) return;

    while (m_process->canReadLine()) {
        const QByteArray line = m_process->readLine();
        const QString s = QString::fromLocal8Bit(line).trimmed();
        if (!s.isEmpty()) {
            emit logLine(s);

            // 출력 패턴으로 러닝 상태 보정
            if (s.contains(u"초음파 테스트 시작"_qs)) setUltraRunning(true);
            if (s.contains(u"초음파 테스트 끝"_qs))   setUltraRunning(false);
            if (s.contains(u"시리얼 포트 종료"_qs))    setUltraRunning(false);
        }
    }

    // 개행 없이 남은 버퍼 방출(있다면)
    const QByteArray rest = m_process->readAll();
    if (!rest.isEmpty()) {
        const QString s = QString::fromLocal8Bit(rest).trimmed();
        if (!s.isEmpty()) emit logLine(s);
    }
}

void UltrasoundController::onErrorOccurred(QProcess::ProcessError e)
{
    m_lastError = QString("QProcess error: %1").arg(int(e));
    emit lastErrorChanged();
    emit logLine(m_lastError);
}

void UltrasoundController::onFinished(int exitCode, QProcess::ExitStatus status)
{
    emit logLine(QString("Python exited. code=%1, status=%2").arg(exitCode).arg(int(status)));
    setUltraRunning(false);
    emit processRunningChanged();
}

void UltrasoundController::onStarted()
{
    emit processRunningChanged();
    emit logLine("Python process started");
    // writeLine("stop");
    setUltraRunning(false);
}

void UltrasoundController::setUltraRunning(bool r)
{
    if (m_ultraRunning == r) return;
    m_ultraRunning = r;
    emit ultrasoundRunningChanged();
}
