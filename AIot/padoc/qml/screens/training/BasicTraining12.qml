import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: basicTraining12Page

    // 사이드바 인덱스 설정
    property int pageIndex: 1

    // 음성 훈련
    property int currentTraining: 1
    property int recordtime: 100

    width: 1024
    height: 600

    // 추가: 업로드 상태를 사용자에게 보여주기 위한 팝업 (간단한 예시)
    Popup {
        id: statusPopup
        x: 362
        y: 250
        width: 300
        height: 100
        modal: true
        focus: true
        closePolicy: Popup.CloseOnEscape | Popup.CloseOnOutsiceClicked

        Label {
            id: statusLabel // <-- 여기에 id를 부여합니다!
            anchors.centerIn: parent
            text: "업로드 중..."
        }
    }


    RowLayout {
        anchors.fill: parent
        spacing: 0

        SideBar {
            Layout.fillHeight: true
            // 메뉴 전달
            menuModel: ["메인", "기초연습", "심화연습", "결과"]
            // 사이드바 제목
            titleText: "음성 트레이닝\n서비스"
            // 현재 페이지의 인덱스 전달
            currentIndex: basicTraining12Page.pageIndex

            onHomeConfirmed: {
                transitionTimer.stop()
                audioRecorder.stopRecording()
                mainStackView.popToIndex(0)
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            Rectangle {
                x: 37
                y: 46
                width: 750
                height: 250
                border.width: 4
                radius: 20

                Text {
                    x: 253
                    y: 202
                    color: "#8d000000"
                    Layout.alignment: Qt.AlignHCenter
                    text: qsTr("호흡 & 발성 연습 1 (" + (mainWindow.basiccount1) + " / 3)")
                    font.pixelSize: 20
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }

                Image {
                    id: basic_training_1
                    x: 93
                    y: 33
                    width: 564
                    height: 185
                    source: "../../../resource/images/ah_const.png"
                    sourceSize.height: 200
                    sourceSize.width: 750
                    fillMode: Image.PreserveAspectFit
                }
            }

            Rectangle {
                id: rectangle
                x: 112
                y: 423
                width: 600
                height: 50
                color: "#cccccc"
                radius: 50
            }

            Rectangle {
                id: rectangle1
                x: 112
                y: 423
                width: rectangle.width * recordtime / 1100
                height: 50
                color: "#113162"
                radius: 50
            }
        }
    }

    // 5초 후 자동 페이지 전환
    Timer {
        id: transitionTimer
        interval: 5
        running: false
        repeat: true

        onTriggered: {
            recordtime += 1
            //console.log(recordtime)
            if(recordtime >= 1100){
                transitionTimer.stop()
                audioRecorder.stopRecording()
                //console.log("기초녹음1 5sec 끝")

                // 업로드에 필요한 파라미터 준비
                var filePath = audioRecorder.lastSavedFilePath() // C++ AudioRecorder에 이 프로퍼티가 있어야 함
                var trainingType = "voice_ah" // 이 훈련에 맞는 타입
                var relatedId = -1             // 관련 ID (필요 시 C++에서 가져오거나 계산)
                var userToken = mainWindow.appToken   // 로그인 시 저장된 토큰

                //console.log("파일 업로드 요청 시작:", filePath)
                statusLabel.text = "파일 업로드 중..."
                statusPopup.open()

                mainWindow.basicTraining1Paths.push(filePath)
                //console.log(mainWindow.basicTraining1Paths)

                audioUpload.startVoiceUpload(filePath, trainingType, relatedId, userToken)

            }
        }
    }

    // C++ 객체의 시그널을 받기 위한 Connections
    Connections {
        // main.cpp에서 등록한 C++ 객체의 objectName 또는 id
        target: audioUpload

        // C++에서 uploadSuccess 시그널이 발생하면 이 함수가 호출됨
        function onUploadSuccess(recordId, message) {
            //console.log(`QML: 업로드 성공! Record ID: ${recordId}, 메시지: ${message}, 나는 1번 커넥션`)
            statusLabel.text = "업로드 성공!"
            // 팝업을 1-2초 후 자동으로 닫는 Timer를 사용할 수 있습니다.
            statusPopup.close()

            if(mainWindow.basiccount1 === 3){
                mainStackView.replace("qrc:/qml/screens/training/BasicTraining21.qml")
            }
            else{
                mainWindow.basiccount1++;
                mainStackView.pop();
            }
        }

        // C++에서 uploadFailed 시그널이 발생하면 이 함수가 호출됨
        function onUploadFailed(reason) {
            statusPopup.close()
            //console.log(`QML: 업로드 실패! 원인: ${reason}`)
            statusLabel.text = `업로드 실패:\n${reason}`
        }
    }

    Component.onCompleted: {
        audioRecorder.startRecording("output.wav")
        transitionTimer.start()
    }
}
