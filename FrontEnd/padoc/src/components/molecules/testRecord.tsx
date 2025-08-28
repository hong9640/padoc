'use client';

import { useEffect, useState, useRef } from "react";
import { useAudioConverter } from '@/hooks/useAudioConverter'; // useAudioConverter 훅 임포트
import { useTestStore } from '@/store/testStore';
import Container from "../atoms/container";
import Text from "../atoms/text";
import RecordButton from "../atoms/recordButton";
import WaveformVisualizer from "../atoms/waveformVisualizer";
import MoveButton from '../atoms/moveButton';
import SubmitButton from '../atoms/submitButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TestPaperweight from '../organisms/testPaperweight';
import test from "node:test";

import styles from './testRecord.module.css';


interface TestRecordProps {
  recording_type: string;
};

export default function TestRecord({
  recording_type = "voice_ah", // 기본값을 "ah"로 설정
}: TestRecordProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wavAudioUrl, setWavAudioUrl] = useState<string | null>(null); // WAV 파일 URL 상태 추가
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);
  const [decibelHistory, setDecibelHistory] = useState<number[]>([]);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const router = useRouter();

  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL + "/screening";

  const { convertToWav } = useAudioConverter(); // 훅 사용

  const messages: string[] = [
    "무엇보다도 산에 오를 땐 더욱더 그 빼어난 아름다움이 느껴진다.",
    "바닷가에 나가 조개를 주우며 넓게 펼쳐있는 바다를 바라보면 내 마음 역시 넓어지는 것 같다.",
  ];

  const testMessages = useTestStore((state) => state.testMessages);
  const setTestMessage = useTestStore((state) => state.setTestMessage);

  const { voice_ah, setVoiceAh } = useTestStore();
  const { voice_sentence, setVoiceSentence } = useTestStore();

  useEffect(() => {
    if (testMessages.length === 0) {
      const random = messages[Math.floor(Math.random() * messages.length)];
      setTestMessage([random]);
    }
  }, [setTestMessage, testMessages]);

  // 컴포넌트 마운트 완료 표시
  useEffect(() => {
    setIsComponentMounted(true);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      audioContextRef.current = new window.AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => { // async로 변경
        if (audioChunksRef.current.length === 0) return;
        const originalAudioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0].type });
        const originalUrl = URL.createObjectURL(originalAudioBlob);
        setAudioUrl(originalUrl);
        audioChunksRef.current = [];

        // WAV로 변환
        try {
          const convertedWavBlob = await convertToWav(originalAudioBlob);
          const wavUrl = URL.createObjectURL(convertedWavBlob); // WAV 파일 URL 생성
          setWavAudioUrl(wavUrl); // WAV 파일 URL 상태 저장
          setWavBlob(convertedWavBlob);
        } catch (error) {
          console.error("Error converting to WAV:", error);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioUrl(null);
      setWavAudioUrl(null); // 녹음 시작 시 WAV URL 초기화
      setWavBlob(null);
      setDecibelHistory([]); // 녹음 시작 시 기록 초기화
      visualize();

      setTimeout(() => {
        stopRecording();
      }, testTime);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
  };

  const visualize = () => {
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const getDecibels = () => {
        analyserRef.current?.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        let average = sum / bufferLength;
        const currentDecibel = Math.max(-100, average - 120); // 데시벨 값 조정
        setDecibelHistory(prev => [...prev, currentDecibel]);
        animationFrameRef.current = requestAnimationFrame(getDecibels);
      };
      getDecibels();
    }
  };

  let testWord = "테스트 유형이 잘못되었습니다.";
  let nextTest = "/test/sentencetest"
  let testTime = 5000;

  const handleSubmit = async (data: any) => {
    // You can use the 'data' received from the SubmitButton if needed
    nextTest = recording_type === 'voice_ah' ? "/test/sentencetest" : "/test/result";
    router.push(nextTest);
  };

  if (recording_type === "voice_ah") {
    testWord = "5초간 \"아\" 발음"
  } else if (recording_type === "voice_sentence") {
    const { testMessages } = useTestStore.getState();
    nextTest = "/test/result"
    testTime = 10000;
    if (testMessages && testMessages.length > 0) {
      testWord = testMessages[0];
    } else {
      testWord = "문장 테스트 데이터가 없습니다.";
    }
  }

  const handleApiSubmit = async () => {
    if (!wavBlob) {
      alert('녹음된 파일이 없습니다.');
      throw new Error('녹음된 파일이 없습니다.');
    }

    const formData = new FormData();
    formData.append("voice_file", wavBlob, "uploaded_audio.wav");
    formData.append("recording_type", recording_type);

    try {
      const response = await fetch(beApiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // 500 에러인 경우 특별한 메시지 표시
        if (response.status === 500) {
          alert('파일 분석에 실패하였습니다. 조용한 환경에서 다시 시도해주세요.');
          throw new Error('파일 분석에 실패하였습니다. 조용한 환경에서 다시 시도해주세요.');
        }
        const errorText = await response.text();
        const errorMessage = `제출 실패: ${errorText || "서버 응답 오류"}`;
        alert(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (recording_type === "voice_ah") {
        setVoiceAh(data);
      } else if (recording_type === "voice_sentence") {
        setVoiceSentence(data);
      }

      // 제출 성공 시 알림 표시
      alert('녹음 파일 제출 성공!');
      return data; // 성공 시 데이터 반환
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error);
      
      // 네트워크 에러나 CORS 에러 등 fetch 자체가 실패한 경우
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('파일 분석에 실패하였습니다. 조용한 환경에서 다시 시도해주세요.');
        throw new Error('파일 분석에 실패하였습니다. 조용한 환경에서 다시 시도해주세요.');
      }
      
      // 기타 예상치 못한 에러
      alert('파일 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      throw error;
    }
  };

  return (
    <div>
      {/* 제목 */}
      <div className={styles.header}>
        <div className={styles.title}>
          <Text fontSize="1.8rem">{testWord}</Text>
        </div>
      </div>

      {/* 녹음/파형 영역 */}
      <div className={styles.recordArea}>
        <div className={styles.waveCard}>
          <div className={styles.waveInner}>
            {isComponentMounted && (
              <WaveformVisualizer isRecording={isRecording} decibelHistory={decibelHistory} recordingTime={testTime} />
            )}
          </div>
        </div>
      </div>

      {/* 녹음 완료 시 → 제출 UI 노출 */}
      {audioUrl && (
        <div className={styles.afterRecord}>
          <span className={styles.badge}>녹음 완료</span>
          <SubmitButton 
            value="제출하기" 
            width="6rem" 
            onSuccess={handleSubmit} 
            onClick={handleApiSubmit} 
          />
        </div>
      )}
      <div className={`${styles.recCtrl} ${isRecording ? styles.recCtrlRecording : ''}`}>
        <RecordButton isRecording={isRecording} onClick={isRecording ? stopRecording : startRecording} />
      </div>
    </div>
  );
}