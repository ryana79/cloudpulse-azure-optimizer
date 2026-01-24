from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
    )

    environment: str = Field(default="dev", alias="ENV")

    frontend_origin: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGIN")
    api_host: str = Field(default="127.0.0.1", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    database_url: str = Field(default="sqlite:///./cloudpulse.db", alias="DATABASE_URL")

    mock_mode: bool = Field(default=False, alias="MOCK_MODE")
    demo_mode: bool = Field(default=False, alias="DEMO_MODE")
    mock_tenant_id: str = Field(default="11111111-1111-1111-1111-111111111111", alias="MOCK_TENANT_ID")
    mock_user_id: str = Field(default="22222222-2222-2222-2222-222222222222", alias="MOCK_USER_ID")
    mock_user_email: str = Field(default="demo@cloudpulse.dev", alias="MOCK_USER_EMAIL")
    mock_user_name: str = Field(default="Demo User", alias="MOCK_USER_NAME")

    azure_client_id: str = Field(default="", alias="AZURE_CLIENT_ID")
    azure_client_secret: str = Field(default="", alias="AZURE_CLIENT_SECRET")
    azure_tenant_id: str = Field(default="common", alias="AZURE_TENANT_ID")
    azure_authority: str = Field(
        default="https://login.microsoftonline.com", alias="AZURE_AUTHORITY"
    )
    azure_scopes: str = Field(
        default="https://management.azure.com/.default", alias="AZURE_SCOPES"
    )

    grok_api_key: str = Field(default="", alias="GROK_API_KEY")
    grok_base_url: str = Field(default="https://api.x.ai/v1", alias="GROK_BASE_URL")
    grok_model: str = Field(default="grok-2-1212", alias="GROK_MODEL")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    rate_limit_per_min: int = Field(default=30, alias="RATE_LIMIT_PER_MIN")
    rate_limit_burst: int = Field(default=10, alias="RATE_LIMIT_BURST")
    rate_limit_per_min_prod: int = Field(default=120, alias="RATE_LIMIT_PER_MIN_PROD")
    rate_limit_burst_prod: int = Field(default=30, alias="RATE_LIMIT_BURST_PROD")

    anomaly_z_threshold: float = Field(default=3.0, alias="ANOMALY_Z_THRESHOLD")
    anomaly_min_abs: float = Field(default=5.0, alias="ANOMALY_MIN_ABS")
    underutilized_cpu_threshold: float = Field(default=10.0, alias="UNDERUTILIZED_CPU_THRESHOLD")
    underutilized_days: int = Field(default=7, alias="UNDERUTILIZED_DAYS")


settings = Settings()

