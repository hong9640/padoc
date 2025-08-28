# app/schemas/list_order.py
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class PatientOrder(BaseModel):
    patient_order: List[int] = Field(..., example=[3, 1, 5])
    model_config = ConfigDict()

class PatientOrderRequest(PatientOrder):
    model_config = ConfigDict()

class PatientOrderResponse(PatientOrder):
    model_config = ConfigDict()
