// PatientSearchBar.tsx (Atom)
// 역할: 텍스트 입력 및 검색 버튼 포함된 검색 바

// 용도: 환자 이름(ID) 검색 기능 제공 → 상위에서 쿼리로 상태 갱신
// 구조: input + button 포함한 form

"use client";

import { useState, useImperativeHandle, forwardRef } from "react";

interface PatientSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export interface PatientSearchBarRef {
  triggerSearch: () => void;
}

const PatientSearchBar = forwardRef<PatientSearchBarRef, PatientSearchBarProps>(
  ({ onSearch, placeholder = "환자의 이름을 입력하세요" }, ref) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(query.trim());
    };

    const triggerSearch = () => {
      if (query.trim()) {
        onSearch(query.trim());
      }
    };

    useImperativeHandle(ref, () => ({
      triggerSearch
    }));

    return (
      <form onSubmit={handleSubmit} style={searchFormStyle}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>검색</button>
      </form>
    );
  }
);

PatientSearchBar.displayName = "PatientSearchBar";

const searchFormStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: "1rem",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  fontSize: "16px",
  border: "1px solid var(--border)",
  borderRadius: "4px 0 0 4px",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "16px",
  border: "1px solid var(--primary)",
  backgroundColor: "var(--primary)",
          color: "var(--text-on-primary)",
  borderRadius: "0 4px 4px 0",
  cursor: "pointer",
};

export default PatientSearchBar;