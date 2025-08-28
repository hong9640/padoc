/**
 * @file ultrasoundcontroller.h
 * @brief 외부 초음파 분석 Python 스크립트를 제어하는 컨트롤러 클래스를 정의합니다.
 */
#pragma once
#include <QObject>
#include <QProcess>
#include <QString>

class UltrasoundController : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool processRunning READ processRunning NOTIFY processRunningChanged)
    Q_PROPERTY(bool ultrasoundRunning READ ultrasoundRunning NOTIFY ultrasoundRunningChanged)
    Q_PROPERTY(QString lastError READ lastError NOTIFY lastErrorChanged)

public:
    explicit UltrasoundController(QObject* parent=nullptr);
    ~UltrasoundController();

    // --- Configuration ---
    Q_INVOKABLE void setPython(const QString& pythonExe);   // "python", "python3" 또는 절대경로
    Q_INVOKABLE void setScript(const QString& scriptPath);  // ultrasound_cli.py 절대경로
    Q_INVOKABLE QString python() const { return m_pythonExe; }
    Q_INVOKABLE QString script() const { return m_scriptPath; }

    // --- Process and Operation Control ---
    Q_INVOKABLE void startProcess();   // python -u <script> 실행
    Q_INVOKABLE void stopProcess();    // "exit\n" 보내고 종료
    Q_INVOKABLE void startUltrasound(); // "start\n"
    Q_INVOKABLE void stopUltrasound();  // "stop\n"
    Q_INVOKABLE void sendRaw(const QString& line); // 디버깅용 raw 명령

    // --- Status ---
    bool processRunning() const;
    bool ultrasoundRunning() const { return m_ultraRunning; }
    QString lastError() const { return m_lastError; }

signals:
    void logLine(const QString& line); // 파이썬 표준출력/에러 한 줄씩 방출
    void processRunningChanged();
    void ultrasoundRunningChanged();
    void lastErrorChanged();

private slots:
    void onReadyRead();
    void onErrorOccurred(QProcess::ProcessError e);
    void onFinished(int exitCode, QProcess::ExitStatus status);
    void onStarted();

private:
    void ensureProcess();
    void writeLine(const QString& line);
    void setUltraRunning(bool r);

    QProcess* m_process = nullptr;
    QString m_pythonExe = "python"; // 리눅스면 "python3"로 바꿔 셋업
    QString m_scriptPath;
    bool m_ultraRunning = false;
    QString m_lastError;
};
