interface TextInputFormProps {
  id?: string;
  height?: string;
  width?: string;
  color?: string;
  textAlign?: React.CSSProperties['textAlign'];
  fontSize?: string;
  fontFamily?: string;
  fontStyle?: React.CSSProperties['fontStyle'];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // 추가
  value? :string;
  className?: string;
}

export default function TextInputForm({
  id,
  height = 'auto',
  width = '100%',
  color = 'var(--text)',
  textAlign = 'start',
  fontSize = '1.5rem',
  fontFamily = 'Arial',
  fontStyle = 'normal',
  placeholder = '입력해주세요',
  onChange, // 추가
  className='',
  value,
}: TextInputFormProps) {
  return (
    <input
      type="text"
      id={id}
      placeholder={placeholder}
      onChange={onChange} // 추가
      value={value}
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
