import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, AlertCircle, Loader2 } from 'lucide-react';
import { studentApi } from '../../services/api/studentApi';

/* ─── Utility ─────────────────────────────────────────────── */
function semLabel(sem) {
  const ord = ['', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];
  return ord[sem] || `${sem}TH`;
}

function programLabel(code) {
  const map = {
    BTECH_CSE: 'BACHELOR OF TECHNOLOGY — COMPUTER SCIENCE & ENGINEERING',
    BTECH_ECE: 'BACHELOR OF TECHNOLOGY — ELECTRONICS & COMMUNICATION ENGINEERING',
    BTECH_EE: 'BACHELOR OF TECHNOLOGY — ELECTRICAL ENGINEERING',
    BTECH_MECH: 'BACHELOR OF TECHNOLOGY — MECHANICAL ENGINEERING',
    BTECH_CIVIL: 'BACHELOR OF TECHNOLOGY — CIVIL ENGINEERING',
    BTECH_IT: 'BACHELOR OF TECHNOLOGY — INFORMATION TECHNOLOGY',
    BTECH_TE: 'BACHELOR OF TECHNOLOGY — TEXTILE ENGINEERING',
    BTECH_BT: 'BACHELOR OF TECHNOLOGY — BIOTECHNOLOGY',
    BTECH_RAI: 'BACHELOR OF TECHNOLOGY — ROBOTICS & ARTIFICIAL INTELLIGENCE',
    BTECH_EIE: 'BACHELOR OF TECHNOLOGY — ELECTRONICS & INSTRUMENTATION ENGINEERING',
    BTECH_CSAIML: 'BACHELOR OF TECHNOLOGY — CS (AI & ML)',
    IMSC_CHEM: 'INTEGRATED M.SC. — CHEMISTRY',
    IMSC_MATH: 'INTEGRATED M.SC. — MATHEMATICS',
    IMSC_PHY: 'INTEGRATED M.SC. — PHYSICS',
    BARCH: 'BACHELOR OF ARCHITECTURE',
    BPLAN: 'BACHELOR OF PLANNING',
  };
  return map[code] || code;
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function AdmitCardPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) { setError('No event_id provided'); setLoading(false); return; }
    studentApi.getAdmitCardData(Number(eventId))
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load admit card'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#4b5563' }}>
          <Loader2 style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontWeight: '500' }}>Loading admit card…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', padding: '32px', maxWidth: '448px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Admit Card Unavailable</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{error}</p>
          <button
            onClick={() => window.close()}
            style={{ marginTop: '8px', padding: '8px 24px', borderRadius: '12px', backgroundColor: '#f3f4f6', border: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { student, event, subjects } = data;

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: '#d1d5db', paddingTop: '40px', paddingBottom: '40px', paddingLeft: '16px', paddingRight: '16px', display: 'flex', justifyContent: 'center', fontFamily: '"Times New Roman", Times, serif', fontSize: '14px', lineHeight: '1.4' }}
    >
      {/* ── Admit Card Paper ── */}
      <main
        id="admit-card-content"
        style={{
          width: '100%',
          maxWidth: '794px',       /* A4 width at 96dpi */
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
          border: '1px solid #d1d5db',
          boxSizing: 'border-box',
          padding: '36px 40px',
          fontFamily: '"Times New Roman", Times, serif',
          color: '#111111',
        }}
      >
        {/* Registration top-right */}
        <div style={{ textAlign: 'right', fontWeight: 'bold', fontStyle: 'italic', fontSize: '12px', marginBottom: '8px' }}>
          {student.name} | {student.reg_no} | {student.branch_name || programLabel(student.program_code)}
        </div>

        {/* ── Header ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          {/* Logo */}
          <img
            alt="OUTR Logo"
            src="/outr.png"
            style={{ width: '84px', height: '84px', objectFit: 'contain', flexShrink: 0 }}
          />

          {/* University name */}
          <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
              ଓଡ଼ିଶା ବୈଷୟିକ ଓ ଗବେଷଣା ବିଶ୍ୱବିଦ୍ୟାଳୟ
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', margin: 0 }}>
              Odisha University of Technology and Research
            </h1>
          </div>

          {/* Photo */}
          <div style={{ width: '80px', height: '96px', border: '2px solid #ccc', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {student.photo_url ? (
              <img src={student.photo_url} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            ) : (
              <span style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>Photo</span>
            )}
          </div>
        </header>

        {/* ── Document Title ── */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'underline', display: 'inline-block', marginBottom: '6px' }}>
            ADMIT CARD
          </h2>
          <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>
            {student.degree_type || 'BACHELOR OF TECHNOLOGY'}, {semLabel(student.semester)} SEMESTER,{' '}
            {event.event_type} EXAMINATIONS, {event.academic_year}
          </p>
        </div>

        {/* ── Student Intro Line ── */}
        <div style={{ marginBottom: '20px', fontSize: '13px', lineHeight: '1.7', textAlign: 'justify' }}>
          <p>
            <strong>{student.name}</strong>
            {' '}bearing university registration number <strong>{student.reg_no}</strong>, having branch{' '}
            <strong>{student.branch_name || student.program_code}</strong> ({programLabel(student.program_code)}) is allowed* to appear the above said
            examination in the following subjects:
          </p>
        </div>

        {/* ── Exam Schedule Table ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '32px', border: '1px solid #000' }}>
          <thead>
            <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #000', backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Exam Date</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Timing</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Subject<br />Code</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Subject Name</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '96px' }}>Signature of<br />the Invigilator</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subj, idx) => {
              const sched = subj.schedule;
              const lowAttendance = subj.attendance_percentage !== null &&
                subj.attendance_percentage < data.minimum_attendance;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #000', textAlign: 'center' }}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{sched ? sched.exam_date : '—'}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', whiteSpace: 'nowrap' }}>
                    {sched ? `${sched.start_time}–${sched.end_time}` : 'TBD'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{subj.subject_code}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>{subj.subject_name.toUpperCase()}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', letterSpacing: lowAttendance ? '2px' : 'normal', color: lowAttendance ? '#666' : 'inherit' }}>
                    {lowAttendance ? '- - - - - - - -' : '\u00A0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Signature Section ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', fontSize: '13px', marginTop: '64px' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px', width: '190px', textAlign: 'center' }}>
            Full Signature of the Candidate
          </div>
          <div style={{ position: 'relative', width: '190px' }}>
            <div style={{
              position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%) rotate(-6deg)',
              color: '#4c1d95', opacity: 0.8, fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '18px' }}>HEAD</div>
              <div style={{ fontSize: '14px' }}>School of Computer Sciences</div>
              <div style={{ fontSize: '14px' }}>OUTR, Bhubaneswar</div>
            </div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '4px', textAlign: 'center' }}>
              Signature of the HOS/HOD
            </div>
          </div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px', width: '190px', textAlign: 'center' }}>
            Controller of Examinations
          </div>
        </div>

        {/* ── Instructions ── */}
        <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0 0 4px' }}>*Instruction(s)</p>
          <p style={{ margin: '0 0 4px' }}>*The HOS/HOD shall only permit a student to appear in subject(s), he/she has registered, and subject(s) are available in Admit Card.</p>
          <p style={{ margin: '0 0 12px' }}>*The HOS/HOD shall permit only on the verification of University Registration Card and valid Voter Id / Aadhar Card, and report to the University immediately.</p>

          <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0 0 4px' }}>INSTRUCTIONS TO THE STUDENT</p>
          <ol style={{ paddingLeft: '20px', margin: '0 0 8px', listStyleType: 'decimal' }}>
            <li>The answer booklet contains 36 pages. Before writing answers, students must check the details on the answer sheets, such as the student's name, registration number, subject name, subject code, number of pages in the answer sheet, etc. Use the same to answer questions. No additional answer booklet or sheet shall be issued.</li>
            <li>The answer to the question must be done in one place. The answer should be written on both sides of the paper except the backside of the cover page.</li>
            <li>
              Students do not:<br />
              <span style={{ display: 'block', paddingLeft: '12px' }}>i. write his or her name and registration number in any part of the answer booklet.</span>
              <span style={{ display: 'block', paddingLeft: '12px' }}>ii. address any manner whatsoever in the answer booklet. If they do, his/her answer booklet will not be evaluated.</span>
              <span style={{ display: 'block', paddingLeft: '12px' }}>iii. bring a Exam Board / Writing Board, Smartwatch, Cell phone, Programmable Calculator, any gadgets, etc. to the exam hall.</span>
              <span style={{ display: 'block', paddingLeft: '12px' }}>iv. Put any kind of mark, religious symbol, or other symbol anywhere in the answer booklet.</span>
              <span style={{ display: 'block', paddingLeft: '12px' }}>v. exhibit insolent or violent toward the invigilator or other exam staff or other examinees, and unruly behaviour in or near the exam hall.</span>
            </li>
            <li>Students are not allowed inside the exam hall one hour after the start of the exam. Students cannot leave the exam hall during the first hour.</li>
            <li>Students are advised to bring a drinking water bottle to the exam hall. The students are not permitted to talk with each other in the exam hall.</li>
            <li>The student is not allowed to write anything on the question paper except the registration number at the specified place.</li>
            <li>Infringement by the student of any of the rules mentioned above will render him/her liable to expulsion from the exam hall and such other penalties as the university may impose as it deems fit and proper.</li>
            <li>During the exam, you are not permitted to use the washroom for longer than five minutes. During the last 30 minutes of the exam, washroom use is not permitted.</li>
            <li>Students shall return the answer booklet to the invigilator before leaving the exam hall.</li>
          </ol>
          <p style={{ fontWeight: 'bold', fontStyle: 'italic', margin: '8px 0 0' }}>NB.: The Result will be published subject to clearance of all academic regulations</p>
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '10px', fontStyle: 'italic', color: '#666' }}>
          School / Dept: {student.program_code}
        </div>
      </main>

      {/* ── Floating Print Button (hidden on print) ── */}
      <div className="no-print" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>
        <button
          onClick={() => window.print()}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '16px',
            borderRadius: '50%',
            boxShadow: '0 8px 32px rgba(79,70,229,0.4)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Print Admit Card"
        >
          <Printer style={{ width: '24px', height: '24px' }} />
        </button>
      </div>

      {/* ── Print styles ── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body { background-color: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          #admit-card-content {
            box-shadow: none !important;
            border: none !important;
            max-width: none !important;
            width: 100% !important;
            padding: 0 !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}
