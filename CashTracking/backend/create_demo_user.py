
import sqlite3
import os
from models import hash_password

# Determine path relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# app.py runs from CashTracking root, so DB is expected there.
# This script is in backend/, so we go up one level.
DATABASE = os.path.join(BASE_DIR, '..', 'cashtrack.db')

def create_demo_user():
    print(f"Initializing database at: {DATABASE}")
    
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    
    # Ensure tables exist
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255),
            username VARCHAR(100) UNIQUE,
            password_hash VARCHAR(255)
        )
    ''')
    
    # We should also ensure transactions table exists just in case
    cur.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type VARCHAR(10),
            amount REAL,
            category VARCHAR(50),
            description TEXT,
            date DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # Create admin user
    username = 'admin'
    password_plain = 'admin123'
    password_hashed = hash_password(password_plain)
    email = 'admin@example.com'
    
    cur.execute("SELECT id FROM users WHERE username=?", (username,))
    row = cur.fetchone()
    
    if row:
        print(f"User '{username}' already exists. Updating password...")
        cur.execute("UPDATE users SET password_hash=? WHERE username=?", (password_hashed, username))
    else:
        print(f"Creating user '{username}'...")
        cur.execute("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)",
                    (email, username, password_hashed))

    # Create demo user (as requested by user screenshot context)
    username_demo = 'demo'
    password_demo = 'demo123'
    password_demo_hashed = hash_password(password_demo)
    email_demo = 'demo@example.com'

    cur.execute("SELECT id FROM users WHERE username=?", (username_demo,))
    row_demo = cur.fetchone()
    
    if row_demo:
        print(f"User '{username_demo}' already exists. Updating password...")
        cur.execute("UPDATE users SET password_hash=? WHERE username=?", (password_demo_hashed, username_demo))
    else:
        print(f"Creating user '{username_demo}'...")
        cur.execute("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)",
                    (email_demo, username_demo, password_demo_hashed))
        
    conn.commit()
    print(f"Success! Users created:")
    print(f"1. Username='{username}', Password='{password_plain}'")
    print(f"2. Username='{username_demo}', Password='{password_demo}'")
        
    conn.close()

if __name__ == '__main__':
    create_demo_user()
