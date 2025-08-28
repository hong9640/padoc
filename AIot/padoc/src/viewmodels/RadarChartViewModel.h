/**
 * @file RadarChartViewModel.h
 * @brief QML의 Radar Chart(방사형 차트)를 위한 ViewModel 클래스를 정의합니다.
 */
#pragma once

#include <QObject>
#include <QVariantList>
#include <QStringList>

class RadarChartViewModel : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QVariantList radarValues READ radarValues NOTIFY radarValuesChanged)
    Q_PROPERTY(QStringList axisLabels READ axisLabels NOTIFY axisLabelsChanged)

public:
    explicit RadarChartViewModel(QObject* parent = nullptr);

    QVariantList radarValues() const;
    QStringList axisLabels() const;

    Q_INVOKABLE void fetchData(); 

signals:
    void radarValuesChanged();
    void axisLabelsChanged();

private:
    QVariantList m_radarValues;
    QStringList m_axisLabels;
};
