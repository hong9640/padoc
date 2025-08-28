/**
 * @file ai_utils.cpp
 * @brief AiUtils 클래스의 구현을 정의합니다.
 */
#include "ai_utils.h"
#include <QCoreApplication>
#include <QRegularExpression>
#include <QProcess>
#include <QDebug>
#include <QDir>
#include <QFileInfo>
#include <QStandardPaths>

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

AiUtils::AiUtils(QObject *parent) : QObject(parent)
{
}

/**
 * @brief Python AI 추론 스크립트를 동기적으로 실행하고 그 결과를 반환합니다.
 * @warning 이 함수는 `QProcess::waitForFinished(-1)`를 호출
 */
QString AiUtils::runAiInference(const QString &wavPath)
{
    QString pythonPath;

#if defined(Q_OS_WIN)
    pythonPath = pickExisting({
        QDir::homePath() + "/micromamba/envs/padoc/python.exe",   // conda/mamba
        QDir::homePath() + "/miniconda3/envs/padoc/python.exe",
        QDir::homePath() + "/venv/Scripts/python.exe",            // venv
        "python.exe"                                              // PATH
    });
#elif defined(Q_OS_LINUX)
        pythonPath = pickExisting({
            QDir::homePath() + "/micromamba/envs/padoc/bin/python",   // conda/mamba
            QDir::homePath() + "/venv/bin/python",                    // venv
            "/usr/bin/python3",
            "python3"                                                 // PATH
        });
#elif defined(Q_OS_MACOS)
        pythonPath = pickExisting({
            QDir::homePath() + "/micromamba/envs/padoc/bin/python",
            QDir::homePath() + "/venv/bin/python",
            "/usr/bin/python3",
            "python3"
        });
#elif defined(Q_OS_ANDROID)
        // Termux 등
        pythonPath = pickExisting({
            "/data/data/com.termux/files/usr/bin/python",
            "python"
        });
#else
        pythonPath = "python3";
#endif

    if (pythonPath.isEmpty()) pythonPath = "python3"; // 최종 폴백

    QString baseDir = QCoreApplication::applicationDirPath(); // 실행파일 위치
    // 추후 경로 변경 필요
    QString scriptPath = QDir(baseDir).absoluteFilePath("../padoc/src/ai/voice_predict.py");
    if (!QFileInfo::exists(scriptPath)) {
        // 윈도우 개발 경로 백업
        QString hardcodedWin = "C:/Users/SSAFY/_dev/S13P11A106/AIot/padoc/src/ai/voice_predict.py";
        if (QFileInfo::exists(hardcodedWin))
            scriptPath = hardcodedWin;
    }

    //qDebug() << "wavePath:" << wavPath;
    //qDebug() << "baseDir:" << baseDir;
    //qDebug() << "scriptPath:" << scriptPath;

    QStringList arguments;
    arguments << scriptPath << wavPath;

    QProcess process;
    process.start(pythonPath, arguments);
    if (!process.waitForStarted(10000)) {
        qWarning() << "[AI] failed to start python:" << pythonPath;
        emit inferenceResultReady(QString());
        return QString();
    }
    process.waitForFinished(-1);

    const int exitCode = process.exitCode();
    const auto exitStatus = process.exitStatus();
    QString output = QString::fromUtf8(process.readAllStandardOutput()).trimmed();
    QString err    = QString::fromUtf8(process.readAllStandardError()).trimmed();

    // if (!err.isEmpty())
    //     qDebug() << "[AI][stderr]" << err;
    // qDebug() << "[AI][stdout]" << output;
    // qDebug() << "[AI] exitCode" << exitCode << "status" << (exitStatus == QProcess::NormalExit ? "Normal" : "Crashed");

    // 결과만 추출 (마지막 줄)
    const QStringList lines = output.split(QRegularExpression("[\r\n]"), Qt::SkipEmptyParts);
    const QString prob = lines.isEmpty() ? QString() : lines.last();
    //qDebug() << "[AI][stdout] (prob only)" << prob;

    emit inferenceResultReady(prob);
    return prob;
}
