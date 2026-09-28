package soap

import (
	"crypto/rsa"
	"testing"
	"time"
)

func TestWSSE_CATrustMode(t *testing.T) {
	rootCert, rootKey, rootDer := generateTestCert(t, "Root", true, nil, nil)
	interCert, interKey, interDer := generateTestCert(t, "Intermediate", true, rootCert, rootKey)

	// Create two valid leaves
	leafACert, leafAKey, _ := generateTestCert(t, "LeafA", false, interCert, interKey)
	leafBCert, leafBKey, _ := generateTestCert(t, "LeafB", false, interCert, interKey)

	// Create an attacker leaf
	attackerRootCert, attackerRootKey, _ := generateTestCert(t, "AttackerRoot", true, nil, nil)
	attackerLeafCert, attackerLeafKey, _ := generateTestCert(t, "AttackerLeaf", false, attackerRootCert, attackerRootKey)

	rootPath := writeTempCert(t, rootDer)
	interPath := writeTempCert(t, interDer)

	verifier, err := LoadCertificateTrustVerifier("ca", "", rootPath, interPath)
	if err != nil {
		t.Fatal(err)
	}

	now := time.Now().UTC()

	// Generate valid request with LeafA
	reqAStr := signedX509SummaryXML(t, leafAKey.(*rsa.PrivateKey), leafACert, leafACert, now.Add(-time.Minute).Format(time.RFC3339), now.Add(5*time.Minute).Format(time.RFC3339), "urn:uuid:550e8400-e29b-41d4-a716-446655440000")
	reqA := []byte(reqAStr)
	// Generate valid request with LeafB
	reqBStr := signedX509SummaryXML(t, leafBKey.(*rsa.PrivateKey), leafBCert, leafBCert, now.Add(-time.Minute).Format(time.RFC3339), now.Add(5*time.Minute).Format(time.RFC3339), "urn:uuid:550e8400-e29b-41d4-a716-446655440001")
	reqB := []byte(reqBStr)
	// Generate attacker request with AttackerLeaf
	reqAttackerStr := signedX509SummaryXML(t, attackerLeafKey.(*rsa.PrivateKey), attackerLeafCert, attackerLeafCert, now.Add(-time.Minute).Format(time.RFC3339), now.Add(5*time.Minute).Format(time.RFC3339), "urn:uuid:550e8400-e29b-41d4-a716-446655440002")
	reqAttacker := []byte(reqAttackerStr)

	// 1. Leaf A should succeed
	_, err = verifySignedBody(reqA, verifier, nil, now, 5*time.Minute, 10*time.Minute, true, true)
	if err != nil {
		t.Fatalf("LeafA failed in CA mode: %v", err)
	}

	// 2. Leaf B should succeed (proof that it's CA mode, not pinning)
	_, err = verifySignedBody(reqB, verifier, nil, now, 5*time.Minute, 10*time.Minute, true, true)
	if err != nil {
		t.Fatalf("LeafB failed in CA mode: %v", err)
	}

	// 3. Attacker Leaf should fail (untrusted root)
	_, err = verifySignedBody(reqAttacker, verifier, nil, now, 5*time.Minute, 10*time.Minute, true, true)
	if err == nil {
		t.Fatal("Attacker leaf succeeded in CA mode")
	}

	// 4. Missing intermediate fails
	verifierNoInter, _ := LoadCertificateTrustVerifier("ca", "", rootPath, "")
	_, err = verifySignedBody(reqA, verifierNoInter, nil, now, 5*time.Minute, 10*time.Minute, true, true)
	if err == nil {
		t.Fatal("LeafA succeeded without intermediate in CA mode")
	}

	// 5. Pin mode test
	leafAPath := writeTempCert(t, leafACert.Raw)
	pinVerifier, _ := LoadCertificateTrustVerifier("pin", leafAPath, "", "")
	_, err = verifySignedBody(reqA, pinVerifier, leafACert, now, 5*time.Minute, 10*time.Minute, true, true)
	if err != nil {
		t.Fatalf("LeafA failed in pin mode: %v", err)
	}
	_, err = verifySignedBody(reqB, pinVerifier, leafACert, now, 5*time.Minute, 10*time.Minute, true, true)
	if err == nil {
		t.Fatal("LeafB succeeded in pin mode with LeafA pinned")
	}
}
