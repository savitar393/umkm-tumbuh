package soap

import (
	"bytes"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"strings"

	"github.com/beevik/etree"
)

const (
	bstBase64Encoding = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"
	bstX509v3Type     = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"
)

type trustedX509Token struct {
	element     *etree.Element
	id          string
	certificate *x509.Certificate
}

func resolveTrustedX509Token(root, security, signature *etree.Element, configured *x509.Certificate) (trustedX509Token, error) {
	var token trustedX509Token
	elements := security.FindElements("./BinarySecurityToken")
	if len(elements) != 1 || elements[0].NamespaceURI() != wsseNamespace || len(root.FindElements(".//BinarySecurityToken")) != 1 {
		return token, errors.New("expected one WS-Security BinarySecurityToken")
	}
	token.element = elements[0]
	var err error
	token.id, err = signedElementID(token.element)
	if err != nil {
		return token, err
	}
	if value, ok := unqualifiedAttribute(token.element, "EncodingType"); !ok || value != bstBase64Encoding {
		return token, errors.New("unsupported BinarySecurityToken encoding")
	}
	if value, ok := unqualifiedAttribute(token.element, "ValueType"); !ok || value != bstX509v3Type {
		return token, errors.New("unsupported BinarySecurityToken type")
	}
	var text strings.Builder
	for _, child := range token.element.Child {
		data, ok := child.(*etree.CharData)
		if !ok {
			return token, errors.New("invalid BinarySecurityToken content")
		}
		text.WriteString(data.Data)
	}
	encoded := strings.Map(func(r rune) rune {
		switch r {
		case ' ', '\t', '\r', '\n':
			return -1
		default:
			return r
		}
	}, text.String())
	if encoded == "" {
		return token, errors.New("empty BinarySecurityToken")
	}
	der, err := base64.StdEncoding.Strict().DecodeString(encoded)
	if err != nil {
		return token, errors.New("invalid BinarySecurityToken Base64")
	}
	certificates, err := x509.ParseCertificates(der)
	if err != nil || len(certificates) != 1 || !bytes.Equal(certificates[0].Raw, der) {
		return token, errors.New("expected one DER X.509 certificate")
	}
	token.certificate = certificates[0]
	if _, ok := token.certificate.PublicKey.(*rsa.PublicKey); !ok {
		return token, errors.New("BinarySecurityToken certificate is not RSA")
	}
	if configured == nil || !bytes.Equal(token.certificate.Raw, configured.Raw) {
		return token, errors.New("BinarySecurityToken does not match configured trust")
	}
	if err := validateSecurityTokenReference(signature, token.id); err != nil {
		return token, err
	}
	return token, nil
}

func validateSecurityTokenReference(signature *etree.Element, tokenID string) error {
	keyInfos := signature.FindElements("./KeyInfo")
	if len(keyInfos) != 1 || keyInfos[0].NamespaceURI() != dsigNamespace {
		return errors.New("expected one XMLDSig KeyInfo")
	}
	children := keyInfos[0].ChildElements()
	if len(children) != 1 || children[0].Tag != "SecurityTokenReference" || children[0].NamespaceURI() != wsseNamespace {
		return errors.New("expected one SecurityTokenReference")
	}
	references := children[0].ChildElements()
	if len(references) != 1 || references[0].Tag != "Reference" || references[0].NamespaceURI() != wsseNamespace ||
		len(references[0].ChildElements()) != 0 || strings.TrimSpace(references[0].Text()) != "" {
		return errors.New("expected one WS-Security token Reference")
	}
	if uri, ok := unqualifiedAttribute(references[0], "URI"); !ok || uri != "#"+tokenID {
		return errors.New("SecurityTokenReference does not identify the token")
	}
	if value, ok := unqualifiedAttribute(references[0], "ValueType"); !ok || value != bstX509v3Type {
		return errors.New("unsupported SecurityTokenReference type")
	}
	return nil
}

func unqualifiedAttribute(element *etree.Element, name string) (string, bool) {
	var value string
	found := false
	for _, attr := range element.Attr {
		if attr.Key == name && attr.Space == "" {
			if found {
				return "", false
			}
			found, value = true, attr.Value
		}
	}
	return value, found
}
