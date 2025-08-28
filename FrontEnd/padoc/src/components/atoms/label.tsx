export interface LabelProps {
  htmlFor?: string;
  height?: string;
  width?: string;
  color?: string;
  textAlign?: React.CSSProperties['textAlign'];
  fontSize?: string;
  fontFamily?: string;
  fontStyle?: React.CSSProperties['fontStyle'];
  children?: React.ReactNode;
  className?: string;
}

export default function Label({
  htmlFor,
  height = 'auto',
  width = '100%',
  color = 'var(--text)',
  textAlign = 'start',
  fontSize = '1rem',
  fontFamily = 'Arial',
  fontStyle = 'normal',
  children = 'Label',
  className = ''
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={className}
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
    </label>
  );
}
