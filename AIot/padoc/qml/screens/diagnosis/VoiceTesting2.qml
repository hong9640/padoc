import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts
import QtQuick.Effects

import "../../components" // 컴포넌트를 import

Page {
    id: voiceTesting2Page
    width: 1024
    height: 600

    // 사이드바 인덱스 설정
    property int pageIndex: 3
    property int recordtime: 100

    property bool savedThisRound: false
    property var testing1Path: []
    property var testing2Path: []

    RowLayout {
        anchors.fill: parent
        spacing: 0

        SideBar {
            Layout.fillHeight: true
            // 메뉴 전달
            menuModel: ["안내", "자가 문진", "음성 검사 1", "음성 검사 2", "결과"]
            // 사이드바 제목
            titleText: "진단 서비스"
            // 현재 페이지의 인덱스 전달
            currentIndex: voiceTesting2Page.pageIndex

            onHomeConfirmed: {
                audioRecorder.stopRecording()
                mainStackView.popToIndex(0)
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"


            Rectangle {
                y: 74
                width: 749
                height: 237
                border.color: "#113162"
                border.width: 4
                anchors.horizontalCenterOffset: 0
                radius: 20
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    id: text2
                    x: 33
                    y: 69
                    width: 684
                    height: 100
                    color: "#113162"
                    text: qsTr("무엇보다도 산에 오를 땐<br>더욱더 그 빼어난 아름다움이 느껴진다")
                    font.pixelSize: 40
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.weight: 700
                    lineHeightMode: Text.ProportionalHeight
                    lineHeight: 1.5
                }
            }

            Rectangle {
                id: rectangle
                x: 112
                y: 433
                width: 600
                height: 50
                color: "#cccccc"
                radius: 50
            }

            Rectangle {
                id: rectangle1
                x: 112
                y: 433
                width: rectangle.width * recordtime / 2100
                height: 50
                color: "#113162"
                radius: 50
            }
            Text {
                id: text1
                x: 56
                y: 317
                width: 712
                height: 126
                text: qsTr("녹음 중입니다...")
                font.pixelSize: 40
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                font.bold: true
            }
        }
    }


    Timer {
        id: transitionTimer
        interval: 5 // 밀리초 단위 (10초)
        running: false
        repeat: true

        onTriggered: {
            recordtime += 1
            //console.log(recordtime)
            if(recordtime >= 2100){
                stop()
                audioRecorder.stopRecording()
                //console.log("녹음2 10sec 끝")

                var path = audioRecorder.lastSavedFilePath()
                if (!savedThisRound && path && path.length > 0) {
                    testing2Path.push(path)
                    savedThisRound = true
                }

                mainStackView.push("qrc:/qml/screens/diagnosis/DiagnosisLoading.qml", {
                                       "saveTesting1Path": testing1Path,
                                       "saveTesting2Path": testing2Path
                                   })
                //console.log(testing1Path)
                //console.log(testing2Path)
            }
        }
    }

    Component.onCompleted: {
        transitionTimer.start()
        audioRecorder.startRecording("output.wav")
    }
}
