// app/doctor/connection/page.tsx
'use client';

import React, { useEffect, useState, useRef } from "react";
import UnconnectedPatientItem from "@/components/molecules/unconnectedPatientItem";
import PendingRequestPatientItem from "@/components/molecules/pendingRequestPatientItem";
import ConnectedPatientItem from "@/components/molecules/connectedPatientItem";
import PatientSearchBar, { PatientSearchBarRef } from "@/components/atoms/patientSearchBar";
import useUserStore from "@/store/userStore";
import DoctorLayout from "@/components/templates/doctorLayout";

import MoveButton from "@/components/atoms/moveButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from './doctorConnection.module.css';

type ConnectionStatus = 'unconnected' | 'pending' | 'approved' | 'rejected' | 'disconnected';

interface Connection {
  id: number;
  doctor_id: number;
  doctor_name: string;
  patient_id: number;
  patient_name: string;
  connection_status: ConnectionStatus;
}

const PatientConnectionManager: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>("");
  const searchBarRef = useRef<PatientSearchBarRef>(null);
  const { userData } = useUserStore();
  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL!;
  const router = useRouter();

  const user = userData as any;
  const doctorId = user?.account_id as number;
  const doctorName = user?.full_name as string;

  // localStorage에서 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('role');
      
      setAccessToken(token);
      
      // 토큰이 없거나 의사가 아닌 경우 홈으로 리다이렉션
      if (!token) {
        console.log('토큰이 없음 - 홈으로 리다이렉션');
        router.push('/');
        return;
      }
      
      if (role !== 'doctor') {
        console.log('의사가 아님 - 홈으로 리다이렉션');
        router.push('/');
        return;
      }
    }
  }, []); // router 의존성 제거

  // 기존 연결/요청 목록 로드
  const fetchConnections = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${beApiUrl}/users/connections`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      const list: Connection[] = Array.isArray(data.connections)
        ? data.connections
        : [];
      setConnections(list);
    } catch (err) {
      console.error("연결 목록 조회 실패", err);
    }
  };

  // accessToken이 설정되면 연결 목록 가져오기
  useEffect(() => {
    if (accessToken) {
      fetchConnections();
    }
  }, [accessToken]);

  // 이름 검색
  const handleSearch = async (query: string) => {
    if (!accessToken) return;
    
    // 검색어 저장
    setLastSearchQuery(query);
    
    try {
      const res = await fetch(
        `${beApiUrl}/users/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      const users: Array<{ account_id: number; full_name: string }> =
        Array.isArray((data as any).users) ? (data as any).users : [];

      const existing = new Set(connections.map(c => c.patient_id));
      const newUnconnected: Connection[] = users
        .filter(u => !existing.has(u.account_id))
        .map(u => ({
          id: -1,
          doctor_id: doctorId,
          doctor_name: doctorName,
          patient_id: u.account_id,
          patient_name: u.full_name,
          connection_status: 'unconnected',
        }));

      setConnections(prev => [...prev, ...newUnconnected]);
    } catch (err) {
      console.error("환자 검색 실패", err);
    }
  };

  // Optimistic UI 연결 요청
  const handleConnect = async (patient_id: number) => {
    if (!accessToken) return;

    // 1) Optimistic update: 바로 pending으로 상태 변경
    setConnections(prev =>
      prev.map(c =>
        c.patient_id === patient_id
          ? { ...c, connection_status: 'pending' as const }
          : c
      )
    );

    try {
  const res = await fetch(`${beApiUrl}/users/connections/requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ patient_id }),
  });
  if (res.status === 409) {
    alert("이미 요청이 등록되어 있습니다.");
    // 중복 요청인 경우, 요청중(pending) 상태로 표시
    setConnections(prev =>
      prev.map(c =>
        c.patient_id === patient_id
          ? { ...c, connection_status: 'pending' as const }
          : c
      )
    );
  }
} catch (err) {
  console.error("연결 요청 실패", err);
  // 네트워크 에러일 때만 롤백
  setConnections(prev =>
    prev.map(c =>
      c.patient_id === patient_id
        ? { ...c, connection_status: 'unconnected' as const }
        : c
    )
  );
} finally {
  await fetchConnections();  // 서버와 최종 동기화
  
  // 연결 요청 후 마지막 검색어로 다시 검색 실행
  if (lastSearchQuery && searchBarRef.current) {
    // 약간의 지연을 두어 서버 상태 업데이트를 기다림
    setTimeout(() => {
      searchBarRef.current?.triggerSearch();
    }, 500);
  }
}

  };

  // 요청 취소/연결 해제
  const handleDisconnect = async (connection_id: number) => {
    if (!accessToken) return;
    try {
      await fetch(`${beApiUrl}/users/connections/${connection_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error("연결 해제 실패", err);
    } finally {
      // 최신 상태 반영
      await fetchConnections();
    }
  };

  const unconnected = connections.filter(c => c.connection_status === 'unconnected');
  const pending     = connections.filter(c => c.connection_status === 'pending');
  const approved    = connections.filter(c => c.connection_status === 'approved');

  return (
    <DoctorLayout>
      <div className={styles.connectionContainer}>
        <header className={styles.header}>
          <h1 className={styles.title}>환자 연결 관리</h1>
        </header>
        
        <div className={styles.searchSection}>
          <PatientSearchBar ref={searchBarRef} onSearch={handleSearch} />
        </div>

        <div className={styles.connectionSections}>
          <section className={styles.connectionSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.icon}>🔍</span>
              연결되지 않은 환자
            </h3>
            <div className={styles.patientList}>
              {unconnected.map(p => (
                <UnconnectedPatientItem
                  key={p.patient_id}
                  id={p.patient_id}
                  patientName={p.patient_name}
                  onConnect={() => handleConnect(p.patient_id)}
                />
              ))}
              {unconnected.length === 0 && (
                <p className={styles.emptyMessage}>연결 가능한 환자가 없습니다.</p>
              )}
            </div>
          </section>

          <section className={styles.connectionSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.icon}>📨</span>
              요청 중인 환자
            </h3>
            <div className={styles.patientList}>
              {pending.map(p => (
                <PendingRequestPatientItem
                  key={p.id}
                  id={p.id}
                  patientName={p.patient_name}
                  onCancelRequest={() => handleDisconnect(p.id)}
                />
              ))}
              {pending.length === 0 && (
                <p className={styles.emptyMessage}>요청 중인 환자가 없습니다.</p>
              )}
            </div>
          </section>

          <section className={styles.connectionSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.icon}>✅</span>
              연결된 환자
            </h3>
            <div className={styles.patientList}>
              {approved.map(p => (
                <ConnectedPatientItem
                  key={p.id}
                  id={p.id}
                  patientName={p.patient_name}
                  onDisconnect={() => handleDisconnect(p.id)}
                />
              ))}
              {approved.length === 0 && (
                <p className={styles.emptyMessage}>연결된 환자가 없습니다.</p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.actionSection}>
          <Link href={'/doctor/dashboard'}>
            <MoveButton value="대시보드로 이동"/>
          </Link>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default PatientConnectionManager;
