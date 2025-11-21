import asyncio
import sys
import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

# Add the app directory to the Python path
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

from tenacity import retry, stop_after_attempt, wait_fixed, before_log
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@retry(stop=stop_after_attempt(5), wait=wait_fixed(2))
async def init_db():
    logger.info("Creating database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully!")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise e

@retry(stop=stop_after_attempt(5), wait=wait_fixed(2))
def init_minio():
    logger.info("Initializing MinIO bucket...")
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
            logger.info(f"Bucket {settings.MINIO_BUCKET} already exists")
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                # Bucket doesn't exist, create it
                minio_client.create_bucket(Bucket=settings.MINIO_BUCKET)
                logger.info(f"Bucket {settings.MINIO_BUCKET} created successfully")
            else:
                # Some other error
                raise e
                
    except Exception as e:
        logger.error(f"Error initializing MinIO: {e}")
        raise e

if __name__ == "__main__":
    # Initialize database
    try:
        asyncio.run(init_db())
    except Exception as e:
        logger.error(f"Failed to initialize database after retries: {e}")
        sys.exit(1)
    
    # Initialize MinIO
    try:
        init_minio()
    except Exception as e:
        logger.error(f"Failed to initialize MinIO after retries: {e}")
        # We might not want to exit here if MinIO is optional, but for now let's be strict
        sys.exit(1)