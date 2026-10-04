package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		fmt.Println("Error: JWT_SECRET environment variable is required")
		os.Exit(1)
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":       "req-1",
		"role":      "UMKM",
		"exp":       time.Now().Add(1 * time.Hour).Unix(),
	})
	tokenString, _ := t.SignedString([]byte(secret))

	xmlBody := `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <p:GetPartnershipSummary xmlns:p="http://umkm-tumbuh.example.com/partnerships">
            <userId>req-1</userId>
            <userRole>UMKM</userRole>
        </p:GetPartnershipSummary>
    </soap:Body>
</soap:Envelope>`

	req, _ := http.NewRequest("POST", "http://localhost:9092/partnership", bytes.NewBufferString(xmlBody))
	req.Header.Set("Content-Type", "text/xml")
	req.Header.Set("Authorization", "Bearer "+tokenString)
	req.Header.Set("SOAPAction", "GetPartnershipSummary")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\n", resp.StatusCode)
	fmt.Printf("Response: %s\n", string(body))

	if resp.StatusCode != 200 {
		fmt.Printf("Expected status 200, got %d\n", resp.StatusCode)
		os.Exit(1)
	}

	if !strings.Contains(string(body), "GetPartnershipSummaryResponse") {
		fmt.Println("Expected Response to contain GetPartnershipSummaryResponse")
		os.Exit(1)
	}
}
