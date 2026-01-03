const XLSX = require('xlsx');
const fs = require('fs');

const buffer = fs.readFileSync('./test-data.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// 헤더 행 찾기
let headerRowIndex = 0;
for (let i = 0; i < Math.min(rawData.length, 10); i++) {
  const row = rawData[i];
  if (row && row.includes('연번')) {
    headerRowIndex = i;
    break;
  }
}

const headerRow = rawData[headerRowIndex];
console.log('Header row index:', headerRowIndex);
console.log('Header:', headerRow);

// 컬럼 인덱스 매핑
const colIndex = {};
headerRow.forEach((col, idx) => {
  if (col) colIndex[col.trim()] = idx;
});
console.log('Column index map:', colIndex);

// 첫 3개 데이터 행 파싱
for (let i = headerRowIndex + 1; i < headerRowIndex + 4; i++) {
  const row = rawData[i];
  if (!row) continue;
  
  const parsed = {
    serialNumber: row[colIndex['연번']],
    executionDate: row[colIndex['집행완료일']],
    purpose: row[colIndex['집행목적']],
    evidenceType: row[colIndex['증빙유형']],
    item: row[colIndex['품목']],
    vendorName: row[colIndex['거래처명']],
    amount: row[colIndex['집행금액']],
    balance: row[colIndex['잔액']],
  };
  console.log('Parsed row', i, ':', parsed);
}



