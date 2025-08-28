/**
 * @file xyseriesiodevice.h
 * @brief 오디오 스트림을 Qt Chart 시리즈로 시각화하는 커스텀 QIODevice 클래스를 정의합니다.
 */
#ifndef XYSERIESIODEVICE_H
#define XYSERIESIODEVICE_H

#include <QIODevice>
#include <QVector>
#include "waveformprocessor.h"
#include "dbprocessor.h"

QT_FORWARD_DECLARE_CLASS(QXYSeries)

class XYSeriesIODevice : public QIODevice
{
    Q_OBJECT
public:
    explicit XYSeriesIODevice(QXYSeries* waveSeries,
                              QXYSeries* dbSeries,
                              QObject* parent = nullptr);

    static const int sampleCount = 4800;  // 반응 빠르게

signals:
    void newDBFrame(int frame);

protected:
    qint64 readData(char* data, qint64 maxSize) override;
    qint64 writeData(const char* data, qint64 maxSize) override;

private:
    WaveformProcessor m_waveProcessor;
    DBProcessor m_dbProcessor;

    QVector<qreal> m_accumulated;
    int m_frameIndex = 0;
};

#endif
