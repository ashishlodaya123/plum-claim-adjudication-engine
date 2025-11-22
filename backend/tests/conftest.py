import sys
import os
from pathlib import Path

# Add the backend directory to sys.path so that 'app' can be imported
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))
