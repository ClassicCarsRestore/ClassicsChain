#!/usr/bin/env bash
set -euo pipefail

BUCKET_NAME="${GARAGE_BUCKET:-vehicles}"
GARAGE_ENDPOINT="http://localhost:3900"

cat > /tmp/cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://classicschain.com",
        "https://admin.classicschain.com"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Type", "Content-Length"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

docker run --rm \
  --network host \
  -v /tmp/cors-config.json:/cors-config.json:ro \
  -e AWS_ACCESS_KEY_ID="${GARAGE_ACCESS_KEY}" \
  -e AWS_SECRET_ACCESS_KEY="${GARAGE_SECRET_KEY}" \
  amazon/aws-cli \
  --endpoint-url "${GARAGE_ENDPOINT}" \
  --region "${GARAGE_REGION}" \
  s3api put-bucket-cors \
  --bucket "${BUCKET_NAME}" \
  --cors-configuration file:///cors-config.json

rm -f /tmp/cors-config.json

echo "CORS configuration applied successfully!"
