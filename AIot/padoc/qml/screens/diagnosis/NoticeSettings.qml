import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

Page {
	id: noticeSettingPage

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
			currentIndex: noticeSettingPage.pageIndex

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

						Row {
							spacing: 10

							Text {
								width: 30
								wrapMode: Text.WordWrap
								horizontalAlignment: Text.AlignLeft
								text: "1"
								font.pixelSize: 27
								font.weight: 700
								color: "#113162"
								lineHeightMode: Text.ProportionalHeight
								lineHeight: 1.2
							}

							Text {
								width: 650
								wrapMode: Text.WordWrap
								horizontalAlignment: Text.AlignLeft
								text: "주변 소음이 최대한 차단된 환경에서 진행해주세요."
								font.pixelSize: 27
								font.weight: 700
								color: "#113162"
								lineHeightMode: Text.ProportionalHeight
								lineHeight: 1.2
							}
						}

						Row {
							spacing: 10

							Text {
								width: 30
								wrapMode: Text.WordWrap
								horizontalAlignment: Text.AlignLeft
								text: "2"
								font.pixelSize: 27
								font.weight: 700
								color: "#113162"
								lineHeightMode: Text.ProportionalHeight
								lineHeight: 1.2
							}

							Text {
								width: 650
								wrapMode: Text.WordWrap
								horizontalAlignment: Text.AlignLeft
								text: "마이크까지의 거리를 약 20~30cm 정도로 유지해주세요."
								font.pixelSize: 27
								font.weight: 700
								color: "#113162"
								lineHeightMode: Text.ProportionalHeight
								lineHeight: 1.2
							}
						}

						Row {
							spacing: 10

							Text {
								width: 30
								wrapMode: Text.WordWrap
								horizontalAlignment: Text.AlignLeft
								text: "3"
								font.pixelSize: 27
								font.weight: 700
								color: "#113162"
								lineHeightMode: Text.ProportionalHeight
								lineHeight: 1.2
							}

							Text {
								width: 650
								wrapMode: Text.WordWrap
								horizontalAlignment: Text.AlignLeft
								text: "검사는 자가 문진 → 음성 검사1 → 음성 검사2 순서로 진행됩니다."
								font.pixelSize: 27
								font.weight: 700
								color: "#113162"
								lineHeightMode: Text.ProportionalHeight
								lineHeight: 1.2
							}
						}
					}
				}

				// 안내 문구
				Text {
					text: "준비가 완료되었으면, 확인 버튼을 눌러주세요."
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
						text: "확인"
						fontSize: 30
						bgColor: "#EAEAEA"
						textColor: "#113162"
						buttonWidth: 300
						buttonHeight: 80
						radius: 16
						onClicked: {
							//console.log("자가문진으로 이동")
							if (ultrasoundController.ultrasoundRunning)
								ultrasoundController.stopUltrasound()

							// 정말 완전히 종료하고 싶다면 이 줄을 추가로 호출
							ultrasoundController.stopProcess()

							mainStackView.push("qrc:/qml/screens/diagnosis/CheckList.qml")
						}
					}
				}
			}
		}
	}

	Component.onCompleted: {
		// console.log("[Notice] startProcess()");
		if (!ultrasoundController.processRunning) {
			ultrasoundController.startProcess();
		} else {
			// 이미 떠있다면 바로 start (한 번 더 안전 체크)
			if (!ultrasoundController.ultrasoundRunning) {
				// console.log("[Notice] already running → startUltrasound()");
				ultrasoundController.startUltrasound();
			}
		}
	}

	// 프로세스가 Running이 되는 순간 startUltrasound() 송신
	Connections {
		target: ultrasoundController

		function onProcessRunningChanged() {
			//console.log("[Notice] processRunning =", ultrasoundController.processRunning);
			if (ultrasoundController.processRunning && !ultrasoundController.ultrasoundRunning) {
				//console.log("[Notice] startUltrasound()");
				ultrasoundController.startUltrasound();
			}
		}

		// 디버깅 로그 권장
		// function onLogLine(line)        { console.log("[Ultrasound]", line); }
		// function onLastErrorChanged()   { console.log("[Ultrasound][ERR]", ultrasoundController.lastError); }
	}
}
