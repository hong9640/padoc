import clsx from 'clsx';

interface ContainerProps {
  height?: string;
  width?: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  centered?: boolean;
  display?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Container({
  height = 'auto',
  width = '100%',
  backgroundColor = 'var(--card)',
  border,
  borderRadius,
  padding = '1rem',
  margin,
  centered = true,
  display,
  children,
  className,
}: ContainerProps) {
  const computedMargin = centered ? '0 auto' : margin;

  // 최종 display 스타일 결정: className에 flex/grid가 포함되어 있으면 inline display 설정하지 않음
  const finalDisplay = className && (className.includes('flex') || className.includes('inline-flex') || className.includes('grid'))
    ? undefined // Tailwind 클래스가 display를 처리하도록 함
    : (display || 'block'); // 그렇지 않으면 제공된 display를 사용하거나 기본값 block 사용

  return (
    <div
      className={clsx(className)} // 외부 className을 먼저 적용
      style={{
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        padding,
        margin: computedMargin,
        display: finalDisplay,
      }}
    >
      {children}
    </div>
  );
}