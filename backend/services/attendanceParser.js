const { readWorkbookFromBuffer, getFirstSheetRows } = require('./excelParser');
const { normaliseHeader, makeError } = require('../utils/validators');

function findHeaderRowIndex(rows) {
  if (!rows || rows.length === 0) return -1;
  if (rows[0]?.[0] === 'Reg No') return 0;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]?.[0] === 'Reg No') return i;
  }
  return -1;
}

function parseAttendanceBuffer({ buffer, subjects }) {
  const workbook = readWorkbookFromBuffer(buffer);
  const rows = getFirstSheetRows(workbook);

  const headerRowIndex = findHeaderRowIndex(rows);
  if (headerRowIndex === -1) throw makeError(400, 'Invalid file format: missing Reg No header');

  const headers = rows[headerRowIndex] || [];
  if (headers[0] !== 'Reg No') throw makeError(400, 'Invalid file format: first column must be Reg No');

  const dataRows = rows.slice(headerRowIndex + 1);

  const subjectByKey = new Map();
  subjects.forEach((s) => {
    const shortKey = s.short_code ? normaliseHeader(s.short_code) : null;
    const codeKey = s.subject_code ? normaliseHeader(s.subject_code) : null;
    if (shortKey) subjectByKey.set(shortKey, s);
    if (codeKey) subjectByKey.set(codeKey, s);
  });

  const recognisedSubjects = [];
  const ignoredColumns = [];
  const columnMappings = []; // { header, subject_id, key }

  for (let c = 1; c < headers.length; c += 1) {
    const header = headers[c];
    const key = normaliseHeader(header);
    const subj = subjectByKey.get(key);
    if (!subj) {
      ignoredColumns.push(String(header ?? '').trim());
      continue;
    }
    if (subj.type !== 'THEORY') {
      ignoredColumns.push(String(header ?? '').trim());
      continue;
    }
    recognisedSubjects.push(subj.short_code || subj.subject_code);
    columnMappings.push({ colIndex: c, subject_id: subj.subject_id, display: subj.short_code || subj.subject_code });
  }

  const unknownRegNos = [];
  const preview = [];
  const parsed = []; // { reg_no, entries: [{subject_id, pct}] }
  const regNosPresent = new Set();

  const toPct = (v) => {
    const n = Number.parseFloat(String(v).trim());
    if (!Number.isFinite(n)) return 0.0;
    return n;
  };

  for (const row of dataRows) {
    const reg_no = String(row?.[0] ?? '').trim();
    if (!reg_no) continue;
    regNosPresent.add(reg_no);

    const entries = [];
    const rowObj = { reg_no };
    for (const m of columnMappings) {
      const pct = toPct(row?.[m.colIndex] ?? '');
      rowObj[m.display] = pct;
      entries.push({ subject_id: m.subject_id, attendance_percentage: pct });
    }

    parsed.push({ reg_no, entries });
    if (preview.length < 5) preview.push(rowObj);
  }

  return {
    totalRows: parsed.length,
    recognisedSubjects,
    ignoredColumns,
    unknownRegNos,
    preview,
    parsed,
    regNosPresent,
  };
}

module.exports = { parseAttendanceBuffer };

