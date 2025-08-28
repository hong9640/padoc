// components/molecules/PatientConnectionManager.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import UnconnectedPatientItem from '@/components/molecules/unconnectedPatientItem';
import PendingRequestPatientItem from '@/components/molecules/pendingRequestPatientItem';
import ConnectedPatientItem from '@/components/molecules/connectedPatientItem';
import PatientSearchBar, { PatientSearchBarRef } from '@/components/atoms/patientSearchBar';
import useUserStore from '@/store/userStore';

type ConnectionStatus = 'unconnected' | 'pending' | 'approved' | 'rejected' | 'disconnected';

interface Connection {
  /** 서버가 발급한 고유 connection_id */
  id: number;
  doctor_id: number;
  doctor_name: string;
  patient_id: number;
  patient_name: string;
  connection_status: ConnectionStatus;
}

export default function PatientConnectionManager() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>("");
  const searchBarRef = useRef<PatientSearchBarRef>(null);
  const { userData } = useUserStore();
  const beApiUrl     = process.env.NEXT_PUBLIC_BE_API_URL!;

  const user       = userData as any;
  const doctorId   = user?.account_id as number;
  const doctorName = user?.full_name  as string;

  // localStorage에서 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      setAccessToken(token);
    }
  }, []);

  // 1) approved + pending + rejected + disconnected 모두 가져오기
  async function fetchConnections() {
    if (!accessToken) return;

    try {
      // approved/rejected/disconnected 가져오기
      const approvedRes = await fetch(
        `${beApiUrl}/users/connections`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!approvedRes.ok) throw new Error(`GET /users/connections failed: ${approvedRes.status}`);
      const approvedJson = await approvedRes.json();
      const approvedList: Connection[] = Array.isArray(approvedJson.connections)
        ? approvedJson.connections as Connection[]
        : [];

      // pending(요청 중) 가져오기
      const pendingRes = await fetch(
        `${beApiUrl}/users/connections/requests`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!pendingRes.ok) throw new Error(`GET /users/connections/requests failed: ${pendingRes.status}`);
      const pendingJson = await pendingRes.json();
      const pendingList: Connection[] = Array.isArray(pendingJson.requests)
        ? (pendingJson.requests as Connection[]).map(r => ({
            ...r,
            connection_status: 'pending'
          }))
        : [];

      // 합쳐서 상태 업데이트
      setConnections([
        ...approvedList,
        ...pendingList
      ]);
    } catch (e) {
      console.error('연결 목록 조회 실패', e);
    }
  }

  // 2) 검색: unconnected 후보만 임시 추가
  async function handleSearch(q: string) {
    if (!accessToken) return;
    
    // 검색어 저장
    setLastSearchQuery(q);
    
    try {
      const res = await fetch(
        `${beApiUrl}/users/search?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`GET /users/search failed: ${res.status}`);
      const json = await res.json();
      const users: { account_id: number; full_name: string }[] =
        Array.isArray(json.users) ? json.users : [];

      const existingIds = new Set(connections.map(c => c.patient_id));
      const newOnes = users
        .filter(u => !existingIds.has(u.account_id))
        .map(u => ({
          id: -1,
          doctor_id: doctorId,
          doctor_name: doctorName,
          patient_id: u.account_id,
          patient_name: u.full_name,
          connection_status: 'unconnected' as const,
        }));
      setConnections(prev => [...prev, ...newOnes]);
    } catch (e) {
      console.error('환자 검색 실패', e);
    }
  }

  // 3) 연결 요청
  async function handleConnect(patient_id: number) {
    if (!accessToken) return;
    try {
      const res = await fetch(
        `${beApiUrl}/users/connections/requests`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ patient_id }),
        }
      );
      if (res.status === 409) {
        alert('이미 연결 요청이 등록되어 있습니다.');
      }
    } catch (e) {
      console.error('연결 요청 실패', e);
    } finally {
      await fetchConnections();
      
      // 연결 요청 후 마지막 검색어로 다시 검색 실행
      if (lastSearchQuery && searchBarRef.current) {
        // 약간의 지연을 두어 서버 상태 업데이트를 기다림
        setTimeout(() => {
          searchBarRef.current?.triggerSearch();
        }, 500);
      }
    }
  }

  // 4) 요청 취소 / 연결 해제
  async function handleDisconnect(connection_id: number) {
    if (!accessToken || connection_id <= 0) return;
    try {
      const res = await fetch(
        `${beApiUrl}/users/connections/${connection_id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) {
        alert('삭제에 실패했습니다.');
        return;
      }
    } catch (e) {
      console.error('연결 해제 실패', e);
      alert('연결 해제에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      await fetchConnections();
    }
  }

  useEffect(() => {
    fetchConnections();
  }, [accessToken]); // accessToken이 변경될 때마다 다시 호출

  // 5) 상태별 분류
  const unconnected = connections.filter(c =>
    c.connection_status === 'unconnected' ||
    c.connection_status === 'rejected' ||
    c.connection_status === 'disconnected'
  );
  const pending  = connections.filter(c => c.connection_status === 'pending');
  const approved = connections.filter(c => c.connection_status === 'approved');

  return (
    <div style={{ padding: '1rem' }}>
      <PatientSearchBar ref={searchBarRef} onSearch={handleSearch} />

      <h3>🔍 연결되지 않은 환자</h3>
      {unconnected.map(c => (
        <UnconnectedPatientItem
          key={c.patient_id}
          id={c.patient_id}
          patientName={c.patient_name}
          onConnect={() => handleConnect(c.patient_id)}
        />
      ))}

      <h3>📨 요청 중인 환자</h3>
      {pending.map(c => (
        <PendingRequestPatientItem
          key={c.id}
          id={c.id}
          patientName={c.patient_name}
          onCancelRequest={() => handleDisconnect(c.id)}
        />
      ))}

      <h3>✅ 연결된 환자</h3>
      {approved.map(c => (
        <ConnectedPatientItem
          key={c.id}
          id={c.id}
          patientName={c.patient_name}
          onDisconnect={() => handleDisconnect(c.id)}
        />
      ))}
    </div>
  );
}
