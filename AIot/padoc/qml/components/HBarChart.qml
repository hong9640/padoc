import QtQuick 2.15
import QtQuick.Layouts 1.15
import QtQuick.Controls 2.15

Item {
    id: root

    // 내용만큼 암시 크기
    implicitWidth: col.implicitWidth
    implicitHeight: col.implicitHeight

    // 표시 텍스트
    property string titleText: "Default"
    property int textSize: 20
    property int textWeight: 500

    // 값/범위/임계 (이름 명확화)
    property real measure: 0.0        // 측정값
    property real rangeMin: 0.0       // 최소
    property real rangeMax: 1.0       // 최대
    property real okThreshold: 0.5    // 정상 경계
    property bool higherIsBetter: true // 큰 값이 좋음 여부

    // 스타일
    property int barHeight: 20
    property int barRadius: 20
    property int barBorder: 1
    property color barBgColor: "#e6e9ee"
    property color barOkColor: "green"
    property color barBadColor: "red"

    // 내부 계산
    readonly property real progress: (rangeMax > rangeMin)
        ? Math.max(0, Math.min(1, (measure - rangeMin) / (rangeMax - rangeMin)))
        : 0
    readonly property bool isOk: higherIsBetter
        ? (measure >= okThreshold)
        : (measure <= okThreshold)

    ColumnLayout {
        id: col
        spacing: 8

        Text {
            text: root.titleText
            font.pixelSize: root.textSize
            font.weight: root.textWeight
            color: "#113162"
        }

        RowLayout {
            spacing: 8

            Text {
                text: qsTr("낮음🔻")
                font.pixelSize: root.textSize
                font.weight: root.textWeight
            }

            Rectangle {
                id: bar
                Layout.fillWidth: true
                implicitWidth: 200
                height: root.barHeight
                radius: root.barRadius
                border.width: root.barBorder
                color: root.barBgColor
                clip: true

                Rectangle {
                    height: parent.height
                    width: parent.width * root.progress
                    radius: root.barRadius
                    color: root.isOk ? root.barOkColor : root.barBadColor
                }
            }

            Text {
                text: qsTr("높음🔺")
                font.pixelSize: root.textSize
                font.weight: root.textWeight
            }
        }
    }
}
