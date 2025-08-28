"""
이 스크립트는 ESP32 같은 마이크로컨트롤러와 시리얼 통신을 통해 초음파 장치를 제어합니다.
상위 프로세스(예: Qt C++ 애플리케이션)로부터 표준 입력(stdin)을 통해 'start', 'stop', 'exit'
명령어를 받아 처리하고, 처리 결과를 표준 출력(stdout)으로 전송합니다.

주요 기능:
- 사용 가능한 시리얼 포트를 자동으로 감지합니다.
- 지정된 속도(Baud Rate)로 시리얼 포트를 엽니다.
- 'start' 명령어 수신 시, 시리얼 포트에 'S'를 전송하여 초음파 측정을 시작합니다.
- 'stop' 명령어 수신 시, 시리얼 포트에 'E'를 전송하여 초음파 측정을 중지합니다.
- 'exit' 명령어 또는 표준 입력이 끊기면(EOF) 루프를 종료하고 리소스를 정리합니다.
"""
import sys
import time
import serial
from serial.tools import list_ports as lp

BAUD_RATE = 115200

def check_ports():
    ports = list(lp.comports())
    for p in ports:
        print(f"{p.device} - {p.description or ''}", flush=True)
    if not ports:
        print("No serial ports found", flush=True)
        sys.exit(1)
    return ports[0].device

def start_ultrasound(ser):
    ser.write(b'S')
    ser.flush()
    print("초음파 테스트 시작", flush=True)

def stop_ultrasound(ser):
    ser.write(b'E')
    ser.flush()
    print("초음파 테스트 끝", flush=True)

def main():
    port = check_ports()
    ser = serial.Serial(port, BAUD_RATE, timeout=0.1)
    time.sleep(2)
    running = False
    try:
        while True:
            cmd = sys.stdin.readline()
            if not cmd:
                # EOF: 상위 프로세스 종료
                break
            cmd = cmd.strip().lower()
            if cmd == "start":
                if not running:
                    start_ultrasound(ser)
                    running = True
                else:
                    print("이미 실행 중입니다.", flush=True)
            elif cmd == "stop":
                if running:
                    stop_ultrasound(ser)
                    running = False
                else:
                    print("이미 정지 상태입니다.", flush=True)
            elif cmd == "exit":
                if running:
                    stop_ultrasound(ser)
                break
            elif cmd:
                print(f"알 수 없는 명령: {cmd}", flush=True)
    finally:
        try:
            ser.close()
        except Exception:
            pass
        print("시리얼 포트 종료", flush=True)

if __name__ == "__main__":
    main()