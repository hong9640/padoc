'use client';

import { useTestStore } from '@/store/testStore';
import { useAutoSizing } from "@/hooks/useAutoSizing";
import RadioButton from "../atoms/radioButton";

import styles from './testPaperweight.module.css';

export default function TestPaperweight() {
  const width = useAutoSizing();
  const { answers, setAnswer } = useTestStore();

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAnswer(name, value);
  };

  const yesCount = Object.values(answers).filter(answer => answer === 'yes').length;

  const questions = [
    {
      id: 'q1',
      text: '입술, 턱, 손, 팔 또는 다리가 가만히 있을 때 떨립니까?'
    },
    {
      id: 'q2',
      text: '걸을 때 발을 끌거나 걸음의 폭이 좁아졌습니까?'
    },
    {
      id: 'q3',
      text: '평소 일상 활동에서 움직임이 느려졌습니까? (예: 머리 빗기, 양말 신기, 목욕, 식사 등)'
    },
    {
      id: 'q4',
      text: '스스로 혹은 다른 사람들이 보기에 걸을 때 팔을 잘 흔들지 않습니까?'
    },
    {
      id: 'q5',
      text: '목소리가 작아졌습니까?'
    },
    {
      id: 'q6',
      text: '얼굴이 무표정 해졌습니까?'
    },
    {
      id: 'q7',
      text: '전보다 냄새를 잘 못 맡습니까?'
    },
    {
      id: 'q8',
      text: '꿈을 꿀 때 말하거나 소리를 지르거나 욕하거나 크게 웃는 일이 발생합니까?'
    },
    {
      id: 'q9',
      text: '걷기 시작하거나 방향을 바꿀 때 발이 바닥에 붙은 것 같이 잘 안떨어진 적이 있습니까?'
    }
  ];

  return (
    <main>
      <div className={styles.questionnaireContainer}>
        <div className={styles.questionnaireTitle}>
          아래의 질문에 답해주세요.
        </div>
        <div className={styles.questionsList}>
          {questions.map((question, index) => (
            <div 
              key={question.id}
              className={`${styles.questionItem} ${answers[question.id] ? styles.selected : ''}`}
            >
              <div className={styles.questionText}>
                <span className={styles.questionNumber}>{index + 1}.</span>
                {question.text}
              </div>
              <div className={styles.radioGroup}>
                <RadioButton 
                  id={`${question.id}_yes`} 
                  name={question.id} 
                  label="예" 
                  value="yes" 
                  onChange={handleRadioChange} 
                  checked={answers[question.id] === 'yes'} 
                />
                <RadioButton 
                  id={`${question.id}_no`} 
                  name={question.id} 
                  label="아니오" 
                  value="no" 
                  onChange={handleRadioChange} 
                  checked={answers[question.id] === 'no'} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}