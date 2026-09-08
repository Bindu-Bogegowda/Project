import subprocess
import sys

print("STARTING PIP RUN")
try:
    # No capture_output, let it print directly
    result = subprocess.run([sys.executable, "-m", "pip", "install", "google-generativeai", "--target", "./ai_deps"])
    print("FINISHED PIP RUN")
    print(f"Return code: {result.returncode}")
except Exception as e:
    print(f"Exception: {e}")
print("DONE")
