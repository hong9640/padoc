/**
 * @file loginmanager.cpp
 * @brief LoginManager 클래스의 구현을 정의합니다.
 */
#include <QJsonObject>
#include <QJsonDocument>
#include <QJsonArray>
#include <QUrl>
#include <QUrlQuery>
#include <QDate>
#include <QDateTime>
#include <QTime>

#include "loginmanager.h"

LoginManager::LoginManager(QObject *parent): QObject(parent){}

/**
 * @brief 서버에 로그인 요청을 보냅니다.
 */
void LoginManager::login(const QString &userId, const QString &password) {
    // --- 1. 전송할 JSON 페이로드 생성 ---
    QJsonObject json;
    json["login_id"] = userId;
    json["password"] = password;

    // --- 2. HTTP 요청 설정 ---
    QNetworkRequest request(QUrl("https://i13a106.p.ssafy.io/api/auth/sessions"));
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QByteArray body = QJsonDocument(json).toJson();

    // --- 3. 비동기 POST 요청 전송 ---
    QNetworkReply *reply = m_networkManager.post(request, body);

    // 응답 처리를 위해 finished 시그널을 onLoginReply 슬롯에 연결합니다.
    connect(reply, &QNetworkReply::finished, this, [this, reply](){
        onLoginReply(reply);
    });
}

/**
 * @brief 로그인 요청에 대한 서버 응답을 처리하는 슬롯입니다.
 */
void LoginManager::onLoginReply(QNetworkReply *reply) {
    QByteArray response = reply->readAll();
    int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();

    if (status == 200) {
        // 성공
        QJsonDocument doc = QJsonDocument::fromJson(response);
        QString token = doc.object().value("access_token").toString();
        emit loginSuccess(token);
    } else {
        // 실패
        QString msg = QString::fromUtf8(response);
        emit loginFailed(msg);
    }

    reply->deleteLater();
}

void LoginManager::fetchProfile(const QString &token) {
    QNetworkRequest request(QUrl("https://i13a106.p.ssafy.io/api/users/profile"));
    request.setRawHeader("Authorization", ("Bearer " + token).toUtf8());

    QNetworkReply *reply = m_networkManager.get(request);
    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        QByteArray response = reply->readAll();
        int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();

        if (status == 200) {
            // 성공
            QJsonDocument doc = QJsonDocument::fromJson(response);
            QVariantMap data = doc.object().toVariantMap();
            emit profileLoaded(data);
        } else {
            // 실패
            emit profileFailed(QString::fromUtf8(response));
        }
        reply->deleteLater();
    });
}

// 최근 1개월 범위 계산
static QString toIsoUtc(const QDate &d, bool endOfDay = false)
{
    QTime t = endOfDay ? QTime(23,59,59,999) : QTime(0,0,0,0);
    QDateTime dt(d, t, Qt::UTC);
    return dt.toString(Qt::ISODate); // 예: "2025-08-16T00:00:00Z"
}

void LoginManager::fetchRecentLatestTraining(const QString &token)
{
    // 날짜 범위: 오늘 ~ 한달 전 (오늘 포함)
    const QDate today = QDate::currentDate();
    const QDate from  = today.addMonths(-1).addDays(1); // "지난 1개월"을 오늘 기준으로 포함하려면 +1

    // 엔드포인트 구성 (네 API에 맞게 조정!)
    QUrl url("https://i13a106.p.ssafy.io/api/dashboard/patient");
    QUrlQuery q;

    auto toYMD = [](const QDate &d){ return d.toString("yyyy-MM-dd"); };
    q.addQueryItem("start_date", toYMD(from));
    q.addQueryItem("end_date",   toYMD(today));
    url.setQuery(q);

    QNetworkRequest request(url);
    request.setRawHeader("Authorization", ("Bearer " + token).toUtf8());

    QNetworkReply *reply = m_networkManager.get(request);
    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        QByteArray response = reply->readAll();
        int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();

        if (status == 200) {
            QJsonParseError perr;
            QJsonDocument doc = QJsonDocument::fromJson(response, &perr);
            if (perr.error != QJsonParseError::NoError || !doc.isObject()) {
                emit recentLatestTrainingFailed(QStringLiteral("JSON 파싱 실패: %1").arg(perr.errorString()));
                reply->deleteLater();
                return;
            }

            // 서버 응답
            QVariantList list;
            QVariantMap root = doc.object().toVariantMap();

            if (root.contains("trainings") && root.value("trainings").canConvert<QVariantList>()) {
                list = root.value("trainings").toList();
            }

            if (list.isEmpty()) {
                emit recentLatestTrainingFailed(QStringLiteral("최근 1개월 훈련 기록이 없습니다."));
            } else {
                // 최신이 0번 인덱스라고 가정
                QVariantMap latest = list.first().toMap();

                // (선택) 타입 보정: avg_score가 문자열일 가능성까지 대비
                if (latest.contains("avg_score"))
                    latest["avg_score"] = latest.value("avg_score").toDouble();

                emit recentLatestTrainingLoaded(latest);
            }
        } else {
            emit recentLatestTrainingFailed(QString::fromUtf8(response));
        }

        reply->deleteLater();
    });
}
