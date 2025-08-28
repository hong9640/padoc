// 개별 의사 정보(이름)를 보여주고
// 버튼을 누르면 연결 해제 요청을 상위 컴포넌트에 전달합니다.

import RemoveButton from "../atoms/removeButton";

interface Props {
  doctorId: number;
  doctorName: string;
  onDisconnect: (doctorId: number) => void;
}

const ConnectedDoctorItem = ({
  doctorId,
  doctorName,
  onDisconnect,
}: Props) => {
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: "8px",
        border: "1px solid var(--doctor-border)",
        padding: "1rem",
        margin: "1rem 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>{doctorName}</span>
      <div style={{ display: "flex", alignItems: "center" }}>
        <RemoveButton onClick={() => onDisconnect(doctorId)} />
      </div>
    </div>
  );
};

export default ConnectedDoctorItem;
