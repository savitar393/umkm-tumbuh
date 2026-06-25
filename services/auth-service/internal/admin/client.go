package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = "http://localhost:8081"
	}

	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func addAuthorizationHeader(req *http.Request, authorizationHeader string) {
	authorizationHeader = strings.TrimSpace(authorizationHeader)
	if authorizationHeader == "" {
		return
	}

	req.Header.Set("Authorization", authorizationHeader)
}

func (c *Client) GetProfile(ctx context.Context, userID string, role string, authorizationHeader string) (any, error) {
	url := fmt.Sprintf("%s/api/v1/admin/profiles/%s?role=%s", c.BaseURL, userID, role)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	addAuthorizationHeader(req, authorizationHeader)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user-service returned status %d", resp.StatusCode)
	}

	var result struct {
		Profile any `json:"profile"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Profile, nil
}

func (c *Client) GetDocuments(ctx context.Context, userID string, role string, authorizationHeader string) (any, error) {
	url := fmt.Sprintf("%s/api/v1/admin/users/%s/documents?role=%s", c.BaseURL, userID, role)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	addAuthorizationHeader(req, authorizationHeader)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user-service returned status %d", resp.StatusCode)
	}

	var result struct {
		Documents any `json:"documents"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Documents, nil
}

func (c *Client) GetDocumentChecklist(ctx context.Context, userID string, role string, authorizationHeader string) any {
	url := fmt.Sprintf("%s/api/v1/admin/users/%s/documents?role=%s", c.BaseURL, userID, role)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil
	}

	addAuthorizationHeader(req, authorizationHeader)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil
	}

	var result struct {
		Checklist any `json:"checklist"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil
	}

	return result.Checklist
}
