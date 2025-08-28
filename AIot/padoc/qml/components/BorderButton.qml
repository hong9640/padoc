import QtQuick 2.15
import QtQuick.Controls 2.15

Rectangle {
    id: borderButton

    property alias buttonText: label.text
    property color borderColor: "#0E3673"
    property int borderWidth: 2
    property color bgColor: "white"
    property color textColor: "#0E3673"
    property int fontSize: 18
    property real cornerRadius: 12
    signal clicked()

    width: 150
    height: 50
    color: bgColor
    border.color: borderColor
    border.width: borderWidth
    radius: cornerRadius

    // 눌림 애니메이션: 작아졌다가 복원
    transform: Scale {
        id: pressScale
        origin.x: borderButton.width / 2
        origin.y: borderButton.height / 2
        xScale: mouseArea.pressed ? 0.96 : 1
        yScale: mouseArea.pressed ? 0.96 : 1
    }

    // 텍스트
    Text {
        id: label
        anchors.fill: parent
        wrapMode: Text.WordWrap
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        color: textColor
        font.pixelSize: fontSize
        font.weight: 700
    }

    // 클릭 감지 + 눌림 상태
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: borderButton.clicked()
    }

    // 애니메이션 부드럽게
    Behavior on transform {
        NumberAnimation {
            duration: 100
            easing.type: Easing.InOutQuad
        }
    }
}
