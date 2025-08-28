"use client";

interface Props {
  onClick: () => void;
  confirmMessage?: string; // 선택적으로 메시지 받기
}

const AcceptButton = ({ onClick, confirmMessage }: Props) => {
  const handleClick = () => {
    if (window.confirm(confirmMessage || "정말 수락하시겠습니까?")) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "lightgreen",
        padding: "0.5rem",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
      }}
    >
      ✅
    </button>
  );
};

export default AcceptButton;
