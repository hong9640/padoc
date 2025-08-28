# cmake/AutoQrc.cmake

# 확장자 리스트 정의
set(QML_EXTS qml js json)

set(QML_FILE_TAGS "")
foreach(ext IN LISTS QML_EXTS)
    file(GLOB_RECURSE FOUND_QML_FILES "${CMAKE_SOURCE_DIR}/qml/*.${ext}")
    foreach(QML_FILE ${FOUND_QML_FILES})
        file(RELATIVE_PATH REL_QML_FILE ${CMAKE_SOURCE_DIR} ${QML_FILE})
        set(QML_FILE_TAGS "${QML_FILE_TAGS}    <file alias=\"${REL_QML_FILE}\">${QML_FILE}</file>\n")
    endforeach()
endforeach()

# configure_file로 자동 생성
set(QML_QRC_OUTPUT "${CMAKE_BINARY_DIR}/generated_qml.qrc")
configure_file(${CMAKE_SOURCE_DIR}/qml.qrc.in ${QML_QRC_OUTPUT})
