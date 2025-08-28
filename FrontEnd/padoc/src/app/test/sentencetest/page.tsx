import Link from "next/link"
import MoveButton from "@/components/atoms/moveButton"
import TestRecord from "@/components/molecules/testRecord"
import Text from "@/components/atoms/text"
import Container from "@/components/atoms/container"
import FileUpload from "@/components/atoms/fileUpload"

import styles from './sentenceTest.module.css';

export default function Page() {
  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL + "/screening";

  return (
    <main className={styles.page}>

      <header className={styles.headerBar}>
        <h1 className={styles.title}>2번 음성 테스트</h1>
        <p className={styles.subtitle}>
          녹음 버튼을 누른 뒤, 화면에 표시된 문장을 또박또박 읽어주세요.
        </p>
      </header>

      <section className={styles.grid}>
        {/* ahTest와 동일한 '녹음하기' 카드 레이아웃 */}
        <section
          className={`${styles.contentCard} ${styles.leftCol}`}
          aria-labelledby="record-title"
        >
          <h2 id="record-title" className={styles.sectionTitle}>녹음하기</h2>
            {/* 파형 넘침 방지용 래퍼 */}
            <div className={styles.waveClamp}>
              <TestRecord recording_type="voice_sentence" />
            </div>
        </section>

          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>파일로 제출하기</h3>
            <p className={styles.sideHelp}>녹음이 어렵다면, 저장된 음성 파일을 업로드하세요.</p>
              <FileUpload apiUrl={beApiUrl} recording_type="voice_sentence" />
            <div className={styles.tip}>
              • 권장 형식: WAV/MP3<br />
              • 길이: 3–10초
            </div>
          </div>

          
      </section>
      <div className={styles.navBox}>
            <Link href={'/'}>
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
    </main>
  );
}