'use client'

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation';
import useUserStore from "@/store/userStore"
import SubmitButton from "@/components/atoms/submitButton"
import MoveButton from "@/components/atoms/moveButton"
import Link from "next/link"

import Label from '@/components/atoms/label';
import TextInputForm from '@/components/atoms/textInputForm';

import styles from './patientProfileEdit.module.css';

interface UserData {
  login_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  gender: string | null;
  age: number | null;
  // [key: string]: any; // 그 외 다른 속성들도 포함할 수 있도록
}

export default function Page() {
  const router = useRouter();
  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL;
  
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { userData, setUser } = useUserStore();
  const [loginId, setLoginId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);

  // localStorage에서 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('role');
      
      setAccessToken(token);
      
      // 토큰이 없거나 환자가 아닌 경우 홈으로 리다이렉션
      if (!token) {
        console.log('토큰이 없음 - 홈으로 리다이렉션');
        router.push('/');
        return;
      }
      
      if (role !== 'patient') {
        console.log('환자가 아님 - 홈으로 리다이렉션');
        router.push('/');
        return;
      }
    }
  }, []); // router 의존성 제거

  // 사용자 데이터 설정
  useEffect(() => {
    if (userData) {
      setLoginId(userData.login_id);
      setFullName(userData.full_name);
      setPhone(userData.phone_number);
      setEmail(userData.email);
      setAddress(userData.address);
      setGender(userData.gender);
      setAge(userData.age);
    }
  }, [userData]);

  const handleSuccess = (updatedData: UserData) => {
    setUser(updatedData);
    alert('프로필 수정에 성공했습니다.');
    window.location.href = '/patient/profile';
  };

  const handleError = () => {
    alert('프로필 수정에 실패했습니다.');
  };

  const handleSubmit = async () => {
    const payload: Record<string, any> = {
      login_id: loginId,
      full_name: fullName,
      email,
      phone_number: phone,
      address,
      gender,
      age,
    };
    try {
      const response = await fetch(beApiUrl + '/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || '프로필 수정 실패');
      }
      const updatedUser: UserData = {
        login_id: loginId,
        full_name: fullName,
        email,
        phone_number: phone,
        address,
        gender,
        age,
      }
      handleSuccess(updatedUser);
    } catch (err) {
      handleError();
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setAge(Number(value));
      setAgeError(null);
    } else {
      setAgeError('숫자만 입력해주세요.');
    }
  };

  return (
    <main className={styles.page}>
      {/* 메인 콘텐츠 */}
      <div className={styles.contentContainer}>
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>프로필 정보 수정</h2>

          {/* 필수 정보 섹션 */}
          <div className={styles.fieldGroup}>
            <h3 className={styles.fieldGroupTitle}>필수 정보</h3>
            <div className={styles.fieldContainer}>
              <div className={styles.field}>
                <Label color="var(--doctor-text)" fontSize="1rem">아이디</Label>
                <input
                  type="text"
                  value={loginId}
                  disabled
                  className={styles.inputField}
                  style={{ backgroundColor: 'var(--card)', color: 'var(--doctor-text)', border: '1px solid var(--border)' }}
                />
              </div>
              <div className={styles.field}>
                <Label color="var(--doctor-text)" fontSize="1rem">이름</Label>
                <TextInputForm 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  height="3.25rem"
                  fontSize="1rem"
                />
              </div>
            </div>
          </div>

          {/* 선택 정보 섹션 */}
          <div className={styles.fieldGroup}>
            <h3 className={styles.fieldGroupTitle}>선택 정보</h3>
            <div className={styles.fieldContainer}>
              <div className={styles.field}>
                <Label color="var(--doctor-text)" fontSize="1rem">이메일</Label>
                <TextInputForm 
                  value={email || ''} 
                  onChange={(e) => setEmail(e.target.value)}
                  height="3.25rem"
                  fontSize="1rem"
                />
              </div>
              <div className={styles.field}>
                <Label color="var(--doctor-text)" fontSize="1rem">전화번호</Label>
                <TextInputForm 
                  value={phone || ''} 
                  onChange={(e) => setPhone(e.target.value)}
                  height="3.25rem"
                  fontSize="1rem"
                />
              </div>
              <div className={styles.field}>
                <Label color="var(--doctor-text)" fontSize="1rem">주소</Label>
                <TextInputForm 
                  value={address || ''} 
                  onChange={(e) => setAddress(e.target.value)}
                  height="3.25rem"
                  fontSize="1rem"
                />
              </div>
              <div className={styles.field}>
                <Label color="var(--doctor-text)" fontSize="1rem">성별</Label>
                <select
                  value={gender || ''}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className={styles.selectField}
                >
                  <option value="">선택해주세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
              <div className={styles.field}>
                <Label color="var(--doctor-text)" fontSize="1rem">나이</Label>
                <TextInputForm
                  value={age === null ? '' : String(age)}
                  placeholder="숫자만 입력해주세요"
                  onChange={handleAgeChange}
                  height="3.25rem"
                  fontSize="1rem"
                />
                {ageError && (
                  <p className={styles.errorMessage}>
                    {ageError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 버튼 섹션 */}
          <div className={styles.buttonContainer}>
            <SubmitButton
              value="프로필 수정"
              width="180px"
              height="48px"
              fontSize="1.25rem"
              onClick={handleSubmit}
            />
            <Link href="/patient/profile" style={{ textDecoration: 'none' }}>
              <MoveButton
                value="이전 페이지로 이동"
                width="auto"
                height="48px"
                fontSize="1.1rem"
              />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}