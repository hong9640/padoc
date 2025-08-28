// 의사 환자 연결기능

"use client";

import { useState, useEffect } from "react";
import ConnectionRequestItem from "@/components/molecules/connectionRequestItem";
import ConnectedDoctorItem from "@/components/molecules/connectedDoctorItem";

interface Connection {
  id: number;
  doctor_id: number;
  doctor_name: string;
  patient_id: number;
  patient_name: string;
  connection_status: 'pending' | 'approved' | 'rejected' | 'disconnected'
  created_at: string;
  updated_at: string;
}

interface Doctor {
  connection_id: number;
  name: string;
}

export default function DoctorConnectionManager() {
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<Doctor[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL;

  // localStorage에서 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("access_token");
      setAccessToken(token);
    }
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${beApiUrl}/users/connections`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();
        const connections: Connection[] = data.connections;

        const pending: Doctor[] = [];
        const approved: Doctor[] = [];

        connections.forEach((connection) => {
          const name = connection.doctor_name;
          const doctorConnection = { connection_id: connection.id, name }

          switch (connection.connection_status) {
            case 'pending':
              pending.push(doctorConnection);
              break;
            case 'approved':
              approved.push(doctorConnection);
              break;
            default:
              break;
          }
        });
        setPendingDoctors(pending);
        setApprovedDoctors(approved);
      } catch (err) {
        console.error("연결 목록 조회 실패", err);
      }
    };
    fetchDoctors();
  }, [accessToken, beApiUrl])

  const approveConnection = async (id: number) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${beApiUrl}/users/connections/approve`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ connection_id: id }),
      });

      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }
      const data = await res.json();
      console.log("연결 승인 성공:", data);
    } catch (err) {
      console.error("연결 승인 실패:", err);
    }
  }

  const rejectConnection = async (id: number) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${beApiUrl}/users/connections/reject`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ connection_id: id }),
      });

      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }
      const data = await res.json();
      console.log("연결 거절 성공:", data);
    } catch (err) {
      console.error("연결 거절 실패:", err);
    }
  }

  const removeConnection = async (id: number) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${beApiUrl}/users/connections/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }
      console.log("연결 삭제 성공:");
    } catch (err) {
      console.error("연결 삭제 실패:", err);
    }
  }

  const handleAccept = (id: number) => {
    const approved = pendingDoctors.find((doc) => doc.connection_id === id);
    if (approved) {
      setApprovedDoctors((prev) => [...prev, approved]);
      setPendingDoctors((prev) => prev.filter((doc) => doc.connection_id !== id));
      approveConnection(id);
    };
  }

  const handleReject = (id: number) => {
    setPendingDoctors((prev) => prev.filter((doc) => doc.connection_id !== id));
    rejectConnection(id)
  };

  const handleDisconnect = (id: number) => {
    const confirmDisconnect = window.confirm("정말 연결을 해제하시겠습니까?");
    if (!confirmDisconnect) return;
    setApprovedDoctors((prev) => prev.filter((doc) => doc.connection_id !== id));
    removeConnection(id);
  };

  return (
    <div style={{ padding: "1rem", fontSize: "1.2rem", fontWeight: "bold", textAlign: "center" }}>
      <h2>연결 요청한 의사 리스트</h2>
      {pendingDoctors.map((doc) => (
        <ConnectionRequestItem
          key={doc.connection_id}
          doctorName={doc.name}
          onAccept={() => handleAccept(doc.connection_id)}
          onReject={() => handleReject(doc.connection_id)}
        />
      ))}

      <h2>연결된 의사 리스트</h2>
      {approvedDoctors.map((doc) => (
        <ConnectedDoctorItem
          key={doc.connection_id}
          doctorId={doc.connection_id}
          doctorName={doc.name}
          onDisconnect={() => handleDisconnect(doc.connection_id)}
        />
      ))}
    </div>
  );
}