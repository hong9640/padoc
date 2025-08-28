/**
 * @file RadarChartViewModel.cpp
 * @brief RadarChartViewModel 클래스의 구현을 정의합니다.
 */
#include "RadarChartViewModel.h"

RadarChartViewModel::RadarChartViewModel(QObject* parent)
    : QObject(parent)
{
    fetchData();
}

void RadarChartViewModel::fetchData()
{
    m_radarValues = { 80.0, 65.0, 70.0, 90.0, 75.0 };
    m_axisLabels = { "정확도", "속도", "반응성", "지속력", "집중력" };

    emit radarValuesChanged();
    emit axisLabelsChanged();
}

QVariantList RadarChartViewModel::radarValues() const
{
    return m_radarValues;
}

QStringList RadarChartViewModel::axisLabels() const
{
    return m_axisLabels;
}
