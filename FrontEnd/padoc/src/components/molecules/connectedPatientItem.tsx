// components/molecules/ConnectedPatientItem.tsx
"use client";

interface Props {
  id: number;
  patientName: string;
  onDisconnect: () => void;
}

const ConnectedPatientItem = ({ id, patientName, onDisconnect }: Props) => {
  const handleClick = () => {
    if (window.confirm("정말 연결을 해제하시겠습니까?")) {
      onDisconnect();
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--green-light)",
        borderRadius: "8px",
        padding: "0.5rem",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      {/* id를 UI에 표시하려면 이렇게 */}
      <span>{patientName} ({id})</span>
      <button
        onClick={handleClick}
        style={{
          backgroundColor: "var(--red-light)",
          padding: "0.5rem",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
        }}
      >
        ❌
      </button>
    </div>
  );
};

export default ConnectedPatientItem;
