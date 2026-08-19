const XLSX = require('xlsx');

function readWorkbookFromBuffer(buffer) {
  try {
    return XLSX.read(buffer, { type: 'buffer' });
  } catch (_e) {
    const err = new Error('Invalid or corrupt file. Please upload a valid .xlsx or .csv file.');
    err.status = 400;
    throw err;
  }
}

function getFirstSheetRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

module.exports = {
  readWorkbookFromBuffer,
  getFirstSheetRows,
};

