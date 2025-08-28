# app/storage.py

import boto3
import os
from dotenv import load_dotenv

load_dotenv()

# S3 클라이언트 의존성 주입
async def get_s3_client():
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION")
        )
        return s3_client
    except Exception as e:
        print(f"S3 클라이언트 초기화 실패: {e}")
        raise