interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  size?: number;
}

const PlayButton: React.FC<PlayButtonProps> = ({ isPlaying, onClick, size = 50 }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--gray-medium)',
        border: '2px solid black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {isPlaying ? (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 100 100">
          <rect x="25" y="20" width="15" height="60" fill="white" />
          <rect x="60" y="20" width="15" height="60" fill="white" />
        </svg>
      ) : (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 100 100">
          <polygon points="30,20 30,80 80,50" fill="blueviolet" stroke="black" strokeWidth="2" />
        </svg>
      )}
    </button>
  );
};

export default PlayButton