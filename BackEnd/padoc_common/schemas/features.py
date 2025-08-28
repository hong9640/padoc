# features.py

from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List

# JitterMetrics, ShimmerMetrics, SampledDataPoint, VoiceSamplingData 클래스는
# 실제 데이터 구조와 맞지 않으므로 모두 삭제합니다.

class JitterMetrics(BaseModel):
    local: float
    rap: float
    ppq5: float
    ddp: float

class ShimmerMetrics(BaseModel):
    local: float
    apq3: float
    apq5: float
    apq11: float
    dda: float

class DataPoint(BaseModel):
    energy: Optional[float] = None
    frequency: Optional[float] = None

# "sampling_data" 딕셔너리에 해당하는 모델
class SamplingData(BaseModel):
    sampling_rate: Optional[float] = None
    data_points: List[DataPoint] = []


class AhFeatures(BaseModel):
    """'아' 발음 음향 분석 데이터"""
    jitter: JitterMetrics
    shimmer: ShimmerMetrics
    hnr: float
    nhr: float
    f0: float
    max_f0: float
    min_f0: float

    model_config = ConfigDict(from_attributes=True)


class FlatAhFeatures(BaseModel):
    """'아' 발음 음향 분석 데이터 (DB 모델과 동일한 평평한 구조)"""
    # DB 모델(models/ah_features.py의 AhFeaturesBase)에 있는 모든 필드를 그대로 가져옵니다.
    jitter_local: Optional[float] = None
    jitter_rap: Optional[float] = None
    jitter_ppq5: Optional[float] = None
    jitter_ddp: Optional[float] = None
    shimmer_local: Optional[float] = None
    shimmer_apq3: Optional[float] = None
    shimmer_apq5: Optional[float] = None
    shimmer_apq11: Optional[float] = None
    shimmer_dda: Optional[float] = None
    hnr: Optional[float] = None
    nhr: Optional[float] = None
    f0: Optional[float] = None
    max_f0: Optional[float] = None
    min_f0: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

class SentenceFeatures(BaseModel):
    """문장 발음 분석 데이터 (DB 모델과 동일한 구조)"""
    # DB 모델(models/sentence_features.py의 SentenceFeaturesBase)에 있는 필드를 그대로 가져옵니다.
    cpp: Optional[float] = None
    csid: Optional[float] = None
    sampling_data: SamplingData
    
    model_config = ConfigDict(from_attributes=True)

class ParkinsonPredictionResult(BaseModel):
    """파킨슨병 진단 결과"""
    ai_score: int