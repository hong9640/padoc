"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";

export interface AudioWaveformPlayerHandle {
  playPause: () => void;
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
}

interface AudioWaveformPlayerProps {
  src: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  onFinish?: () => void; // 재생 종료 시 콜백
}

const AudioWaveformPlayer = forwardRef<AudioWaveformPlayerHandle, AudioWaveformPlayerProps>(
  ({ src, height = 80, waveColor = "var(--gray-medium)", progressColor = "var(--light-blue)", onFinish }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);

    // WaveSurfer 생성
    useEffect(() => {
      if (!containerRef.current) return;

      const waveSurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor,
        progressColor,
        height,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true,
        interact: true,
        // responsive: true,
      });

      waveSurfer.load(src);
      waveSurferRef.current = waveSurfer;

      waveSurfer.on("finish", () => {
        onFinish?.();
      });

      return () => {
        waveSurfer.destroy();
      };
    }, [src]);

    // 외부에서 제어할 수 있도록 메서드 노출
    useImperativeHandle(ref, () => ({
      playPause: () => waveSurferRef.current?.playPause(),
      play: () => waveSurferRef.current?.play(),
      pause: () => waveSurferRef.current?.pause(),
      isPlaying: () => waveSurferRef.current?.isPlaying() ?? false,
    }));

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: `${height}px`,
          cursor: "pointer",
        }}
      />
    );
  }
);

export default AudioWaveformPlayer;
