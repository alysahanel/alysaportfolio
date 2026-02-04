from flask import Flask, request, jsonify, session, g
import sqlite3
from flask_cors import CORS
from flask_session import Session
from datetime import datetime
import pytz
from models import create_user_table, create_transaction_table, hash_password, check_password
import os

app = Flask(__name__)
app.secret_key = 'supersecretkey'

class PrefixMiddleware(object):
    def __init__(self, app, prefix=''):
        self.app = app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'].startswith(self.prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(self.prefix):]
            environ['SCRIPT_NAME'] = self.prefix
            return self.app(environ, start_response)
        return self.app(environ, start_response)

# Vercel/Render/Demo Adaptation
if os.environ.get('VERCEL') or os.environ.get('RENDER'):
    if os.environ.get('VERCEL'):
        app.wsgi_app = PrefixMiddleware(app.wsgi_app, prefix='/cashtracking/api')
    # Use default Flask sessions (cookie-based) for serverless/demo
    # Do NOT set SESSION_TYPE or initialize Flask-Session
    DATABASE = ':memory:' # Use in-memory DB for read-only environment
else:
    app.config['SESSION_TYPE'] = 'filesystem'
    DATABASE = 'cashtrack.db'
    Session(app)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        
        # Initialize DB if in-memory
        if DATABASE == ':memory:':
            cur = db.cursor()
            create_user_table(cur)
            create_transaction_table(cur)
            # Create a demo user
            password = hash_password('password')
            cur.execute("INSERT OR IGNORE INTO users (email, username, password_hash) VALUES (?, ?, ?)",
                        ('demo@example.com', 'demo', password))
            
            # Insert dummy transactions for demo
            cur.execute("SELECT id FROM users WHERE username='demo'")
            user_row = cur.fetchone()
            if user_row:
                uid = user_row[0]
                # Check if transactions exist
                cur.execute("SELECT count(*) FROM transactions WHERE user_id=?", (uid,))
                if cur.fetchone()[0] == 0:
                    now = datetime.now()
                    dummy_txs = [
                        (uid, 'income', 5000000, 'Salary', 'Monthly Salary', now),
                        (uid, 'expense', 50000, 'Food', 'Lunch', now),
                        (uid, 'expense', 20000, 'Transport', 'Taxi', now),
                        (uid, 'expense', 150000, 'Utilities', 'Internet Bill', now)
                    ]
                    cur.executemany("INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)", dummy_txs)

            db.commit()
            
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

if not os.environ.get('VERCEL') and not os.environ.get('RENDER'):
    # This block was moving Session(app) up, ensuring we don't init it for Vercel/Render
    pass 

CORS(app, supports_credentials=True)

# Remove the initial db setup block as it's handled in get_db for memory
# or pre-existing for file
if not os.environ.get('VERCEL') and not os.environ.get('RENDER'):
    with app.app_context():
        if os.path.exists(DATABASE):
             # Ensure tables exist
            db = get_db()
            cur = db.cursor()
            create_user_table(cur)
            create_transaction_table(cur)
            db.commit()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data['email']
    username = data['username']
    password = hash_password(data['password'])

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT id FROM users WHERE username=?", (username,))
    if cur.fetchone():
        return jsonify({'message': 'Username already exists'}), 400

    cur.execute("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)",
                (email, username, password))
    db.commit()
    return jsonify({'message': 'Registration successful'})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM users WHERE username=?", (username,))
    user = cur.fetchone()

    if user and check_password(password, user['password_hash']):
        session['user_id'] = user['id']
        return jsonify({'message': 'Login successful'})
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

@app.route('/check')
def check_login():
    if 'user_id' in session:
        return jsonify({'message': 'Logged in'})
    return jsonify({'message': 'Not logged in'}), 401

@app.route('/transactions', methods=['GET'])
def get_transactions():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    user_id = session['user_id']
    db = get_db()
    cur = db.cursor()
    cur.execute('''
        SELECT t.*, u.username, u.email
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = ?
        ORDER BY t.date DESC
    ''', (user_id,))
    rows = cur.fetchall()
    transactions = [dict(row) for row in rows]

    # SQLite stores dates as strings, so no need to convert from datetime object usually
    # But if we want to be safe or format it:
    # for tx in transactions:
    #     if isinstance(tx['date'], str):
    #         pass 

    return jsonify(transactions)

@app.route('/transactions', methods=['POST'])
def add_transaction():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    data = request.json
    user_id = session['user_id']

    jakarta = pytz.timezone('Asia/Jakarta')
    now = datetime.now(jakarta)

    db = get_db()
    cur = db.cursor()
    cur.execute('''
        INSERT INTO transactions (user_id, type, amount, category, description, date)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        data['type'],
        int(data['amount']),
        data['category'],
        data.get('description', ''),
        now
    ))
    db.commit()
    return jsonify({'message': 'Transaction added'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
