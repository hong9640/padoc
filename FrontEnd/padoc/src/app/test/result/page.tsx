'use client';

import { useTestStore } from "@/store/testStore"
import Link from "next/link"
import Container from "@/components/atoms/container"
import Text from "@/components/atoms/text"
import MoveButton from "@/components/atoms/moveButton"
import RadarChart from "@/components/atoms/radarChart";
import { VoiceData } from "@/store/patientTrainingInformationStore";

import styles from "./result.module.css";

export default function ResultPage() {
  const answers = useTestStore((state) => state.answers);
  const yesCount = Object.values(answers).filter(answer => answer === 'yes').length;
  const voice_ah = useTestStore((state) => state.voice_ah);
  const voice_sentence = useTestStore((state) => state.voice_sentence);
  const exceedNormalCount = useTestStore((state) => state.exceedNormalCount);
  const rangeST = useTestStore((state) => state.rangeST);

  let status = 0;
  let resultMent = "";
  
  if (yesCount > 2) {
    status += 1;
  }
  if (voice_sentence.ai_score > 50) {
    status += 1;
  }
  if (exceedNormalCount > 3) {
    status += 1;
  }

  if (status === 3) {
    resultMent = "파킨슨과 같은 뇌 질환이 의심됩니다. 병원에 방문해 보시는 것을 추천드립니다.";
  } else if (status === 2) {
    resultMent = "경미한 이상이 발견되었습니다. 정밀한 확인을 추천드립니다.";
  } else if (status <= 1) {
    resultMent = "특이사항이 발견되지 않았습니다.";
  } else {
    resultMent = "분석이 정상적으로 이루어지지 않았습니다.";
  }

  // RangeST를 사용하여 차트 데이터 구성
  const chartData: VoiceData = {
    ah_features: {
      ...voice_ah,
      // F0 대신 RangeST 값을 사용, min_f0와 max_f0는 유지
      f0: rangeST,
    },
    sentence_features: null,
    voice_id: 0,
    patient_id: 0,
    related_voice_info_id: null,
    file_path: "",
    recording_type: "",
    created_at: "",
  };
  
  return (
    <main className={styles.page}>
      <div className={styles.surface}>
        {/* 헤더 */}
        <header className={styles.headerBar}>
          <h1 className={styles.title}>분석 결과</h1>
        </header>

        {/* 3열 카드 */}
        <section className={styles.grid}>
          {/* 자가 문진 */}
          <section className={styles.card} aria-labelledby="self-check-title">
            <h2 id="self-check-title" className={styles.sectionTitle}>
              자가 문진 결과
            </h2>
            <div className={styles.pill}>
              <span>{yesCount}/9</span>
            </div>
            <p className={styles.helper}>
              {yesCount === 0 
                ? "모든 증상이 정상입니다." 
                : yesCount <= 3 
                ? "일부 증상이 발견되었습니다." 
                : "여러 증상이 발견되었습니다."}
            </p>
          </section>

          {/* 1차 음성 */}
          <section className={styles.card} aria-labelledby="voice1-title">
            <h2 id="voice1-title" className={styles.sectionTitle}>
              1차 음성 테스트 결과
            </h2>

            <div className={styles.chartCard}>
              <div className={styles.chartInner}>
                <RadarChart 
                  data1={chartData} 
                  backgroundColor="var(--card)"
                  width="100%"
                  height="280px"
                  showLegend={false}
                  showLabels={false}
                  showNormalRangeInfo={false}
                />
              </div>
              <div className={styles.chartInfo}>
                <div className={styles.normalRangeInfo}>
                  초록색 영역: 정상 범위
                </div>
                <div className={styles.chartFooter}>
                  초과 항목: <strong>{exceedNormalCount}개</strong>
                </div>
              </div>
            </div>
          </section>

          {/* 2차 음성 */}
          <section className={styles.card} aria-labelledby="voice2-title">
            <h2 id="voice2-title" className={styles.sectionTitle}>
              2차 음성 테스트 결과
            </h2>
            <div className={styles.pill}>
              <span>
                AI 분석 결과: <strong>{(voice_sentence?.ai_score ?? 0)}%</strong>
              </span>
            </div>
            <p className={styles.helper}>
              {(voice_sentence?.ai_score ?? 0) <= 30 
                ? "정상 범위입니다." 
                : (voice_sentence?.ai_score ?? 0) <= 50 
                ? "경미한 이상이 발견되었습니다." 
                : "뚜렷한 이상이 발견되었습니다."}
            </p>
          </section>
        </section>

        {/* 결과 배너 */}
        <div
          className={`${styles.resultBanner} ${
            status === 3 ? styles.bannerDanger : 
            status === 2 ? styles.bannerAlert : 
            styles.bannerGood
          }`}
        >
          <div className={styles.resultLabel}>
            최종 판단 결과
          </div>
          <div className={styles.resultText}>{resultMent}</div>
        </div>

        {/* 하단 액션 */}
        <div className={styles.actions}>
          <Link href="/">
            <MoveButton
              value="홈으로 돌아가기"
              width="15rem"
              height="4rem"
              fontSize="1.5rem"
              backgroundColor="var(--ink-strong)"
              color="var(--text-on-primary)"
              borderRadius="0.75rem"
              margin="0"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}