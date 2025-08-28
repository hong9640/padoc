import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "../../components"

Page {
    id: trainingLoginPage

    width: 1024
    height: 600

    property bool _profileReady: false
    property bool _latestReady: false
    property bool _navigated: false
    property var  _profileData:  ({})

    function proceedIfReady() {
        if (!_navigated && _profileReady && _latestReady) {
            _navigated = true

            //console.log(mainWindow.latestScore)
            mainStackView.push("qrc:/qml/screens/training/TrainingMain.qml", {
                                   "profile": _profileData,
                               })
        }
    }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.preferredWidth: 630
            Layout.fillHeight: true
            color: "#113162"

            ColumnLayout {
                anchors.fill: parent
                spacing: 0

                Item {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 30
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "파킨슨병 음성 트레이닝 서비스"
                    color: "white"
                    font.pixelSize: 25
                    font.weight: 700
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "회원 로그인"
                    color: "white"
                    font.pixelSize: 50
                    font.weight: 700
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    horizontalAlignment: Text.AlignHCenter
                    text: "음성 트레이닝 서비스는 로그인이 필요한 서비스입니다.\n회원가입은 [파닥:파킨슨 닥터] 홈페이지에서 가능합니다."
                    color: "white"
                    font.pixelSize: 20
                    font.weight: 700
                }

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 415
                    height: 55
                    color: "#FFFFFF"
                    radius: 100
                    border.color: "#CCCCCC"
                    border.width: 1

                    TextField {
                        id: idInput
                        anchors.verticalCenter: parent.verticalCenter
                        width: 375
                        height: 40
                        x: 20
                        placeholderText: "아이디를 입력해주세요."
                        echoMode: TextInput.Normal
                        focus: true
                        font.pixelSize: 25
                        background: null
                    }
                }

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 415
                    height: 55
                    color: "#FFFFFF"
                    radius: 100
                    border.color: "#CCCCCC"
                    border.width: 1

                    TextField {
                        id: pwInput
                        anchors.verticalCenter: parent.verticalCenter
                        width: 375
                        height: 40
                        x: 20
                        placeholderText: "패스워드를 입력해주세요."
                        echoMode: TextInput.Password
                        focus: true
                        font.pixelSize: 25
                        background: null
                    }
                }

                SolidButton {
                    Layout.alignment: Qt.AlignHCenter
                    text: "로그인"
                    bgColor: "#EAEAEA"
                    fontSize: 30
                    buttonWidth: 250
                    buttonHeight: 60
                    radius: 20

                    onClicked: {
                        // console.log("로그인 되었습니다.")
                        loginManager.login(idInput.text, pwInput.text)
                    }
                }

                Connections {
                    target: loginManager
                    function onLoginSuccess(token) {
                        //console.log("로그인에 성공하였습니다.")
                        mainWindow.appToken = token
                        //console.log(token)
                        loginManager.fetchProfile(token)
                        loginManager.fetchRecentLatestTraining(token)
                    }

                    function onLoginFailed(message) {
                        //console.log("로그인에 실패하였습니다. message:", message)
                    }

                    // ── 프로필 ────────────────────────────────
                    function onProfileLoaded(profileData) {
                        //console.log("프로필:", JSON.stringify(profileData))
                        _profileData = profileData
                        _profileReady = true
                        proceedIfReady()
                    }

                    function onProfileFailed(message) {
                        //console.log("프로필 로드 실패:", message)
                        // 실패를 치명으로 볼지 말지는 선택
                        _profileReady = true
                        proceedIfReady()
                    }

                    // ── 최근 1개월 중 최신 훈련 1건 ─────────────
                    function onRecentLatestTrainingLoaded(item) {
                        //console.log("최근 훈련:", JSON.stringify(item))

                        // 안전 캐스팅
                        const score = Number(item.avg_score)

                        // 전역 보관
                        mainWindow.latestTrainingItem = item
                        mainWindow.latestScore = isNaN(score) ? NaN : score

                        _latestReady = true
                        proceedIfReady()
                    }

                    function onRecentLatestTrainingFailed(message) {
                        //console.log("최근 훈련 로드 실패:", message)
                        mainWindow.latestTrainingItem = ({})
                        mainWindow.latestScore = NaN
                        mainWindow.latestProgress = ""
                        _latestReady = true
                        proceedIfReady()
                    }
                }

                Item {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 20
                }
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "#ffffff"

            Image {
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.verticalCenter: parent.verticalCenter
                width: 375
                height: 375
                source: "qrc:/resource/images/padoc_mic.png"
                fillMode: Image.PreserveAspectFit
            }
        }
    }
}
