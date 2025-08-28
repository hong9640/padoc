import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: trainingResultPage

    width: 1024
    height: 600

    // 사이드바 인덱스 설정
    property int pageIndex: 3

    // 훈련 점수
    property var result1
    property var result2

    // 심화 훈련 점수
    property real prevScore
    property real todayScore
    property real maxScore: 100

    function initializePage() {
        //console.log("초기화 함수 실행: 훈련 점수를 설정합니다.")
        prevScore = Number.isFinite(
                    mainWindow.latestScore) ? mainWindow.latestScore : 0
        if (mainWindow.totalProgress === 0) {
            todayScore = 0
        } else {
            // C++에서 넘어온 숫자들을 명시적으로 실수(float)로 변환 후 계산
            todayScore = Math.round((parseFloat(
                                         mainWindow.totalScore) / parseFloat(
                                         mainWindow.totalProgress)))
            //console.log("계산된 Today's Score:", todayScore)
        }
    }

    Component.onCompleted: {
        initializePage()
    }

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
            currentIndex: trainingResultPage.pageIndex

            onHomeConfirmed: mainStackView.popToIndex(0)
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            RowLayout {
                anchors.centerIn: parent
                spacing: 20

                ColumnLayout {
                    spacing: 16
                    Text {
                        text: "기초 훈련 결과"
                        color: "#113162"
                        font.pixelSize: 25
                        font.bold: true
                    }

                    Rectangle {
                        width: 400
                        height: 510
                        border.width: 3
                        border.color: "#113162"
                        radius: 16

                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 15

                            // --- Jitter (정상 ≤ 0.005, 작을수록 좋음) ---
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 6

                                HBarChart {
                                    Layout.fillWidth: true
                                    titleText: "Jitter"
                                    textWeight: 700
                                    barBorder: 0
                                    measure: result1.localJitter
                                    rangeMin: 0
                                    rangeMax: 0.02 // 기존 가로폭 계산과 동일 스케일
                                    okThreshold: 0.005
                                    higherIsBetter: false
                                }
                                Text {
                                    Layout.fillWidth: true
                                    wrapMode: Text.WordWrap
                                    text: "작을수록 발성이 더 안정적입니다. (정상 ≤ 0.005)"
                                    color: "#666"
                                    font.pixelSize: 12
                                }
                            }

                            // --- Shimmer (정상 ≤ 0.025, 작을수록 좋음) ---
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 6

                                HBarChart {
                                    Layout.fillWidth: true
                                    titleText: "Shimmer"
                                    textWeight: 700
                                    barBorder: 0
                                    measure: result1.localShimmer
                                    rangeMin: 0
                                    rangeMax: 0.10 // 기존 가로폭 계산(/0.1)과 동일 스케일
                                    okThreshold: 0.025
                                    higherIsBetter: false
                                }
                                Text {
                                    Layout.fillWidth: true
                                    wrapMode: Text.WordWrap
                                    text: "작을수록 소리 크기가 더 고르고 깨끗합니다. (정상 ≤ 0.025)"
                                    color: "#666"
                                    font.pixelSize: 12
                                }
                            }

                            // // --- HNR (정상 ≥ 20, 클수록 좋음) ---
                            // ColumnLayout {
                            //     Layout.fillWidth: true
                            //     spacing: 6

                            //     HBarChart {
                            //         Layout.fillWidth: true
                            //         titleText: "HNR"
                            //         textWeight: 700
                            //         barBorder: 0
                            //         measure: result1.hnr
                            //         rangeMin: 0
                            //         rangeMax: 40            // 기존 가로폭 계산(/40)과 동일 스케일
                            //         okThreshold: 20
                            //         higherIsBetter: true
                            //     }
                            //     Text {
                            //         Layout.fillWidth: true
                            //         wrapMode: Text.WordWrap
                            //         text: "클수록 잡음이 적고 맑은 음성입니다. (정상 ≥ 20)"
                            //         color: "#666"; font.pixelSize: 12
                            //     }
                            // }

                            // --- NHR (정상 ≤ 0.02, 작을수록 좋음) ---
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 6

                                HBarChart {
                                    Layout.fillWidth: true
                                    titleText: "NHR"
                                    textWeight: 700
                                    barBorder: 0
                                    measure: result1.nhr
                                    rangeMin: 0
                                    rangeMax: 0.08 // 기존 가로폭 계산(/0.08)과 동일 스케일
                                    okThreshold: 0.02
                                    higherIsBetter: false
                                }
                                Text {
                                    Layout.fillWidth: true
                                    wrapMode: Text.WordWrap
                                    text: "작을수록 잡음이 적고 맑게 들립니다. (정상 ≤ 0.02)"
                                    color: "#666"
                                    font.pixelSize: 12
                                }
                            }

                            // // --- F0_MIN (참고용: 최저 기본주파수, Hz) ---
                            // ColumnLayout {
                            //     Layout.fillWidth: true
                            //     spacing: 6

                            //     HBarChart {
                            //         Layout.fillWidth: true
                            //         titleText: "F0_MIN (Hz)"
                            //         textWeight: 700
                            //         barBorder: 0
                            //         measure: result1.minF0
                            //         rangeMin: 50             // 일반 성인 음역 대략 범위(필요 시 조정)
                            //         rangeMax: 400
                            //         okThreshold: 50          // 참고용(상태 판정이 목적이 아니면 임계 미사용)
                            //         higherIsBetter: true
                            //     }
                            //     Text {
                            //         Layout.fillWidth: true
                            //         wrapMode: Text.WordWrap
                            //         text: "분석 구간의 최저 음높이입니다. 수치 비교용 참고 지표입니다."
                            //         color: "#666"; font.pixelSize: 12
                            //     }
                            // }

                            // // --- F0_MAX (참고용: 최고 기본주파수, Hz) ---
                            // ColumnLayout {
                            //     Layout.fillWidth: true
                            //     spacing: 6

                            //     HBarChart {
                            //         Layout.fillWidth: true
                            //         titleText: "F0_MAX (Hz)"
                            //         textWeight: 700
                            //         barBorder: 0
                            //         measure: result1.maxF0
                            //         rangeMin: 50
                            //         rangeMax: 700            // 필요 시 상한 조정
                            //         okThreshold: 50
                            //         higherIsBetter: true
                            //     }
                            //     Text {
                            //         Layout.fillWidth: true
                            //         wrapMode: Text.WordWrap
                            //         text: "분석 구간의 최고 음높이입니다. 수치 비교용 참고 지표입니다."
                            //         color: "#666"; font.pixelSize: 12
                            //     }
                            // }

                            // --- CPP (일반적으로 클수록 양호, dB) ---
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 6

                                HBarChart {
                                    Layout.fillWidth: true
                                    titleText: "CPP"
                                    textWeight: 700
                                    barBorder: 0
                                    measure: result2.cpp
                                    rangeMin: 0
                                    rangeMax: 20 // 다른 화면에서 0~20 사용하신 점 반영
                                    okThreshold: 10 // 보편적 기준 예시(환경에 맞게 조정)
                                    higherIsBetter: true
                                }

                                Text {
                                    Layout.fillWidth: true
                                    wrapMode: Text.WordWrap
                                    text: "값이 클수록 음성이 더 맑게 인지됩니다."
                                    color: "#666"
                                    font.pixelSize: 12
                                }
                            }

                            // --- CSID (값이 작을수록 정상에 가까움) ---
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 6

                                HBarChart {
                                    Layout.fillWidth: true
                                    titleText: "CSID"
                                    textWeight: 700
                                    barBorder: 0
                                    measure: result2.csid
                                    rangeMin: 0
                                    rangeMax: 100 // 스케일 예시(데이터 분포에 맞게 조정)
                                    okThreshold: 50 // 예시: 50 미만을 양호로 간주 (환경에 맞게 조정)
                                    higherIsBetter: false
                                }
                                Text {
                                    Layout.fillWidth: true
                                    wrapMode: Text.WordWrap
                                    text: "값이 낮을수록 정상에 가깝습니다."
                                    color: "#666"
                                    font.pixelSize: 12
                                }
                            }
                        }
                    }
                }

                ColumnLayout {
                    spacing: 16

                    Text {
                        text: "심화 훈련 결과"
                        color: "#113162"
                        font.pixelSize: 25
                        font.bold: true
                    }

                    Rectangle {
                        width: 330
                        height: 510
                        radius: 16
                        border.width: 3
                        border.color: "#113162"
                        color: "white"

                        Column {
                            anchors.fill: parent
                            anchors.margins: 18
                            spacing: 20

                            // ▼ 메인 공간 전체 사용, Row를 중앙에 배치
                            Item {
                                id: barArea
                                anchors.left: parent.left
                                anchors.right: parent.right
                                anchors.top: parent.top
                                anchors.bottom: parent.bottom
                                anchors.topMargin: 52 // 타이틀과의 간격
                                anchors.bottomMargin: 18
                                anchors.horizontalCenter: parent.horizontalCenter

                                Row {
                                    anchors.centerIn: parent // Item 안에서 수직·수평 완전 중앙
                                    spacing: 100

                                    // --- 이전 점수 Bar ---
                                    Column {
                                        width: 38
                                        spacing: 16

                                        // 수직 정렬 보장
                                        Text {
                                            text: trainingResultPage.prevScore + "점"
                                            font.pixelSize: 22
                                            color: "#113162"
                                            font.bold: true
                                            horizontalAlignment: Text.AlignHCenter
                                            anchors.horizontalCenter: parent.horizontalCenter
                                            width: parent.width
                                        }

                                        // Bar
                                        Item {
                                            width: parent.width
                                            height: barArea.height * 0.90

                                            Rectangle {
                                                width: parent.width
                                                height: parent.height
                                                color: "#e6e8eb"
                                                radius: width / 2
                                                anchors.horizontalCenter: parent.horizontalCenter
                                                anchors.bottom: parent.bottom

                                                Rectangle {
                                                    width: parent.width
                                                    height: parent.height * (trainingResultPage.prevScore / trainingResultPage.maxScore)
                                                    color: "#113162"
                                                    radius: width / 2
                                                    anchors.horizontalCenter: parent.horizontalCenter
                                                    anchors.bottom: parent.bottom
                                                }
                                            }
                                        }

                                        Text {
                                            text: "이전 점수"
                                            font.pixelSize: 18
                                            color: "#113162"
                                            font.bold: true
                                            horizontalAlignment: Text.AlignHCenter
                                            anchors.horizontalCenter: parent.horizontalCenter
                                            width: parent.width
                                        }
                                    }

                                    // --- 오늘 점수 Bar ---
                                    Column {
                                        width: 38
                                        spacing: 16

                                        Text {
                                            text: trainingResultPage.todayScore + "점"
                                            font.pixelSize: 22
                                            color: "#113162"
                                            font.bold: true
                                            horizontalAlignment: Text.AlignHCenter
                                            anchors.horizontalCenter: parent.horizontalCenter
                                            width: parent.width
                                        }

                                        Item {
                                            width: parent.width
                                            height: barArea.height * 0.90

                                            Rectangle {
                                                width: parent.width
                                                height: parent.height
                                                color: "#e6e8eb"
                                                radius: width / 2
                                                anchors.horizontalCenter: parent.horizontalCenter
                                                anchors.bottom: parent.bottom

                                                Rectangle {
                                                    width: parent.width
                                                    height: parent.height * (trainingResultPage.todayScore / trainingResultPage.maxScore)
                                                    color: "#113162"
                                                    radius: width / 2
                                                    anchors.horizontalCenter: parent.horizontalCenter
                                                    anchors.bottom: parent.bottom
                                                }
                                            }
                                        }

                                        Text {
                                            text: "오늘 점수"
                                            font.pixelSize: 18
                                            color: "#113162"
                                            font.bold: true
                                            horizontalAlignment: Text.AlignHCenter
                                            anchors.horizontalCenter: parent.horizontalCenter
                                            width: parent.width
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
