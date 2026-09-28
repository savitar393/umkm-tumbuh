package soap

import (
	"errors"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/auth"
)

type authenticatedActor = auth.Actor
type authenticationError struct{ serverMisconfigured bool }

func (e *authenticationError) Error() string { return "invalid authentication credentials" }
func authenticateBearer(header, secret string) (authenticatedActor, error) {
	actor, err := auth.VerifyBearer(header, secret)
	if err != nil {
		return authenticatedActor{}, &authenticationError{serverMisconfigured: errors.Is(err, auth.ErrUnconfigured)}
	}
	return actor, nil
}
