class AppError(Exception):
    status_code: int = 400
    code: str = "bad_request"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class DatasetError(AppError):
    status_code = 422
    code = "invalid_dataset"


class InvalidRequestError(AppError):
    status_code = 422
    code = "invalid_request"


class ModelNotFoundError(AppError):
    status_code = 404
    code = "model_not_found"


class PayloadTooLargeError(AppError):
    status_code = 413
    code = "payload_too_large"