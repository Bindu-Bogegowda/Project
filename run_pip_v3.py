import os
print("STARTING")
ret = os.system("pip install google-generativeai --target lib")
print(f"DONE with return code {ret}")
