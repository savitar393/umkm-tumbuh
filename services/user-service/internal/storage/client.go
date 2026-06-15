package storage

import (
	"context"
	"errors"
	"io"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Client struct {
	S3     *s3.Client
	Bucket string
}

func NewFromEnv(ctx context.Context) (*Client, error) {
	endpoint := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_ENDPOINT"))
	accessKey := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_SECRET_KEY"))
	region := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_REGION"))
	bucket := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_BUCKET_PRODUCT_IMAGES"))

	if region == "" {
		region = "garage"
	}

	if bucket == "" {
		bucket = "product-images"
	}

	if endpoint == "" || accessKey == "" || secretKey == "" {
		return nil, errors.New("object storage endpoint/access key/secret key belum lengkap")
	}

	cfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		),
	)
	if err != nil {
		return nil, err
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	return &Client{
		S3:     s3Client,
		Bucket: bucket,
	}, nil
}

func (c *Client) PutObject(ctx context.Context, key string, body io.Reader, contentType string) error {
	_, err := c.S3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.Bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})

	return err
}

func (c *Client) GetObject(ctx context.Context, key string) (*s3.GetObjectOutput, error) {
	return c.S3.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.Bucket),
		Key:    aws.String(key),
	})
}

func (c *Client) DeleteObject(ctx context.Context, key string) error {
	_, err := c.S3.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.Bucket),
		Key:    aws.String(key),
	})

	return err
}
