/**
 * @file loginmanager.h
 * @brief 사용자 인증(로그인) 및 데이터 조회를 관리하는 LoginManager 클래스를 정의합니다.
 */
#ifndef LOGINMANAGER_H
#define LOGINMANAGER_H

#pragma once

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>

class LoginManager : public QObject
{
    Q_OBJECT
public:
    explicit LoginManager(QObject *parent = nullptr);

    Q_INVOKABLE void login(const QString &userId, const QString &password);
    Q_INVOKABLE void fetchProfile(const QString &token);
    Q_INVOKABLE void fetchRecentLatestTraining(const QString &token);

signals:
    void loginSuccess(QString token);
    void loginFailed(QString message);

    void profileLoaded(QVariantMap profileData);
    void profileFailed(QString message);

    void recentLatestTrainingLoaded(QVariantMap trainingItem);
    void recentLatestTrainingFailed(QString message);

private slots:
    void onLoginReply(QNetworkReply *reply);

private:
    QNetworkAccessManager m_networkManager;
};

#endif // LOGINMANAGER_H
