import os
import sys

# Add the backend directory to sys.path so imports work
backend_dir = os.path.join(os.path.dirname(__file__), '../CashTracking/backend')
sys.path.append(backend_dir)

from app import app

# Vercel requires 'app' object to be available
# or for a handler function. Flask 'app' is WSGI compatible.
