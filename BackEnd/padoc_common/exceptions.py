class DuplicateIdError(Exception):
    """ID가 이미 사용 중일 때 발생하는 예외"""
    def __init__(self, message="ID is already in use."):
        self.message = message
        super().__init__(self.message)

class LicenseVerificationError(Exception):
    """라이선스 확인에 실패했을 때 발생하는 예외"""
    def __init__(self, message="License verification failed."):
        self.message = message
        super().__init__(self.message)

class InvalidCredentialsError(Exception):
    """자격 증명(예: 사용자 이름/비밀번호)이 유효하지 않을 때 발생하는 예외"""
    def __init__(self, message="Could not validate credentials."):
        self.message = message
        super().__init__(self.message)

class PermissionDeniedError(Exception):
    """요청된 리소스나 작업에 대한 접근 권한이 없을 때 발생하는 예외"""
    def __init__(self, message="Permission denied."):
        self.message = message
        super().__init__(self.message)

class BadRequestError(Exception):
    """클라이언트의 요청이 잘못되었을 때 발생하는 예외"""
    def __init__(self, message="Bad request."):
        self.message = message
        super().__init__(self.message)

class InsufficientPermissionsError(Exception):
    """특정 역할이나 권한이 없어 작업을 수행할 수 없을 때 발생하는 예외"""
    def __init__(self, message="요청을 수행할 권한이 없습니다."):
        self.message = message
        super().__init__(self.message)

class AlreadyConnectedError(Exception):
    """이미 연결 관계가 존재하여 중복된 요청을 보낼 때 발생하는 예외"""
    def __init__(self, message="이미 연결된 관계입니다."):
        self.message = message
        super().__init__(self.message)

class ConnectionCreationError(Exception):
    """연결 생성 과정에서 알 수 없는 오류가 발생했을 때"""
    def __init__(self, message="연결 요청 처리 중 오류가 발생했습니다."):
        self.message = message
        super().__init__(self.message)

class BackEndInternalError(Exception):
    """백엔드 내부의 심각한 논리적 오류"""
    def __init__(self, message="백엔드 내부 처리 중 오류가 발생했습니다."):
        self.message = message
        super().__init__(self.message)

class NotFoundError(Exception):
    """요청한 리소스를 찾을 수 없을 때 발생하는 예외"""
    def __init__(self, message="요청한 리소스를 찾을 수 없습니다."):
        self.message = message
        super().__init__(self.message)
