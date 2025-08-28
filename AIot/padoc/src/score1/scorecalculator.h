/**
 * @file scorecalculator.h
 * @brief 차트 데이터로부터 점수를 계산하는 로직을 제공하는 ScoreCalculator 클래스를 정의합니다.
 */
#ifndef SCORECALCULATOR_H
#define SCORECALCULATOR_H

#include <QObject>
#include <QtCharts/QAbstractSeries>

class ScoreCalculator : public QObject
{
    Q_OBJECT
public:
    explicit ScoreCalculator(QObject *parent = nullptr);

    Q_INVOKABLE int calculateScoreUD(QAbstractSeries *series, int updown);
    Q_INVOKABLE int calculateScoreMaxdB(QAbstractSeries *series, int bigsmall);
};

#endif
