import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Effects

Rectangle {
    id: micButton
    width: 217
    height: 217
    visible: true
    radius: 100
    color: "#00ffffff"

    signal clicked()

    Image {
        id: image
        width: 217
        height: 217
        source: "../../resource/images/Mic_button.png"
        sourceSize.height: 217
        sourceSize.width: 217
        fillMode: Image.PreserveAspectFit
    }

    MouseArea {
        anchors.fill: parent
        onClicked: {
            micButton.clicked()    // emit 시그널을 외부로 보냄
        }
        cursorShape: Qt.PointingHandCursor
    }
}
