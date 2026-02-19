import speech_recognition as srec

def runner():
    l = srec.Recognizer()
    with srec.Microphone() as source:
        l.adjust_for_ambient_noise(source, duration=1) 
        try:
            aud = l.listen(source, timeout=0 , phrase_time_limit=60)  
            listen = l.recognize_google(aud, language='id-ID')
            print(listen)
        except srec.WaitTimeoutError:
            print("No speech detected within timeout")
            listen = ""
        except Exception as e:
            print(f"Error: {e}")
            listen = ""
        return listen

def rSave(teks):
    if teks:
        with open('voice.txt', 'w', encoding='utf-8') as file:
            file.write(f"{teks}")
        print("Saved")

def main():
    adder = runner()
    if adder:
        rSave(adder)

main()