import QtQuick 2.15

Item {
    id: root

    // 입력 속성
    property string labelText: "Label"
    property real currentValue: 0
    property real normalThreshold: 50
    property real displayMaximum: 100

    // 컴포넌트 전체 높이
    height: 40

    Row {
        anchors.fill: parent
        anchors.verticalCenter: parent.verticalCenter
        spacing: 16

        Text {
            text: root.labelText
            width: 80
            font.pixelSize: 18
            verticalAlignment: Text.AlignVCenter
        }

        // 그래프 바 영역
        Item {
            id: barArea
            width: 300
            height: 16
            anchors.verticalCenter: parent.verticalCenter

            // 배경 바 (회색)
            Rectangle {
                anchors.fill: parent
                color: "#d3d3d3"
                radius: height / 2
            }

            // 중앙 기준점 계산
            readonly property real thresholdPosition: normalThreshold / displayMaximum

            // 채워지는 바
            Rectangle {
                id: valueFill
                color: currentValue > normalThreshold ? "#e53935" : "#43a047"
                // 바의 x 좌표 결정
                x: {
                    if (currentValue > normalThreshold) {
                        barArea.width * barArea.thresholdPosition
                    } else {
                        // 그 외의 모든 경우: 왼쪽 끝에서부터 시작
                        0
                    }
                }
                // 바의 너비 결정
                width: {
                    var currentPosition = currentValue / displayMaximum;
                    if (currentValue > normalThreshold) {
                        // Jitter가 기준보다 클 때: (현재위치 - 중앙위치) 만큼의 너비
                        barArea.width * (currentPosition - barArea.thresholdPosition)
                    } else {
                        // 그 외: 현재 위치만큼의 너비
                        barArea.width * Math.min(currentPosition, 1.0)
                    }
                }
                height: parent.height
                radius: height / 2
            }
        }

        Text {
            text: currentValue < normalThreshold ? "낮다 ↓" : "정상"
            font.pixelSize: 16
            color: valueFill.color // 바 색상과 동일하게 설정
        }
    }
}
