// components/molecules/doctorSidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortablePatientButton from './sortablePatientButton';
import SubmitButton from '@/components/atoms/submitButton';
import useAuthStore from '@/store/authStore';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

import useSelectedPatientStore from '@/store/selectedPatientStore';

interface Patient {
  account_id: number;
  full_name: string;
}

interface DoctorSidebarProps {
  onSelectPatient: (id: number | null, fullName: string) => void;
  isSidebarOpen?: boolean;
}

export default function DoctorSidebar({ onSelectPatient, isSidebarOpen = true }: DoctorSidebarProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { selectedPatient } = useSelectedPatientStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleRequestConnection = async () => {
    await router.push('/doctor/connection');
  };


  useEffect(() => {
    const fetchAndSortPatients = async () => {
      if (!isAuthenticated) {
        return;
      }
      try {
        const [connectionsRes, orderRes] = await Promise.all([
          authenticatedGet('/users/connections'),
          authenticatedGet('/users/list-order')
        ]);

        if (connectionsRes.error || orderRes.error) {
          return;
        }

        const { connections } = connectionsRes.data;
        const { patient_order: patientOrder } = orderRes.data;

        const approved: Patient[] = connections
          .filter((c: any) => c.connection_status === 'approved')
          .map((c: any) => ({ account_id: c.patient_id, full_name: c.patient_name }));

        const sortedList = approved.sort((a: Patient, b: Patient) => {
          const aIndex = patientOrder.indexOf(a.account_id);
          const bIndex = patientOrder.indexOf(b.account_id);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

        setPatients(sortedList);

        if (sortedList.length > 0 && !selectedPatient) {
          const patientToSelect = sortedList[0];
          setSelectedId(patientToSelect.account_id);
          onSelectPatient(patientToSelect.account_id, patientToSelect.full_name);
        } else if (selectedPatient) {
          setSelectedId(selectedPatient.account_id);
        }
      } catch (e) {
        // 에러 처리
      }
    };

    fetchAndSortPatients();
  }, [onSelectPatient, selectedPatient, isAuthenticated]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPatients(prev => {
      const oldIndex = prev.findIndex(p => p.account_id === (active.id as number));
      const newIndex = prev.findIndex(p => p.account_id === (over.id as number));
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      
      const updatePatientOrder = async () => {
        if (!isAuthenticated) {
          return;
        }
        const patientOrder = newOrder.map(p => p.account_id);

        try {
          const { error } = await authenticatedPost('/users/list-order', { patient_order: patientOrder });
          if (error) {
            throw new Error('환자 순서 변경에 실패했습니다.');
          }
        } catch (error) {
          setPatients(prev);
        }
      };

      updatePatientOrder();

      return newOrder;
    });
  };

  const handleSelect = (id: number) => {
    if (selectedId === id) return;

    setSelectedId(id);
    const patient = patients.find(p => p.account_id === id);
    if (patient && isAuthenticated) {
      onSelectPatient(id, patient.full_name);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      width: '100%'
    }}>

      {/* 환자 목록 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        marginBottom: '1rem'
      }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={patients.map(p => p.account_id)} strategy={verticalListSortingStrategy}>
            {patients.map((p) => (
              <SortablePatientButton
                key={p.account_id}
                id={p.account_id}
                fullName={p.full_name}
                isActive={p.account_id === selectedId}
                onClick={handleSelect}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        {/* 환자 연결 관리 버튼 - 사이드바가 열려있을 때만 표시 */}
        {isSidebarOpen && (
          <div style={{ 
            paddingTop: '1rem',
            marginTop: '1rem',
            borderTop: '1px solid #e9ecef'
          }}>
            <p style={{
              color: 'var(--doctor-text)',
              opacity: 0.5,
              fontSize: '0.8rem',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>드래그 앤 드롭으로 환자 순서를 변경</p>
            <SubmitButton
              value='환자 연결 관리'
              onClick={handleRequestConnection}
              height='44px'
              width='100%'
              backgroundColor='#007bff'
              color='white'
              fontSize='0.95rem'
              borderRadius='8px'
              border='none'
            />
          </div>
        )}
        
        {patients.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: '#6c757d',
            fontSize: '0.9rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
            <p style={{ margin: '0' }}>연결된 환자가 없습니다.</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
              환자 연결 관리를 통해 환자를 추가하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}