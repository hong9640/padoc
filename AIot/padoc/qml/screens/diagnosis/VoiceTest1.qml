import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts
import QtQuick.Effects
import QtCharts

import "../../components"

Page {
    id: voiceTest1Page
    width: 1024
    height: 600
    property int pageIndex: 2

    RowLayout {
        anchors.fill: parent
        spacing: 0

        SideBar {
            Layout.fillHeight: true
            menuModel: ["안내", "자가 문진", "음성 검사 1", "음성 검사 2", "결과"]
            titleText: "진단 서비스"
            currentIndex: voiceTest1Page.pageIndex
            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "white"

            Text {
                id: text1
                x: 62
                y: 45
                width: 100
                height: 100
                color: "#113162"
                text: qsTr("“아”")
                font.pixelSize: 60
                font.weight: 700
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                lineHeightMode: Text.ProportionalHeight
                lineHeight: 1.5
            }

            Text {
                id: text2
                x: 62
                y: 90
                width: 700
                height: 160
                text: qsTr("  소리를 최대한 길게 녹음해주세요.\n준비가 완료되셨으면 아래 녹음 버튼을 눌러\n녹음을 진행해주세요.")
                font.pixelSize: 36
                font.weight: 700
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                lineHeightMode: Text.ProportionalHeight
                lineHeight: 1.5
            }

            MicButton {
                id: micButton
                x: 304
                y: 324
                onClicked: {
                    ultrasoundController.stopProcess();
                    mainStackView.push("qrc:/qml/screens/diagnosis/VoiceTesting1.qml")
                }
            }
        }
    }
}
