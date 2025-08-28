interface TextProps {
  height?: string;
  width?: string;
  color?: string;
  textAlign?: React.CSSProperties['textAlign'];
  fontSize?: string;
  fontFamily?: string;
  fontStyle?: React.CSSProperties['fontStyle'];
  children?: React.ReactNode;
}

export default function Text({
  height = 'auto',
  width = '100%',
  color = 'var(--text)',
  textAlign = 'start',
  fontSize = '1rem',
  fontFamily = 'Arial',
  fontStyle = 'normal',
  children = 'text area',
}: TextProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        height,
        width,
        color,
        textAlign,
        fontSize,
        fontFamily,
        fontStyle
      }}
    >
      {children}
    </span>
  );
}
