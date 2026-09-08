import pip
print("STARTING")
try:
    pip.main(["install", "google-generativeai", "--target", "lib"])
except Exception as e:
    print(f"Exception: {e}")
print("DONE")
