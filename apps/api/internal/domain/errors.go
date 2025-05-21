package domain

type ServiceError struct {
	Code    string  `json:"code"`
	Message string  `json:"message"`
	Detail  *string `json:"detail,omitempty"`
	err     error
}

func (e *ServiceError) Error() string {
	return e.Message
}

func (e *ServiceError) Is(target error) bool {
	if targetErr, ok := target.(*ServiceError); ok {
		return e.Code == targetErr.Code
	}
	return false
}

func (e *ServiceError) Unwrap() error {
	return e.err
}

type NotFoundError struct {
	Code    string  `json:"code"`
	Message string  `json:"message"`
	Detail  *string `json:"detail,omitempty"`
	err     error
}

func (e *NotFoundError) Error() string {
	return e.Message
}

func (e *NotFoundError) Is(target error) bool {
	if targetErr, ok := target.(*NotFoundError); ok {
		return e.Code == targetErr.Code
	}
	return false
}

func (e *NotFoundError) Unwrap() error {
	return e.err
}

func NewNotFoundError(message string, detail *string, err error) *NotFoundError {
	return &NotFoundError{
		Code:    "NotFound",
		Message: message,
		Detail:  detail,
		err:     err,
	}
}
