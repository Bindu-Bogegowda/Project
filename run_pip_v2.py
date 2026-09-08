import subprocess
import sys
import os

with open("pip_log.txt", "w") as f:
    f.write("STARTING PIP INSTALL\n")
    try:
        # Try to install google-generativeai and its dependencies to a local 'lib' folder
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "google-generativeai", "google-ai-generativelanguage", "--target", "lib"],
            capture_output=True,
            text=True
        )
        f.write(f"STDOUT:\n{result.stdout}\n")
        f.write(f"STDERR:\n{result.stderr}\n")
        f.write(f"RETURN CODE: {result.returncode}\n")
    except Exception as e:
        f.write(f"EXCEPTION: {e}\n")
    f.write("DONE\n")
