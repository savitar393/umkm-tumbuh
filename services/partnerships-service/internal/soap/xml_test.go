package soap

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSOAPRejectsAmbiguousXML(t *testing.T) {
	body := operationEnvelope(soapOperationCase{name: "GetPartnershipSummary"}, "<userId>AKUN-UMKM</userId><userRole>UMKM</userRole>")
	for name, xmlBody := range map[string]string{
		"wrong envelope namespace":  strings.ReplaceAll(body, NSEnvelope, "urn:wrong"),
		"wrong operation namespace": strings.ReplaceAll(body, NSPartner, "urn:wrong"),
		"duplicate body":            strings.Replace(body, "</soap:Envelope>", "<soap:Body/></soap:Envelope>", 1),
		"two operations":            strings.Replace(body, "</soap:Body>", "<tns:GetPartnershipSummary xmlns:tns=\""+NSPartner+"\"/></soap:Body>", 1),
		"trailing document":         body + "<extra/>",
		"duplicate identity":        strings.Replace(body, "<userRole>UMKM</userRole>", "<userRole>MITRA</userRole><userRole>UMKM</userRole>", 1),
	} {
		t.Run(name, func(t *testing.T) {
			spy := &partnershipServiceSpy{}
			req := httptest.NewRequest("POST", "/partnership", strings.NewReader(xmlBody))
			req.Header.Set("Authorization", "Bearer "+validTestToken(t, "AKUN-UMKM", "UMKM"))
			rr := httptest.NewRecorder()
			newTestHandler(spy, HandlerConfig{JWTSecret: testJWTSecret}).ServeHTTP(rr, req)
			if rr.Code != 400 || spy.calls != 0 {
				t.Fatalf("status=%d calls=%d body=%s", rr.Code, spy.calls, rr.Body.String())
			}
		})
	}
	t.Run("action mismatch", func(t *testing.T) {
		spy := &partnershipServiceSpy{}
		req := httptest.NewRequest("POST", "/partnership", strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+validTestToken(t, "AKUN-UMKM", "UMKM"))
		req.Header.Set("SOAPAction", NSPartner+"/SignPartnership")
		rr := httptest.NewRecorder()
		newTestHandler(spy, HandlerConfig{JWTSecret: testJWTSecret}).ServeHTTP(rr, req)
		if rr.Code != 400 || spy.calls != 0 {
			t.Fatalf("status=%d calls=%d", rr.Code, spy.calls)
		}
	})
}
