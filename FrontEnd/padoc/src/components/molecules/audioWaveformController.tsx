"use client";

import { useRef, useState } from "react";
import AudioWaveformPlayer, {
  AudioWaveformPlayerHandle,
} from "@/components/atoms/audioWaveformPlayer";
import PlayButton from "@/components/atoms/playButton";

interface AudioWaveformControllerProps {
  src: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  buttonSize?: number;
}

const AudioWaveformController = ({
  src,
  height = 80,
  waveColor = "var(--gray-medium)",
  progressColor = "var(--light-blue)",
  buttonSize = 50,
}: AudioWaveformControllerProps) => {
  const waveformRef = useRef<AudioWaveformPlayerHandle>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    const ws = waveformRef.current;
    if (!ws) return;

    if (ws.isPlaying()) {
      ws.pause();
      setIsPlaying(false);
    } else {
      ws.play();
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      {/* 파형 */}
      <AudioWaveformPlayer
        ref={waveformRef}
        src={src}
        height={height}
        waveColor={waveColor}
        progressColor={progressColor}
        onFinish={() => setIsPlaying(false)}
      />

      {/* 재생 버튼 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
        <PlayButton isPlaying={isPlaying} onClick={handleToggle} size={buttonSize} />
      </div>
    </div>
  );
};

export default AudioWaveformController;
