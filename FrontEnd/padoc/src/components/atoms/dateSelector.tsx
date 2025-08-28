'use client';

import { format } from 'date-fns';

interface DateSelectorProps {
  availableDates: string[];
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  disabledDates?: string[]; // 비활성화할 날짜들
}

export default function DateSelector({
  availableDates,
  selectedDates,
  onChange,
  disabledDates = [],
}: DateSelectorProps) {
  const toggleDate = (date: string) => {
    // 비활성화된 날짜는 선택할 수 없음
    if (disabledDates.includes(date)) {
      return;
    }
    
    const updated = selectedDates.includes(date)
      ? selectedDates.filter((d) => d !== date)
      : [...selectedDates, date];

    onChange(updated);
  };

  const uniqueDates = [...new Set(availableDates)];

  return (
    <div
      className="flex gap-2 sm:gap-3 flex-wrap justify-center my-4 sm:mb-5 w-full"
    >
      {uniqueDates.map((date) => {
        const isSelected = selectedDates.includes(date);
        const label = new Date(date).toLocaleDateString('ko-KR', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
        }).replace(/\./g, '/').replace(/\s+/g, '').replace(/\/$/, '');

        const isDisabled = disabledDates.includes(date);
        
        return (
          <button
            key={date}
            onClick={() => toggleDate(date)}
            disabled={isDisabled}
            className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md border-none cursor-pointer transition-colors"
            style={{
              backgroundColor: isSelected ? 'var(--purple-medium)' : 'var(--purple-light)',
              color: isSelected ? 'var(--text-on-primary)' : 'var(--text)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
