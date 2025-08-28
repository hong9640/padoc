import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: basicTrainingFinPage

    // 사이드바 인덱스 설정
    property int pageIndex: -1 // 표시 안되게 처리

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
            currentIndex: basicTrainingFinPage.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            RowLayout {
                // anchors.fill: parentRect
                spacing: 0

                ColumnLayout {
                    // 말풍선
                    Rectangle {
                        width: 560
                        height: 400

                        Image {
                            anchors.fill: parent
                            source: "qrc:/resource/images/speech_bubble.png"
                            fillMode: Image.PreserveAspectFit
                        }

                        Text {
                            anchors.centerIn: parent
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                            text: "기본 훈련을 모두 끝냈어요!\n심화 훈련으로 넘어가려면 아래\n계속하기 버튼을 눌러주세요."
                            font.pixelSize: 25
                            font.weight: 700
                            lineHeightMode: Text.ProportionalHeight
                            lineHeight: 1.2
                        }
                    }

                    RowLayout {
                        Layout.fillHeight: true
                        Layout.fillWidth: true
                        spacing: 20

                        Item {
                            Layout.fillWidth: true
                        }

                        BorderButton {
                            width: 210
                            height: 160
                            buttonText: "계속\n하기"
                            fontSize: 50
                            borderColor: "#113162"
                            borderWidth: 8
                            cornerRadius: 25
                            bgColor: "white"
                            textColor: "#113162"
                            onClicked: {
                                // START DEBUG =====
                                //console.log("계속하기 버튼이 클릭됨")
                                // END DEBUG =====
                                mainStackView.push(
                                            "qrc:/qml/screens/training/AdvancedTraining11.qml")
                            }
                        }

                        BorderButton {
                            width: 210
                            height: 160
                            buttonText: "그만\n하기"
                            fontSize: 50
                            borderColor: "#113162"
                            borderWidth: 8
                            cornerRadius: 25
                            bgColor: "white"
                            textColor: "#113162"
                            onClicked: {
                                // START DEBUG =====
                                //console.log("그만하기 버튼 클릭됨")
                                // END DEBUG =====
                                mainStackView.push(
                                            "qrc:/qml/screens/training/TrainingLoading.qml")
                            }
                        }

                        Item {
                            Layout.fillWidth: true
                        }
                    }
                }
                Rectangle {
                    Image {
                        x: -30
                        width: 300
                        height: 300
                        source: "qrc:/resource/images/padoc_main.png"
                        fillMode: Image.PreserveAspectFit
                    }
                }
            }
        }
    }
}
