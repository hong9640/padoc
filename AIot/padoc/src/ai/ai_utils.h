/**
 * @file ai_utils.h
 * @brief 외부 AI 추론 스크립트를 실행하기 위한 유틸리티 클래스 AiUtils를 정의합니다.
 */
#ifndef AI_UTILS_H
#define AI_UTILS_H

#include <QObject>
#include <QString>

class AiUtils : public QObject
{
    Q_OBJECT
public:
    explicit AiUtils(QObject *parent = nullptr);
    Q_INVOKABLE QString runAiInference(const QString &wavPath);

signals:
    void inferenceResultReady(const QString &result);
};

#endif
