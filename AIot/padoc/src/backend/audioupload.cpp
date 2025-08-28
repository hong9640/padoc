/**
 * @file audioupload.cpp
 * @brief AudioUpload 클래스의 구현을 정의합니다.
 */
#include "audioupload.h"
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QFileInfo>
#include <QFile>
#include <QDebug>

AudioUpload::AudioUpload(QObject *parent)
    : QObject(parent)
{
}

/**
 * @brief 전체 3단계 오디오 업로드 프로세스를 시작하는 진입점 함수입니다.
 */
void AudioUpload::startVoiceUpload(const QString &localFilePath, const QString &type, int relatedId, const QString &token)
{
    m_localFilePath = localFilePath;
    m_token = token;

    // --- 단계 1: 서버에 업로드 URL 요청 시작 ---

    QFileInfo fileInfo(localFilePath);
    QString fileName = fileInfo.fileName();

    // 서버에 보낼 요청 본문(JSON)을 생성합니다.
    QJsonObject json;
    json["file_name"] = fileName;
    json["type"] = type;
    if(relatedId != -1) json["related_voice_record_id"] = relatedId;
    //qDebug() << "related_voice_record_id:" << relatedId;

    QNetworkRequest request(QUrl("https://i13a106.p.ssafy.io/api/training/basic/upload"));
    request.setRawHeader("Authorization", ("Bearer " + m_token).toUtf8());
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");


    QNetworkReply *reply = m_networkManager.post(request, QJsonDocument(json).toJson());
    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        onUrlRequestReply(reply);
    });
}

/**
 * @brief [1단계 핸들러] 업로드 URL 요청에 대한 서버 응답을 처리합니다.
 */
void AudioUpload::onUrlRequestReply(QNetworkReply *reply)
{
    if (reply->error() != QNetworkReply::NoError) {
        emit uploadFailed("URL 요청 실패: " + reply->errorString());
        reply->deleteLater();
        return;
    }

    QByteArray responseData = reply->readAll();
    QJsonDocument doc = QJsonDocument::fromJson(responseData);
    QJsonObject obj = doc.object();

    m_recordId = obj["record_id"].toInt();
    QString uploadUrl = obj["upload_url"].toString();

    reply->deleteLater();

    if (uploadUrl.isEmpty()) {
        emit uploadFailed("URL 응답이 비어있습니다: " + QString(responseData));
        return;
    }

    // --- 단계 2: 실제 파일 데이터 업로드 시작 ---

    QFile *file = new QFile(m_localFilePath);
    if (!file->open(QIODevice::ReadOnly)) {
        emit uploadFailed("파일을 열 수 없습니다: " + m_localFilePath);
        delete file;
        return;
    }

    // 이 요청은 백엔드 서버가 아닌, 받은 uploadUrl(S3 등)로 직접 보냅니다.
    QNetworkRequest request(uploadUrl);
    // WAV 파일에 맞는 Content-Type을 지정해주는 것이 좋습니다.
    request.setHeader(QNetworkRequest::ContentTypeHeader, "audio/wav");

    // 파일 데이터를 PUT 요청으로 보냅니다.
    QNetworkReply *fileUploadReply = m_networkManager.put(request, file);
    // 파일은 QNetworkReply가 완료될 때 함께 삭제되도록 parent를 설정합니다.
    file->setParent(fileUploadReply);

    // 1. uploadProgress 시그널을 AudioUpload 클래스의 시그널로 그대로 전달 (올바른 코드)
    connect(fileUploadReply, &QNetworkReply::uploadProgress, this, &AudioUpload::uploadProgress);


    // 2. finished 시그널을 람다 함수를 이용해 onFileUploadReply 슬롯에 연결 (수정된 코드)
    connect(fileUploadReply, &QNetworkReply::finished, this, [this, fileUploadReply]() {
        onFileUploadReply(fileUploadReply);
    });
}

/**
 * @brief [2단계 핸들러] 파일 업로드(PUT)에 대한 응답을 처리합니다.
 */
void AudioUpload::onFileUploadReply(QNetworkReply *reply)
{
    // AWS S3의 경우 성공 시 보통 200 OK를 반환합니다.
    int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();

    if (reply->error() != QNetworkReply::NoError) {
        emit uploadFailed("파일 업로드 실패: " + reply->errorString() + " (Status: " + QString::number(status) + ")");
        reply->deleteLater();
        return;
    }

    reply->deleteLater();
    //qDebug() << "파일 업로드 성공. 상태 확인을 시작합니다. Record ID:" << m_recordId;

    // --- 단계 3: 서버에 업로드 완료 통보 시작 ---

    QString statusUrl = QString("https://i13a106.p.ssafy.io/api/training/basic/upload-status/%1").arg(m_recordId);
    QNetworkRequest request(statusUrl);
    request.setRawHeader("Authorization", ("Bearer " + m_token).toUtf8());

    QNetworkReply *statusReply = m_networkManager.get(request);
    connect(statusReply, &QNetworkReply::finished, this, [this, statusReply]() {
        onStatusCheckReply(statusReply);
    });
}

/**
 * @brief [3단계 핸들러] 업로드 완료 통보에 대한 서버 응답을 처리합니다.
 */
void AudioUpload::onStatusCheckReply(QNetworkReply *reply)
{

    //qDebug() << "--- 3단계 응답 (상태 확인) 수신 ---";

    int statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    //qDebug() << "[정보] HTTP 상태 코드:" << statusCode;
    
    QByteArray responseBody = reply->readAll();
    //qDebug() << "[정보] 서버 응답 내용(Body):" << responseBody;

    if (reply->error() != QNetworkReply::NoError) {
        emit uploadFailed("업로드 상태 확인 실패: " + reply->errorString());
        reply->deleteLater();
        return;
    }

    // 상태 확인 API가 200 OK를 반환하면 최종 성공으로 간주합니다.
    // 더 복잡한 로직(예: status가 "COMPLETED"인지 확인)이 필요할 수도 있습니다.
    emit uploadSuccess(m_recordId, "음성 파일이 성공적으로 업로드 및 처리되었습니다.");
    reply->deleteLater();
}
