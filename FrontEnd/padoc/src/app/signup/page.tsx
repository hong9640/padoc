"use client";

import { useState } from 'react';
import Label from '@/components/atoms/label';
import TextInputForm from '@/components/atoms/textInputForm';
import PasswordInputForm from '@/components/atoms/passwordInputForm';
import SubmitButton from '@/components/atoms/submitButton';
import MoveButton from '@/components/atoms/moveButton';
import CheckPassword from '@/components/atoms/checkPassword';

import styles from './signup.module.css';

export default function SignupPage() {
  const [accountType, setAccountType] = useState<'patient' | 'doctor'>('patient');
  const [loginId, setLoginId] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwdCheck, setPwdCheck] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(0);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [licenseId, setLicenseId] = useState('');
  const [idCheckMessage, setIdCheckMessage] = useState<string | null>(null);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [licenseCheckMessage, setLicenseCheckMessage] = useState<string | null>(null);
  const [isLicenseChecked, setIsLicenseChecked] = useState(false);

  const isPasswordMatched =
    pwd === '' && pwdCheck === '' ? undefined : pwd === pwdCheck;

  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL;

  const url =
    accountType === 'doctor'
      ? beApiUrl + "/auth/doctors"
      : beApiUrl + "/auth/patients";

  const handleSuccess = () => {
    alert('회원가입이 완료되었습니다.');
    window.location.href = '/';
  };

  const handleError = () => {
    alert('회원가입에 실패했습니다.');
  };

  const handleSubmit = async () => {
    if (!isIdChecked) {
      alert('아이디 중복 확인을 해주세요.');
      return;
    }
    if (!isPasswordMatched) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (accountType === 'doctor' && !isLicenseChecked) {
      alert('의사 면허 확인을 완료해주세요.');
      return;
    }

    const payload: Record<string, any> = {
      login_id: loginId,
      full_name: fullName,
      email,
      phone_number: phone,
      role: accountType,
      address,
      gender,
      age,
      password: pwd,
    };

    if (accountType === 'doctor') {
      payload.valid_license_id = licenseId;
      payload.is_verified = true;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || '회원가입 실패');
      }

      await response.json();
      handleSuccess();
    } catch (err) {
      handleError();
    }
  };

  const handleCheckDuplicateId = async () => {
    if (!loginId) {
      setIdCheckMessage('아이디를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(beApiUrl + '/auth/check-duplicate-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId }),
      });

      if (!res.ok) throw new Error('요청 실패');

      const result = await res.json();
      if (result.result) {
        setIsIdChecked(true);
        setIdCheckMessage('✅ ' + result.message);
      } else {
        setIsIdChecked(false);
        setIdCheckMessage('❌ ' + result.message);
      }
    } catch (err) {
      setIsIdChecked(false);
      setIdCheckMessage('❌ 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleCheckDoctorLicense = async () => {
    if (!licenseId) {
      setLicenseCheckMessage('면허번호를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(beApiUrl + '/auth/verify-doctor-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid_license_id: licenseId }),
      });

      if (!res.ok) throw new Error('요청 실패');

      const result = await res.json();
      if (result.result) {
        setIsLicenseChecked(true);
        setLicenseCheckMessage('✅ ' + result.message);
      } else {
        setIsLicenseChecked(false);
        setLicenseCheckMessage('❌ ' + result.message);
      }
    } catch (err) {
      setIsLicenseChecked(false);
      setLicenseCheckMessage('❌ 면허 확인 중 오류가 발생했습니다.');
    }
  };

  // age 입력 처리 함수
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
    <main
      style={{
        boxSizing: 'border-box',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '3rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--ink)',
            margin: '0 0 2rem 0',
            textAlign: 'center',
          }}
        >
          회원가입
        </h1>

        {/* 계정 유형 토글 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '2rem',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <button
            onClick={() => setAccountType('patient')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              backgroundColor: accountType === 'patient' ? 'var(--primary)' : 'var(--background)',
              color: accountType === 'patient' ? 'var(--background)' : 'var(--text)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            일반 계정
          </button>
          <button
            onClick={() => setAccountType('doctor')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              backgroundColor: accountType === 'doctor' ? 'var(--primary)' : 'var(--background)',
              color: accountType === 'doctor' ? 'var(--background)' : 'var(--text)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            의사 계정
          </button>
        </div>

        {/* 필수 정보 섹션 */}
        <div style={{
          backgroundColor: 'var(--gray-light)',
          padding: '2rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 1.5rem 0',
          }}>
            필수 정보
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              아이디
            </Label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <TextInputForm 
                onChange={e => { 
                  setLoginId(e.target.value); 
                  setIsIdChecked(false); 
                  setIdCheckMessage(null); 
                }} 
              />
              <MoveButton
                value="중복확인"
                onClick={handleCheckDuplicateId}
                width="100px"
                height="40px"
                fontSize="0.875rem"
                backgroundColor="var(--accent)"
                color="var(--background)"
                borderRadius="0.5rem"
              />
            </div>
            {idCheckMessage && (
              <p style={{
                color: isIdChecked ? 'var(--success)' : 'var(--danger)',
                fontSize: '0.875rem',
                marginTop: '0.5rem',
              }}>
                {idCheckMessage}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              비밀번호
            </Label>
            <PasswordInputForm value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              비밀번호 확인
            </Label>
            <PasswordInputForm value={pwdCheck} onChange={(e) => setPwdCheck(e.target.value)} />
            <CheckPassword isMatched={isPasswordMatched} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              이름
            </Label>
            <TextInputForm onChange={e => setFullName(e.target.value)} />
          </div>

          {accountType === 'doctor' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Label 
                color="var(--text)" 
                fontSize="1.125rem" 
                fontFamily="Arial" 
                fontStyle="normal"
              >
                검사자 인증번호
              </Label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <TextInputForm onChange={e => setLicenseId(e.target.value)} />
                <MoveButton
                  value="확인요청"
                  onClick={handleCheckDoctorLicense}
                  width="100px"
                  height="40px"
                  fontSize="0.875rem"
                  backgroundColor="var(--accent)"
                  color="var(--background)"
                  borderRadius="0.5rem"
                />
              </div>
              {licenseCheckMessage && (
                <p style={{
                  color: isLicenseChecked ? 'var(--success)' : 'var(--danger)',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                }}>
                  {licenseCheckMessage}
                </p>
              )}
              <p style={{ 
                color: 'var(--warning)', 
                fontSize: '0.875rem',
                marginTop: '0.5rem',
                lineHeight: '1.4',
              }}>
                의료인 면허 정보를 입력하세요.<br />
                네트워크 상황에 따라 시간이 소요될 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 선택사항 섹션 */}
        <div style={{
          backgroundColor: 'var(--gray-light)',
          padding: '2rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 1.5rem 0',
          }}>
            추가 정보
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              성별
            </Label>
            <select
              onChange={e => setGender(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                fontSize: '1rem',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              나이
            </Label>
            <TextInputForm
              placeholder="숫자만 입력"
              onChange={handleAgeChange}
            />
            {ageError && (
              <p style={{ 
                color: 'var(--danger)', 
                fontSize: '0.875rem', 
                marginTop: '0.5rem' 
              }}>
                {ageError}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              전화번호
            </Label>
            <TextInputForm onChange={e => setPhone(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              Email
            </Label>
            <TextInputForm onChange={e => setEmail(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label 
              color="var(--text)" 
              fontSize="1.125rem" 
              fontFamily="Arial" 
              fontStyle="normal"
            >
              주소
            </Label>
            <TextInputForm onChange={e => setAddress(e.target.value)} />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem' 
        }}>
          <SubmitButton
            value="회원가입"
            onClick={handleSubmit}
            width="150px"
            height="45px"
            fontSize='1.125rem'
            backgroundColor="var(--primary)"
            color="var(--background)"
            borderRadius="0.5rem"
          />
          <MoveButton
            value="이전 화면으로"
            onClick={() => history.back()}
            width="150px"
            height="45px"
            fontSize='1.125rem'
            backgroundColor="var(--secondary)"
            color="var(--background)"
            borderRadius="0.5rem"
          />
        </div>
      </div>
    </main>
  );
}