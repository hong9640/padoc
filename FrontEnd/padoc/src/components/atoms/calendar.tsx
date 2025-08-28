import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './custom-calendar.css';
import { format } from 'date-fns';

interface MyCalendarProps {
  trainedDates: Date[];
  reservedDates: Date[];
  onToggleReserve: (date: Date) => void;
  activeStartDate: Date; // 현재 뷰의 시작 날짜 (월 제어용)
  onActiveStartDateChange: ({ activeStartDate }: { activeStartDate: Date | null }) => void; // 월 변경 핸들러
}

export default function MyCalendar({
  trainedDates,
  reservedDates,
  onToggleReserve,
  activeStartDate,
  onActiveStartDateChange
}: MyCalendarProps) {
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  return (
    <Calendar
      calendarType="gregory"
      formatDay={(locale, date) => date.getDate().toString()}
      activeStartDate={activeStartDate} // 외부에서 월 제어
      onActiveStartDateChange={onActiveStartDateChange} // 월 변경 시 상위 컴포넌트에 알림
      tileClassName={({ date }) => {
        const isSunday = date.getDay() === 0;
        const isSaturday = date.getDay() === 6;

        const formatKey = (d: Date) => format(d, 'yyyy-MM-dd');
        const trainedDateSet = new Set(trainedDates.map((d) => formatKey(d)));

        const todayKey = formatKey(date);
        const isTrained = trainedDateSet.has(todayKey);

        let isTrainedPrev = false;
        let isTrainedNext = false;

        if (isTrained) {
          const prev = new Date(date);
          prev.setDate(prev.getDate() - 1);
          const next = new Date(date);
          next.setDate(next.getDate() + 1);

          isTrainedPrev = trainedDateSet.has(formatKey(prev));
          isTrainedNext = trainedDateSet.has(formatKey(next));
        }

        return [
          isSunday ? 'sunday' : '',
          isSaturday ? 'saturday' : '',
          isTrained ? 'trained-text' : '',
          isTrainedPrev ? 'left-line' : '',
          isTrainedNext ? 'right-line' : '',
        ]
          .filter(Boolean)
          .join(' ');
      }}
      tileContent={({ date }) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const trainedSet = new Set(trainedDates.map((d) => format(d, 'yyyy-MM-dd')));
        const reservedSet = new Set(reservedDates.map((d) => format(d, 'yyyy-MM-dd')));

        const isTrained = trainedSet.has(dateKey);
        const isReserved = reservedSet.has(dateKey);

        return (
          <>
            {isReserved && <div className="reserved-indicator" />}
            {isTrained && <div className="trained-indicator" />}
          </>
        );
      }}
      onClickDay={(date) => {
        onToggleReserve(date);
      }}
    />
  );
}