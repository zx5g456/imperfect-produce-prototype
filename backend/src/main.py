from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Protocol

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


BACKEND_DIR = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = BACKEND_DIR / "migrations"
PRODUCT_DATA_PATH = BACKEND_DIR.parent / "data" / "products.json"
DEFAULT_DATABASE_PATH = BACKEND_DIR / ".data" / "prototype.sqlite3"

StudyMode = Literal["browse", "comprehension", "comparison"]
Condition = Literal["A", "B"]
ProductKind = Literal["standard", "imperfect"]
EventType = Literal[
    "product_details_opened",
    "product_chosen",
    "task_completed",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def to_python(value: Any) -> Any:
    """Convert a Pyodide JavaScript proxy to ordinary Python when necessary."""
    converter = getattr(value, "to_py", None)
    return converter() if callable(converter) else value


class SessionCreate(BaseModel):
    participant_name: str = Field(min_length=1, max_length=80)
    study_mode: StudyMode
    condition: Condition
    scenario_index: int = Field(ge=1, le=100)

    @field_validator("participant_name")
    @classmethod
    def participant_name_must_not_be_blank(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("participant name is required")
        return cleaned


class SessionCreated(BaseModel):
    id: str
    started_at: str


class EventCreate(BaseModel):
    event_type: EventType
    product_id: str | None = Field(default=None, max_length=80)
    product_kind: ProductKind | None = None
    elapsed_ms: int | None = Field(default=None, ge=0, le=86_400_000)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("metadata")
    @classmethod
    def metadata_must_be_small(cls, value: dict[str, Any]) -> dict[str, Any]:
        encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        if len(encoded.encode("utf-8")) > 4096:
            raise ValueError("metadata must be no larger than 4 KB")
        return value


class SessionComplete(BaseModel):
    elapsed_ms: int = Field(ge=0, le=86_400_000)
    product_id: str | None = Field(default=None, max_length=80)
    product_kind: ProductKind | None = None


class Repository(Protocol):
    async def list_products(self) -> list[dict[str, Any]]: ...

    async def product_exists(self, product_id: str) -> bool: ...

    async def create_session(self, payload: SessionCreate) -> SessionCreated: ...

    async def add_event(self, session_id: str, payload: EventCreate) -> str: ...

    async def complete_session(
        self, session_id: str, payload: SessionComplete
    ) -> None: ...


PRODUCT_SELECT = """
SELECT
  id,
  category,
  name,
  image,
  unit,
  original_price_cents,
  current_price_cents,
  appearance,
  quality,
  condition_a_information,
  condition_b_information,
  scenario,
  source_status
FROM products
ORDER BY position ASC
"""


def product_to_api(row: dict[str, Any]) -> dict[str, Any]:
    raw_category = row["category"]
    kind: ProductKind = (
        "standard" if raw_category.startswith("s-") else "imperfect"
    )
    return {
        "id": row["id"],
        "category": raw_category[2:],
        "kind": kind,
        "name": row["name"],
        "image": row["image"],
        "unit": row["unit"],
        "originalPriceCents": row["original_price_cents"],
        "currentPriceCents": row["current_price_cents"],
        "appearance": row["appearance"],
        "quality": row["quality"],
        "conditionAInformation": row["condition_a_information"],
        "conditionBInformation": row["condition_b_information"],
        "scenario": row["scenario"],
        "sourceStatus": row["source_status"],
    }


def sync_local_product_catalog(connection: sqlite3.Connection) -> None:
    products = json.loads(PRODUCT_DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(products, list) or not products:
        raise ValueError("data/products.json must contain at least one product")

    product_ids = [product["id"] for product in products]
    placeholders = ", ".join("?" for _ in product_ids)
    connection.execute(
        f"DELETE FROM products WHERE id NOT IN ({placeholders})", product_ids
    )
    connection.execute("UPDATE products SET position = position + 1000000000")

    for product in products:
        is_standard = product["category"].startswith("s-")
        name = (
            product["standardName"]
            if is_standard
            else product["imperfectName"]
        )
        image = (
            product["standardImage"] if is_standard else product["imperfectImage"]
        )
        connection.execute(
            """
            INSERT INTO products (
              id, position, category, name, image, unit,
              original_price_cents, current_price_cents,
              appearance, quality,
              condition_a_information, condition_b_information,
              scenario, source_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              position = excluded.position,
              category = excluded.category,
              name = excluded.name,
              image = excluded.image,
              unit = excluded.unit,
              original_price_cents = excluded.original_price_cents,
              current_price_cents = excluded.current_price_cents,
              appearance = excluded.appearance,
              quality = excluded.quality,
              condition_a_information = excluded.condition_a_information,
              condition_b_information = excluded.condition_b_information,
              scenario = excluded.scenario,
              source_status = excluded.source_status
            """,
            (
                product["id"],
                product["position"],
                product["category"],
                name,
                image,
                product["unit"],
                product["originalPriceCents"],
                product["currentPriceCents"],
                product["appearance"],
                product["quality"],
                product["conditionAInformation"],
                product["conditionBInformation"],
                product["scenario"],
                product["sourceStatus"],
            ),
        )


class LocalSQLiteRepository:
    """SQLite repository used by the standard local FastAPI server."""

    _initialized_paths: set[Path] = set()

    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        if database_path not in self._initialized_paths:
            database_path.parent.mkdir(parents=True, exist_ok=True)
            with self.connect() as connection:
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS local_schema_migrations (
                      name TEXT PRIMARY KEY,
                      applied_at TEXT NOT NULL
                    )
                    """
                )
                applied = {
                    row[0]
                    for row in connection.execute(
                        "SELECT name FROM local_schema_migrations"
                    ).fetchall()
                }
                for migration_path in sorted(MIGRATIONS_DIR.glob("*.sql")):
                    if migration_path.name in applied:
                        continue
                    connection.executescript(
                        migration_path.read_text(encoding="utf-8")
                    )
                    connection.execute(
                        "INSERT INTO local_schema_migrations (name, applied_at) VALUES (?, ?)",
                        (migration_path.name, utc_now()),
                    )
                sync_local_product_catalog(connection)
            self._initialized_paths.add(database_path)

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    async def list_products(self) -> list[dict[str, Any]]:
        with self.connect() as connection:
            rows = connection.execute(PRODUCT_SELECT).fetchall()
        return [product_to_api(dict(row)) for row in rows]

    async def product_exists(self, product_id: str) -> bool:
        with self.connect() as connection:
            return (
                connection.execute(
                    "SELECT 1 FROM products WHERE id = ?", (product_id,)
                ).fetchone()
                is not None
            )

    async def create_session(self, payload: SessionCreate) -> SessionCreated:
        session_id = str(uuid.uuid4())
        started_at = utc_now()
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO study_sessions
                  (id, participant_name, study_mode, condition_code,
                   scenario_index, started_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    payload.participant_name,
                    payload.study_mode,
                    payload.condition,
                    payload.scenario_index,
                    started_at,
                ),
            )
        return SessionCreated(id=session_id, started_at=started_at)

    async def add_event(self, session_id: str, payload: EventCreate) -> str:
        event_id = str(uuid.uuid4())
        if payload.product_id and not await self.product_exists(payload.product_id):
            raise ValueError(payload.product_id)
        with self.connect() as connection:
            if not connection.execute(
                "SELECT 1 FROM study_sessions WHERE id = ?", (session_id,)
            ).fetchone():
                raise KeyError(session_id)
            connection.execute(
                """
                INSERT INTO behavior_events
                  (id, session_id, event_type, product_id, product_kind,
                   occurred_at, elapsed_ms, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    session_id,
                    payload.event_type,
                    payload.product_id,
                    payload.product_kind,
                    utc_now(),
                    payload.elapsed_ms,
                    json.dumps(
                        payload.metadata, ensure_ascii=False, separators=(",", ":")
                    ),
                ),
            )
        return event_id

    async def complete_session(
        self, session_id: str, payload: SessionComplete
    ) -> None:
        if payload.product_id and not await self.product_exists(payload.product_id):
            raise ValueError(payload.product_id)
        completed_at = utc_now()
        event_id = str(uuid.uuid4())
        with self.connect() as connection:
            cursor = connection.execute(
                """
                UPDATE study_sessions
                SET completed_at = ?, duration_ms = ?
                WHERE id = ?
                """,
                (completed_at, payload.elapsed_ms, session_id),
            )
            if cursor.rowcount == 0:
                raise KeyError(session_id)
            connection.execute(
                """
                INSERT INTO behavior_events
                  (id, session_id, event_type, product_id, product_kind,
                   occurred_at, elapsed_ms, metadata_json)
                VALUES (?, ?, 'task_completed', ?, ?, ?, ?, '{}')
                """,
                (
                    event_id,
                    session_id,
                    payload.product_id,
                    payload.product_kind,
                    completed_at,
                    payload.elapsed_ms,
                ),
            )


class D1Repository:
    """D1 repository used by the FastAPI Cloudflare Python Worker."""

    def __init__(self, database: Any) -> None:
        self.database = database

    async def rows(self, query: str, *params: Any) -> list[dict[str, Any]]:
        statement = self.database.prepare(query)
        if params:
            statement = statement.bind(*params)
        result = await statement.all()
        rows = to_python(result.results)
        return [dict(row) for row in rows]

    async def run(self, query: str, *params: Any) -> Any:
        statement = self.database.prepare(query)
        if params:
            statement = statement.bind(*params)
        return await statement.run()

    async def session_exists(self, session_id: str) -> bool:
        rows = await self.rows(
            "SELECT 1 AS found FROM study_sessions WHERE id = ? LIMIT 1", session_id
        )
        return bool(rows)

    async def list_products(self) -> list[dict[str, Any]]:
        rows = await self.rows(PRODUCT_SELECT)
        return [product_to_api(row) for row in rows]

    async def product_exists(self, product_id: str) -> bool:
        rows = await self.rows(
            "SELECT 1 AS found FROM products WHERE id = ? LIMIT 1", product_id
        )
        return bool(rows)

    async def create_session(self, payload: SessionCreate) -> SessionCreated:
        session_id = str(uuid.uuid4())
        started_at = utc_now()
        await self.run(
            """
            INSERT INTO study_sessions
              (id, participant_name, study_mode, condition_code,
               scenario_index, started_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            session_id,
            payload.participant_name,
            payload.study_mode,
            payload.condition,
            payload.scenario_index,
            started_at,
        )
        return SessionCreated(id=session_id, started_at=started_at)

    async def add_event(self, session_id: str, payload: EventCreate) -> str:
        if not await self.session_exists(session_id):
            raise KeyError(session_id)
        if payload.product_id and not await self.product_exists(payload.product_id):
            raise ValueError(payload.product_id)
        event_id = str(uuid.uuid4())
        await self.run(
            """
            INSERT INTO behavior_events
              (id, session_id, event_type, product_id, product_kind,
               occurred_at, elapsed_ms, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            event_id,
            session_id,
            payload.event_type,
            payload.product_id,
            payload.product_kind,
            utc_now(),
            payload.elapsed_ms,
            json.dumps(payload.metadata, ensure_ascii=False, separators=(",", ":")),
        )
        return event_id

    async def complete_session(
        self, session_id: str, payload: SessionComplete
    ) -> None:
        if not await self.session_exists(session_id):
            raise KeyError(session_id)
        if payload.product_id and not await self.product_exists(payload.product_id):
            raise ValueError(payload.product_id)
        completed_at = utc_now()
        await self.run(
            """
            UPDATE study_sessions
            SET completed_at = ?, duration_ms = ?
            WHERE id = ?
            """,
            completed_at,
            payload.elapsed_ms,
            session_id,
        )
        await self.run(
            """
            INSERT INTO behavior_events
              (id, session_id, event_type, product_id, product_kind,
               occurred_at, elapsed_ms, metadata_json)
            VALUES (?, ?, 'task_completed', ?, ?, ?, ?, '{}')
            """,
            str(uuid.uuid4()),
            session_id,
            payload.product_id,
            payload.product_kind,
            completed_at,
            payload.elapsed_ms,
        )


def repository_for(request: Request) -> Repository:
    env = request.scope.get("env")
    d1 = getattr(env, "DB", None) if env is not None else None
    if d1 is not None:
        return D1Repository(d1)

    database_path = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DATABASE_PATH)))
    return LocalSQLiteRepository(database_path)


