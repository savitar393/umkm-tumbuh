package soap

import (
	"bytes"
	_ "embed"
	"encoding/xml"
	"fmt"
	"net/url"
	"strings"
)

//go:embed partnership.wsdl
var wsdlDocument string

// WSDL tidak bergantung pada direktori kerja atau berkas runtime.
func WSDL(endpoint string) (string, error) {
	u, err := url.Parse(endpoint)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.User != nil || u.Fragment != "" {
		return "", fmt.Errorf("SOAP_ENDPOINT_URL harus berupa URL HTTP(S) absolut")
	}
	var escaped bytes.Buffer
	if err := xml.EscapeText(&escaped, []byte(endpoint)); err != nil {
		return "", err
	}
	return strings.Replace(wsdlDocument, "http://localhost:9090/partnership", escaped.String(), 1), nil
}
