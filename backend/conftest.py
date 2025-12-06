import sys
from pathlib import Path

# Add the backend directory to sys.path to ensure imports work correctly
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))
