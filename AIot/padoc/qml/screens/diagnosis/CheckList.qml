import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

// 컴포넌트를 import
Page {
    id: checkListPage
    width: 1024
    height: 600

    // 사이드바 인덱스 설정
    property int pageIndex: 1
    property int currentIndex: 0

    // 질문 목록
    property var questions: ["입술, 턱, 손, 팔, 또는 다리가\n가만히 있을 때 떨립니까?", "걸을 때 발을 끌거나\n걸음의 폭이 좁아졌습니까?", "평소 일상 활동에서 움직임이 느려졌습니까?\n(예: 머리빗기, 양말신기, 목욕, 식사 등)", "스스호 혹은 다른 사람들이 보기에\n걸을 때 팔을 잘 흔들지 않습니까?", "목소리가 작아졌습니까? ", "얼굴이 무표정 해졌습니까?", "전보다 냄새를 잘 못 맡습니까?", "꿈을 꿀 때 말하거나 소리를 지르거나\n욕하거나 크게 웃는 일이 발생합니까?", "걷기 시작하거나 방향을 바꿀 때 발이 바닥에\n붙은 것 같이 잘 안떨어진 적이 있습니까?"]

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
            currentIndex: checkListPage.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            ColumnLayout {
                anchors.centerIn: parent
                anchors.margins: 20
                Layout.fillHeight: true
                Layout.fillWidth: true
                spacing: 20

                Rectangle {
                    width: 750
                    height: 350

                    radius: 20
                    border.width: 4
                    border.color: "#113162"

                    Text {
                        anchors.centerIn: parent
                        horizontalAlignment: Text.AlignHCenter
                        text: qsTr(questions[currentIndex])
                        font.pixelSize: 40
                        font.weight: 700
                        lineHeightMode: Text.ProportionalHeight
                        lineHeight: 1.5
                    }

                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        anchors.bottom: parent.bottom
                        anchors.bottomMargin: 30
                        color: "#68000000"
                        text: qsTr("(" + (currentIndex + 1) + " / 9)")
                        font.pixelSize: 20
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 0

                    SolidButton {
                        id: solidButton1
                        width: 350
                        height: 150
                        text: qsTr("예")
                        fontSize: 50
                        bgColor: "#d2ecff"
                        textColor: "#000000"
                        buttonHeight: 150
                        buttonWidth: 350
                        onClicked: {
                            if (currentIndex < questions.length - 1) {
                                currentIndex++
                                mainWindow.checkListCount++
                                //console.log("예")
                            } else {
                                //console.log("예")
                                //console.log("음성 검사 1 이동")
                                mainWindow.checkListCount++
                                mainStackView.push(
                                            "qrc:/qml/screens/diagnosis/VoiceTest1.qml")
                            }
                        }
                    }

                    Item {
                        Layout.fillWidth: true
                    }

                    SolidButton {
                        id: solidButton2
                        width: 350
                        height: 150
                        text: qsTr("아니오")
                        fontSize: 50
                        textColor: "#000000"
                        bgColor: "#ffdada"
                        buttonWidth: 350
                        buttonHeight: 150
                        onClicked: {
                            if (currentIndex < questions.length - 1) {
                                currentIndex++
                                //console.log("아니오")
                            } else {
                                //console.log("아니오")
                                //console.log("진단 세팅 화면 이동")
                                mainStackView.push(
                                            "qrc:/qml/screens/diagnosis/VoiceTest1.qml")
                            }
                        }
                    }
                }
            }
        }
    }
}
