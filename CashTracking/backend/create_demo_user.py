
import sqlite3
from werkzeug.security import generate_password_hash
import os

DATABASE = 'cashtrack.db'

def create_demo_user():
    if not os.path.exists(DATABASE):
        print(f"Database {DATABASE} not found!")
        return

    try:
        conn = sqlite3.connect(DATABASE)
        cur = conn.cursor()
        
        # Check if demo user exists
        cur.execute("SELECT id FROM users WHERE username='demo'")
        if cur.fetchone():
            print("Demo user already exists.")
        else:
            password_hash = generate_password_hash('demo123')
            cur.execute("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)",
                        ('demo@example.com', 'demo', password_hash))
            conn.commit()
            print("Demo user created successfully: demo / demo123")
            
        conn.close()
    except Exception as e:
        print(f"Error creating demo user: {e}")

if __name__ == '__main__':
    create_demo_user()
