'use client';

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

export default function RecordButton({ isRecording, onClick }: RecordButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: isRecording ? 'var(--danger)' : 'var(--primary)',
        color: 'white',
        fontSize: '1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: isRecording ? '0 0 20px rgba(220, 38, 38, 0.5)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {isRecording ? '녹음 종료' : '녹음 시작'}
    </button>
  );
}
