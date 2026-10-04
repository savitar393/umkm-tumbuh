package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/beevik/etree"
	"github.com/joho/godotenv"
	"github.com/moov-io/signedxml"
	dsig "github.com/russellhaering/goxmldsig"
	"github.com/russellhaering/goxmldsig/etreeutils"
)

func parseKeyAndCert(keyPath, certPath string) (*rsa.PrivateKey, *x509.Certificate, error) {
	keyBytes, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, nil, fmt.Errorf("read key file: %w", err)
	}
	certBytes, err := os.ReadFile(certPath)
	if err != nil {
		return nil, nil, fmt.Errorf("read cert file: %w", err)
	}

	keyBlock, _ := pem.Decode(keyBytes)
	if keyBlock == nil {
		return nil, nil, fmt.Errorf("failed to decode PEM block from key file")
	}

	var parsedKey interface{}
	if keyBlock.Type == "RSA PRIVATE KEY" {
		parsedKey, err = x509.ParsePKCS1PrivateKey(keyBlock.Bytes)
	} else if keyBlock.Type == "PRIVATE KEY" {
		parsedKey, err = x509.ParsePKCS8PrivateKey(keyBlock.Bytes)
	} else {
		return nil, nil, fmt.Errorf("unsupported key type: %s", keyBlock.Type)
	}
	if err != nil {
		return nil, nil, fmt.Errorf("parse private key: %w", err)
	}

	rsaKey, ok := parsedKey.(*rsa.PrivateKey)
	if !ok {
		return nil, nil, fmt.Errorf("key is not RSA private key")
	}

	certBlock, _ := pem.Decode(certBytes)
	if certBlock == nil {
		return nil, nil, fmt.Errorf("failed to decode PEM block from cert file")
	}
	cert, err := x509.ParseCertificate(certBlock.Bytes)
	if err != nil {
		return nil, nil, fmt.Errorf("parse certificate: %w", err)
	}

	return rsaKey, cert, nil
}

func parseCACertPool(certPath string) (*x509.CertPool, error) {
	certBytes, err := os.ReadFile(certPath)
	if err != nil {
		return nil, fmt.Errorf("read CA file: %w", err)
	}
	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(certBytes) {
		return nil, fmt.Errorf("no PEM data found in CA file")
	}
	return pool, nil
}

func generateUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("urn:uuid:%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func signRequestXML(key *rsa.PrivateKey, cert *x509.Certificate, bodyInnerXML string, msgID string) (string, error) {
	now := time.Now().UTC()
	created := now.Format(time.RFC3339)
	expires := now.Add(5 * time.Minute).Format(time.RFC3339)
	certBase64 := base64.StdEncoding.EncodeToString(cert.Raw)

	rawXML := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Header>
        <wsa:MessageID xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="msgid-1">%s</wsa:MessageID>
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
            <wsu:Timestamp xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="ts-1">
                <wsu:Created>%s</wsu:Created>
                <wsu:Expires>%s</wsu:Expires>
            </wsu:Timestamp>
            <wsse:BinarySecurityToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="bst-1" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">%s</wsse:BinarySecurityToken>
        </wsse:Security>
    </soap:Header>
    <soap:Body xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="body-1">
%s
    </soap:Body>
</soap:Envelope>`, msgID, created, expires, certBase64, bodyInnerXML)

	doc := etree.NewDocument()
	if err := doc.ReadFromString(rawXML); err != nil {
		return "", err
	}
	security := doc.Root().FindElement(".//Security")
	signer, _ := dsig.NewSigningContext(key, [][]byte{cert.Raw})
	signer.IdAttribute = "wsu:Id"
	signer.Canonicalizer = dsig.MakeC14N10ExclusiveCanonicalizerWithPrefixList("")
	var sig *etree.Element
	references := []string{"body", "timestamp", "messageID", "bst"}
	for _, reference := range references {
		var target *etree.Element
		switch reference {
		case "body": target = doc.Root().FindElement("./Body")
		case "timestamp": target = security.FindElement("./Timestamp")
		case "messageID": target = doc.Root().FindElement("./Header/MessageID")
		case "bst": target = security.FindElement("./BinarySecurityToken")
		}
		if target == nil {
			return "", fmt.Errorf("could not find target element for reference %s", reference)
		}
		next, err := signer.ConstructSignature(target, false)
		if err != nil {
			return "", fmt.Errorf("ConstructSignature failed for %s: %v", reference, err)
		}
		if sig == nil {
			sig = next
		} else {
			ref := next.FindElement(".//Reference")
			sig.FindElement(".//SignedInfo").AddChild(ref.Copy())
		}
	}
	security.AddChild(sig)
	keyInfo := sig.FindElement(".//KeyInfo")
	for _, child := range keyInfo.ChildElements() {
		keyInfo.RemoveChild(child)
	}
	str := keyInfo.CreateElement("wsse:SecurityTokenReference")
	str.CreateAttr("xmlns:wsse", "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd")
	reference := str.CreateElement("wsse:Reference")
	reference.CreateAttr("URI", "#bst-1")
	reference.CreateAttr("ValueType", "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3")

	signedInfo := sig.FindElement(".//SignedInfo")
	nsContext, _ := etreeutils.NSBuildParentContext(signedInfo)
	detached, _ := etreeutils.NSDetatch(nsContext, signedInfo)
	canonical, _ := signer.Canonicalizer.Canonicalize(detached)
	digest := sha256.Sum256(canonical)
	value, _ := key.Sign(rand.Reader, digest[:], crypto.SHA256)
	sig.FindElement(".//SignatureValue").SetText(base64.StdEncoding.EncodeToString(value))
	return doc.WriteToString()
}

func verifyResponseXML(raw []byte, verifyOpts x509.VerifyOptions, expectedRelatesTo string) error {
	doc := etree.NewDocument()
	if err := doc.ReadFromBytes(raw); err != nil {
		return fmt.Errorf("invalid XML: %v", err)
	}
	root := doc.Root()
	if root == nil {
		return fmt.Errorf("empty XML root")
	}

	relatesToEl := root.FindElement(".//RelatesTo")

	if relatesToEl == nil {
		return fmt.Errorf("missing wsa:RelatesTo")
	}
	if relatesToEl.Text() != expectedRelatesTo {
		return fmt.Errorf("RelatesTo mismatch: expected %s, got %s", expectedRelatesTo, relatesToEl.Text())
	}

	sigEl := root.FindElement(".//Signature")
	if sigEl == nil {
		return fmt.Errorf("missing Signature")
	}

	bstEl := root.FindElement(".//BinarySecurityToken")
	if bstEl == nil {
		return fmt.Errorf("missing BinarySecurityToken")
	}
	leafCertBytes, err := base64.StdEncoding.DecodeString(strings.TrimSpace(bstEl.Text()))
	if err != nil {
		return fmt.Errorf("invalid base64 in BinarySecurityToken: %v", err)
	}
	leafCert, err := x509.ParseCertificate(leafCertBytes)
	if err != nil {
		return fmt.Errorf("invalid x509 certificate in BinarySecurityToken: %v", err)
	}

	validator, err := signedxml.NewValidator(string(raw))
	if err != nil {
		return fmt.Errorf("validator init failed: %v", err)
	}
	validator.SetReferenceIDAttribute("Id")
	validator.Certificates = []x509.Certificate{*leafCert}

	verifiedRefs, err := validator.ValidateReferences()
	if err != nil {
		return fmt.Errorf("signature validation failed: %v", err)
	}
	if len(verifiedRefs) == 0 {
		return fmt.Errorf("no signed references found")
	}

	references := sigEl.FindElements(".//Reference")
	if len(references) < 4 {
		return fmt.Errorf("expected at least 4 signed references, found %d", len(references))
	}

	bodyEl := root.FindElement(".//Body")
	tsEl := root.FindElement(".//Timestamp")
	bstEl = root.FindElement(".//BinarySecurityToken")

	if bodyEl == nil {
		return fmt.Errorf("missing Body")
	}
	if tsEl == nil {
		return fmt.Errorf("missing Timestamp")
	}
	if bstEl == nil {
		return fmt.Errorf("missing BinarySecurityToken")
	}

	bodyID := getID(bodyEl)
	tsID := getID(tsEl)
	rtID := getID(relatesToEl)
	bstID := getID(bstEl)

	if bodyID == "" || tsID == "" || rtID == "" || bstID == "" {
		return fmt.Errorf("missing wsu:Id on required elements")
	}

	refsMap := make(map[string]bool)
	for _, ref := range references {
		uri := ref.SelectAttrValue("URI", "")
		if strings.HasPrefix(uri, "#") {
			refsMap[uri[1:]] = true
		}
	}

	if !refsMap[bodyID] || !refsMap[tsID] || !refsMap[rtID] || !refsMap[bstID] {
		return fmt.Errorf("not all required elements (Body, Timestamp, RelatesTo, BST) are signed")
	}

	signingCert := validator.SigningCert()
	if len(signingCert.Raw) == 0 {
		return fmt.Errorf("no signing certificate found")
	}



	if _, err := signingCert.Verify(verifyOpts); err != nil {
		return fmt.Errorf("invalid server certificate chain: %v", err)
	}

	return nil
}

func getID(el *etree.Element) string {
	for _, attr := range el.Attr {
		if attr.Key == "Id" || (attr.Space == "wsu" && attr.Key == "Id") {
			return attr.Value
		}
	}
	return ""
}

func main() {
	godotenv.Load("../../.env")
	godotenv.Load("../../.env.example") // Fallback

	port := os.Getenv("SOAP_GATEWAY_PORT")
	if port == "" { port = "9092" }

	upstreamURL := os.Getenv("SOAP_UPSTREAM_URL")
	if upstreamURL == "" { upstreamURL = "http://localhost:9090/partnership" }

	clientCertFile := os.Getenv("SOAP_CLIENT_CERT_FILE")
	if clientCertFile == "" { clientCertFile = "../../tests/smoke/ca-trust/certs/leaf-a.crt" }

	clientKeyFile := os.Getenv("SOAP_CLIENT_KEY_FILE")
	if clientKeyFile == "" { clientKeyFile = "../../tests/smoke/ca-trust/certs/leaf-a.key" }

	caFile := os.Getenv("SOAP_SERVER_CA_FILE")
	if caFile == "" { caFile = "../../tests/smoke/ca-trust/certs/server-ca.crt" }

	intermediatesFile := os.Getenv("SOAP_SERVER_INTERMEDIATES_FILE")

	key, cert, err := parseKeyAndCert(clientKeyFile, clientCertFile)
	if err != nil {
		log.Fatalf("Failed to load client cert/key: %v", err)
	}

	caCertPool, err := parseCACertPool(caFile)
	if err != nil {
		log.Fatalf("Failed to load CA cert: %v", err)
	}

	var intermediatePool *x509.CertPool
	if intermediatesFile != "" {
		intermediatePool, err = parseCACertPool(intermediatesFile)
		if err != nil {
			log.Fatalf("Failed to load intermediate certs: %v", err)
		}
	}

	verifyOpts := x509.VerifyOptions{
		Roots:         caCertPool,
		Intermediates: intermediatePool,
		KeyUsages:     []x509.ExtKeyUsage{x509.ExtKeyUsageAny},
	}

	http.HandleFunc("/partnership", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, SOAPAction")
			w.WriteHeader(http.StatusOK)
			return
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read body", http.StatusBadRequest)
			return
		}

		doc := etree.NewDocument()
		if err := doc.ReadFromBytes(body); err != nil {
			http.Error(w, "Invalid XML", http.StatusBadRequest)
			return
		}

		bodyEl := doc.Root().FindElement(".//Body")
		if bodyEl == nil || len(bodyEl.ChildElements()) == 0 {
			http.Error(w, "No SOAP Body found", http.StatusBadRequest)
			return
		}

		innerXML := ""
		for _, child := range bodyEl.ChildElements() {
			docChild := etree.NewDocument()
			docChild.SetRoot(child.Copy())
			str, _ := docChild.WriteToString()
			innerXML += str
		}

		msgID := generateUUID()
		signedXML, err := signRequestXML(key, cert, innerXML, msgID)
		if err != nil {
			log.Printf("Failed to sign request: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		req, err := http.NewRequest("POST", upstreamURL, strings.NewReader(signedXML))
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Content-Type", "text/xml; charset=utf-8")
		if auth := r.Header.Get("Authorization"); auth != "" {
			req.Header.Set("Authorization", auth)
		}
		if action := r.Header.Get("SOAPAction"); action != "" {
			req.Header.Set("SOAPAction", action)
		}

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Upstream request failed: %v", err)
			http.Error(w, "Bad Gateway", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read upstream response", http.StatusBadGateway)
			return
		}


		// Security constraint: strict verification of ALL responses!
		if err := verifyResponseXML(respBody, verifyOpts, msgID); err != nil {
			log.Printf("Security Error: %v", err)
			http.Error(w, "SOAP upstream response failed security verification", http.StatusBadGateway)
			return
		}

		for k, vv := range resp.Header {
			for _, v := range vv {
				w.Header().Add(k, v)
			}
		}
		w.WriteHeader(resp.StatusCode)
		w.Write(respBody)
	})

	log.Printf("SOAP Gateway listening on :%s, upstream: %s", port, upstreamURL)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
