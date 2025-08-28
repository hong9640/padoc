/**
 * @file audio_controller.h
 * @brief 실시간 오디오 캡처 및 차트 시각화 파이프라인을 제어하는 AudioController 클래스를 정의합니다.
 */
#pragma once
#include <QObject>
#include <QAudioSource>
#include <QMediaDevices>
#include <QXYSeries>
#include "xyseriesiodevice.h"

class AudioController : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool isRecording READ isRecording NOTIFY isRecordingChanged)

public:
    explicit AudioController(QObject *parent=nullptr) : QObject(parent) {}

    // QML에서 호출
    Q_INVOKABLE void start(QXYSeries* wave, QXYSeries* db);
    Q_INVOKABLE void stop();

    bool isRecording() const { return m_isRecording; }

signals:
    void dbFrameUpdated(int frame);
    void isRecordingChanged();

private:
    QAudioSource *m_audioSource = nullptr;
    XYSeriesIODevice *m_device = nullptr;
    bool m_isRecording = false;
};
