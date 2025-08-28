// DoctorMainPage.tsx (Template)
"use client";

import PatientConnectionManager from "@/components/organisms/patientConnectionManager";

const DoctorMainPage = () => {
  return (
    <div>
      <h2>의사 메인 페이지</h2>
      <PatientConnectionManager />
    </div>
  );
};

export default DoctorMainPage;