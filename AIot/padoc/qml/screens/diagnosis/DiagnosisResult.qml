import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

Page {
    id: diagnosisResultPage
    width: 1024
    height: 600

    property int pageIndex: 4
    property var anResult
    // 음성 분석 결과 객체
    property var aiResult

    // AI 진단 결과
    RowLayout {
        anchors.fill: parent
        spacing: 0

        SideBar {
            Layout.fillHeight: true
            menuModel: ["안내", "자가 문진", "음성 검사 1", "음성 검사 2", "결과"]
            titleText: "진단 서비스"
            currentIndex: diagnosisResultPage.pageIndex
            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        // --- 메인 콘텐츠 영역 ---
        // 기존 Rectangle을 주 컨텐츠 영역으로 사용하고, 내부에 RowLayout을 배치하여 좌우 분할
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "white"

            RowLayout {
                id: mainRowLayout
                anchors.fill: parent
                anchors.margins: 10 // 전체적인 여백
                spacing: 10 // 좌우 컬럼 사이의 간격

                // --- 왼쪽 컬럼 ---
                ColumnLayout {
                    id: leftColLayout
                    Layout.preferredWidth: (mainRowLayout.width / 2) - 20
                    Layout.fillHeight: true

                    Rectangle {
                        id: leftTopRectangle
                        Layout.fillWidth: true
                        Layout.fillHeight: true

                        // color: "red"
                        ColumnLayout {
                            spacing: 0
                            anchors.fill: parent
                            anchors.margins: 15 // 전체적인 여백

                            Text {
                                text: "자가문진 결과"
                                font.pixelSize: 25
                                font.bold: true
                                color: "#113162"
                            }

                            Rectangle {
                                Layout.fillWidth: true
                                Layout.preferredHeight: (leftTopRectangle.height * 3) / 4
                                border.width: 4
                                border.color: "#113162"
                                radius: 12

                                Text {
                                    anchors.centerIn: parent
                                    horizontalAlignment: Text.AlignHCenter
                                    textFormat: Text.RichText
                                    text: "사용자님의 <span style='color:#113162; font-weight:700'>자가 문진 점수</span>는<br><span style='color:#113162; font-weight:700'>" + (mainWindow.checkListCount) + "점</span>으로 " + (mainWindow.checkListCount >= 2 ? "파킨슨 증상이 의심되니<br>전문의와 상의하십시오." : "파킨슨 증상이<br>의심되지 않습니다.")
                                    font.pixelSize: 22
                                    font.weight: 700
                                    lineHeightMode: Text.ProportionalHeight
                                    lineHeight: 1.5
                                }
                            }
                        }
                    }

                    Rectangle {
                        id: leftBottomRectangle
                        Layout.fillWidth: true
                        Layout.fillHeight: true

                        ColumnLayout {
                            spacing: 0
                            anchors.fill: parent
                            anchors.margins: 15 // 전체적인 여백

                            Text {
                                text: "AI 음성 진단"
                                font.pixelSize: 25
                                font.weight: 700
                                color: "#113162"
                            }

                            Rectangle {
                                Layout.fillWidth: true
                                Layout.preferredHeight: (leftTopRectangle.height * 3) / 4
                                border.width: 4
                                border.color: "#113162"
                                radius: 12

                                Text {
                                    anchors.centerIn: parent
                                    horizontalAlignment: Text.AlignHCenter
                                    text: aiResult === "0" ? "AI진단 결과<br>파킨슨의 가능성이 낮습니다." : "AI진단 결과<br>파킨슨의 가능성이 높습니다.<br>정확한 진단을 위해<br>상담을 권유드립니다."
                                    font.pixelSize: 22
                                    font.weight: 700
                                    lineHeightMode: Text.ProportionalHeight
                                    lineHeight: 1.5
                                }
                            }
                        }
                    }
                }

                // --- 오른쪽 컬럼 ---
                ColumnLayout {
                    id: rightColLayout
                    Layout.preferredWidth: (mainRowLayout.width / 2) - 20
                    Layout.fillHeight: true

                    Rectangle {
                        id: rightTopRectangle
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        Layout.preferredHeight: 3

                        ColumnLayout {
                            spacing: 5
                            anchors.fill: parent
                            anchors.margins: 15 // 전체적인 여백

                            Text {
                                text: "음성 분석"
                                font.pixelSize: 25
                                font.bold: true
                                color: "#113162"
                            }

                            Rectangle {
                                Layout.fillWidth: true
                                Layout.fillHeight: true
                                border.color: "#113162"
                                border.width: 4
                                radius: 12

                                anchors.margins: 0

                                Item {
                                    id: centerWrap
                                    anchors.fill: parent
                                    anchors.margins: 15
                                    anchors.topMargin: 20
                                    anchors.bottomMargin: 20

                                    ColumnLayout {
                                        anchors.centerIn: parent
                                        spacing: 15

                                        ColumnLayout {
                                            Layout.fillWidth: true
                                            spacing: 10

                                            // Jitter (정상 ≤ 0.005, 작을수록 좋음)
                                            HBarChart {
                                                Layout.fillWidth: true
                                                titleText: "Jitter"
                                                textWeight: 700
                                                barBorder: 0
                                                measure: anResult.localJitter
                                                rangeMin: 0
                                                rangeMax: 0.05
                                                okThreshold: 0.005
                                                higherIsBetter: false
                                            }

                                            Text {
                                                Layout.fillWidth: true
                                                wrapMode: Text.WordWrap
                                                text: "작을수록 발성이 더 안정적입니다."
                                                color: "#666"
                                                font.pixelSize: 12
                                            }
                                        }

                                        ColumnLayout {
                                            Layout.fillWidth: true
                                            spacing: 10

                                            // Shimmer (정상 ≤ 0.025)
                                            HBarChart {
                                                Layout.fillWidth: true
                                                titleText: "Shimmer"
                                                textWeight: 700
                                                barBorder: 0
                                                measure: anResult.localShimmer
                                                rangeMin: 0
                                                rangeMax: 0.25
                                                okThreshold: 0.025
                                                higherIsBetter: false
                                            }

                                            Text {
                                                Layout.fillWidth: true
                                                wrapMode: Text.WordWrap
                                                text: "작을수록 소리가 더 고르고 깨끗하게 들립니다."
                                                color: "#666"
                                                font.pixelSize: 12
                                            }
                                        }

                                        ColumnLayout {
                                            Layout.fillWidth: true
                                            spacing: 10

                                            // NHR (정상 ≤ 0.02)
                                            HBarChart {
                                                Layout.fillWidth: true
                                                titleText: "NHR"
                                                textWeight: 700
                                                barBorder: 0
                                                measure: anResult.nhr
                                                rangeMin: 0
                                                rangeMax: 0.2
                                                okThreshold: 0.02
                                                higherIsBetter: false
                                            }

                                            Text {
                                                Layout.fillWidth: true
                                                wrapMode: Text.WordWrap
                                                text: "낮을수록 맑고, 높으면 거칠게 들립니다."
                                                color: "#666"
                                                font.pixelSize: 12
                                            }
                                        }

                                        ColumnLayout {
                                            Layout.fillWidth: true
                                            spacing: 10

                                            // RangeST (정상 ≥ 3)
                                            HBarChart {
                                                Layout.fillWidth: true
                                                titleText: "RangeST"
                                                textWeight: 700
                                                barBorder: 0
                                                measure: anResult.rangeST
                                                rangeMin: 0
                                                rangeMax: 20
                                                okThreshold: 3.0
                                                higherIsBetter: true
                                            }

                                            Text {
                                                Layout.fillWidth: true
                                                wrapMode: Text.WordWrap
                                                text: "너무 좁으면 단조롭게, 지나치게 넓으면 과장되게 들리거나\n측정 오류 가능성을 의심합니다."
                                                color: "#666"
                                                font.pixelSize: 12
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
