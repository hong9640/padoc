from padoc_common.schemas.features import AhFeatures as AhFeaturesResponse, FlatAhFeatures


def flatten_ah_features(nested_response: AhFeaturesResponse) -> FlatAhFeatures:
    """중첩된 AhFeaturesResponse 객체를 FlatAhFeatures 객체로 변환합니다."""
    
    # 1. 소스 객체를 딕셔너리로 변환합니다.
    nested_dict = nested_response.model_dump()
    
    flat_data = {}
    
    # 2. 'jitter'와 'shimmer' 내부의 값들을 평탄화합니다.
    #    .get()을 사용하여 키가 없더라도 에러 없이 안전하게 처리합니다.
    jitter_metrics = nested_dict.get("jitter", {})
    shimmer_metrics = nested_dict.get("shimmer", {})

    for key, value in jitter_metrics.items():
        flat_data[f"jitter_{key}"] = value
        
    for key, value in shimmer_metrics.items():
        flat_data[f"shimmer_{key}"] = value

    # 3. 최상위 레벨의 값들을 추가합니다.
    top_level_keys = ["hnr", "nhr", "f0", "max_f0", "min_f0"]
    for key in top_level_keys:
        if key in nested_dict:
            flat_data[key] = nested_dict[key]

    # 4. 평탄화된 딕셔너리로 타겟 모델 객체를 생성하여 반환합니다.
    return FlatAhFeatures(**flat_data)

def nest_ah_features(flat_response: FlatAhFeatures) -> AhFeaturesResponse:
    """평탄화된 FlatAhFeatures 객체를 중첩된 AhFeaturesResponse 객체로 변환합니다."""
    
    # 1. 소스 객체를 딕셔너리로 변환합니다. (None 값은 제외)
    flat_dict = flat_response.model_dump(exclude_none=True)
    
    # 2. 중첩 구조를 만들기 위한 빈 딕셔너리들을 준비합니다.
    nested_data = {}
    jitter_data = {}
    shimmer_data = {}

    # 3. 평탄화된 딕셔너리의 모든 항목을 순회합니다.
    for key, value in flat_dict.items():
        if key.startswith("jitter_"):
            # 'jitter_' 접두사를 제거하여 원래 키를 만듭니다. (예: "jitter_local" -> "local")
            sub_key = key.replace("jitter_", "", 1)
            jitter_data[sub_key] = value
        elif key.startswith("shimmer_"):
            # 'shimmer_' 접두사를 제거하여 원래 키를 만듭니다.
            sub_key = key.replace("shimmer_", "", 1)
            shimmer_data[sub_key] = value
        else:
            # 접두사가 없는 키는 최상위 레벨에 그대로 추가합니다.
            nested_data[key] = value
            
    # 4. 그룹화된 딕셔너리들을 사용하여 최종 중첩 모델 객체를 생성합니다.
    nested_data["jitter"] = jitter_data
    nested_data["shimmer"] = shimmer_data
    
    return AhFeaturesResponse(**nested_data)