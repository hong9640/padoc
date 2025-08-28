import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

Page {
    id: voiceTest2Page
    width: 1024
    height: 600

    // 사이드바 인덱스 설정
    property int pageIndex: 3

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
            currentIndex: voiceTest2Page.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "white"

            ColumnLayout {
                anchors.fill: parent
                spacing: 30

                // 세로 중앙을 위한 위쪽 스페이서
                Item { Layout.fillHeight: true }

                // 1) 인용문 카드
                Rectangle {
                    Layout.alignment: Qt.AlignHCenter       
                    Layout.preferredWidth: 750
                    Layout.preferredHeight: 237
                    radius: 20
                    border.width: 4
                    border.color: "#113162"

                    Text {
                        anchors.centerIn: parent
                        width: parent.width - 32
                        text: qsTr("무엇보다도 산에 오를 땐<br>더욱더 그 빼어난 아름다움이 느껴진다")
                        color: "#113162"
                        font.pixelSize: 40
                        font.weight: 700
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                        wrapMode: Text.WordWrap
                        lineHeightMode: Text.ProportionalHeight
                        lineHeight: 1.5
                    }
                }

                // 2) 안내 텍스트
                Text {
                    Layout.alignment: Qt.AlignHCenter       
                    width: 900
                    horizontalAlignment: Text.AlignHCenter
                    wrapMode: Text.WordWrap
                    text: qsTr("녹음 버튼을 누르고 위 문장을 자연스럽게 읽어주세요.")
                    font.pixelSize: 27
                    font.weight: 700
                }

                // 3) 마이크 버튼
                MicButton {
                    Layout.alignment: Qt.AlignHCenter
                    id: micButton
                    onClicked: {
                        console.log("녹음2")
                        mainStackView.push(
                            "qrc:/qml/screens/diagnosis/VoiceTesting2.qml",
                            { "testing1Path": testing1Path }
                        )
                        console.log(testing1Path)
                    }
                }

                // 세로 중앙을 위한 아래쪽 스페이서
                Item { Layout.fillHeight: true }
            }
        }
    }
}
