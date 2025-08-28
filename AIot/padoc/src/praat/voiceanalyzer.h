/**
 * @file voiceanalyzer.h
 * @brief 외부 음성 분석 스크립트를 실행하고 결과를 처리하는 VoiceAnalyzer 클래스를 정의합니다.
 */
#pragma once
#include <QObject>
#include <QProcess>

class VoiceAnalyzer : public QObject
{
    Q_OBJECT
public:
    explicit VoiceAnalyzer(QObject *parent = nullptr);
    Q_INVOKABLE void analyze(const QString &audioFilePath);
    Q_INVOKABLE void analyze(const QStringList &audioFilePaths);

signals:
    void analysisCompleted(QVariantMap result);
    void analysisFailed(const QString &error);

private slots:
    void onProcessFinished(int exitCode, QProcess::ExitStatus exitStatus);

private:
    QProcess *m_process;
};
