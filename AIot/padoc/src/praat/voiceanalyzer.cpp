/**
 * @file voiceanalyzer.cpp
 * @brief VoiceAnalyzer 클래스의 구현을 정의합니다.
 */

#include "voiceanalyzer.h"
#include <QJsonDocument>
#include <QCoreApplication>
#include <QJsonObject>
#include <QDir>
#include <QFileInfo>
#include <QDebug>

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

VoiceAnalyzer::VoiceAnalyzer(QObject *parent) : QObject(parent), m_process(nullptr) {}

/**
 * @brief 단일 오디오 파일 분석을 위해 다중 파일 분석 메서드를 호출합니다.
 */
void VoiceAnalyzer::analyze(const QString &audioFilePath)
{
    // 단일 인자도 동작하도록 호환 유지
    analyze(QStringList{ audioFilePath });
}

/**
 * @brief 오디오 파일 목록을 받아 외부 Python 스크립트로 음성 분석을 시작합니다.
 */
void VoiceAnalyzer::analyze(const QStringList &audioFilePaths)
{
    if (audioFilePaths.isEmpty()) {
        emit analysisFailed("No file paths given.");
        return;
    }

    // 이전 분석 프로세스가 아직 실행 중인 경우, 새로운 요청을 무시합니다.
    if (m_process && m_process->state() == QProcess::Running) {
        qWarning() << "analyze() called while still running; ignored";
        return;
    }

    if (m_process) {
        m_process->deleteLater();
        m_process = nullptr;
    }

    // --- 1. Python 실행 파일 경로 탐색 ---
    QString pythonPath;
#if defined(Q_OS_WIN)
    pythonPath = pickExisting({
        QDir::homePath() + "/micromamba/envs/padoc/python.exe",
        QDir::homePath() + "/miniconda3/envs/padoc/python.exe",
        QDir::homePath() + "/venv/Scripts/python.exe",
        "python.exe"
    });
#elif defined(Q_OS_LINUX)
    pythonPath = pickExisting({
        QDir::homePath() + "/micromamba/envs/padoc/bin/python",
        QDir::homePath() + "/venv/bin/python",
        "/usr/bin/python3",
        "python3"
    });
#elif defined(Q_OS_MACOS) || defined(Q_OS_DARWIN)
    pythonPath = pickExisting({
        QDir::homePath() + "/micromamba/envs/padoc/bin/python",
        QDir::homePath() + "/venv/bin/python",
        "/usr/bin/python3",
        "python3"
    });
#elif defined(Q_OS_ANDROID)
    pythonPath = pickExisting({
        "/data/data/com.termux/files/usr/bin/python",
        "python"
    });
#else
    pythonPath = "python3";
#endif

    if (pythonPath.isEmpty()) pythonPath = "python3";

    // --- 2. 분석 스크립트 경로 결정 ---
    const QString baseDir = QCoreApplication::applicationDirPath();
    QString scriptPath = QDir(baseDir).absoluteFilePath("../padoc/src/praat/analyze_voice.py");
    if (!QFileInfo::exists(scriptPath)) {
        const QString hardcodedWin = "C:/Users/SSAFY/_dev/S13P11A106/AIot/padoc/src/praat/analyze_voice.py";
        if (QFileInfo::exists(hardcodedWin))
            scriptPath = hardcodedWin;
    }

    // --- 3. 프로세스 실행 ---
    QStringList args;
    args << scriptPath;
    for (const QString &p : audioFilePaths) {
        args << QDir::toNativeSeparators(p);
    }

    //qDebug() << "[VoiceAnalyzer] pythonPath:" << pythonPath;
    //qDebug() << "[VoiceAnalyzer] scriptPath:" << scriptPath;
    //qDebug() << "[VoiceAnalyzer] run args:" << args;

    m_process = new QProcess(this);
    connect(m_process, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
            this, &VoiceAnalyzer::onProcessFinished);

    // (선택) 스크립트가 상대 리소스를 쓴다면:
    // m_process->setWorkingDirectory(QFileInfo(scriptPath).absolutePath());

    m_process->start(pythonPath, args);
    if (!m_process->waitForStarted(10000)) {
        emit analysisFailed(QStringLiteral("Failed to start python: %1").arg(pythonPath));
        m_process->deleteLater();
        m_process = nullptr;
        return;
    }
}

/**
 * @brief 외부 분석 프로세스가 종료되었을 때 호출되는 슬롯입니다.
 * @details 프로세스의 결과를 읽어 JSON으로 파싱하고, 성공/실패에 따라 적절한 시그널을 발생시킵니다.
 */
void VoiceAnalyzer::onProcessFinished(int exitCode, QProcess::ExitStatus exitStatus)
{
    // 이번에 '끝난' 프로세스를 정확히 집는다
    QProcess* proc = qobject_cast<QProcess*>(sender());
    if (!proc) return;

    // 끝난 프로세스에서 출력 읽기 (m_process에서 읽지 말 것!)
    const QByteArray stdOut = proc->readAllStandardOutput();
    const QByteArray stdErr = proc->readAllStandardError();

    // 먼저 포인터를 끊고 deleteLater
    QProcess* finishedProc = m_process;
    m_process = nullptr;
    if (finishedProc) finishedProc->deleteLater();

    // 원본 출력 완전히 로그로 찍기
    // qDebug() << "======= Raw Python stdout =======";
    // qDebug() << stdOut;
    // qDebug() << "======= Raw Python stdout (QString) =======";
    // qDebug() << QString::fromUtf8(stdOut);
    // qDebug() << "======= Raw Python stderr =======";
    // qDebug() << stdErr;

    // 종료 코드/상태 체크
    if (exitStatus != QProcess::NormalExit || exitCode != 0) {
        emit analysisFailed(QStringLiteral("Python failed (exit %1): %2")
                                .arg(exitCode).arg(QString::fromUtf8(stdErr)));
        proc->deleteLater();
        if (proc == m_process) m_process = nullptr;
        return;
    }

    QString output = QString::fromUtf8(stdOut).trimmed();

    // 1. 앞뒤 쌍따옴표 제거
    if (output.startsWith("\"") && output.endsWith("\"")) {
        output = output.mid(1, output.length() - 2);
    }
    // 2. 이스케이프 된 쌍따옴표를 실제 쌍따옴표로 변환
    output = output.replace("\\\"", "\"");

    // (선택) 만약 역슬래시까지 들어가는 경우 한 번 더 처리
    output = output.replace("\\\\", "\\");

    //qDebug() << "======= output =======";
    //qDebug() << output;

    QJsonDocument doc = QJsonDocument::fromJson(output.toUtf8());
    //qDebug() << doc;

    if (doc.isNull() || !doc.isObject()) {
        emit analysisFailed(QStringLiteral("JSON parse failed: %1").arg(output));
        proc->deleteLater();
        if (proc == m_process) m_process = nullptr;
        return;
    }

    QJsonObject obj = doc.object();
    if (obj.contains(QStringLiteral("error"))) {
        emit analysisFailed(obj.value(QStringLiteral("error")).toString());
        proc->deleteLater();
        if (proc == m_process) m_process = nullptr;
        return;
    }

    // 정리는 'proc'만. m_process는 건드리지 않는다!
    proc->deleteLater();
    if (proc == m_process) m_process = nullptr;

    // 이제 안전하게 신호 emit (QML에서 곧바로 analyze 다시 호출해도 OK)
    // 재진입 이슈 방지하려면 큐드 emit 권장:
    QMetaObject::invokeMethod(this, [this, obj](){
        emit analysisCompleted(obj.toVariantMap());
    }, Qt::QueuedConnection);
}
