import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.db import Base

class Claim(Base):
    __tablename__ = "claims"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    member_id = Column(String, index=True)
    status = Column(String, default="PENDING")
    documents = relationship("Document", back_populates="claim")
    decision = relationship("Decision", back_populates="claim", uselist=False)

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"))
    filename = Column(String)
    storage_path = Column(String)
    document_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    claim = relationship("Claim", back_populates="documents")
    extractions = relationship("Extraction", back_populates="document")

class Extraction(Base):
    __tablename__ = "extractions"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    field = Column(String)
    value = Column(JSON)
    confidence = Column(Float)
    method = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    document = relationship("Document", back_populates="extractions")

class Decision(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"))
    decision = Column(String)
    approved_amount = Column(Float)
    rejection_reasons = Column(JSON)
    confidence_score = Column(Float)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    claim = relationship("Claim", back_populates="decision")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"))
    action = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
