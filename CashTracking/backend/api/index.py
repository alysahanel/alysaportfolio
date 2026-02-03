import os
import sys

# Add the parent directory (backend) to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel entry point
if __name__ == "__main__":
    app.run()
