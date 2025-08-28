import enum

# Role 필드를 Enum으로 정의하여 실수를 방지하고 코드 가독성을 높입니다.
class UserRoleEnum(str, enum.Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"
    ADMIN = "admin"

class GenderEnum(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ConnectionStatusEnum(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    TERMINATED = "terminated"

class RecordingTypeEnum(str, enum.Enum):
    none_ = "None"
    voice_ah = "voice_ah"
    voice_sentence = "voice_sentence"

class AdvTrainingProgressEnum(str, enum.Enum):
    level1 = "level 1"
    level2 = "level 2"
    level3 = "level 3"
    level4 = "level 4"
    level5 = "level 5"
    level6 = "level 6"
    level7 = "level 7"
    level8 = "level 8"
    level9 = "level 9"
    level10 = "level 10"


class FileStatusEnum(str, enum.Enum):
    """파일 업로드 및 처리 상태를 나타내는 Enum"""

    PENDING_UPLOAD = "PENDING_UPLOAD"    # 업로드 URL 생성, 클라이언트가 S3에 업로드 중
    UPLOAD_COMPLETED = "UPLOAD_COMPLETED"  # S3에 업로드 완료, 분석 대기 중
    PROCESSING = "PROCESSING"           # 워커가 파일을 가져가 분석 중
    COMPLETED = "COMPLETED"             # 분석 완료 및 결과 저장 성공
    FAILED = "FAILED"                   # 업로드 또는 분석 과정에서 실패