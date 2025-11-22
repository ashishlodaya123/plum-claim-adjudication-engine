from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    GROQ_API_KEY: str
    JWT_SECRET: str

    model_config = SettingsConfigDict(env_file=(".env", ".env.local"))

settings = Settings()
