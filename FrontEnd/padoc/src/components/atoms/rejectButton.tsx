"use client";

interface Props {
  onClick: () => void;
  confirmMessage?: string;
}

const RejectButton = ({ onClick, confirmMessage }: Props) => {
  const handleClick = () => {
    if (window.confirm(confirmMessage || "정말 거절하시겠습니까?")) {
      onClick();
    }
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

export default RejectButton;
