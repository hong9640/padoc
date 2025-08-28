/**
 * @file scoresend.cpp
 * @brief ScoreSend 클래스의 구현을 정의합니다.
 */
#include <QJsonObject>
#include <QJsonDocument>
#include "scoresend.h"
#include <string>

ScoreSend::ScoreSend() {}

/**
 * @brief 서버로 점수와 진행도를 전송하기 위한 비동기 POST 요청을 생성하고 전송합니다.
 */
void ScoreSend::send(int score, int progress, const QString &token) {

    // --- 1. 전송할 JSON 페이로드(Payload) 생성 ---
    std::string levels[10] = {"level 1", "level 2", "level 3", "level 4", "level 5", "level 6", "level 7", "level 8", "level 9", "level 10"};
    QString progressString;

    if (progress >= 1 && progress <= 10) {
        progressString = QString::fromStdString(levels[progress-1]);
    } else {
        progressString = "level 1"; // 예외 처리
    }

    // JSON 객체를 생성하고 데이터를 담습니다.
    QJsonObject json;
    json["avg_score"] = score/progress;
    json["progress"] = progressString;


    // --- 2. HTTP 요청(Request) 설정 ---
    QNetworkRequest request(QUrl("https://i13a106.p.ssafy.io/api/training/advanced"));
    request.setRawHeader("Authorization", ("Bearer " + token).toUtf8());
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QByteArray body = QJsonDocument(json).toJson();

    // --- 3. 비동기 POST 요청 전송 ---
    QNetworkReply *reply = m_networkManager.post(request, body);

    // 응답 처리 슬롯 연결
    connect(reply, &QNetworkReply::finished, this, [this, reply](){
        onScoreReply(reply);
    });
}

/**
 * @brief 네트워크 요청에 대한 서버의 응답을 처리하는 슬롯입니다.
 */
void ScoreSend::onScoreReply(QNetworkReply *reply) {
    QByteArray response = reply->readAll();
    int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();

    if (status == 200) {
        // 성공
        QJsonDocument doc = QJsonDocument::fromJson(response);
        QString msg = doc.object().value("message").toString();
        emit sendSuccess(msg);
    } else {
        // 실패
        QString msg = QString::fromUtf8(response);
        emit sendFailed(msg);
    }

    reply->deleteLater();
}
