'use client';

interface RadioButtonProps {
  id: string;
  name: string;
  label: string;
  value: string;
  height?: string;
  width?: string;
  selectedColor?: string;
  borderColor?: string;
  labelColor?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RadioButton({
  id,
  name,
  label,
  value,
  height = '40px',
  width = '80px',
  selectedColor = 'var(--primary)',
  borderColor = 'var(--border)',
  labelColor = 'var(--text)',
  checked,
  onChange,
}: RadioButtonProps) {
  return (
    <label htmlFor={id} style={{ cursor: 'pointer', display: 'inline-block' }}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={{
          display: 'none',
        }}
      />
      <div
        className="radio-box"
        style={{
          height,
          width,
          lineHeight: height,
          textAlign: 'center',
          border: `2px solid ${borderColor}`,
          color: labelColor,
          userSelect: 'none',
          borderRadius: '6px',
          transition: 'all 0.2s',
        }}
      >
        {label}
      </div>

      <style jsx>{`
        input[type="radio"]:checked + .radio-box {
          background-color: ${selectedColor};
          color: var(--text-on-primary) !important;
          border-color: ${selectedColor};
        }

        input[type="radio"]:hover + .radio-box {
          opacity: 0.85;
        }
      `}</style>
    </label>
  );
}
