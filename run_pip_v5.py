import pip._internal.main as pip_main
print("STARTING")
try:
    pip_main.main(["install", "google-generativeai", "--target", "lib"])
except Exception as e:
    print(f"Exception: {e}")
print("DONE")
