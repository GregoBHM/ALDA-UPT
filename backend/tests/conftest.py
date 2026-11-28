"""Entorno aislado para pruebas de API y persistencia."""
import os
from contextlib import contextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session

import models
from core.dependencies import get_db
from core.security import COOKIE_NAME, create_session_token
from database import Base
from main import app


@compiles(JSONB, "sqlite")
def compile_jsonb_for_sqlite(_type, _compiler, **_kwargs):
    return "JSON"


@pytest.fixture
def engine(tmp_path):
    url = os.environ.get("ALDA_TEST_DATABASE_URL")
    if url:
        engine = create_engine(url)
        # El servidor de CI aloja una base de pruebas desechable.
        from uuid import uuid4

        schema = f"qa_{uuid4().hex}"
        with engine.begin() as connection:
            connection.exec_driver_sql(f'CREATE SCHEMA "{schema}"')

        @event.listens_for(engine, "checkout")
        def set_search_path(dbapi_connection, *_args):
            cursor = dbapi_connection.cursor()
            try:
                cursor.execute(f'SET search_path TO "{schema}"')
                dbapi_connection.commit()
            finally:
                cursor.close()
    else:
        engine = create_engine(f"sqlite:///{tmp_path / 'alda-qa.db'}")

        @event.listens_for(engine, "connect")
        def enable_foreign_keys(dbapi_connection, _record):
            dbapi_connection.execute("PRAGMA foreign_keys=ON")

    try:
        Base.metadata.create_all(engine)
        yield engine
    finally:
        try:
            if url:
                with engine.begin() as connection:
                    connection.exec_driver_sql(f'DROP SCHEMA "{schema}" CASCADE')
        finally:
            engine.dispose()


@pytest.fixture
def db(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture
def users(db):
    accounts = {
        role: models.DBUser(email=f"{role}@virtual.upt.pe", name=f"QA {role}", role=models.UserRole(role))
        for role in ("student", "teacher", "admin")
    }
    accounts["other_student"] = models.DBUser(
        email="other@virtual.upt.pe", name="QA estudiante 2", role=models.UserRole.student
    )
    accounts["other_teacher"] = models.DBUser(
        email="other-teacher@virtual.upt.pe", name="QA docente 2", role=models.UserRole.teacher
    )
    db.add_all(accounts.values())
    db.commit()
    for user in accounts.values():
        db.refresh(user)
        db.expunge(user)
    return accounts


@pytest.fixture
def api(engine, monkeypatch):
    monkeypatch.setenv("SESSION_SECRET", "alda-local-qa-session-key-for-generated-test-users")
    monkeypatch.setenv("COOKIE_SECURE", "true")
    monkeypatch.delenv("BOOTSTRAP_ADMIN_EMAIL", raising=False)

    def test_database():
        with Session(engine) as session:
            yield session

    monkeypatch.setitem(app.dependency_overrides, get_db, test_database)

    @contextmanager
    def open_client(user=None):
        client = TestClient(app, base_url="https://testserver")
        if user is not None:
            client.cookies.set(COOKIE_NAME, create_session_token(str(user.id)))
        try:
            yield client
        finally:
            client.close()

    return open_client
