import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "memory.db")

def init_memory_db():
    """Initializes the SQLite database for user memories."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_memories (
            username TEXT,
            key TEXT,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (username, key)
        )
    """)
    conn.commit()
    conn.close()

def store_memory(username, key, value):
    """Stores or updates a memory key-value pair for a user."""
    username = username.strip().lower()
    key = key.strip().lower()
    value = value.strip()
    if not username or not key or not value:
        return False, "Username, key, and value cannot be empty."
    
    init_memory_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO user_memories (username, key, value, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(username, key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
        """, (username, key, value))
        conn.commit()
        return True, f"Memory '{key}' stored successfully."
    except Exception as e:
        return False, f"Database error: {str(e)}"
    finally:
        conn.close()

def get_memory(username, key):
    """Retrieves a specific memory value for a user. Returns None if not found."""
    username = username.strip().lower()
    key = key.strip().lower()
    if not username or not key:
        return None
    
    init_memory_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT value FROM user_memories WHERE username = ? AND key = ?", (username, key))
        row = cursor.fetchone()
        if row:
            return row[0]
        return None
    except Exception:
        return None
    finally:
        conn.close()

def delete_memory(username, key):
    """Deletes a specific memory entry for a user."""
    username = username.strip().lower()
    key = key.strip().lower()
    if not username or not key:
        return False, "Username and key cannot be empty."
    
    init_memory_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM user_memories WHERE username = ? AND key = ?", (username, key))
        conn.commit()
        if cursor.rowcount > 0:
            return True, f"Memory '{key}' deleted."
        return False, f"Memory '{key}' not found."
    except Exception as e:
        return False, f"Database error: {str(e)}"
    finally:
        conn.close()

def list_memories(username):
    """Returns a dictionary of all key-value memory pairs for a user."""
    username = username.strip().lower()
    if not username:
        return {}
    
    init_memory_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    memories = {}
    
    try:
        cursor.execute("SELECT key, value FROM user_memories WHERE username = ? ORDER BY key ASC", (username,))
        rows = cursor.fetchall()
        for key, value in rows:
            memories[key] = value
        return memories
    except Exception:
        return {}
    finally:
        conn.close()
