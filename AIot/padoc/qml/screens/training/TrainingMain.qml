import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: trainingMainPage

    // 사이드바 인덱스 설정
    property int pageIndex: 0

    // 외부에서 프로필데이터 전달
    property var profile: ({})

    width: 1024
    height: 600

    RowLayout {
        anchors.fill: parent
        spacing: 0

        SideBar {
            Layout.fillHeight: true
            // 메뉴 전달
            menuModel: ["메인", "기초연습", "심화연습"]
            // 사이드바 제목
            titleText: "음성 트레이닝\n서비스"
            // 현재 페이지의 인덱스 전달
            currentIndex: trainingMainPage.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            ColumnLayout {
                anchors.centerIn: parent
                spacing: 40

                Text {
                    text: profile
                          && profile.full_name ? profile.full_name + "님 안녕하세요\n오늘도 함께 노력해봅시다." : "안녕하세요\n오늘도 함께 노력해봅시다."
                    font.pixelSize: 40
                    horizontalAlignment: Text.AlignHCenter
                    Layout.alignment: Qt.AlignHCenter
                }

                RowLayout {
                    spacing: 40

                    Image {
                        Layout.preferredWidth: 310
                        Layout.preferredHeight: 310
                        source: "qrc:/resource/images/padoc_main.png"
                        fillMode: Image.PreserveAspectFit
                    }

                    ColumnLayout {
                        spacing: 30

                        BorderButton {
                            width: 350
                            height: 200
                            buttonText: "오늘의 훈련"
                            fontSize: 50
                            borderColor: "#113162"
                            borderWidth: 12
                            cornerRadius: 25
                            bgColor: "white"
                            textColor: "#113162"
                            onClicked: {
                                // START DEBUG =====
                                //console.log("오늘의 훈련 버튼 클릭됨")
                                // END DEBUG =====
                                mainWindow.basiccount1 = 1
                                mainWindow.basiccount2 = 1
                                mainWindow.basic2connect = -1
                                mainWindow.advancedcount1 = 1
                                mainWindow.advancedcount2 = 1
                                mainWindow.advancedcount3 = 0

                                mainStackView.push("qrc:/qml/screens/training/BasicTraining11.qml")
                            }
                        }
                    }
                }
            }
        }
    }
}
