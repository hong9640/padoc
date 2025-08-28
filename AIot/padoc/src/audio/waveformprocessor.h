/**
 * @file waveformprocessor.h
 * @brief 오디오 샘플 데이터를 파형(Waveform) 차트 시리즈로 변환하는 헬퍼 클래스를 정의합니다.
 */
#pragma once
#include <QVector>
#include <QXYSeries>
#include <QPointF>
#include <QList>

class WaveformProcessor {
public:
    explicit WaveformProcessor(QXYSeries* series, int sampleCount)
        : m_series(series), m_sampleCount(sampleCount) {}

    void updateWaveform(const QVector<qreal>& samples) {
        QList<QPointF> points;
        points.reserve(samples.size());
        for (int i = 0; i < samples.size(); ++i)
            points.append(QPointF(i, samples[i]));
        m_series->replace(points);
    }

private:
    QXYSeries* m_series;
    int m_sampleCount;
};
