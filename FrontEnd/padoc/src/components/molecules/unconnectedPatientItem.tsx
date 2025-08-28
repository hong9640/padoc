// 역할: 아직 연결되지 않은 환자 항목
// 구성: patientName + AcceptButton
// 동작: 수락 시 연결 요청 상태로 이동

// UnconnectedPatientItem.tsx (Molecule)
"use client";

import AcceptButton from "@/components/atoms/acceptButton";

interface Props {
  id: number;
  patientName: string;
  onConnect: () => void;
}

const UnconnectedPatientItem = ({ id, patientName, onConnect }: Props) => {
  return (
    <div
      style={{
        backgroundColor: "var(--cyan-light)",
        borderRadius: "8px",
        padding: "0.5rem",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>{patientName}</span>
      <AcceptButton 
        onClick={onConnect} 
        confirmMessage={`${patientName}님에게 연결 요청을 보내시겠습니까?`}
      />
    </div>
  );
};

export default UnconnectedPatientItem;