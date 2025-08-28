"use client";

interface Props {
  onClick: () => void;
  confirmMessage?: string;
}

const RemoveButton = ({ onClick, confirmMessage }: Props) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "var(--red-light)",
        padding: "0.5rem",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
        marginLeft: "0.5rem",
      }}
    >
      ❌
    </button>
  );
};

export default RemoveButton;