app = FastAPI(
    title="Fresh Choice Research API",
    version="1.0.0",
    description="Participant-linked interaction logging for the produce study.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
async def health(request: Request) -> dict[str, str]:
    env = request.scope.get("env")
    storage = "d1" if env is not None and getattr(env, "DB", None) else "sqlite"
    return {"status": "ok", "storage": storage}


@app.get("/api/products")
async def list_products(request: Request) -> dict[str, list[dict[str, Any]]]:
    return {"products": await repository_for(request).list_products()}


@app.post("/api/sessions", response_model=SessionCreated, status_code=201)
async def create_session(request: Request, payload: SessionCreate) -> SessionCreated:
    return await repository_for(request).create_session(payload)


@app.post("/api/sessions/{session_id}/events", status_code=201)
async def add_event(
    session_id: str, request: Request, payload: EventCreate
) -> dict[str, str]:
    try:
        event_id = await repository_for(request).add_event(session_id, payload)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Product not found") from error
    return {"id": event_id}


@app.post("/api/sessions/{session_id}/complete", status_code=204)
async def complete_session(
    session_id: str, request: Request, payload: SessionComplete
) -> None:
    try:
        await repository_for(request).complete_session(session_id, payload)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Product not found") from error


try:
    from workers import asgi

    Default = asgi.entrypoint(app)
except ImportError:
    # The Workers runtime supplies this package; normal local FastAPI does not.
    Default = None
