package soap

import (
	"strings"
	"testing"
)

func TestEmbeddedWSDLAddress(t *testing.T) {
	t.Chdir(t.TempDir())
	s, err := WSDL("https://example.test/partnership?a=1&b=2")
	if err != nil || !strings.Contains(s, `location="https://example.test/partnership?a=1&amp;b=2"`) {
		t.Fatalf("address: %v", err)
	}
	for _, bad := range []string{"", "/partnership", "file:///etc/passwd", "http://user:pass@host/partnership"} {
		if _, err := WSDL(bad); err == nil {
			t.Fatalf("accepted %q", bad)
		}
	}
}
