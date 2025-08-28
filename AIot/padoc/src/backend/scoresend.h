/**
 * @file scoresend.h
 * @brief 사용자 점수를 서버로 전송하는 ScoreSend 클래스를 정의합니다.
 */
#ifndef SCORESEND_H
#define SCORESEND_H

#pragma once

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>

class ScoreSend : public QObject
{
    Q_OBJECT
public:
    explicit ScoreSend();

     Q_INVOKABLE void send(int score, int progress, const QString &token);

signals:
    void sendSuccess(QString message);
    void sendFailed(QString message);

private slots:
    void onScoreReply(QNetworkReply *reply);

private:
    QNetworkAccessManager m_networkManager;
};

#endif // SCORESEND_H
