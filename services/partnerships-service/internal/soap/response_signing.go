package soap

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/beevik/etree"
	dsig "github.com/russellhaering/goxmldsig"
	"github.com/russellhaering/goxmldsig/etreeutils"
)

// ResponseSigningIdentity is the server's response identity, independent of
// the certificate pinned for verification of incoming requests.
type ResponseSigningIdentity struct {
	certificate *x509.Certificate
	privateKey  *rsa.PrivateKey
}

// LoadResponseSigningIdentity loads exactly one RSA certificate and matching
// unencrypted PEM private key. It does not perform CA-chain validation.
func LoadResponseSigningIdentity(certFile, keyFile string) (*ResponseSigningIdentity, error) {
	if certFile == "" || keyFile == "" {
		return nil, errors.New("response certificate and private key files are required")
	}
	certPEM, err := os.ReadFile(certFile)
	if err != nil {
		return nil, err
	}
	keyPEM, err := os.ReadFile(keyFile)
	if err != nil {
		return nil, err
	}
	pair, err := tls.X509KeyPair(certPEM, keyPEM)
	if err != nil {
		return nil, err
	}
	if len(pair.Certificate) != 1 {
		return nil, errors.New("response identity must have one leaf certificate")
	}
	cert, err := x509.ParseCertificate(pair.Certificate[0])
	if err != nil {
		return nil, err
	}
	key, ok := pair.PrivateKey.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("response signing key must be RSA")
	}
	if _, ok := cert.PublicKey.(*rsa.PublicKey); !ok {
		return nil, errors.New("response certificate must be RSA")
	}
	return &ResponseSigningIdentity{certificate: cert, privateKey: key}, nil
}

func signSOAPResponse(raw []byte, identity *ResponseSigningIdentity, requestMessageID string, now time.Time, ttl time.Duration) ([]byte, error) {
	if identity == nil || identity.certificate == nil || identity.privateKey == nil ||
		!messageUUID.MatchString(requestMessageID) || ttl <= 0 {
		return nil, errors.New("response signing is not configured")
	}
	doc := etree.NewDocument()
	if err := doc.ReadFromBytes(raw); err != nil {
		return nil, err
	}
	root := doc.Root()
	if root == nil || root.Tag != "Envelope" || root.NamespaceURI() != NSEnvelope {
		return nil, errors.New("invalid SOAP response Envelope")
	}
	bodies, headers := root.FindElements("./Body"), root.FindElements("./Header")
	if len(bodies) != 1 || bodies[0].NamespaceURI() != NSEnvelope || len(headers) > 1 {
		return nil, errors.New("SOAP response needs one Body")
	}
	for _, ns := range []struct{ prefix, uri string }{
		{"wsu", wsuNamespace}, {"wsse", wsseNamespace}, {"wsa", wsaNamespace}, {"ds", dsigNamespace},
	} {
		name := "xmlns:" + ns.prefix
		if attr := root.SelectAttr(name); attr != nil {
			if attr.Value != ns.uri {
				return nil, errors.New("conflicting SOAP response namespace")
			}
		} else {
			root.CreateAttr(name, ns.uri)
		}
	}
	var header *etree.Element
	if len(headers) == 0 {
		header = etree.NewElement(root.Space + ":Header")
		root.InsertChildAt(0, header)
	} else {
		header = headers[0]
		if header.NamespaceURI() != NSEnvelope {
			return nil, errors.New("invalid SOAP response Header")
		}
	}
	ids, err := newResponseIDs()
	if err != nil {
		return nil, err
	}
	body := bodies[0]
	if _, err := signedElementID(body); err == nil {
		return nil, errors.New("response Body already has a signed ID")
	}
	body.CreateAttr("wsu:Id", ids[0])
	relates := header.CreateElement("wsa:RelatesTo")
	relates.CreateAttr("wsu:Id", ids[2])
	relates.SetText(requestMessageID)
	security := header.CreateElement("wsse:Security")
	token := security.CreateElement("wsse:BinarySecurityToken")
	token.CreateAttr("wsu:Id", ids[3])
	token.CreateAttr("EncodingType", bstBase64Encoding)
	token.CreateAttr("ValueType", bstX509v3Type)
	token.SetText(base64.StdEncoding.EncodeToString(identity.certificate.Raw))
	timestamp := security.CreateElement("wsu:Timestamp")
	timestamp.CreateAttr("wsu:Id", ids[1])
	timestamp.CreateElement("wsu:Created").SetText(now.UTC().Format(time.RFC3339Nano))
	timestamp.CreateElement("wsu:Expires").SetText(now.UTC().Add(ttl).Format(time.RFC3339Nano))

	signer, err := dsig.NewSigningContext(identity.privateKey, [][]byte{identity.certificate.Raw})
	if err != nil {
		return nil, err
	}
	signer.Prefix = "ds"
	signer.IdAttribute = "wsu:Id"
	signer.Canonicalizer = dsig.MakeC14N10ExclusiveCanonicalizerWithPrefixList("")
	var signature *etree.Element
	for _, target := range []*etree.Element{body, timestamp, relates, token} {
		parentNS, err := etreeutils.NSBuildParentContext(target)
		if err != nil {
			return nil, err
		}
		detached, err := etreeutils.NSDetatch(parentNS, target)
		if err != nil {
			return nil, err
		}
		part, err := signer.ConstructSignature(detached, false)
		if err != nil {
			return nil, err
		}
		if signature == nil {
			signature = part
		} else {
			signature.FindElement("./SignedInfo").AddChild(part.FindElement("./SignedInfo/Reference").Copy())
		}
	}
	security.AddChild(signature)
	keyInfo := signature.FindElement("./KeyInfo")
	for _, child := range keyInfo.ChildElements() {
		keyInfo.RemoveChild(child)
	}
	str := keyInfo.CreateElement("wsse:SecurityTokenReference")
	reference := str.CreateElement("wsse:Reference")
	reference.CreateAttr("URI", "#"+ids[3])
	reference.CreateAttr("ValueType", bstX509v3Type)
	info := signature.FindElement("./SignedInfo")
	parentNS, err := etreeutils.NSBuildParentContext(info)
	if err != nil {
		return nil, err
	}
	detachedInfo, err := etreeutils.NSDetatch(parentNS, info)
	if err != nil {
		return nil, err
	}
	canonical, err := signer.Canonicalizer.Canonicalize(detachedInfo)
	if err != nil {
		return nil, err
	}
	digest := sha256.Sum256(canonical)
	signedDigest, err := identity.privateKey.Sign(rand.Reader, digest[:], crypto.SHA256)
	if err != nil {
		return nil, err
	}
	signature.FindElement("./SignatureValue").SetText(base64.StdEncoding.EncodeToString(signedDigest))
	result, err := doc.WriteToBytes()
	if err != nil {
		return nil, err
	}
	if len(bytes.TrimSpace(result)) == 0 {
		return nil, fmt.Errorf("empty signed SOAP response")
	}
	return result, nil
}

