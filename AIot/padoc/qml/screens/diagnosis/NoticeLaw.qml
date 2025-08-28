import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

Page {
    id: noticeLawPage

    // 사이드바 인덱스 설정
    property int pageIndex: 0

    width: 1024
    height: 600

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
            currentIndex: noticeLawPage.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            Column {
                anchors.centerIn: parent
                spacing: 30

                // 제목
                Text {
                    text: "검사 시 안내사항"
                    font.pixelSize: 50
                    font.weight: 700
                    color: "#113162"
                    anchors.horizontalCenter: parent.horizontalCenter
                }

                // 안내 박스
                Rectangle {
                    width: 760
                    height: 280
                    border.color: "#113162"
                    border.width: 4
                    radius: 20
                    anchors.horizontalCenter: parent.horizontalCenter

                    Column {
                        anchors.centerIn: parent
                        spacing: 15

                        Text {
                            text: "측정된 값은 개인 참고용입니다."
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }

                        Text {
                            text: "의학적 상태 또는 질병의 감지, 진단, 치료에"
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }

                        Text {
                            text: "사용하기 위한 것이 아닙니다."
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }

                        Text {
                            text: "자세한 사항은 의료 전문가와의 상담이 필요합니다."
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }
                    }
                }

                // 안내 문구
                Text {
                    text: '주의사항을 모두 읽으셨으면 "동의" 버튼을 눌러주세요.'
                    font.pixelSize: 27
                    font.weight: 700
                    color: "#113162"
                    anchors.horizontalCenter: parent.horizontalCenter
                }

                Item {
                    width: parent.width
                    height: 80

                    SolidButton {
                        anchors.centerIn: parent
                        text: "동의"
                        fontSize: 30
                        bgColor: "#EAEAEA"
                        textColor: "#113162"
                        buttonWidth: 300
                        buttonHeight: 80
                        radius: 16
                        onClicked: {
                            //console.log("자가문진으로 이동")
                            mainStackView.push("qrc:/qml/screens/diagnosis/NoticeSettings.qml")
                        }
                    }
                }
            }
        }
    }
}

