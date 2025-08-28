import QtQuick 2.15
import QtCharts 2.15

PolarChartView {
    id: chartView
    width: 400
    height: 400
    legend.visible: false
    antialiasing: true

    property var categories: ["Jitter", "Shimmer", "NHR", "HNR", "F0"]

    property var normalData: []
    property var resultData: []

    function updateSeries() {
        normalSeries.clear()
        for (var i = 0; i < normalData.length; ++i)
            normalSeries.append(i, normalData[i])
        normalSeries.append(i, normalData[0])

        resultSeries.clear()
        for (var j = 0; j < resultData.length; ++j)
            resultSeries.append(j, resultData[j])
        resultSeries.append(j, resultData[0])
    }

    ValueAxis {
        id: angular
        min: 0
        max: normalData.length > 0 ? normalData.length : 5
        tickCount: normalData.length > 0 ? normalData.length + 1 : 6
    }

    ValueAxis {
        id: radial
        min: 0
        max: 1
    }

    LineSeries {
        id: normalSeries
        name: "정상범위"
        axisAngular: angular
        axisRadial: radial
        color: "green"
        width: 2
        pointsVisible: false
    }

    LineSeries {
        id: resultSeries
        name: "분석결과"
        axisAngular: angular
        axisRadial: radial
        color: "red"
        width: 2
        pointsVisible: false
    }
}
