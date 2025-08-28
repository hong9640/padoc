/**
 * @file scorecalculator.cpp
 * @brief ScoreCalculator 클래스의 구현을 정의합니다.
 */
#include "scorecalculator.h"
#include <QtCharts/QLineSeries> // at(), count() 등 사용을 위해 포함
#include <QPointF>
#include <QtMath> // qAbs() 사용
#include <QDebug>

ScoreCalculator::ScoreCalculator(QObject *parent) : QObject(parent) {}

/**
 * @brief Up/Down 패턴의 점수를 계산합니다.
 * @details 이 함수는 다음 세 가지 주요 지표를 분석하여 최종 점수를 산출합니다:
 * 1. 기울기 (Slope): 데이터가 얼마나 일관된 상승/하강 추세를 보이는가.
 * 2. 평균 변화량 (Average Difference): 데이터가 얼마나 부드럽게 변화하는가.
 * 3. 최대 음량 (Max dBFS): 얼마나 충분한 음량으로 발성했는가.
 */
int ScoreCalculator::calculateScoreUD(QAbstractSeries *series, int updown)
{
    // --- 1. 유효성 검사 및 데이터 준비 ---
    if (!series) {
        qWarning() << "Error: Series is null.";
        return -1; // 에러 코드로 -1 반환
    }

    // QLineSeries로 캐스팅하여 포인트에 접근
    auto *lineSeries = static_cast<QLineSeries*>(series);

    const int startIndex = 10;
    const int endIndex = lineSeries->count() - 10;
    const int validCount = endIndex - startIndex;

    if (validCount < 10) {
        //qDebug() << "Data is not sufficient to calculate score.";
        return 0;
    }

    // --- 2. 기울기(Slope) 계산 ---
    qreal sumX = 0;
    qreal sumY = 0;
    qreal sumXY = 0;
    qreal sumXX = 0;

    for (int i = startIndex; i < endIndex; ++i) {
        QPointF p = lineSeries->at(i);
        qreal x = p.x();
        qreal y = p.y();

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    qreal numerator = validCount * sumXY - sumX * sumY;
    qreal denominator = validCount * sumXX - sumX * sumX;
    qreal slope = ((denominator != 0) ? numerator / denominator : 0) * updown;
    //qDebug() << "Calculated slope:" << slope;

    // --- 3. 평균 변화량(Average Difference) 계산 ---
    qreal totalDiff = 0;
    for (int k = startIndex + 1; k < endIndex; ++k) {
        qreal prev = lineSeries->at(k - 1).y(); 
        qreal curr = lineSeries->at(k).y();     
        totalDiff += qAbs(curr - prev);
    }
    qreal avgDiff = (validCount > 1) ? totalDiff / (validCount - 1) : 0;
    //qDebug() << "Average difference (avgDiff):" << avgDiff;

    // --- 4. 최대 dBFS 값 탐색 ---
    qreal maxvoice = -120.0;
    for (int j = startIndex; j < endIndex; ++j) {
        qreal dby = lineSeries->at(j).y();
        if (dby > maxvoice)
            maxvoice = dby;
    }
    //qDebug() << "Max dBFS:" << maxvoice;

    // --- 5. 최종 점수 산출 ---
    int s_slope = 0;
    int s_diff = 0;
    int s_max = 0;

    if (slope >= 0.2) s_slope = 40;
    else if (slope >= 0.05) s_slope = 30;
    else if (slope >= 0.005) s_slope = 20;
    else s_slope = 10;

    if (avgDiff <= 1) s_diff += 30;
    else if (avgDiff <= 1.5) s_diff += 20;
    else s_diff += 10;

    if (maxvoice >= -20) s_max += 30;
    else if (maxvoice >= -30) s_max += 20;
    else s_diff += 10;

    //qDebug() << "Slope: " << s_slope << "Diff: " << s_diff << "Max: " << s_max;
    //qDebug() << "Final Score:" << s_slope + s_diff + s_max;

    return s_slope + s_diff + s_max;
}

/**
 * @brief 최대 dB 값 유지 과제의 성공/실패를 판별합니다.
 * @details 주어진 데이터에서 최대 dBFS 값을 찾고, 이 값이 특정 임계치를 넘는지(큰 소리)
 * 또는 넘지 않는지(작은 소리)에 따라 성공(1) 또는 실패(0)를 반환합니다.
 */
int ScoreCalculator::calculateScoreMaxdB(QAbstractSeries *series, int bigsmall)
{
    // --- 1. 유효성 검사 ---
    if (!series) {
        qWarning() << "Error: Series is null.";
        return -1; // 에러 코드로 -1 반환
    }

    
    auto *lineSeries = static_cast<QLineSeries*>(series);

    const int startIndex = 1;
    const int endIndex = lineSeries->count()-1;

    // --- 2. 최대 dBFS 값 탐색 ---
    qreal maxvoice = -120.0;
    for (int j = startIndex; j < endIndex; ++j) {
        qreal dby = lineSeries->at(j).y();
        if (dby > maxvoice)
            maxvoice = dby;
    }
    //qDebug() << "Max dBFS:" << maxvoice;

    // --- 3. 성공/실패 판별 ---
    if(bigsmall == 1){
        if(maxvoice >= -25) {
            //qDebug() << "OK";
            return 1;
        }
        else {
            //qDebug() << "NO";
            return 0;
        }
    }
    else{
        if(maxvoice < -25) {
            //qDebug() << "OK";
            return 1;
        }
        else {
            //qDebug() << "NO";
            return 0;
        }
    }

    //qDebug() << "Error";
    return 0;
}
