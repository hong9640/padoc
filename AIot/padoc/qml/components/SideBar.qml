import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: root

    // --- 외부에서 제어할 속성 ---
    property var menuModel: []
    property int currentIndex: 0
    property int barWidth: 200
    property alias titleText: label.text

    // --- 확인 팝업 제어용 속성(커스터마이즈 가능) ---
    property bool confirmOnHome: true
    property string confirmTitle: "처음 화면으로 이동"
    property string confirmMessage: "현재 진행 중인 내용을 종료하고 처음 화면으로 이동합니다.\n계속하시겠습니까?"

    // --- 외부로 보낼 신호 ---
    /** 새 신호: 확인 버튼이 눌렸을 때만 발신 */
    signal homeConfirmed
    /** 선택: 취소 시 알리고 싶으면 사용 */
    signal homeCancelled
    /** 하위호환: 기존 신호도 '확인됨' 시점에 함께 발신 (원치 않으면 아래 emit 부분 제거) */
    signal homeClicked

    // --- 기본 스타일 ---
    width: barWidth
    color: "#113162"

    // == 홈 이동 확인 다이얼로그 ==
    Dialog {
        id: confirmHome
        modal: true
        title: root.confirmTitle
        // Dialog는 Overlay 위에 뜨므로 이렇게 중앙 정렬
        anchors.centerIn: Overlay.overlay
        width: 420
        closePolicy: Popup.CloseOnEscape

        contentItem: Label {
            text: root.confirmMessage
            wrapMode: Text.WordWrap
            padding: 16
        }

        footer: DialogButtonBox {
            standardButtons: DialogButtonBox.Ok | DialogButtonBox.Cancel
            onAccepted: {
                confirmHome.close()
                // 확인됨: 새 신호 발신
                root.homeConfirmed()
                // (선택) 하위호환을 위해 기존 신호도 함께 발신
                root.homeClicked()
            }
            onRejected: {
                confirmHome.close()
                root.homeCancelled()
            }
        }
    }

    // --- 메뉴 레이아웃 ---
    ColumnLayout {
        anchors.fill: parent
        anchors.topMargin: 40
        anchors.bottomMargin: 20
        spacing: 0

        // 상단 타이틀
        Text {
            id: label
            text: titleText
            color: "white"
            font.pixelSize: 30
            horizontalAlignment: Text.AlignHCenter
            font.weight: 700
            Layout.alignment: Qt.AlignCenter
            Layout.bottomMargin: 30
        }

        Item {
            width: 200
            height: 25
        }

        // 메뉴 동적으로 생성
        Column {
            id: menuContainer
            Layout.fillHeight: true
            width: root.barWidth
            spacing: 10

            Repeater {
                model: root.menuModel

                Item {
                    width: root.barWidth
                    height: 60

                    // === 선택된 경우에만 흰색 배경 표시 (왼쪽 둥근 형태로)
                    Rectangle {
                        x: 10
                        width: root.barWidth + 20
                        height: 60

                        visible: index === root.currentIndex
                        color: "white"
                        radius: height / 2 // 둥글게
                        antialiasing: true
                    }

                    // === 텍스트
                    Text {
                        text: modelData
                        anchors.centerIn: parent
                        font.pixelSize: 25
                        font.weight: 700
                        color: index === root.currentIndex ? "#113162" : "white"
                    }
                }
            }
        }

        // 하단 처음으로 버튼
        Rectangle {
            id: homeButton
            width: root.barWidth
            Layout.preferredHeight: 50
            color: "transparent"

            Image {
                anchors.centerIn: parent
                width: 32
                height: 32
                source: "qrc:/resource/icons/home_icon.png"
                fillMode: Image.PreserveAspectFit
            }

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    if (root.confirmOnHome) {
                        confirmHome.open()
                    } else {
                        // 확인 없이 바로 이동시키고 싶을 때
                        root.homeConfirmed()
                        root.homeClicked() // (선택) 하위호환
                    }
                }
            }
        }
    }
}
