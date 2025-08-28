/**
 * @file AudioRecorder.h
 * @brief Qt Multimedia를 사용하여 오디오 녹음을 관리하는 AudioRecorder 클래스를 정의합니다.
 */
#pragma once

#include <QObject>
#include <QMediaCaptureSession>
#include <QMediaRecorder>
#include <QAudioInput>

class AudioRecorder : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool recording READ isRecording NOTIFY recordingChanged)

public:
    explicit AudioRecorder(QObject* parent = nullptr);

    Q_INVOKABLE void startRecording(const QString &filePath);
    Q_INVOKABLE void stopRecording();
    Q_INVOKABLE void clearAudioFolder();
    bool isRecording() const { return m_recording; }
    Q_INVOKABLE QString lastSavedFilePath() const { return m_lastSavedFilePath; }

signals:
    void recordingChanged(bool recording);

private:
    QMediaCaptureSession m_captureSession;
    QAudioInput*         m_audioInput;
    QMediaRecorder*      m_mediaRecorder;
    bool                 m_recording = false;
    QString m_lastSavedFilePath;
};
