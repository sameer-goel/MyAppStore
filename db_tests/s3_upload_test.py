"""
S3 presign + upload test (no server required).

Requires:
  export AWS_REGION=us-west-2
  export S3_BUCKET=your-bucket

Runs:
  python db_tests/s3_upload_test.py
"""
import os
import sys
import time
import requests
import boto3
from botocore.client import Config


def main():
    region = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-west-2'
    bucket = os.getenv('S3_BUCKET')
    if not bucket:
        print('S3_BUCKET not set', file=sys.stderr)
        sys.exit(2)

    key = f"icons/test-{int(time.time())}.txt"
    s3 = boto3.client('s3', region_name=region, config=Config(signature_version='s3v4'))
    url = s3.generate_presigned_url(
        'put_object',
        Params={'Bucket': bucket, 'Key': key, 'ContentType': 'text/plain', 'ACL': 'public-read'},
        ExpiresIn=300,
    )
    print('Presigned URL acquired')

    # Upload a small payload
    r = requests.put(url, data=b'hello from test', headers={'Content-Type': 'text/plain'})
    r.raise_for_status()
    public_url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
    print('Uploaded. Public URL:', public_url)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as e:
        print('Error:', e, file=sys.stderr)
        sys.exit(1)

