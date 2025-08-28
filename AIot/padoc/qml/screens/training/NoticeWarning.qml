import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: noticeWarningPage

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
            menuModel: ["안내"]
            // 사이드바 제목
            titleText: "음성 트레이닝\n서비스"
            // 현재 페이지의 인덱스 전달
            currentIndex: noticeWarningPage.pageIndex

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
                    text: "주의 사항"
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
                        spacing: 10

                        Text {
                            text: "해당 서비스는 일반적인 재활 보조 목적의"
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }

                        Text {
                            text: "정보 및 기능을 제공하며,"
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }

                        Text {
                            text: "전문 의료 진단이나 치료를 대체하지 않습니다."
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }

                        Text {
                            text: "건강에 대한 의사결정은"
                            font.pixelSize: 27
                            font.weight: 700
                            color: "#113162"
                            anchors.horizontalCenter: parent.horizontalCenter
                        }

                        Text {
                            text: "반드시 의료 전문가와 상의하시기 바랍니다."
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
                    font.bold: true
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
                            //console.log("회원 로그인 페이지로 이동")
                            mainStackView.push("qrc:/qml/screens/training/TrainingLogin.qml")
                        }
                    }
                }
            }
        }
    }
}

