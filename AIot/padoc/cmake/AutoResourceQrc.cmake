# cmake/AutoResourceQrc.cmake

# 등록할 리소스 확장자 정의
set(RESOURCE_EXTS png jpg jpeg svg gif bmp ttf otf woff woff2 mp3 wav)

set(RESOURCE_FILE_TAGS "")
foreach(ext IN LISTS RESOURCE_EXTS)
    file(GLOB_RECURSE FOUND_RES_FILES "${CMAKE_SOURCE_DIR}/resource/*.${ext}")
    foreach(RES_FILE ${FOUND_RES_FILES})
        file(RELATIVE_PATH REL_RES_FILE ${CMAKE_SOURCE_DIR} ${RES_FILE})
        set(RESOURCE_FILE_TAGS "${RESOURCE_FILE_TAGS}    <file alias=\"${REL_RES_FILE}\">${RES_FILE}</file>\n")
    endforeach()
endforeach()

# configure_file로 qrc 생성
set(RESOURCE_QRC_OUTPUT "${CMAKE_BINARY_DIR}/generated_resource_qrc.qrc")
configure_file(${CMAKE_SOURCE_DIR}/resource.qrc.in ${RESOURCE_QRC_OUTPUT})
