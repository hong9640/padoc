/**
 * @file AudioRecorder.cpp
 * @brief AudioRecorder 클래스의 구현을 정의합니다.
 */
#include "AudioRecorder.h"
#include <QAudioDevice>
#include <QMediaDevices>
#include <QUrl>
#include <QDebug>
#include <QDir>
#include <QStandardPaths>
#include <QMediaFormat>

/**
 * @brief AudioRecorder의 생성자입니다.
 * @details 오디오 입력 장치를 탐색 및 설정하고, Qt Multimedia 파이프라인을 구성합니다.
 */
AudioRecorder::AudioRecorder(QObject* parent)
    : QObject(parent)
{
    // --- 1. 오디오 입력 장치 탐색 및 선택 ---
    QAudioDevice targetDevice;
    const auto availableDevices = QMediaDevices::audioInputs();
    for (const QAudioDevice &deviceInfo : availableDevices) {
        //qDebug() << "Found Audio Device:" << deviceInfo.description();
        // 장치 설명에 "Brio"가 포함되어 있는지 확인 (대소문자 무시)
        if (deviceInfo.description().contains("Brio", Qt::CaseInsensitive)) {
            targetDevice = deviceInfo;
            qInfo() << ">>> Target device 'Brio' found!";
            break; // Brio를 찾았으면 반복 중단
        }
    }

    // 2. Brio를 찾지 못했을 경우, 기본 장치로 대체 (첫 번째 코드에서 가져옴)
    if (targetDevice.isNull()) {
        qWarning() << "Brio device not found! Falling back to default audio input.";
        targetDevice = QMediaDevices::defaultAudioInput();
        if (targetDevice.isNull()) {
            qCritical() << "No audio input device found at all!";
            return; // 어떤 장치도 찾을 수 없으면 함수 종료
        }
    }

    // --- 2. Qt Multimedia 객체 초기화 및 파이프라인 구성 ---
    m_audioInput = new QAudioInput(targetDevice, this);
    m_mediaRecorder = new QMediaRecorder(this);

    // CaptureSession 연결
    m_captureSession.setAudioInput(m_audioInput);
    m_captureSession.setRecorder(m_mediaRecorder);

    // --- 3. 녹음 포맷 설정 ---
    QMediaFormat format;
    format.setFileFormat(QMediaFormat::Wave);
    format.setAudioCodec(QMediaFormat::AudioCodec::Unspecified); // 기본 PCM
    m_mediaRecorder->setMediaFormat(format);

    // --- 4. 상태 변경 시그널 연결 ---
    connect(m_mediaRecorder, &QMediaRecorder::recorderStateChanged,
            this, [this](QMediaRecorder::RecorderState state) {
                bool now = (state == QMediaRecorder::RecordingState);
                if (now != m_recording) {
                    m_recording = now;
                    emit recordingChanged(m_recording);
                }
            });
}

/**
 * @brief 오디오 녹음을 시작합니다.
 * @note 이 함수는 파라미터로 받은 `filePath`를 무시하고, 홈 디렉토리의 'audio_test' 폴더에
 * 'Audio_001.wav', 'Audio_002.wav'와 같이 순차적인 파일명으로 자동 저장합니다.
 * @param filePath 현재 구현에서는 사용되지 않고 무시됩니다.
 */
void AudioRecorder::startRecording(const QString &filePath)
{
    // --- 자동 파일명 생성을 위한 경로 및 폴더 설정 ---
    QString dirPath = QStandardPaths::writableLocation(QStandardPaths::HomeLocation)
                      + "/audio_test";
    QDir dir(dirPath);
    if (!dir.exists())
        dir.mkpath(".");

    // --- 다음 녹음 파일의 인덱스 계산 ---
    QStringList files = dir.entryList(QStringList() << "Audio_*.wav", QDir::Files, QDir::Name);

    int maxIndex = 0;
    for (const QString &file : files) {
        QString base = file;
        base.remove("Audio_");
        base.remove(".wav");
        bool ok;
        int num = base.toInt(&ok);
        if (ok && num > maxIndex)
            maxIndex = num;
    }

    // 새 파일명을 생성합니다. (예: /home/user/audio_test/Audio_001.wav)
    int nextIndex = maxIndex + 1;
    QString filename = QString("%1/Audio_%2.wav")
                           .arg(dirPath)
                           .arg(nextIndex, 3, 10, QChar('0'));  // 3자리 001 형식

    // --- 녹음 시작 ---
    m_mediaRecorder->setOutputLocation(QUrl::fromLocalFile(filename));
    m_mediaRecorder->record();

    //qDebug() << "Recording to:" << filename;

    m_lastSavedFilePath = filename;
}

/**
 * @brief 진행 중인 녹음을 중지하고 파일을 저장합니다.
 */
void AudioRecorder::stopRecording()
{
    m_mediaRecorder->stop();
}

/**
 * @brief 오디오 녹음 폴더 안의 모든 파일을 삭제합니다.
 * @warning 이 작업은 되돌릴 수 없습니다. `~/audio_test` 폴더의 모든 파일이 영구적으로 삭제됩니다.
 */
void AudioRecorder::clearAudioFolder()
{
    // AudioRecorder와 동일한 경로를 사용해야 합니다.
    QString dirPath = QStandardPaths::writableLocation(QStandardPaths::HomeLocation)
                      + "/audio_test";

    QDir dir(dirPath);

    // 폴더가 존재하지 않으면 아무 작업도 하지 않음
    if (!dir.exists()) {
        //qDebug() << "Directory not found:" << dirPath;
        return;
    }

    //qDebug() << "Clearing all files in:" << dirPath;

    // 폴더 내의 모든 파일 목록을 가져옴 (하위 폴더는 제외)
    // QDir::Files 플래그는 파일만 대상으로 함
    QStringList files = dir.entryList(QDir::Files);
    for (const QString &file : files) {
        // 각 파일을 삭제
        if (dir.remove(file)) {
            //qDebug() << "  - Removed:" << file;
        } else {
            qWarning() << "  - Failed to remove:" << file;
        }
    }
}
