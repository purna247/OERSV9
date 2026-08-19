const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function resolvePhotoPath(photoUrl) {
  if (!photoUrl) return null;
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || './uploads');
  const cleaned = String(photoUrl).replace(/^\/+/, '');
  if (!cleaned.startsWith('uploads/')) return path.resolve(uploadRoot, cleaned.replace(/^uploads[\\/]/, ''));
  return path.resolve(process.cwd(), cleaned);
}

function generateAdmitCardPdf({
  res,
  student,
  event,
  subjects,
  scheduleBySubjectId,
  minimumAttendance,
}) {
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  doc.fontSize(16).text('Online Examination Registration System', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(12).text('Admit Card', { align: 'center' });
  doc.moveDown(1);

  const photoPath = resolvePhotoPath(student.photo_url);
  if (photoPath && fs.existsSync(photoPath)) {
    try {
      doc.image(photoPath, 430, 90, { fit: [120, 120] });
    } catch (_e) {
      // Ignore photo render errors; gating is checked before generation.
    }
  }

  doc.fontSize(11);
  doc.text(`Name: ${student.name}`);
  doc.text(`Reg No: ${student.reg_no}`);
  doc.text(`Program: ${student.program_code}`);
  doc.text(`Semester: ${student.semester}`);
  doc.text(`Academic Year: ${event.academic_year}`);
  doc.text(`Event Type: ${event.event_type}`);
  doc.moveDown(0.8);

  doc.fontSize(10).text(`Eligibility Threshold (Attendance): ${minimumAttendance}%`);
  doc.moveDown(0.6);

  doc.fontSize(11).text('Subjects', { underline: true });
  doc.moveDown(0.4);

  subjects.forEach((s, idx) => {
    const sched = scheduleBySubjectId.get(s.subject_id) || null;
    const scheduleText = sched
      ? `${sched.exam_date} ${sched.start_time}-${sched.end_time} (${sched.session})`
      : 'Schedule TBD';

    doc.fontSize(10).text(
      `${idx + 1}. ${s.subject_code} — ${s.subject_name} | ${scheduleText} | ${s.eligibility}`,
    );
  });

  doc.moveDown(2);
  doc.fontSize(9).text('This admit card is generated dynamically by the system.', { align: 'left' });
  doc.end();
}

function generateAdmitCardBuffer({
  student,
  event,
  subjects,
  scheduleBySubjectId,
  minimumAttendance,
}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Online Examination Registration System', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(12).text('Admit Card', { align: 'center' });
    doc.moveDown(1);

    const photoPath = resolvePhotoPath(student.photo_url);
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        doc.image(photoPath, 430, 90, { fit: [120, 120] });
      } catch (_e) {
        // ignore
      }
    }

    doc.fontSize(11);
    doc.text(`Name: ${student.name}`);
    doc.text(`Reg No: ${student.reg_no}`);
    doc.text(`Program: ${student.program_code}`);
    doc.text(`Semester: ${student.semester}`);
    doc.text(`Academic Year: ${event.academic_year}`);
    doc.text(`Event Type: ${event.event_type}`);
    doc.moveDown(0.8);

    doc.fontSize(10).text(`Eligibility Threshold (Attendance): ${minimumAttendance}%`);
    doc.moveDown(0.6);

    doc.fontSize(11).text('Subjects', { underline: true });
    doc.moveDown(0.4);

    subjects.forEach((s, idx) => {
      const sched = scheduleBySubjectId.get(s.subject_id) || null;
      const scheduleText = sched
        ? `${sched.exam_date} ${sched.start_time}-${sched.end_time} (${sched.session})`
        : 'Schedule TBD';

      doc.fontSize(10).text(
        `${idx + 1}. ${s.subject_code} — ${s.subject_name} | ${scheduleText} | ${s.eligibility}`,
      );
    });

    doc.end();
  });
}

module.exports = {
  generateAdmitCardPdf,
  generateAdmitCardBuffer,
};

