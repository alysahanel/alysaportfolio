import hashlib
import hmac

def create_user_table(cur):
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255),
            username VARCHAR(100) UNIQUE,
            password_hash VARCHAR(255)
        )
    ''')

def create_transaction_table(cur):
    cur.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type TEXT,
            amount INTEGER,
            category VARCHAR(100),
            description TEXT,
            date DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def check_password(password, hashed):
    return hmac.compare_digest(hash_password(password), hashed)
