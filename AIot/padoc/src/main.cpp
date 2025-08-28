/**
 * @file main.cpp
 * @brief 애플리케이션의 메인 진입점(Entry Point)입니다.
 * @details QApplication을 초기화하고, 전역 폰트를 설정하며,
 * QML 엔진을 생성하고 C++ 백엔드 객체들을 QML 컨텍스트에 등록합니다.
 * 마지막으로 메인 QML 파일을 로드하여 애플리케이션을 실행합니다.
 */

// Qt Core & GUI
#include <QApplication>
#include <QQmlApplicationEngine>
#include <QFontDatabase>
#include <QQmlContext>
#include <QWindow>
#include <QDebug>
#include <QFont>
#include <QDir>

// Project Backend & Controllers
#include "praat/voiceanalyzer.h"
#include "backend/loginmanager.h"
#include "backend/scoresend.h"
#include "backend/audioupload.h"
#include "audio/audio_controller.h"
#include "audiorecord/AudioRecorder.h"
#include "score1/scorecalculator.h"
#include "ai/ai_utils.h"
#include "ultrasound/ultrasoundcontroller.h"

/**
 * @brief Qt 리소스 경로(qrc)로부터 애플리케이션 폰트를 로드하고 폰트 패밀리 이름을 반환합니다.
 * @param qrcPath Qt 리소스 시스템에 등록된 폰트 파일의 경로.
 * @return 로드 성공 시 폰트 패밀리 이름(QString), 실패 시 빈 QString.
 */
static QString loadAppFont(const QString& qrcPath) {
    int id = QFontDatabase::addApplicationFont(qrcPath);
    if (id < 0) {
        qWarning() << "Failed to load font:" << qrcPath;
        return {};
    }
    const QStringList families = QFontDatabase::applicationFontFamilies(id);
    if (families.isEmpty()) {
        qWarning() << "No families in font:" << qrcPath;
        return {};
    }
    return families.first();
}


int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    // --- 전역 폰트 설정(Pretendard) ---
    // 애플리케이션 리소스로부터 Pretendard 폰트를 로드하여 기본 폰트로 설정합니다.
    QString family = loadAppFont(":/resource/fonts/PretendardVariable.ttf");

    if (!family.isEmpty()) {
        QFont f(family);
        f.setPixelSize(16); // UI 기본 폰트 크기 지정
        app.setFont(f);
    }

    QQmlApplicationEngine engine;
    // --- START DEBUG ---
    // QDir dir(":/qml");
    // qDebug() << "Listing contents of QRC:/qml/";
    // for (const auto &entry : dir.entryList(QDir::Files | QDir::Dirs))
    //     qDebug() << " - " << entry;
    // QDir resDir(":/res");
    // qDebug() << "QRC:/res contains:";
    // for (const auto &entry : resDir.entryList(QDir::Files | QDir::Dirs))
    //     qDebug() << " - " << entry;
    // --- END DEBUG ---

    // --- C++ 백엔드 객체 QML에 등록 ---
    // 아래 객체들을 QML 전역 컨텍스트 프로퍼티로 등록하여 QML 측에서 직접 호출하고 사용할 수 있도록 합니다.
    LoginManager loginManager;
    engine.rootContext()->setContextProperty("loginManager", &loginManager);
    
    AudioController audioController;
    engine.rootContext()->setContextProperty("audioController", &audioController);

    AudioRecorder audioRecorder;
    engine.rootContext()->setContextProperty("audioRecorder", &audioRecorder);

    ScoreCalculator scoreCalculator;
    engine.rootContext()->setContextProperty("scoreCalculator", &scoreCalculator);

    ScoreSend scoreSend;
    engine.rootContext()->setContextProperty("scoreSend", &scoreSend);

    AudioUpload audioUpload;
    engine.rootContext()->setContextProperty("audioUpload", &audioUpload);

    AiUtils aiUtils;
    engine.rootContext()->setContextProperty("aiUtils", &aiUtils);

    VoiceAnalyzer voiceAnalyzer;
    engine.rootContext()->setContextProperty("voiceAnalyzer", &voiceAnalyzer);
    
    UltrasoundController ultrasoundController;
    engine.rootContext()->setContextProperty("ultrasoundController", &ultrasoundController);

    // --- QML 엔진 로딩 및 오류 처리 ---
    QObject::connect(
        &engine,
        &QQmlApplicationEngine::objectCreationFailed,
        &app,
        []() { QCoreApplication::exit(-1); },
        Qt::QueuedConnection);

    //qDebug() << "QML loading start";
    engine.load(QUrl("qrc:/qml/Main.qml"));
    //qDebug() << "QML loaded";

    // // ==========================================================
    // // ===== 전체 화면 및 상단 바 제거 코드 적용 (QML용) ======
    // // ==========================================================

    // // QML 로딩이 실패했거나, 로드된 객체가 없으면 종료
    // if (engine.rootObjects().isEmpty()) {
    //     qDebug() << "Error: Failed to load QML or no root objects found.";
    //     return -1;
    // }

    // // QML 엔진이 생성한 최상위 객체(보통 메인 윈도우)를 가져옵니다.
    // QObject *topLevelObject = engine.rootObjects().first();
    // QWindow *mainWindow = qobject_cast<QWindow*>(topLevelObject);

    // // 메인 객체가 윈도우가 아니면 오류 처리
    // if (!mainWindow) {
    //     qDebug() << "Error: The root QML object is not a QWindow.";
    //     return -1;
    // }

    // // X11 환경에서 윈도우 매니저의 제어를 받지 않도록 플래그를 설정합니다.
    // mainWindow->setFlags(mainWindow->flags() | Qt::X11BypassWindowManagerHint);

    // // 창을 전체 화면으로 표시합니다.
    // mainWindow->showFullScreen();

    // // ==========================================================

    return app.exec();
}
