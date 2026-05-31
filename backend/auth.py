import sqlite3
import hashlib
import os
import secrets
import streamlit as st

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")

def init_auth_db():
    """Initializes the SQLite database for user authentication."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def _hash_password(password, salt):
    """Hashes a password with a given salt."""
    hash_inst = hashlib.sha256()
    hash_inst.update(salt.encode('utf-8'))
    hash_inst.update(password.encode('utf-8'))
    return hash_inst.hexdigest()

def register_user(username, password):
    """Registers a new user. Returns True if successful, False if username already exists."""
    username = username.strip().lower()
    if not username or not password:
        return False, "Username and password cannot be empty."
    
    init_auth_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT 1 FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return False, "Username already exists."
        
        # Generate salt and hash
        salt = secrets.token_hex(16)
        pwd_hash = _hash_password(password, salt)
        
        cursor.execute(
            "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
            (username, pwd_hash, salt)
        )
        conn.commit()
        return True, "Registration successful! You can now log in."
    except Exception as e:
        return False, f"Database error: {str(e)}"
    finally:
        conn.close()

def login_user(username, password):
    """Validates login credentials. Returns True and username if successful, False and error message otherwise."""
    username = username.strip().lower()
    if not username or not password:
        return False, "Username and password cannot be empty."
    
    init_auth_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT password_hash, salt FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if not row:
            return False, "Username not found."
        
        db_hash, salt = row
        input_hash = _hash_password(password, salt)
        if input_hash == db_hash:
            return True, username
        else:
            return False, "Incorrect password."
    except Exception as e:
        return False, f"Database error: {str(e)}"
    finally:
        conn.close()

def show_auth_page():
    """Renders a simple, clean login/signup page in Streamlit."""
    # Centered container styling
    st.markdown("""
        <style>
        .auth-container {
            max-width: 400px;
            margin: 50px auto;
            padding: 30px;
            background-color: #fcfcfc;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border: 1px solid #eaeaea;
        }
        .stButton>button {
            width: 100%;
            border-radius: 6px;
            font-weight: 500;
        }
        </style>
    """, unsafe_allow_html=True)
    
    st.title("👤 Personal AI Assistant")
    st.caption("A beginner-friendly local Agent system powered by Ollama.")
    
    # Simple tab selection
    tab1, tab2 = st.tabs(["Login", "Sign Up"])
    
    with tab1:
        st.subheader("Login to your account")
        login_user_input = st.text_input("Username", key="login_username").strip()
        login_pass_input = st.text_input("Password", type="password", key="login_password")
        
        if st.button("Login", key="login_btn"):
            success, msg_or_username = login_user(login_user_input, login_pass_input)
            if success:
                st.session_state["authenticated"] = True
                st.session_state["username"] = msg_or_username
                st.success("Successfully logged in!")
                st.rerun()
            else:
                st.error(msg_or_username)
                
    with tab2:
        st.subheader("Create a new account")
        signup_user_input = st.text_input("Choose Username", key="signup_username").strip()
        signup_pass_input = st.text_input("Choose Password", type="password", key="signup_password")
        signup_confirm = st.text_input("Confirm Password", type="password", key="signup_confirm")
        
        if st.button("Register", key="signup_btn"):
            if signup_pass_input != signup_confirm:
                st.error("Passwords do not match.")
            else:
                success, msg = register_user(signup_user_input, signup_pass_input)
                if success:
                    st.success(msg)
                else:
                    st.error(msg)
