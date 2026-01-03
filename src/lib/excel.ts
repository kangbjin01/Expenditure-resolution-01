import * as XLSX from "xlsx";

export interface ParsedExpense {
  serialNumber: number;
  executionDate: Date;
  purpose: string;
  evidenceType: string;
  item: string;
  vendorName: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  amount: number;
  subsidyCategory: string | null;
  fundSource: string | null;
  supplyPrice: number | null;
  vat: number | null;
  balance: number | null;
}

function parseExcelDate(value: string | number | undefined | null): Date {
  if (!value) return new Date();
  
  if (typeof value === "number") {
    // Excel serial date number
    const utcDays = Math.floor(value - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  }
  
  // String date format: "2025.02.10" or "2025-02-10" or "2025/02/10"
  const dateStr = String(value).replace(/[.\/]/g, "-");
  const parsed = new Date(dateStr);
  
  // 유효한 날짜인지 확인
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  
  return parsed;
}

function safeNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function parseExcelFile(buffer: Buffer): ParsedExpense[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("No sheets found in workbook");
  }
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    throw new Error("Worksheet is empty");
  }
  
  // 엑셀 데이터를 배열로 변환 (헤더 포함)
  const rawData = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(worksheet, { header: 1 });
  
  if (!rawData || rawData.length === 0) {
    throw new Error("No data found in worksheet");
  }
  
  console.log("Raw data rows:", rawData.length);
  
  // 헤더 행 찾기 (연번이 포함된 행)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    if (row && Array.isArray(row)) {
      const hasSerialNumber = row.some(cell => 
        cell !== undefined && String(cell).trim() === "연번"
      );
      if (hasSerialNumber) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    console.log("Header row not found, trying first row");
    headerRowIndex = 0;
  }
  
  console.log("Header row index:", headerRowIndex);
  
  // 헤더 인덱스 매핑
  const headerRow = rawData[headerRowIndex] as (string | number | undefined)[];
  const colIndex: Record<string, number> = {};
  
  if (headerRow) {
    headerRow.forEach((col, idx) => {
      if (col !== undefined && col !== null) {
        const colName = String(col).trim();
        if (colName) {
          colIndex[colName] = idx;
        }
      }
    });
  }
  
  console.log("Column index:", colIndex);
  
  // 데이터 행 파싱 (헤더 다음 행부터)
  const expenses: ParsedExpense[] = [];
  
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i] as (string | number | undefined)[];
    if (!row || !Array.isArray(row)) continue;
    
    // 연번 컬럼 인덱스 찾기
    const serialNumIdx = colIndex["연번"] ?? 1;
    const serialNumber = row[serialNumIdx];
    
    // 연번이 숫자가 아니면 스킵 (헤더나 합계 행 등)
    if (serialNumber === undefined || serialNumber === null) continue;
    const serialNum = Number(serialNumber);
    if (isNaN(serialNum) || serialNum <= 0) continue;
    
    // 집행완료일
    const executionDateIdx = colIndex["집행완료일"] ?? 2;
    const executionDate = row[executionDateIdx];
    if (!executionDate) continue;
    
    // 집행목적
    const purposeIdx = colIndex["집행목적"] ?? 3;
    const purpose = row[purposeIdx];
    if (!purpose) continue;
    
    const expense: ParsedExpense = {
      serialNumber: serialNum,
      executionDate: parseExcelDate(executionDate),
      purpose: safeString(purpose),
      evidenceType: safeString(row[colIndex["증빙유형"] ?? 4]),
      item: safeString(row[colIndex["품목"] ?? 5]),
      vendorName: safeString(row[colIndex["거래처명"] ?? 6]) || null,
      bankName: safeString(row[colIndex["입금은행"] ?? 7]) || null,
      accountHolder: safeString(row[colIndex["예금주명"] ?? 8]) || null,
      accountNumber: safeString(row[colIndex["입금계좌번호"] ?? 9]) || null,
      amount: safeNumber(row[colIndex["집행금액"] ?? 10]),
      subsidyCategory: safeString(row[colIndex["보조세목"] ?? 11]) || null,
      fundSource: safeString(row[colIndex["재원"] ?? 12]) || null,
      supplyPrice: safeNumber(row[colIndex["공급가액"] ?? 13]) || null,
      vat: safeNumber(row[colIndex["부가세"] ?? 14]) || null,
      balance: safeNumber(row[colIndex["잔액"] ?? 15]) || null,
    };
    
    expenses.push(expense);
  }

  console.log("Parsed expenses count:", expenses.length);
  
  return expenses;
}
