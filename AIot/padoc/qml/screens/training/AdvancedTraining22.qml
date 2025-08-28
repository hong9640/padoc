import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import QtCharts
import "../../components"

Page {
    id: advancedTraining22Page

    // 사이드바 인덱스 설정
    property int pageIndex: 2

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
            currentIndex: advancedTraining22Page.pageIndex

            onHomeConfirmed: {
                mainStackView.popToIndex(0)
                audioController.stop()
            }
        }
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            Rectangle {
                y: 49
                width: 750
                height: 250
                border.color: "#113162"
                border.width: 4
                anchors.horizontalCenterOffset: 0
                radius: 20
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    id: text2
                    x: 0
                    y: 15
                    width: 750
                    height: 52
                    color: "#000000"
                    text: qsTr("점점 작게 말하기 (" + (mainWindow.advancedcount2) + " / 3)")
                    font.pixelSize: 40
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.bold: true
                }

                Text {
                    id: text3
                    x: 9
                    y: 106
                    width: 741
                    height: 95
                    text: qsTr("한 번에 숨을 깊이 들이 쉰 다음 숨을 내쉬면서\n'아' 발성을 내어보세요.\n큰 소리에서 천천히 점점 작은 소리로 변화시키면서 발성해보세요.")
                    font.pixelSize: 25
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    lineHeightMode: Text.ProportionalHeight
                    lineHeight: 1.2
                }
            }

            MicButton {
                id: micButton
                x: 570
                y: 341
                onClicked: {
                    audioController.stop()

                    var finalScore = scoreCalculator.calculateScoreUD(dbSeries,-1)

                    if (finalScore < 0) {
                        //console.log("점수 계산 중 에러 발생, 코드:", finalScore)
                    } else {
                        //console.log("계산된 최종 점수:", finalScore)
                        // 이제 finalScore 변수를 사용해 UI 업데이트 등 다른 작업 수행
                    }

                    //console.log("녹음 중지")
                    //console.log("심화녹음2-2")
                    mainWindow.totalProgress++
                    mainWindow.totalScore += finalScore
                    if(mainWindow.advancedcount2 === 3){
                        mainStackView.push(
                                    "qrc:/qml/screens/training/AdvancedTraining31.qml")
                    }
                    else{
                        mainWindow.advancedcount2++;
                        mainStackView.pop();
                    }
                }
            }

            ChartView {
                id: dbChart
                x: 111
                y: 350
                width: 453
                height: 200
                antialiasing: true
                legend.visible: false
                ValueAxis {
                    id: dbAxisX
                    min: 0
                    max: 200
                    labelsVisible: false
                    gridVisible: false
                    lineVisible: false
                    tickCount: 2
                }
                ValueAxis {
                    id: dbAxisY
                    min: -50
                    max: -5
                    labelsVisible: false
                    gridVisible: false
                    lineVisible: false
                    tickCount: 2
                }
                LineSeries {
                    id: dbSeries
                    //name: "dB Level"
                    axisX: dbAxisX
                    axisY: dbAxisY
                    color: "#113162"
                    width: 6
                }
            }

            Image {
                x: 8
                y: 366
                source: "../../../resource/images/ah.png"
                fillMode: Image.PreserveAspectFit
            }

            LineSeries {
                id: waveSeries
                name: "wave Level"
                axisX: dbAxisX
                axisY: dbAxisY
            }

            Connections {
                target: audioController
                function onDbFrameUpdated(frame) {
                    // 파라미터를 명시적으로 선언
                    dbAxisX.min = frame - 100 > 0 ? frame - 100 : 5
                    dbAxisX.max = frame - 100 > 0 ? frame : 100
                    // dbAxisX.min = 0
                    // dbAxisX.max = 200
                }
            }
        }
    }
    Component.onCompleted: {
        audioController.start(waveSeries, dbSeries)
        //console.log("dB 출력 시작")
    }
}
