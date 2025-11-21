import asyncio
import sys
import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.db import engine, Base
from app.models.claims import Claim, Document, Extraction, Decision, AuditLog
from app.core.config import settings

async def init_db():
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")

def init_minio():
    print("Initializing MinIO bucket...")
    try:
        # Create MinIO client
        minio_client = boto3.client(
            "s3",
            endpoint_url=settings.MINIO_ENDPOINT,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
        
        # Create bucket if it doesn't exist
        try:
            minio_client.head_bucket(Bucket=settings.MINIO_BUCKET)
            print(f"Bucket {settings.MINIO_BUCKET} already exists")
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                # Bucket doesn't exist, create it
                minio_client.create_bucket(Bucket=settings.MINIO_BUCKET)
                print(f"Bucket {settings.MINIO_BUCKET} created successfully")
            else:
                # Some other error
                raise e
                
    except Exception as e:
        print(f"Error initializing MinIO: {e}")
        print("MinIO initialization skipped")

if __name__ == "__main__":
    # Initialize database
    asyncio.run(init_db())
    
    # Initialize MinIO
    init_minio()