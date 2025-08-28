import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Effects

Item {
    id: root

    // === 외부에서 조정할 속성 ===
    property alias text: buttonText.text
    property color bgColor: "#EAEAEA"
    property int fontSize: 30
    property color textColor: "#113162"
    property real radius: 16
    property real buttonWidth: 300
    property real buttonHeight: 80

    signal clicked()

    width: buttonWidth
    height: buttonHeight

    // === 눌림 애니메이션 ===
    property bool pressed: false

    Rectangle {
        id: buttonRect
        anchors.centerIn: parent
        width: buttonWidth
        height: buttonHeight
        color: bgColor
        radius: root.radius
        scale: mouseArea.pressed ? 0.97 : 1.0

        Behavior on scale {
            NumberAnimation { duration: 100; easing.type: Easing.InOutQuad }
        }

        // 텍스트
        Text {
            id: buttonText
            anchors.centerIn: parent
            color: textColor
            font.pixelSize: fontSize
            font.weight: 700
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
        }

        // 마우스 영역
        MouseArea {
            id: mouseArea
            anchors.fill: parent
            onClicked: root.clicked()
            cursorShape: Qt.PointingHandCursor
        }
    }
}
