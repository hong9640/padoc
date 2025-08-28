'use client';

import { useEffect, useRef, useState } from 'react';
import { getThemeColors } from '@/utils/theme';

interface WaveformVisualizerProps {
  isRecording: boolean;
  decibelHistory: number[];
  recordingTime: number;
}

export default function WaveformVisualizer({ isRecording, decibelHistory, recordingTime }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // 캔버스 크기 초기화 및 업데이트 함수
  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // 유효하지 않은 크기면 무시

    const dpr = window.devicePixelRatio || 1;
    
    // 캔버스 실제 크기 설정
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // 논리적 크기 저장 (스케일 조정 전)
    setCanvasSize({ width: rect.width, height: rect.height });
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 컨텍스트 스케일 조정
    ctx.scale(dpr, dpr);
    
    // 안티앨리어싱 활성화
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 초기화 완료 표시
    if (!isInitialized) {
      setIsInitialized(true);
    }
  };

  // 리사이즈 처리 - ResizeObserver만 사용
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 초기 크기 설정을 위한 타이머 (여러 번 시도)
    const initTimer = setTimeout(() => {
      updateCanvasSize();
      
      // 첫 번째 시도가 실패할 경우를 대비해 추가 시도
      const retryTimer = setTimeout(() => {
        updateCanvasSize();
      }, 200);
      
      return () => clearTimeout(retryTimer);
    }, 50);

    // ResizeObserver를 사용하여 크기 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(canvas);

    // 클린업 함수
    return () => {
      clearTimeout(initTimer);
      resizeObserver.disconnect();
    };
  }, []);

  // 파형 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInitialized || !canvasSize.width || !canvasSize.height) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();

    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.fillStyle = colors.grayBg; // 회색 배경 (--gray-bg)
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      // 디버깅: 테스트 파형 그리기 (파형이 보이지 않을 때 확인용)
      if (decibelHistory.length === 0 && !isRecording) {
        ctx.beginPath();
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        
        // 간단한 사인파 그리기
        for (let x = 0; x < canvasSize.width; x += 2) {
          const y = canvasSize.height / 2 + Math.sin(x * 0.02) * 20;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        return;
      }

      if (isRecording || decibelHistory.length > 0) {
        // 녹음 시작 시간 설정
        if (isRecording && startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }

        ctx.beginPath();
        
        // 선 두께를 캔버스 크기에 비례하여 동적으로 조정
        const lineWidth = Math.max(0.5, Math.min(2, canvasSize.width / 200));
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = colors.primary; // 메인 브랜드 컬러 (--primary)

        const totalDuration = recordingTime;
        const sampleRate = 60; // 초당 60개 샘플
        const timePerSample = 1000 / sampleRate; // 각 샘플 간의 시간 간격 (밀리초)
        
        // 현재 시간 기준으로 파형 위치 계산
        const currentTime = Date.now();
        const elapsedTime = startTimeRef.current ? currentTime - startTimeRef.current : 0;
        
        // 5초 윈도우 내의 데이터만 표시
        const windowStartTime = Math.max(0, elapsedTime - totalDuration);
        const windowEndTime = elapsedTime;
        
        let hasDrawn = false;
        
        for (let i = 0; i < decibelHistory.length; i++) {
          const decibel = decibelHistory[i];
          const sampleTime = i * timePerSample;
          
          // 현재 샘플이 5초 윈도우 내에 있는지 확인
          if (sampleTime >= windowStartTime && sampleTime <= windowEndTime) {
            // y 값 계산: 데시벨(-100 ~ 0)을 캔버스 높이(0 ~ height)로 매핑
            const y = (1 - (decibel + 100) / 100) * canvasSize.height;
            
            // x 위치 계산: 5초 윈도우 내에서의 상대적 위치
            const relativeTime = sampleTime - windowStartTime;
            const x = (relativeTime / totalDuration) * canvasSize.width;
            
            if (!hasDrawn) {
              ctx.moveTo(x, y);
              hasDrawn = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        
        if (hasDrawn) {
          ctx.stroke();
        }
      }

      // 녹음이 끝나면 시작 시간 초기화
      if (!isRecording) {
        startTimeRef.current = null;
      }

      // 녹음 중일 때만 애니메이션 계속
      if (isRecording) {
        animationRef.current = requestAnimationFrame(drawWaveform);
      }
    };

    // 초기 그리기
    drawWaveform();

    // 클린업 함수
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

  }, [isRecording, decibelHistory, canvasSize.width, canvasSize.height, isInitialized]);

  const colors = getThemeColors();
  
  return (
    <canvas
      ref={canvasRef}
      style={{ 
        border: `1px solid ${colors.border}`, 
        borderRadius: '8px', 
        marginLeft: '10px', 
        width: '100%', 
        height: 'clamp(80px, 8vh, 120px)', // 반응형 높이 설정
        display: 'block', // 인라인 요소로 인한 여백 제거
        minHeight: '80px', // 최소 높이 보장
        maxHeight: '120px' // 최대 높이 제한
      }}
    />
  );
}

