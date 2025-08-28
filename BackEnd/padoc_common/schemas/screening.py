from pydantic import BaseModel, ConfigDict, Field
from typing import Union
from padoc_common.schemas.features import AhFeatures, ParkinsonPredictionResult
from padoc_common.models.enums import RecordingTypeEnum


class ScreeningRequest(BaseModel):
    recording_type: RecordingTypeEnum

class SentenceScreeningResult(ParkinsonPredictionResult):
    model_config = ConfigDict(from_attributes=True)

class AhScreeningResult(AhFeatures):
    model_config = ConfigDict(from_attributes=True)

ScreeningResponse = Union[AhScreeningResult, SentenceScreeningResult]