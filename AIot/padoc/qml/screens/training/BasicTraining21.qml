import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: basicTraining21Page

    // 사이드바 인덱스 설정
    property int pageIndex: 1
    property int currentIndex: 0

    width: 1024
    height: 600

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
            currentIndex: basicTraining21Page.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
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
                    id: text3
                    x: 5
                    y: 78
                    width: 741
                    height: 95
                    text: qsTr("다음 문장을 부드러운 목소리로 말해보세요.")
                    font.pixelSize: 30
                    font.weight: 700
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }

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

            MicButton {
                id: micButton
                x: 304
                y: 335
                onClicked: {
                    //console.log("기초녹음2-1")
                    mainStackView.push(
                                "qrc:/qml/screens/training/BasicTraining22.qml")
                }
            }
        }
    }
}
