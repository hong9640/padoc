'use client';
import { useRouter } from 'next/navigation';

interface MoveButtonProps {
  url?: string;
  value?: string;
  height?: string;
  width?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  borderRadius?: string;
  border?: string;
  margin?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function MoveButton({
  url = '#',
  value = '이동',
  height = 'auto',  // 자동 높이
  width = '100px',
  backgroundColor = 'var(--primary)',
  color = 'var(--text-on-primary)',
  fontSize = '1rem',
  borderRadius = '6px',
  border = 'none',
  margin,
  className='',
  onClick,
  disabled = false,
}: MoveButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick();
    } else {
      router.push(url);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      disabled={disabled}
      style={{
        minHeight: height,
        width,
        backgroundColor: disabled ? 'var(--gray-medium)' : backgroundColor,
        color: disabled ? 'var(--gray-dark)' : color,
        fontSize,
        borderRadius,
        border,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0.5rem',
        whiteSpace: 'normal',      // 줄바꿈 허용
        wordBreak: 'break-word',   // 단어 단위 줄바꿈
        textAlign: 'center',
        margin,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {value}
    </button>
  );
}

