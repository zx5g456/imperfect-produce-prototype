from pathlib import Path

from fastapi.testclient import TestClient

from backend.src.main import LocalSQLiteRepository, app


def test_products_and_anonymous_session_flow(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "test.sqlite3"
    LocalSQLiteRepository._initialized_paths.discard(database_path)
    monkeypatch.setenv("DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json() == {"status": "ok", "storage": "sqlite"}

        products = client.get("/api/products")
        assert products.status_code == 200
        assert [item["id"] for item in products.json()["products"]] == [
            "carrots",
            "apples",
            "capsicum",
        ]

        created = client.post(
            "/api/sessions",
            json={
                "study_mode": "comparison",
                "condition": "B",
                "scenario_index": 1,
            },
        )
        assert created.status_code == 201
        session_id = created.json()["id"]

        event = client.post(
            f"/api/sessions/{session_id}/events",
            json={
                "event_type": "product_chosen",
                "product_id": "carrots",
                "product_kind": "imperfect",
                "elapsed_ms": 1200,
                "metadata": {"condition": "B"},
            },
        )
        assert event.status_code == 201

        completed = client.post(
            f"/api/sessions/{session_id}/complete",
            json={
                "elapsed_ms": 2500,
                "product_id": "carrots",
                "product_kind": "imperfect",
            },
        )
        assert completed.status_code == 204

        with LocalSQLiteRepository(database_path).connect() as connection:
            stored_session = connection.execute(
                "SELECT completed_at, duration_ms FROM study_sessions WHERE id = ?",
                (session_id,),
            ).fetchone()
            event_types = [
                row[0]
                for row in connection.execute(
                    "SELECT event_type FROM behavior_events WHERE session_id = ? ORDER BY occurred_at",
                    (session_id,),
                ).fetchall()
            ]

        assert stored_session["completed_at"] is not None
        assert stored_session["duration_ms"] == 2500
        assert event_types == ["product_chosen", "task_completed"]


def test_event_rejects_unknown_session(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "missing.sqlite3"
    LocalSQLiteRepository._initialized_paths.discard(database_path)
    monkeypatch.setenv("DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        response = client.post(
            "/api/sessions/not-a-session/events",
            json={"event_type": "product_details_opened", "metadata": {}},
        )

    assert response.status_code == 404


def test_event_rejects_unknown_product(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "missing-product.sqlite3"
    LocalSQLiteRepository._initialized_paths.discard(database_path)
    monkeypatch.setenv("DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        created = client.post(
            "/api/sessions",
            json={
                "study_mode": "comparison",
                "condition": "B",
                "scenario_index": 1,
            },
        )
        response = client.post(
            f"/api/sessions/{created.json()['id']}/events",
            json={
                "event_type": "product_chosen",
                "product_id": "not-a-product",
                "product_kind": "imperfect",
                "metadata": {},
            },
        )

    assert response.status_code == 422
    assert response.json() == {"detail": "Product not found"}
