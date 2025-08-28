// 역할: 연결 요청 중인 환자 항목
// 구성: patientName + RejectButton (→ "요청 취소")
// 동작: 취소하면 다시 "연결되지 않은 환자" 목록으로 복귀

// PendingRequestPatientItem.tsx (Molecule)
"use client";

import RejectButton from "@/components/atoms/rejectButton";

interface Props {
  id: number;
  patientName: string;
  onCancelRequest: () => void;
}

const PendingRequestPatientItem = ({ id, patientName, onCancelRequest }: Props) => {
  return (
    <div
      style={{
        backgroundColor: "var(--orange-light)",
        borderRadius: "8px",
        padding: "0.5rem",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>{patientName}</span>
      <RejectButton
        onClick={onCancelRequest}
        confirmMessage="정말 연결 요청을 취소하시겠습니까?"
      />
    </div>
  );
};

export default PendingRequestPatientItem;