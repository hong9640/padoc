// submitButton.tsx 수정: onClick 콜백 추가로 재사용성과 유연성 향상

"use client";

interface SubmitButtonProps {
  value?: string;
  className?: string;
  height?: string;
  width?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  borderRadius?: string;
  border?: string;
  onClick?: () => Promise<any>; // API 요청 로직을 포함하는 비동기 함수
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function SubmitButton({
  value = "제출",
  className='',
  height = "40px",
  width = "100px",
  backgroundColor = "var(--primary)",
  color = "var(--text-on-primary)",
  fontSize = "1rem",
  borderRadius = "6px",
  border = "none",
  onClick,
  onSuccess,
  onError,
}: SubmitButtonProps) {
  const handleClick = async () => {
    if (!onClick) {
      console.warn("onClick 함수가 제공되지 않았습니다.");
      return;
    }

    try {
      const data = await onClick(); // onClick 함수 실행 및 결과 대기
      if (onSuccess) onSuccess(data);
    } catch (error) {
      console.error("제출 실패:", error);
      if (onError) onError(error);
    }
  };

  return (
    <input
      type="button"
      value={value}      
      onClick={handleClick}
      className={className}
      style={{
        height,
        width,
        backgroundColor,
        color,
        fontSize,
        borderRadius,
        border,
        cursor: "pointer",
      }}
    />
  );
}