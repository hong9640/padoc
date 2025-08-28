interface PasswordInputFormProps {
  id?: string;
  value?: string;
  height?: string;
  width?: string;
  color?: string;
  textAlign?: React.CSSProperties['textAlign'];
  fontSize?: string;
  fontFamily?: string;
  fontStyle?: React.CSSProperties['fontStyle'];
  placeholder?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // 추가
}

export default function PasswordInputForm({
  id,
  value,
  height = 'auto',
  width = '100%',
  color = 'var(--text)',
  textAlign = 'start',
  fontSize = '1.5rem',
  fontFamily = 'Arial',
  fontStyle = 'normal',
  placeholder = '입력해주세요',
  className = '',
  onChange, // 추가
}: PasswordInputFormProps) {
  return (
    <input
      type="password"
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={onChange} // 추가
      className={className}
      style={{
        display: 'inline-block',
        height,
        width,
        color,
        textAlign,
        fontSize,
        fontFamily,
        fontStyle,
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '4px 8px'
      }}
    />
  );
}