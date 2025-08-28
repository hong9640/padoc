// 의사와 연결 요청이 온 상황에서, 각 요청 항목을 하나씩 렌더링해주며
// 수락 혹은 거절 버튼을 보여주는 UI 요소

"use client";

import AcceptButton from "@/components/atoms/acceptButton";
import RejectButton from "@/components/atoms/rejectButton";

interface Props {
  doctorName: string;
  onAccept: () => void;
  onReject: () => void;
}

const ConnectionRequestItem = ({
  doctorName,
  onAccept,
  onReject,
}: Props) => {
  return (
    <div
      style={{
        backgroundColor: "var(--blue-light)",
        borderRadius: "8px",
        padding: "1rem",
        margin: "1rem 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>{doctorName}</span>
      <div style={{ display: "flex", alignItems: "center" }}>
        <AcceptButton 
          onClick={onAccept} 
          confirmMessage={`${doctorName}님의 연결 요청을 수락하시겠습니까?`}
        />
        <RejectButton onClick={onReject} />
      </div>
    </div>
  );
};

export default ConnectionRequestItem;
