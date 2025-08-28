import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtCharts

import "../../components"

Page {
    id: advancedTraining31Page

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
            currentIndex: advancedTraining31Page.pageIndex

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
                    text: qsTr("크고 작게 말하기")
                    font.pixelSize: 40
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.bold: true
                }

                Text {
                    id: text3
                    x: 5
                    y: 95
                    width: 741
                    height: 95
                    text: qsTr("각 음절을 지시에 따라 크게 또는 작게 말하세요.")
                    font.pixelSize: 25
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
            }

            // 좌측 버튼: BorderButton 컴포넌트
            BorderButton {
                x: 272
                y: 357
                width: 281
                height: 179
                buttonText: "시작"
                fontSize: 70
                borderColor: "#113162"
                borderWidth: 12
                cornerRadius: 25
                bgColor: "white"
                textColor: "#113162"
                onClicked: {
                    //console.log("심화녹음3-1")
                    mainStackView.push("qrc:/qml/screens/training/AdvancedTraining32.qml")
                }
            }
        }

    }
}
