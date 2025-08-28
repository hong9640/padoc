import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

// 컴포넌트를 import
Page {
    id: voiceTesting1Page
    width: 1024
    height: 600

    // 사이드바 인덱스 설정
    property int pageIndex: 2
    property int recordtime: 100

    property bool savedThisRound: false
    property var testing1Path: []

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
            currentIndex: voiceTesting1Page.pageIndex

            onHomeConfirmed: {
                audioRecorder.stopRecording()
                mainStackView.popToIndex(0)
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            Column {
                anchors.centerIn: parent
                spacing: 24

                // 이미지 행
                Item {
                    // x: -50
                    width: parent.width
                    height: basic_training_1.implicitHeight
                    Image {
                        id: basic_training_1
                        y: -212
                        anchors.horizontalCenter: parent.horizontalCenter
                        source: "../../../resource/images/ah_const.png"
                        width: 700
                        height: 200
                        fillMode: Image.PreserveAspectFit
                    }
                }

                // 텍스트 행
                Item {
                    width: parent.width
                    height: text1.implicitHeight
                    Text {
                        id: text1
                        y: 34
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: qsTr("녹음 중입니다...")
                        font.pixelSize: 40
                        anchors.horizontalCenterOffset: 0
                        font.weight: 700
                        color: "#113162"
                    }
                }

                // 진행바 행
                Item {
                    width: parent.width
                    height: 50

                    Rectangle {
                        id: rectangle
                        y: 156
                        anchors.horizontalCenter: parent.horizontalCenter
                        width: 600
                        height: 50
                        color: "#cccccc"
                        radius: 50
                        anchors.horizontalCenterOffset: 0

                        Rectangle {
                            width: rectangle.width * recordtime / 1100
                            height: 50
                            color: "#113162"
                            radius: 50
                        }
                    }
                }
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
            if (recordtime >= 1100) {
                stop()
                audioRecorder.stopRecording()
                //console.log("녹음1 5sec 끝")

                var path = audioRecorder.lastSavedFilePath()
                if (!savedThisRound && path && path.length > 0) {
                    testing1Path.push(path)
                    savedThisRound = true
                }

                mainStackView.push("qrc:/qml/screens/diagnosis/VoiceTest2.qml",
                                   {
                                       "testing1Path": testing1Path // 필요하면 testing1Path.slice() 로 복사본
                                   })

                //console.log(testing1Path)
            }
        }
    }

    Component.onCompleted: {
        audioRecorder.startRecording("output.wav")
        transitionTimer.start()
    }
}
