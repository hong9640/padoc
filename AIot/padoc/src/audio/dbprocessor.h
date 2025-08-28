/**
 * @file dbprocessor.h
 * @brief 오디오 샘플 데이터로부터 dB 레벨을 계산하고 시각화하는 헬퍼 클래스를 정의합니다.
 */
#pragma once
#include <QVector>
#include <QXYSeries>
#include <QtMath>

class DBProcessor : public QObject {
    Q_OBJECT
public:
    explicit DBProcessor(QXYSeries* series, QObject* parent=nullptr)
        : QObject(parent), m_series(series) {}

    void updateDB(const QVector<qreal>& samples) {
        double sum = 0;
        for (auto v : samples) sum += v*v;
        double rms = std::sqrt(sum / samples.size());
        double dB = 20.0 * std::log10((rms/ 32768.0) + 1e-6);
        double amplitude = dB;

        // EMA 필터 적용
        double alpha = 0.4;  // 0~1, 작을수록 부드러움
        m_filtered = alpha * amplitude + (1.0 - alpha) * m_filtered;
        m_series->append(m_frameIndex++, m_filtered);
        emit newDBFrame(m_frameIndex);
    }

signals:
    void newDBFrame(int frame);

private:
    QXYSeries* m_series;
    int m_frameIndex = 0;

    // EMA 상태 변수
    double m_filtered = 0.0;
};

