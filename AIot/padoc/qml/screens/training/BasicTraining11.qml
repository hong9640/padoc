import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: basicTraining11Page

    // 사이드바 인덱스 설정
    property int pageIndex: 1

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
            currentIndex: basicTraining11Page.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            Rectangle {
                x: 37
                y: 46
                width: 750
                height: 250
                border.width: 4
                radius: 20

                Text {
                    x: 253
                    y: 202
                    color: "#8d000000"
                    Layout.alignment: Qt.AlignHCenter
                    text: qsTr("호흡 & 발성 연습 1 (" + (mainWindow.basiccount1) + " / 3)")
                    font.pixelSize: 20
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    // font.weight: 700
                }

                Text {
                    x: 45
                    y: 25
                    width: 660
                    height: 171
                    Layout.alignment: Qt.AlignHCenter
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    text: "한 번에 숨을 깊이 들이 쉰 다음 숨을 내쉬면서\n'아' 발성을 내어 보세요.\n천천히 가능한 길고 크게 발성해보세요."
                    font.pixelSize: 30
                    font.weight: 700
                }
            }

            RowLayout {
                Layout.alignment: Qt.AlignHCenter // 레이아웃 내에서 가운데 정렬
                spacing: 40
            }

            MicButton {
                x: 304
                y: 335
                onClicked: {
                    //console.log("녹음1")
                    // 보통은 초음파만 멈추고 프로세스는 계속 켜 둔다(다음 페이지도 빠르게 제어 가능)
                    if (ultrasoundController.ultrasoundRunning)
                        ultrasoundController.stopUltrasound()

                    // 정말 완전히 종료하고 싶다면 이 줄을 추가로 호출 (선택)
                    ultrasoundController.stopProcess()
                    mainStackView.push(
                                "qrc:/qml/screens/training/BasicTraining12.qml")
                }
            }
        }
    }

    // 페이지가 생성되면 파이썬 프로세스를 '준비'만 한다.
	// 실제 start는 프로세스가 Running이 된 다음에 보낸다.
	Component.onCompleted: {
		//console.log("[Notice] startProcess()");
		if (!ultrasoundController.processRunning) {
			ultrasoundController.startProcess();
		} else {
			// 이미 떠있다면 바로 start (한 번 더 안전 체크)
			if (!ultrasoundController.ultrasoundRunning) {
				//console.log("[Notice] already running → startUltrasound()");
				ultrasoundController.startUltrasound();
			}
		}
	}

	// 프로세스가 Running이 되는 순간 startUltrasound() 송신
	Connections {
		target: ultrasoundController

		function onProcessRunningChanged() {
            // console.log("[Notice] processRunning =", ultrasoundController.processRunning);
			if (ultrasoundController.processRunning && !ultrasoundController.ultrasoundRunning) {
                // console.log("[Notice] startUltrasound()");
				ultrasoundController.startUltrasound();
			}
		}
	}
}
