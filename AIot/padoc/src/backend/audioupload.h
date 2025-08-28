/**
 * @file audioupload.h
 * @brief 3단계에 걸친 오디오 파일 업로드 프로세스를 관리하는 AudioUpload 클래스를 정의합니다.
 */
#ifndef VOICEUPLOADMANAGER_H
#define VOICEUPLOADMANAGER_H

#include <QObject>
#include <QNetworkAccessManager>
#include <QString>

class QNetworkReply;

class AudioUpload : public QObject
{
    Q_OBJECT

public:
    explicit AudioUpload(QObject *parent = nullptr);

    // 이 함수를 호출하여 전체 업로드 프로세스를 시작합니다.
    Q_INVOKABLE  void startVoiceUpload(const QString &localFilePath, const QString &type, int relatedId, const QString &token);

signals:
    // UI에 진행률을 표시하기 위한 시그널
    void uploadProgress(qint64 bytesSent, qint64 bytesTotal);

    // 최종 성공/실패를 알리는 시그널
    void uploadSuccess(int recordId, const QString &message);
    void uploadFailed(const QString &reason);

private slots:
    // 1단계: URL 요청에 대한 응답 처리
    void onUrlRequestReply(QNetworkReply *reply);

    // 2단계: 파일 업로드에 대한 응답 처리
    void onFileUploadReply(QNetworkReply *reply);

    // 3단계: 상태 조회에 대한 응답 처리
    void onStatusCheckReply(QNetworkReply *reply);

private:
    QNetworkAccessManager m_networkManager;
    QString m_token;
    QString m_localFilePath;

    // 단계 간에 전달되어야 하는 데이터
    int m_recordId;
};

#endif // VOICEUPLOADMANAGER_H
