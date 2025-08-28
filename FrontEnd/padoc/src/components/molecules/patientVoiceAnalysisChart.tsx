'use client';

import { format, parseISO } from 'date-fns';
import { VoiceData } from '@/store/patientTrainingInformationStore';
import RadarChart from '@/components/atoms/radarChart';

interface PatientVoiceAnalysisChartProps {
  data: VoiceData[];
}

export default function PatientVoiceAnalysisChart({ data }: PatientVoiceAnalysisChartProps) {

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* 차트 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.length > 0 ? (
          data.map((item, index) => (
            <div key={item.voice_id} className="bg-white p-4 rounded-lg shadow-md">
                             <h4 className="text-lg font-semibold mb-2 text-gray-800">
                 {(() => {
                   try {
                     return format(parseISO(item.created_at), 'yyyy년 MM월 dd일 HH:mm');
                   } catch (error) {
                     console.error('날짜 표시 오류:', item.created_at, error);
                     return '날짜 정보 없음';
                   }
                 })()}
               </h4>
              <RadarChart data1={item} />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 데이터 요약 */}
      {data.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-blue-800">데이터 요약</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">총 데이터:</span> {data.length}개
            </div>
            <div>
              <span className="font-medium">기간:</span> {
                data.length > 0 
                  ? `${format(parseISO(data[data.length - 1].created_at), 'MM/dd')} ~ ${format(parseISO(data[0].created_at), 'MM/dd')}`
                  : '-'
              }
            </div>
            <div>
              <span className="font-medium">최신 데이터:</span> {
                data.length > 0 
                  ? format(parseISO(data[0].created_at), 'MM/dd HH:mm')
                  : '-'
              }
            </div>
            <div>
              <span className="font-medium">가장 오래된 데이터:</span> {
                data.length > 0 
                  ? format(parseISO(data[data.length - 1].created_at), 'MM/dd HH:mm')
                  : '-'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
