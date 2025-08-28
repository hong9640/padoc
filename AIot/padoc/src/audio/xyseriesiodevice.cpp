/**
 * @file xyseriesiodevice.cpp
 * @brief XYSeriesIODevice 클래스의 구현을 정의합니다.
 */
#include "xyseriesiodevice.h"
#include <QXYSeries>
#include <QtMath>
#include <complex>

/**
 * @brief XYSeriesIODevice의 생성자입니다.
 * @details 멤버 변수인 WaveformProcessor와 DBProcessor를 초기화하고,
 * DBProcessor의 시그널을 이 클래스의 시그널로 전달(forwarding)하도록 연결합니다.
 */
XYSeriesIODevice::XYSeriesIODevice(QXYSeries *waveSeries,
                                   QXYSeries *dbSeries,
                                   QObject *parent)
    : QIODevice(parent),
    m_waveProcessor(waveSeries, sampleCount),
    m_dbProcessor(dbSeries, this)
{
    connect(&m_dbProcessor, &DBProcessor::newDBFrame,
            this, &XYSeriesIODevice::newDBFrame);
}

/**
 * @brief 이 I/O 장치는 쓰기 전용(Write-Only)이므로 읽기 동작은 지원하지 않습니다.
 * @details QIODevice 문서에 따라, 지원되지 않는 동작에 대해서는 -1을 반환하여 오류를 알립니다.
 * @return 항상 -1을 반환합니다.
 */
qint64 XYSeriesIODevice::readData(char*, qint64)
{
    return -1;
}

/**
 * @brief QAudioSource로부터 원시 오디오 데이터를 받아 처리하는 핵심 메서드입니다.
 */
qint64 XYSeriesIODevice::writeData(const char* data, qint64 maxSize)
{
    // --- 1. 원시 바이트 데이터를 16비트 오디오 샘플로 변환 ---
    int sampleNum = maxSize / 2;
    const qint16* pcm = reinterpret_cast<const qint16*>(data);

    // --- 2. 변환된 샘플을 내부 버퍼(m_accumulated)에 추가 ---
    for (int i = 0; i < sampleNum; ++i){
        m_accumulated.append(pcm[i]);
        //m_accumulated.append(pcm[i] / 32768.0); // -1 ~ 1 정규화
    }
    
    // --- 3. 버퍼에 처리할 만큼의 데이터(sampleCount)가 쌓이면 블록 단위로 처리 ---
    while (m_accumulated.size() >= sampleCount) {
        QVector<qreal> block = m_accumulated.mid(0, sampleCount);
        m_accumulated.remove(0, sampleCount);

        // 모듈 호출
        m_waveProcessor.updateWaveform(block);
        m_dbProcessor.updateDB(block);

    }
    return maxSize;
}
