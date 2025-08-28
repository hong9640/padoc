import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../components"

Page {
    id: mainScreenPage
    width: 1024
    height: 600

    // 전체 페이지 배경
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
            color: "#113162" // 짙은 파란색 배경

            // 헤더 안의 텍스트를 세로로 정렬
            ColumnLayout {
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.verticalCenter: parent.verticalCenter
                spacing: 30

                // 소제목 텍스트
                Text {
                    Layout.fillWidth: true
                    horizontalAlignment: Text.AlignHCenter
                    color: "#ffffff"
                    text: "파킨슨병 자가 진단 및 트레이닝 서비스"
                    font.pixelSize: 30
                    font.weight: 700
                }

                // 메인 제목 텍스트
                Text {
                    Layout.fillWidth: true
                    horizontalAlignment: Text.AlignHCenter
                    color: "#ffffff"
                    text: "파닥: 파킨슨 닥터"
                    font.pixelSize: 60
                    font.weight: 700
                }
            }
        }

        Rectangle {
            Layout.fillHeight: true
            Layout.fillWidth: true

            RowLayout {
                anchors.centerIn: parent
                width: 1024
                spacing: 30

                Item {
                    Layout.fillWidth: true
                }

                BorderButton {
                    width: 350
                    height: 250
                    buttonText: "자가\n진단"
                    fontSize: 70
                    borderColor: "#113162"
                    borderWidth: 12
                    cornerRadius: 25
                    bgColor: "white"
                    textColor: "#113162"
                    onClicked: {
                        //console.log("자가진단 버튼 클릭됨")
                        mainStackView.push(
                                    "qrc:/qml/screens/diagnosis/DiagnosisMain.qml")
                    }
                }

                Item {
                    Layout.fillWidth: true
                }

                BorderButton {
                    width: 350
                    height: 250
                    buttonText: "음성\n트레이닝"
                    fontSize: 70
                    borderColor: "#113162"
                    borderWidth: 12
                    cornerRadius: 25
                    bgColor: "white"
                    textColor: "#113162"
                    onClicked: {
                        //console.log("음성트레이닝 버튼 클릭됨")
                        mainStackView.push(
                                    "qrc:/qml/screens/training/NoticeWarning.qml")
                    }
                }

                Item {
                    Layout.fillWidth: true
                }
            }
        }
    }
}
