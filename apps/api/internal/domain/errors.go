package domain

type NotFoundError struct {
	Message string `json:"message"`
	Code    string `json:"code"`
}
