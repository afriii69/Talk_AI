import subprocess
import uuid
import os
import ctypes

engine = "engine/piper.exe"
model = "engine/id_ID-news_tts-medium.onnx"

def delete_permanent(path):
    if os.path.exists(path):
        ctypes.windll.kernel32.DeleteFileW(path)

def tResp(fl):
    with open(fl, "r") as file:
        return file.read()

c_ = tResp("chat.txt")
input = c_ + "\n"

aud = f"{uuid.uuid4().hex}.mp3"

proc = subprocess.Popen(
    [engine, "-m", model, "-f", aud],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding='utf-8'
)

stdout, stderr = proc.communicate(input)

if proc.returncode == 0 and os.path.exists(aud):
    os.system(f'powershell -c "(New-Object Media.SoundPlayer \\"{aud}\\").PlaySync()"')
    delete_permanent(aud)
else:
    print("Failed to generate audio.")
