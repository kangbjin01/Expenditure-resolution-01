import * as XLSX from "xlsx";

export interface ExcelExpenseRow {
  연번: number;
  집행완료일: string | number;
  집행목적: string;
  증빙유형: string;
  품목: string;
  거래처명?: string;
  입금은행?: string;
  예금주명?: string;
  입금계좌번호?: string;
  집행금액: number;
  보조세목?: string;
  재원?: string;
  공급가액?: number;
  부가세?: number;
  잔액?: number;
}

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

function parseExcelDate(value: string | number): Date {
  if (typeof value === "number") {
    // Excel serial date number
    const utcDays = Math.floor(value - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  }
  
  // String date format: "2025.02.10" or "2025-02-10" or "2025/02/10"
  const dateStr = String(value).replace(/[.\/]/g, "-");
  return new Date(dateStr);
}

export function parseExcelFile(buffer: Buffer): ParsedExpense[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 엑셀 데이터를 배열로 변환 (헤더 포함)
  const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  
  // 헤더 행 찾기 (연번이 포함된 행)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    if (row && row.includes("연번")) {
      headerRowIndex = i;
      break;
    }
  }
  
  // 헤더 인덱스 매핑
  const headerRow = rawData[headerRowIndex] as string[];
  const colIndex: Record<string, number> = {};
  headerRow.forEach((col, idx) => {
    if (col) colIndex[col.trim()] = idx;
  });
  
  // 데이터 행 파싱 (헤더 다음 행부터)
  const expenses: ParsedExpense[] = [];
  
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i] as (string | number | undefined)[];
    if (!row) continue;
    
    const serialNumber = row[colIndex["연번"]];
    const executionDate = row[colIndex["집행완료일"]];
    const purpose = row[colIndex["집행목적"]];
    
    // 연번, 집행완료일, 집행목적이 있어야 유효한 행
    if (!serialNumber || !executionDate || !purpose) continue;
    
    // "이자" 같은 특수 행 제외 (숫자가 아닌 연번)
    if (typeof serialNumber !== "number" && isNaN(Number(serialNumber))) continue;
    
    const expense: ParsedExpense = {
      serialNumber: Number(serialNumber) || 0,
      executionDate: parseExcelDate(executionDate as string | number),
      purpose: String(purpose || ""),
      evidenceType: String(row[colIndex["증빙유형"]] || ""),
      item: String(row[colIndex["품목"]] || ""),
      vendorName: row[colIndex["거래처명"]] ? String(row[colIndex["거래처명"]]) : null,
      bankName: row[colIndex["입금은행"]] ? String(row[colIndex["입금은행"]]) : null,
      accountHolder: row[colIndex["예금주명"]] ? String(row[colIndex["예금주명"]]) : null,
      accountNumber: row[colIndex["입금계좌번호"]] ? String(row[colIndex["입금계좌번호"]]) : null,
      amount: Number(row[colIndex["집행금액"]]) || 0,
      subsidyCategory: row[colIndex["보조세목"]] ? String(row[colIndex["보조세목"]]) : null,
      fundSource: row[colIndex["재원"]] ? String(row[colIndex["재원"]]) : null,
      supplyPrice: row[colIndex["공급가액"]] ? Number(row[colIndex["공급가액"]]) : null,
      vat: row[colIndex["부가세"]] ? Number(row[colIndex["부가세"]]) : null,
      balance: row[colIndex["잔액"]] ? Number(row[colIndex["잔액"]]) : null,
    };
    
    expenses.push(expense);
  }

  return expenses;
}