func newResponseIDs() ([4]string, error) {
	var random [16]byte
	if _, err := rand.Read(random[:]); err != nil {
		return [4]string{}, err
	}
	suffix := hex.EncodeToString(random[:])
	return [4]string{
		"response-body-" + suffix,
		"response-ts-" + suffix,
		"response-relates-" + suffix,
		"response-cert-" + suffix,
	}, nil
}

type bufferedSOAPResponse struct {
	header http.Header
	body   bytes.Buffer
	status int
}

func newBufferedSOAPResponse() *bufferedSOAPResponse {
	return &bufferedSOAPResponse{header: make(http.Header)}
}

func (b *bufferedSOAPResponse) Header() http.Header { return b.header }

func (b *bufferedSOAPResponse) WriteHeader(status int) {
	if b.status == 0 {
		b.status = status
	}
}

func (b *bufferedSOAPResponse) Write(data []byte) (int, error) {
	if b.status == 0 {
		b.status = http.StatusOK
	}
	return b.body.Write(data)
}

func (h *Handler) writeSignedResponse(w http.ResponseWriter, response *bufferedSOAPResponse, messageID string) error {
	signed, err := signSOAPResponse(response.body.Bytes(), h.responseSigningIdentity, messageID, h.now(), h.wsseMaxTimestampTTL)
	if err != nil {
		return err
	}
	for name, values := range response.header {
		if http.CanonicalHeaderKey(name) == "Content-Length" {
			continue
		}
		for _, value := range values {
			w.Header().Add(name, value)
		}
	}
	status := response.status
	if status == 0 {
		status = http.StatusOK
	}
	w.WriteHeader(status)
	_, err = w.Write(signed)
	return err
}

// ValidateResponseIdentityChain verifies the loaded ResponseSigningIdentity against
// a configured CA root and optional intermediate chain.
func ValidateResponseIdentityChain(identity *ResponseSigningIdentity, caFile, intermediatesFile string, now time.Time) error {
	if caFile == "" {
		return errors.New("caFile is required for response CA validation")
	}
	roots, err := loadCertPool(caFile)
	if err != nil {
		return err
	}
	var intermediates *x509.CertPool
	if intermediatesFile != "" {
		intermediates, err = loadCertPool(intermediatesFile)
		if err != nil {
			return err
		}
	} else {
		intermediates = x509.NewCertPool()
	}

	opts := x509.VerifyOptions{
		Roots:         roots,
		Intermediates: intermediates,
		CurrentTime:   now,
		KeyUsages:     []x509.ExtKeyUsage{x509.ExtKeyUsageAny},
	}
	if _, err := identity.certificate.Verify(opts); err != nil {
		return err
	}
	return nil
}
