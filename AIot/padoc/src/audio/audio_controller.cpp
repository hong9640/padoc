/**
 * @file audio_controller.cpp
 * @brief AudioController 클래스의 구현을 정의합니다.
 */
#include "audio_controller.h"
#include <QAudioFormat>
#include <QAudioDevice>
#include <QMediaDevices>
#include <QDebug>

/**
 * @brief 실시간 오디오 캡처 및 시각화 파이프라인을 구성하고 시작합니다.
 * @details 이 메서드는 오디오 장치 탐색, 오디오 포맷 설정, QAudioSource와
 * XYSeriesIODevice 객체 생성 및 연결, 그리고 오디오 스트림 시작까지의
 * 모든 과정을 수행합니다.
 */
void AudioController::start(QXYSeries* wave, QXYSeries* db)
{
    if (m_audioSource) return;

    // --- 1. 오디오 입력 장치 탐색 및 선택 ---
    QAudioDevice targetDevice;
    const auto availableDevices = QMediaDevices::audioInputs();
    for (const QAudioDevice &deviceInfo : availableDevices) {
        //qDebug() << "Found Audio Device:" << deviceInfo.description();
        if (deviceInfo.description().contains("Brio", Qt::CaseInsensitive)) {
            targetDevice = deviceInfo;
            qInfo() << ">>> Target device 'Brio 100' found!";
            break; // Brio를 찾았으면 반복 중단
        }
    }

    // 2. Brio 100을 찾지 못했을 경우, 기본 장치를 사용하거나 오류 처리
    if (targetDevice.isNull()) {
        qWarning() << "Brio 100 not found! Falling back to default audio input.";
        targetDevice = QMediaDevices::defaultAudioInput();
        if (targetDevice.isNull()) {
            qCritical() << "No audio input device found at all!";
            return;
        }
    }

     // --- 2. 오디오 포맷 설정 ---
    QAudioFormat format;
    format.setSampleRate(48000);
    format.setChannelCount(1);
    format.setSampleFormat(QAudioFormat::Int16);

    // --- 3. 오디오 파이프라인 객체 생성 및 연결 ---
    m_audioSource = new QAudioSource(targetDevice, format, this);
    m_device = new XYSeriesIODevice(wave, db, this);
    m_device->open(QIODevice::WriteOnly);

    connect(m_device, &XYSeriesIODevice::newDBFrame,
            this, &AudioController::dbFrameUpdated);

    // --- 4. 오디오 캡처 시작 ---
    m_audioSource->setBufferSize(9600);
    m_audioSource->start(m_device);

    // --- 5. 상태 업데이트 ---
    m_isRecording = true;
    emit isRecordingChanged();
    //qDebug() << "Audio recording started";
}

/**
 * @brief 진행 중인 오디오 캡처 및 시각화를 중지하고 관련 리소스를 모두 해제합니다.
 */
void AudioController::stop()
{
    if (!m_audioSource) return;

    // --- 1. 파이프라인 중지 ---
    m_audioSource->stop();
    m_device->close();

    // --- 2. 리소스 정리 ---
    m_audioSource->deleteLater();
    m_device->deleteLater();

    m_audioSource = nullptr;
    m_device = nullptr;

    // --- 3. 상태 업데이트 ---
    m_isRecording = false;  
    emit isRecordingChanged();
    //qDebug() << "Audio recording stopped";
}
