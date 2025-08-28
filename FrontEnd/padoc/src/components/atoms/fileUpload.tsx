"use client";

import { useRef, useState, useEffect } from 'react';
import { useAudioConverter } from '@/hooks/useAudioConverter';
import { useRouter } from 'next/navigation';
import { useTestStore } from '@/store/testStore';


interface FileUploadProps {
  apiUrl: string;
  recording_type: string;
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
}

// 파일 이름을 반응형으로 자르는 함수
const truncateFileNameResponsive = (fileName: string, maxWidth: number, fontSize: number = 14): string => {
  if (maxWidth <= 0) return fileName;
  
  // 대략적인 문자 너비 계산 (한글, 영문, 숫자 고려)
  const getCharWidth = (char: string): number => {
    const code = char.charCodeAt(0);
    // 한글, 한자 등은 더 넓음
    if (code >= 0xAC00 && code <= 0xD7AF) return fontSize * 1.2; // 한글
    if (code >= 0x4E00 && code <= 0x9FFF) return fontSize * 1.2; // 한자
    // 영문, 숫자, 특수문자는 좁음
    return fontSize * 0.6;
  };
  
  // 전체 파일명의 예상 너비 계산
  const totalWidth = fileName.split('').reduce((sum, char) => sum + getCharWidth(char), 0);
  
  if (totalWidth <= maxWidth) {
    return fileName;
  }
  
  const extension = fileName.split('.').pop();
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
  
  if (!extension) {
    // 확장자가 없는 경우
    let truncated = '';
    let currentWidth = 0;
    const ellipsisWidth = fontSize * 1.8; // "..."의 예상 너비
    
    for (const char of fileName) {
      const charWidth = getCharWidth(char);
      if (currentWidth + charWidth + ellipsisWidth <= maxWidth) {
        truncated += char;
        currentWidth += charWidth;
      } else {
        break;
      }
    }
    return truncated + '...';
  }
  
  // 확장자가 있는 경우
  const extensionWidth = extension.split('').reduce((sum, char) => sum + getCharWidth(char), 0);
  const ellipsisWidth = fontSize * 1.8; // "..."의 예상 너비
  const availableWidth = maxWidth - extensionWidth - ellipsisWidth;
  
  if (availableWidth <= 0) {
    return '...' + extension;
  }
  
  let truncated = '';
  let currentWidth = 0;
  
  for (const char of nameWithoutExtension) {
    const charWidth = getCharWidth(char);
    if (currentWidth + charWidth <= availableWidth) {
      truncated += char;
      currentWidth += charWidth;
    } else {
      break;
    }
  }
  
  return truncated + '...' + extension;
};

export default function FileUpload({ apiUrl, recording_type, onSubmitStart, onSubmitEnd }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileNameRef = useRef<HTMLSpanElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [wavFile, setWavFile] = useState<Blob | null>(null);
  const [wavFileUrl, setWavFileUrl] = useState<string | null>(null);
  const [truncatedFileName, setTruncatedFileName] = useState<string>('');
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const { convertToWav } = useAudioConverter();

  const router = useRouter();

  const { voice_ah, setVoiceAh } = useTestStore();
  const { voice_sentence, setVoiceSentence } = useTestStore();

  let nextRoute = ''
  if (recording_type === 'voice_ah') {
    nextRoute = '/test/sentencetest'
  } else if (recording_type === 'voice_sentence') {
    nextRoute = '/test/result'
  }

  // 컨테이너 너비 측정 및 파일명 자르기
  useEffect(() => {
    const updateTruncatedFileName = () => {
      if (fileName && containerWidth > 0) {
        const truncated = truncateFileNameResponsive(fileName, containerWidth);
        setTruncatedFileName(truncated);
      }
    };

    updateTruncatedFileName();
  }, [fileName, containerWidth]);

  // 컨테이너 너비 측정
  useEffect(() => {
    const measureContainerWidth = () => {
      if (fileNameRef.current) {
        const parent = fileNameRef.current.parentElement;
        if (parent) {
          const parentWidth = parent.offsetWidth;
          // 파일명 컨테이너의 여백과 X 버튼 공간을 고려
          const availableWidth = parentWidth - 60; // 여백과 X 버튼 공간
          setContainerWidth(Math.max(availableWidth, 50)); // 최소 50px 보장
        }
      }
    };

    measureContainerWidth();
    
    // 윈도우 리사이즈 시 다시 측정
    const handleResize = () => {
      measureContainerWidth();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fileName]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 오디오 파일 또는 video/webm 파일만 허용
      if (!selectedFile.type.startsWith('audio/') && selectedFile.type !== 'video/webm') {
        alert('오디오 파일 (또는 WebM 비디오 파일)만 업로드할 수 있습니다.');
        handleClearFile();
        return;
      }

      setFileName(selectedFile.name);
      setOriginalFile(selectedFile);
      setWavFile(null);
      setWavFileUrl(null);

      console.log("Selected file type:", selectedFile.type);

      try {
        let processedFile: Blob = selectedFile;
        if (selectedFile.type !== 'audio/wav') {
          console.log("Converting to WAV...");
          processedFile = await convertToWav(selectedFile);
          console.log("Conversion complete. Converted file type:", processedFile.type);
        }
        setWavFile(processedFile);
        setWavFileUrl(URL.createObjectURL(processedFile));

      } catch (error) {
        console.error("Error processing audio file:", error);
        alert('오디오 파일 처리 중 오류가 발생했습니다.');
        handleClearFile();
      }
    }
  };

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileName(null);
    setOriginalFile(null);
    setWavFile(null);
    setWavFileUrl(null);
  };

  const handleSubmit = async () => {
    if (!wavFile) return;

    onSubmitStart?.();

    try {
      const formData = new FormData();
      formData.append('voice_file', wavFile, fileName ? fileName.replace(/\.[^/.]+$/, ".wav") : "uploaded_audio.wav");
      formData.append('recording_type', recording_type)

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 500) {
          alert('파일 분석에 실패하였습니다. 다른 파일을 보내주세요');
          return;
        }
        throw new Error('업로드 실패');
      }

      const data = await response.json();
      if (recording_type === "voice_ah") {
        setVoiceAh(data);
      } else if (recording_type === "voice_sentence") {
        setVoiceSentence(data);
      }

      alert('파일 업로드 성공!');
      handleClearFile();
      router.push(nextRoute);
    } catch (error) {
      console.error(error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      onSubmitEnd?.();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100 border rounded-md w-full max-w-lg">
      <div className="flex items-center space-x-4">
        {/* 파일 선택 버튼 */}
        <label
          htmlFor="file"
          className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition"
        >
          파일 선택
        </label>

        {/* 실제 input은 숨김 */}
        <input
          type="file"
          accept="audio/*" // 오디오 파일만 받도록 제한
          id="file"
          name="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 선택한 파일 이름 및 취소 버튼 */}
        {fileName && (
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span 
              className="text-sm text-gray-700 flex-1 min-w-0" 
              title={fileName}
              ref={fileNameRef}
            >
              {truncatedFileName}
            </span>
            <button
              onClick={handleClearFile}
              className="text-xs text-red-500 hover:text-red-700 flex-shrink-0"
              title="선택 취소"
              style={{ cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!wavFile}
        className={`px-4 py-2 rounded text-white transition ${!wavFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
      >
        제출
      </button>
    </div>
  );
}
