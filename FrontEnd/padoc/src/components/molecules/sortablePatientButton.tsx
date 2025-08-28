// components/molecules/sortablePatientButton.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PatientNavButton from '@/components/atoms/patientNavButton';

interface Props {
  id: number;
  fullName: string;
  isActive: boolean;
  onClick: (id: number) => void;
}

const SortablePatientButton = ({ 
  id, 
  fullName, 
  isActive, 
  onClick
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // 스타일: 드래그 변환 + 레이아웃
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <PatientNavButton
        id={id}
        fullName={fullName}
        isActive={isActive}
        onClick={onClick}
      />
    </div>
  );
};

export default SortablePatientButton;
