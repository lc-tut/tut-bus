package repository

import "api/internal/domain"

type ServiceRepository interface {
	LoadAllServices() ([]domain.ServiceData, error)
}
