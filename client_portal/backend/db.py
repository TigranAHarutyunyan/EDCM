"""
Client Portal persistence: PostgreSQL (recommended) or SQLite (local fallback).

Set CLIENT_PORTAL_DATABASE_URL, e.g.:
  postgresql://portal_user:secret@db:5432/client_portal

Or use split vars (docker-compose can build the URL):
  CLIENT_PORTAL_DB_HOST, CLIENT_PORTAL_DB_PORT, CLIENT_PORTAL_DB_NAME,
  CLIENT_PORTAL_DB_USER, CLIENT_PORTAL_DB_PASSWORD
"""
from __future__ import annotations

import os
import sqlite3
from typing import Any, Dict, Optional, Tuple
from urllib.parse import quote_plus

DB_FILE = "portal.db"


def _database_url() -> Optional[str]:
    url = os.getenv("CLIENT_PORTAL_DATABASE_URL", "").strip()
    if url:
        return url
    host = os.getenv("CLIENT_PORTAL_DB_HOST", "").strip()
    if not host:
        return None
    port = os.getenv("CLIENT_PORTAL_DB_PORT", "5432")
    name = os.getenv("CLIENT_PORTAL_DB_NAME", "client_portal")
    user = os.getenv("CLIENT_PORTAL_DB_USER", "client_portal")
    password = os.getenv("CLIENT_PORTAL_DB_PASSWORD", "")
    # URL-encode user/password for special characters
    return (
        f"postgresql://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{name}"
    )


USE_POSTGRES = bool(_database_url())


def connect():
    if USE_POSTGRES:
        import psycopg2

        return psycopg2.connect(_database_url())
    return sqlite3.connect(DB_FILE)


def _ph() -> str:
    return "%s" if USE_POSTGRES else "?"


def init_db() -> None:
    conn = connect()
    try:
        c = conn.cursor()
        if USE_POSTGRES:
            c.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    company TEXT DEFAULT '',
                    is_verified INTEGER DEFAULT 0
                )
                """
            )
            c.execute(
                """
                CREATE TABLE IF NOT EXISTS verification_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        else:
            c.execute(
                """CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE,
                  email TEXT UNIQUE,
                  password TEXT,
                  full_name TEXT,
                  company TEXT,
                  is_verified INTEGER DEFAULT 0)"""
            )
            c.execute(
                """CREATE TABLE IF NOT EXISTS verification_tokens
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  token TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"""
            )
        conn.commit()
    finally:
        conn.close()


def row_to_user(row: Tuple[Any, ...]) -> Dict[str, Any]:
    return {
        "id": row[0],
        "username": row[1],
        "email": row[2],
        "password": row[3],
        "full_name": row[4],
        "company": row[5] or "",
        "is_verified": bool(row[6]),
    }


def get_user(username: str) -> Optional[Dict[str, Any]]:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(f"SELECT * FROM users WHERE username={ph}", (username,))
        row = c.fetchone()
        if row:
            return row_to_user(row)
        return None
    finally:
        conn.close()


def insert_user_register(
    username: str,
    email: str,
    hashed_password: str,
    full_name: str,
) -> int:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        if USE_POSTGRES:
            c.execute(
                f"""
                INSERT INTO users (username, email, password, full_name, company)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph})
                RETURNING id
                """,
                (username, email, hashed_password, full_name, ""),
            )
            user_id = c.fetchone()[0]
        else:
            c.execute(
                f"INSERT INTO users (username, email, password, full_name, company) VALUES ({ph}, {ph}, {ph}, {ph}, {ph})",
                (username, email, hashed_password, full_name, ""),
            )
            user_id = c.lastrowid
        conn.commit()
        return int(user_id)
    finally:
        conn.close()


def insert_verification_token(user_id: int, code: str) -> None:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(
            f"INSERT INTO verification_tokens (user_id, token) VALUES ({ph}, {ph})",
            (user_id, code),
        )
        conn.commit()
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[Tuple[int, str]]:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(f"SELECT id, username FROM users WHERE email={ph}", (email,))
        return c.fetchone()
    finally:
        conn.close()


def verify_token_match(user_id: int, code: str) -> bool:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(
            f"SELECT user_id FROM verification_tokens WHERE user_id={ph} AND token={ph}",
            (user_id, code),
        )
        return c.fetchone() is not None
    finally:
        conn.close()


def mark_verified_and_delete_token(user_id: int, code: str) -> None:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(f"UPDATE users SET is_verified = 1 WHERE id={ph}", (user_id,))
        c.execute(
            f"DELETE FROM verification_tokens WHERE user_id={ph} AND token={ph}",
            (user_id, code),
        )
        conn.commit()
    finally:
        conn.close()


def get_user_id_by_token(token: str) -> Optional[int]:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(f"SELECT user_id FROM verification_tokens WHERE token={ph}", (token,))
        row = c.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def verify_email_token_complete(user_id: int, token: str) -> None:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(f"UPDATE users SET is_verified = 1 WHERE id={ph}", (user_id,))
        c.execute(f"DELETE FROM verification_tokens WHERE token={ph}", (token,))
        conn.commit()
    finally:
        conn.close()


def insert_google_user(email: str, full_name: str) -> None:
    conn = connect()
    try:
        c = conn.cursor()
        ph = _ph()
        c.execute(
            f"""
            INSERT INTO users (username, email, password, full_name, company, is_verified)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})
            """,
            (email, email, "GOOGLE_AUTH_NO_PASSWORD", full_name, "", 1),
        )
        conn.commit()
    finally:
        conn.close()
