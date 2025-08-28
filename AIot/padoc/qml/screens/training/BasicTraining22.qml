import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: basicTraining22Page

    // 사이드바 인덱스 설정
    property int pageIndex: 1
    property int currentIndex: 0
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
            currentIndex: basicTraining22Page.pageIndex

            onHomeConfirmed: {
                transitionTimer.stop()
                audioRecorder.stopRecording()
                mainStackView.popToIndex(0)
            }
        }
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            Rectangle {
                x: 37
                y: 46
                width: 750
                height: 250
                border.color: "#113162"
                border.width: 4
                anchors.horizontalCenterOffset: 0
                radius: 20
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    x: 253
                    y: 202
                    color: "#8d000000"
                    Layout.alignment: Qt.AlignHCenter
                    text: qsTr("호흡 & 발성 연습 2 (" + (mainWindow.basiccount2) + " / 2)")
                    font.pixelSize: 20
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
            }

            Text {
                id: text4
                x: 114
                y: 62
                width: 596
                height: 218
                text: qsTr("잘 들어! 내가 너한테\n비밀을 말해 줄게")
                font.pixelSize: 50
                font.weight: 700
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                lineHeightMode: Text.ProportionalHeight
                lineHeight: 1.2
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
                width: rectangle.width * recordtime / 2100
                height: 50
                color: "#113162"
                radius: 50
            }
        }
    }
    // 10초 후 자동 페이지 전환
    Timer {
        id: transitionTimer
        interval: 5
        running: false
        repeat: true

        onTriggered: {
            recordtime += 1
            //console.log(recordtime)
            if(recordtime >= 2100){
                transitionTimer.stop()
                audioRecorder.stopRecording()
                //console.log("기초녹음2 10sec 끝")

                // 업로드에 필요한 파라미터 준비
                var filePath = audioRecorder.lastSavedFilePath() // C++ AudioRecorder에 이 프로퍼티가 있어야 함
                var trainingType = "voice_sentence" // 이 훈련에 맞는 타입
                var relatedId = mainWindow.basic2connect             // 관련 ID (필요 시 C++에서 가져오거나 계산)
                var userToken = mainWindow.appToken   // 로그인 시 저장된 토큰

                //console.log("파일 업로드 요청 시작:", filePath)
                statusLabel.text = "파일 업로드 중..."
                statusPopup.open()

                mainWindow.basicTraining2Paths.push(filePath)
                //console.log(mainWindow.basicTraining2Paths)

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
            //console.log(`QML: 업로드 성공! Record ID: ${recordId}, 메시지: ${message}, 나는 2번 커넥션`)
            statusLabel.text = "업로드 성공!"
            mainWindow.basic2connect = recordId
            //console.log(`QML: mainWindow.basic2connect변경완료: ${mainWindow.basic2connect}`)
            // 팝업을 1-2초 후 자동으로 닫는 Timer를 사용할 수 있습니다.
            statusPopup.close()

            if(mainWindow.basiccount2 === 2){
                mainStackView.replace("qrc:/qml/screens/training/BasicTrainingFin.qml")
            }
            else{
                mainWindow.basiccount2++;
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
