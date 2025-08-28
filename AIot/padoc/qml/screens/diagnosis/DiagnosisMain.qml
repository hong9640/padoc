import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

// 컴포넌트를 import
Page {
    id: diagnosisMainPage
    width: 1024
    height: 600

    Rectangle {
        anchors.fill: parent
        width: 1024
        height: 600
        color: "#FFFFFF" // 전체 배경색
        z: -1 // 모든 UI 뒤에 배경이 위치하도록 설정
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            width: 1024
            height: 250
            color: "#113162"
            z: 1

            Text {
                anchors.centerIn: parent
                horizontalAlignment: Text.AlignHCenter
                text: "파킨슨병 자가 진단 서비스"
                font.pixelSize: 60
                font.weight: 700
                color: "white"
            }
        }

        Rectangle {
            Layout.fillHeight: true
            Layout.fillWidth: true

            RowLayout {
                anchors.centerIn: parent
                width: 1024

                Item {
                    Layout.fillWidth: true
                }

                BorderButton {
                    width: 450
                    height: 250
                    buttonText: "시작하기"
                    fontSize: 70
                    radius: 25
                    borderWidth: 12
                    borderColor: "#113162"

                    onClicked: {
                        mainWindow.checkListCount = 0
                        mainStackView.push("qrc:/qml/screens/diagnosis/NoticeLaw.qml")
                    }
                }

                Item {
                    Layout.fillWidth: true
                }

                Rectangle {
                    Layout.preferredWidth: 420
                    Layout.preferredHeight: 370
                    color: "#ffffff"
                    Layout.alignment: Qt.AlignVCenter

                    // 캐릭터 이미지
                    Image {
                        anchors.centerIn: parent
                        width: 285
                        height: 285
                        source: "qrc:/resource/images/padoc_main.png"
                        anchors.verticalCenterOffset: 42
                        anchors.horizontalCenterOffset: 67
                        fillMode: Image.PreserveAspectFit
                    }

                    // === 말풍선 버튼 영역 ===
                    Item {
                        width: 230
                        height: 190

                        Rectangle {
                            id: clickableArea
                            anchors.fill: parent
                            color: "transparent" // 투명한 배경 (눌림 효과만 적용)

                            // 눌렸을 때 애니메이션용 상태
                            property bool pressed: false
                            scale: mouseArea.pressed ? 0.97 : 1.0
                            Behavior on scale {
                                NumberAnimation {
                                    duration: 100
                                    easing.type: Easing.InOutQuad
                                }
                            }

                            // 말풍선 이미지
                            Image {
                                anchors.fill: parent
                                source: "qrc:/resource/images/speech_bubble.png"
                                fillMode: Image.PreserveAspectFit
                            }

                            // 말풍선 텍스트
                            Text {
                                anchors.centerIn: parent
                                width: parent.width
                                height: 75
                                text: "안녕하세요"
                                font.pixelSize: 30
                                font.weight: 700
                                color: "#113162"
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                                wrapMode: Text.WordWrap
                            }

                            // 클릭 감지 영역
                            // MouseArea {
                            //     id: mouseArea
                            //     anchors.fill: parent
                            //     cursorShape: Qt.PointingHandCursor
                            //     onClicked: {
                            //         //console.log("말풍선 버튼 클릭됨!")
                            //         mainStackView.push("qrc:/qml/screens/diagnosis/DiagnosisResult.qml")
                            //     }
                            // }
                        }
                    }

                    Item {
                        Layout.fillWidth: true
                    }
                }
            }
        }
    }
}
