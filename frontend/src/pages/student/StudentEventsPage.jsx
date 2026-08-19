import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { studentApi } from '../../services/api/studentApi';
import { paymentApi } from '../../services/api/paymentApi';
import { useToast } from '../../hooks/useToast';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, Printer, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

const btnPrimary = 'h-9 px-4 text-sm font-medium text-bg-primary bg-text-primary rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-normal flex items-center gap-2';
const btnSecondary = 'h-9 px-4 text-sm font-medium text-text-secondary border border-border-default rounded-sm hover:bg-bg-secondary disabled:opacity-40 transition-colors duration-normal flex items-center gap-2';

/* ─── Receipt Modal ──────────────────────────────────────────── */
function ReceiptContent({ event }) {
  const receiptNo = `OERS-${event.event_id}-${event.registration_id}`;
  const payDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=800,height=600');
    const content = document.getElementById('receipt-content').innerHTML;
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt - ${receiptNo}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Times New Roman',serif;font-size:13px;padding:32px}
      .header{text-align:center;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px 12px;border:1px solid #000}
      .label{font-weight:bold;width:200px;background:#f3f4f6}.total td{font-weight:bold;background:#e5e7eb}
      .footer{margin-top:32px;display:flex;justify-content:space-between;font-size:11px}</style>
      </head><body>${content}</body></html>`);
    w.document.close(); w.focus(); w.print(); w.close();
  };

  return (
    <div className="space-y-4">
      <div id="receipt-content" className="border border-border-default rounded-sm p-5 bg-bg-secondary text-sm" style={{ fontFamily: '"Times New Roman", serif' }}>
        <div className="header text-center border-b-2 border-text-primary pb-3 mb-3">
          <h1 className="text-base font-bold uppercase">Odisha University of Technology and Research</h1>
          <h2 className="text-xs text-text-secondary mt-1">Examination Section — Fee Payment Receipt</h2>
        </div>
        <p className="text-center font-bold underline uppercase mb-3">Payment Receipt</p>
        <table className="w-full border-collapse text-sm mb-3">
          <tbody>
            {[
              ['Receipt No.',      <span className="font-mono">{receiptNo}</span>],
              ['Registration ID', <span className="font-mono">#{event.registration_id}</span>],
              ['Program',         `${event.program_code} — Semester ${event.semester}`],
              ['Examination',     `${event.event_type} — ${event.academic_year}`],
              ['Payment Status',  event.reg_payment_status || '—'],
            ].map(([label, val]) => (
              <tr key={label}>
                <td className="label border border-border-default px-3 py-2 font-bold bg-bg-secondary w-44">{label}</td>
                <td className="border border-border-default px-3 py-2">{val}</td>
              </tr>
            ))}
            <tr className="total">
              <td className="border border-border-default px-3 py-2 font-bold">Amount Paid</td>
              <td className="border border-border-default px-3 py-2 font-bold">{formatCurrency(event.reg_fee_paid ?? event.fee_applicable ?? 0)}</td>
            </tr>
          </tbody>
        </table>
        <div className="footer flex justify-between text-xs text-text-tertiary mt-4">
          <p>Generated: {payDate}</p>
          <div className="text-right border-t border-text-primary pt-1 w-36 text-center text-xs">Controller of Examinations</div>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={handlePrint} className={btnPrimary}>
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>
    </div>
  );
}

/* ─── Event Card ─────────────────────────────────────────────── */
function EventCard({ event, onRegister, onReceipt }) {
  const isRegistered = event.already_registered;
  const isOpen = event.registration_status === 'OPEN';

  return (
    <Card hoverable>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-sm bg-bg-secondary border border-border-default flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-text-primary">{event.program_code} · Sem {event.semester}</span>
              <Badge variant="neutral">{event.event_type}</Badge>
              {isRegistered
                ? <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />Registered</Badge>
                : <Badge variant={isOpen ? 'success' : 'error'}>{event.registration_status}</Badge>}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">{event.academic_year} · Deadline: {formatDateTime(event.registration_end)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-text-primary">{formatCurrency(event.fee_applicable || 0)}</span>
          {isRegistered ? (
            <button onClick={() => onReceipt(event)} className={btnSecondary}>
              <FileText className="w-4 h-4" /> Receipt
            </button>
          ) : (
            <button onClick={() => onRegister(event)} disabled={!isOpen} className={btnPrimary}>
              Register
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export const StudentEventsPage = () => {
  const { data: events, loading, error, execute: reload } = useFetch(studentApi.getEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [receiptEvent, setReceiptEvent]   = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError]           = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const confirmRegistration = async () => {
    setIsRegistering(true);
    setRegError(null);
    try {
      const regResponse = await studentApi.registerForEvent({ event_id: selectedEvent.event_id });
      if (selectedEvent.fee_applicable > 0) {
        addToast('Registration initiated. Processing payment…', 'info');
        const orderResponse = await paymentApi.createOrder({ registration_id: regResponse.registration_id });
        await paymentApi.verifyPayment({ registration_id: regResponse.registration_id, order_id: orderResponse.order_id, action: 'success' });
        addToast('Payment successful! Registration complete.', 'success');
      } else {
        addToast('Registration successful.', 'success');
      }
      setSelectedEvent(null);
      reload();
      navigate('/student/registrations');
    } catch (err) {
      // Show error inline in modal instead of just a toast
      setRegError(err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Available Exams</h2>
        <p className="text-sm text-text-secondary">Register for upcoming regular or arrear examinations</p>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !events?.length ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <Calendar className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No events available</p>
            <p className="text-xs text-text-tertiary">There are currently no active exam events for your program.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 animate-fade-in-stagger">
          {events.map(ev => (
            <EventCard key={ev.event_id} event={ev} onRegister={setSelectedEvent} onReceipt={setReceiptEvent} />
          ))}
        </div>
      )}

      {/* Confirm registration modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => { if (!isRegistering) { setSelectedEvent(null); setRegError(null); } }}
        title="Confirm Registration"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setSelectedEvent(null); setRegError(null); }} disabled={isRegistering} className={btnSecondary}>Cancel</button>
            <button onClick={confirmRegistration} disabled={isRegistering} className={btnPrimary}>
              {isRegistering && <Spinner size="sm" />}
              Confirm &amp; Pay
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">You are about to register for:</p>
          <div className="rounded-sm border border-border-default bg-bg-secondary p-4 space-y-2 text-sm">
            {[
              ['Program',       `${selectedEvent?.program_code} · Sem ${selectedEvent?.semester}`],
              ['Type',          selectedEvent?.event_type],
              ['Academic Year', selectedEvent?.academic_year],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-text-tertiary">{k}</span>
                <span className="text-text-primary font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border-default pt-2 mt-1">
              <span className="text-text-secondary font-medium">Total Fee</span>
              <span className="text-text-primary font-semibold">{formatCurrency(selectedEvent?.fee_applicable || 0)}</span>
            </div>
          </div>

          {/* Inline error from backend */}
          {regError && (
            <div className="flex items-start gap-2 p-3 rounded-sm bg-[#fee2e2] border border-[#fecaca]">
              <span className="text-[#991b1b] text-sm">{regError}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal isOpen={!!receiptEvent} onClose={() => setReceiptEvent(null)} title="Payment Receipt" size="lg">
        {receiptEvent && <ReceiptContent event={receiptEvent} />}
      </Modal>
    </div>
  );
};

export default StudentEventsPage;
