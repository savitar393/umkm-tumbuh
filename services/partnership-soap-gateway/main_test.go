package main

import (
	"testing"
	"github.com/stretchr/testify/assert"
)

func TestGatewaySigning(t *testing.T) {
	key, cert, err := parseKeyAndCert("../../tests/smoke/ca-trust/certs/leaf-a.key", "../../tests/smoke/ca-trust/certs/leaf-a.crt")
	assert.NoError(t, err)

	msgID := "test-msg-id"
	xmlBody := "<test>body</test>"
	
	signed, err := signRequestXML(key, cert, xmlBody, msgID)
	assert.NoError(t, err)
	assert.Contains(t, signed, msgID)
	assert.Contains(t, signed, "Signature")
	assert.Contains(t, signed, "<test>body</test>")
}
