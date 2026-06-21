package apperror

type AppError struct {
	StatusCode int
	Code       string
	Message    string
}

func (e *AppError) Error() string {
	return e.Message
}

func New(statusCode int, code string, message string) *AppError {
	return &AppError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
	}
}

func NewInternal(msg string) *AppError {
	return &AppError{
		StatusCode: 503,
		Code:       "ERR-SYS-01",
		Message:    msg,
	}
}
