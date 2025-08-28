// 네비게이션바 버튼을 클릭했을때 해당화면으로 콘텐츠가 전환되도록하는것
// (summary, data, graph, personal)
// 버튼 하나 (ex. Summary, Data 등)

"use client";

interface Props {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton = ({ label, isActive, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        marginRight: "0.5rem",
        borderRadius: "6px",
        backgroundColor: isActive ? "var(--card)" : "var(--gray-medium)",
        border: "2px solid var(--gray-dark)",
        fontWeight: isActive ? "bold" : "normal",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
};

export default NavButton;
