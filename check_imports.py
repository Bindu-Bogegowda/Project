import sys
import os
print(f"Python version: {sys.version}")
print(f"Python path: {sys.path}")
try:
    import google.generativeai
    print("google.generativeai imported successfully")
except ImportError as e:
    print(f"Failed to import google.generativeai: {e}")
