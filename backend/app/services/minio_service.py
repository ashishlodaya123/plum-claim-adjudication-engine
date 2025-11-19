import boto3
from botocore.client import Config
from app.core.config import settings

class MinioService:
    def __init__(self):
        self.minio_client = boto3.client(
            "s3",
            endpoint_url=settings.MINIO_ENDPOINT,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
        self.bucket_name = settings.MINIO_BUCKET

    def upload_file(self, file_path: str, object_name: str):
        self.minio_client.upload_file(file_path, self.bucket_name, object_name)

    def download_file(self, object_name: str, file_path: str):
        self.minio_client.download_file(self.bucket_name, object_name, file_path)

minio_service = MinioService()
