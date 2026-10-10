from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import datetime
from database import Base
import enum


class UserRole(str, enum.Enum):
    student = 'student'
    teacher = 'teacher'
    admin = 'admin'


class DBUser(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(Text, nullable=True)
    role = Column(Enum(UserRole, name="user_role", create_type=False), default=UserRole.student)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))

    attempts = relationship("Attempt", back_populates="student", cascade="all, delete-orphan")
    # Laboratorios creados por este usuario (si es docente)
    laboratories = relationship("Laboratory", back_populates="teacher", foreign_keys="Laboratory.teacher_id")


class SystemConfig(Base):
    __tablename__ = "system_config"

    key = Column(String(100), primary_key=True)
    value = Column(JSONB, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))


class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    chromadb_doc_id = Column(String(255), nullable=True)
    is_exam = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))

    teacher = relationship("DBUser", back_populates="laboratories", foreign_keys=[teacher_id])
    attempts = relationship("Attempt", back_populates="laboratory", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="laboratory", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laboratory_id = Column(UUID(as_uuid=True), ForeignKey("laboratories.id", ondelete="CASCADE"), nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False)
    evaluation_type = Column(String(20), default="exact")  # exact | regex | ai_semantic
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))

    laboratory = relationship("Laboratory", back_populates="test_cases")


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    laboratory_id = Column(UUID(as_uuid=True), ForeignKey("laboratories.id", ondelete="CASCADE"), nullable=True)
    code_snapshot = Column(Text, nullable=False)
    student_intention = Column(Text, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    attempt_number = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))

    ai_rating = Column(Integer, nullable=True)
    ai_rating_comment = Column(Text, nullable=True)

    student = relationship("DBUser", back_populates="attempts")
    laboratory = relationship("Laboratory", back_populates="attempts")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), onupdate=datetime.datetime.now(datetime.timezone.utc))


class AllowedEmail(Base):
    __tablename__ = "allowed_emails"

    email = Column(String(255), primary_key=True)
    note = Column(Text, nullable=True)
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))
class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))
