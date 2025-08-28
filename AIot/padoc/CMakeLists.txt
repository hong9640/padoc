cmake_minimum_required(VERSION 3.16)
project(padoc VERSION 0.1 LANGUAGES CXX)

# Qt 및 설정
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
find_package(Qt6 REQUIRED COMPONENTS
    Core
    Gui
    Qml
    Quick
    Charts
    ChartsQml
    Multimedia
)

qt_standard_project_setup(REQUIRES 6.7)

# QML 리소스 자동 생성
include(cmake/AutoQrc.cmake)
include(cmake/AutoResourceQrc.cmake)

# QRC 파일을 Qt 리소스로 등록
qt6_add_resources(QML_QRC_GEN ${QML_QRC_OUTPUT})
qt6_add_resources(RES_QRC_GEN ${RESOURCE_QRC_OUTPUT})

# C++ 소스 파일 동적 탐색
file(GLOB_RECURSE PROJECT_SOURCES
    "src/*.cpp"
    "src/*.h"
)

# 실행 파일
qt_add_executable(apppadoc
    ${PROJECT_SOURCES}
    ${QML_QRC_GEN}
    ${RES_QRC_GEN}
)

# Qt Quick 모듈 연결
target_link_libraries(apppadoc PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::Charts
    Qt6::ChartsQml
    Qt6::Multimedia
)

set_target_properties(apppadoc PROPERTIES
    QT_QML_MODULES "QtCharts"
)

# 인스톨 설정
include(GNUInstallDirs)
install(TARGETS apppadoc
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)