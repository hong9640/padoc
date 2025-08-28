"use client";

interface PatientNavButtonProps {
  id: number;
  fullName: string;
  isActive: boolean;
  onClick: (id: number) => void;
}

const PatientNavButton = ({
  id,
  fullName,
  isActive,
  onClick,
}: PatientNavButtonProps) => {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        width: "100%",
        padding: "0.75rem 1rem",
        border: "none",
        borderRadius: "8px",
        backgroundColor: isActive ? "#e9ecef" : "transparent",
        color: isActive ? "#212529" : "#6c757d",
        fontSize: "0.95rem",
        fontWeight: isActive ? "600" : "500",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "0.25rem",
        position: "relative",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
          e.currentTarget.style.color = "#495057";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#6c757d";
        }
      }}
      title={fullName}
    >
      <span style={{ 
        fontSize: "1.1rem", 
        flexShrink: 0,
        opacity: isActive ? 1 : 0.7
      }}>
        👤
      </span>
      <span style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }}>
        {fullName}
      </span>
    </button>
  );
};

export default PatientNavButton;
