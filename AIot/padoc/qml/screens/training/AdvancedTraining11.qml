import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: advancedTraining11Page

    // 사이드바 인덱스 설정
    property int pageIndex: 2

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
            currentIndex: advancedTraining11Page.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            Rectangle {
                y: 49
                width: 750
                height: 250
                border.color: "#113162"
                border.width: 4
                anchors.horizontalCenterOffset: 0
                radius: 20
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    id: text2
                    x: 0
                    y: 15
                    width: 750
                    height: 52
                    color: "#000000"
                    text: qsTr("점점 크게 말하기 (" + (mainWindow.advancedcount1) + " / 3)")
                    font.pixelSize: 40
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.bold: true
                }

                Text {
                    id: text3
                    x: 9
                    y: 106
                    width: 741
                    height: 95
                    text: qsTr("한 번에 숨을 깊이 들이 쉰 다음 숨을 내쉬면서\n'아' 발성을 내어보세요.\n천천히 점점 큰 소리로 변화시키면서 발성해보세요.")
                    font.pixelSize: 25
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    lineHeightMode: Text.ProportionalHeight
                    lineHeight: 1.2
                }
            }


            MicButton {
                id: micButton
                x: 570
                y: 341
                onClicked: {
                    //console.log("심화녹음1-1")
                    mainStackView.push("qrc:/qml/screens/training/AdvancedTraining12.qml")
                }
            }

            Image {
                id: basic_training_3
                x: 15
                y: 360
                width: 549
                height: 198
                horizontalAlignment: Image.AlignHCenter
                source: "../../../resource/images/ah_louder.png"
                fillMode: Image.PreserveAspectFit
            }

        }

    }
}
