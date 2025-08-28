'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

interface DateRangeSelectorProps {
  minDate?: string;
  maxDate?: string;
  onChange: (startDate: string, endDate: string) => void;
}

export default function DateRangeSelector({
  minDate,
  maxDate,
  onChange,
}: DateRangeSelectorProps) {
  const startOfPrevMonth = startOfMonth(subMonths(new Date(), 1));
  const endOfNextMonth = endOfMonth(addMonths(new Date(), 1));

  const defaultStart = format(startOfPrevMonth, 'yyyy-MM-dd');
  const defaultEnd = format(endOfNextMonth, 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const handleApply = () => {
    if (startDate && endDate && startDate <= endDate) {
      onChange(startDate, endDate);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-3 sm:p-4 border rounded-md w-full" style={{
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      color: 'var(--text)'
    }}>
             <div className="flex flex-col gap-3 sm:gap-4 items-center w-full">
         <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
           <label htmlFor="start-date" className="text-sm sm:text-base whitespace-nowrap" style={{ color: 'var(--text)' }}>
             <span className="hidden lg:inline">탐색 시작일:</span>
             <span className="lg:hidden">시작일</span>
           </label>
           <input
             id="start-date"
             type="date"
             value={startDate}
             onChange={(e) => setStartDate(e.target.value)}
             min={minDate}
             max={defaultEnd}
             className="border rounded px-2 py-1 text-sm sm:text-base w-full sm:w-auto"
             style={{
               backgroundColor: 'var(--card)',
               borderColor: 'var(--border)',
               color: 'var(--text)'
             }}
           />
         </div>
         <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
           <label htmlFor="end-date" className="text-sm sm:text-base whitespace-nowrap" style={{ color: 'var(--text)' }}>
             <span className="hidden lg:inline">탐색 종료일:</span>
             <span className="lg:hidden">종료일</span>
           </label>
           <input
             id="end-date"
             type="date"
             value={endDate}
             onChange={(e) => setEndDate(e.target.value)}
             min={startDate || minDate}
             max={defaultEnd}
             className="border rounded px-2 py-1 text-sm sm:text-base w-full sm:w-auto"
             style={{
               backgroundColor: 'var(--card)',
               borderColor: 'var(--border)',
               color: 'var(--text)'
             }}
           />
         </div>
       </div>
      <button
        onClick={handleApply}
        className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full cursor-pointer text-sm sm:text-base"
      >
        적용
      </button>
    </div>
  );
}