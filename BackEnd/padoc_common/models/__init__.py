from .patients import Patient, PatientCreate, PatientRead, PatientUpdate
from .doctors import Doctor, DoctorCreate, DoctorRead, DoctorUpdate
from .calendar_events import CalendarEvent, CalendarEventCreate, CalendarEventRead, CalendarEventUpdate
from .doctor_notes import DoctorNote, DoctorNoteCreate, DoctorNoteUpdate, DoctorNoteRead
from .doctor_patient_view_settings import DoctorPatientViewSetting, DoctorPatientViewSettingCreate, DoctorPatientViewSettingRead, DoctorPatientViewSettingUpdate
from .patient_doctor_access import PatientDoctorAccess, PatientDoctorAccessCreate, PatientDoctorAccessRead, PatientDoctorAccessUpdate
from .voice_records import VoiceRecord, VoiceRecordCreate, VoiceRecordRead, VoiceRecordUpdate
from .ah_features import AhFeaturesCreate, AhFeaturesRead, AhFeaturesUpdate, AhFeatures
from .sentence_features import SentenceFeatures, SentenceFeaturesCreate, SentenceFeaturesRead, SentenceFeaturesUpdate
from .advanced_training_informations import AdvancedTrainingInformation, AdvancedTrainingInformationCreate, AdvancedTrainingInformationRead, AdvancedTrainingInformationUpdate
from .accounts import AccountCreate, AccountRead, AccountUpdate, Account 

# 모든 테이블 모델의 관계를 재설정합니다.
Patient.model_rebuild()
PatientCreate.model_rebuild()
PatientRead.model_rebuild()
PatientUpdate.model_rebuild()

Doctor.model_rebuild()
DoctorCreate.model_rebuild()
DoctorRead.model_rebuild()
DoctorUpdate.model_rebuild()

CalendarEvent.model_rebuild()
CalendarEventRead.model_rebuild()
CalendarEventCreate.model_rebuild()
CalendarEventUpdate.model_rebuild()

DoctorNote.model_rebuild()
DoctorNoteCreate.model_rebuild()
DoctorNoteRead.model_rebuild()
DoctorNoteUpdate.model_rebuild()
# DoctorPatientViewSetting 모델 그룹
DoctorPatientViewSetting.model_rebuild()
DoctorPatientViewSettingCreate.model_rebuild()
DoctorPatientViewSettingRead.model_rebuild()
DoctorPatientViewSettingUpdate.model_rebuild()

# PatientDoctorAccess 모델 그룹
PatientDoctorAccess.model_rebuild()
PatientDoctorAccessCreate.model_rebuild()
PatientDoctorAccessRead.model_rebuild()
PatientDoctorAccessUpdate.model_rebuild()

AdvancedTrainingInformation.model_rebuild()
AdvancedTrainingInformationCreate.model_rebuild()
AdvancedTrainingInformationRead.model_rebuild()
AdvancedTrainingInformationUpdate.model_rebuild()

Account.model_rebuild()
AccountCreate.model_rebuild()
AccountRead.model_rebuild()
AccountUpdate.model_rebuild()

VoiceRecord.model_rebuild()
VoiceRecordRead.model_rebuild()
VoiceRecordCreate.model_rebuild()
VoiceRecordUpdate.model_rebuild()

AhFeaturesCreate.model_rebuild()
AhFeaturesRead.model_rebuild()
AhFeaturesUpdate.model_rebuild()
AhFeatures.model_rebuild()

SentenceFeatures.model_rebuild()
SentenceFeaturesRead.model_rebuild()
SentenceFeaturesCreate.model_rebuild()
SentenceFeaturesUpdate.model_rebuild()

print("--- All separated model files initialized and rebuilt successfully. ---")