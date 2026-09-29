from flask import Flask, request, jsonify, send_from_directory
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "backend" / "notes.db"
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/notes")
def get_notes():
    conn = get_db()

    rows = conn.execute(
        "SELECT id, content, created_at FROM notes ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(row) for row in rows])


@app.post("/api/notes")
def save_note():
    data = request.get_json(silent=True) or {}
    content = str(data.get("content", "")).strip()

    if not content:
        return jsonify({"error": "Note cannot be empty."}), 400

    conn = get_db()

    cursor = conn.execute(
        "INSERT INTO notes (content) VALUES (?)",
        (content,)
    )

    conn.commit()

    note = conn.execute(
        "SELECT id, content, created_at FROM notes WHERE id = ?",
        (cursor.lastrowid,)
    ).fetchone()

    conn.close()

    return jsonify(dict(note)), 201


@app.delete("/api/notes/<int:note_id>")
def delete_note(note_id):
    conn = get_db()

    cursor = conn.execute(
        "DELETE FROM notes WHERE id = ?",
        (note_id,)
    )

    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({"error": "Note not found."}), 404

    return jsonify({"message": "Note deleted."})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)