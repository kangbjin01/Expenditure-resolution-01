import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageBreak,
} from "docx";

interface Expense {
  id: number;
  serialNumber: number;
  executionDate: Date | string;
  purpose: string;
  evidenceType: string;
  item: string;
  vendorName: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  amount: number;
  subsidyCategory: string | null;
  supplyPrice: number | null;
  vat: number | null;
  note: string | null;
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "0원";
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function formatDate(dateValue: Date | string): string {
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function createTableRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 20 })],
            alignment: AlignmentType.LEFT,
          }),
        ],
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: "F0F0F0" },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: value, size: 20 })],
            alignment: AlignmentType.LEFT,
          }),
        ],
        width: { size: 75, type: WidthType.PERCENTAGE },
      }),
    ],
  });
}

function createHeaderCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: "F0F0F0" },
  });
}

function createDataCell(text: string, alignment: typeof AlignmentType[keyof typeof AlignmentType]): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20 })],
        alignment,
      }),
    ],
  });
}

// 계좌 정보 포맷팅 (은행명 + 예금주 + 계좌번호)
function formatAccountInfo(expense: Expense): string {
  const parts: string[] = [];
  if (expense.bankName) parts.push(expense.bankName);
  if (expense.accountHolder) parts.push(expense.accountHolder);
  if (expense.accountNumber) parts.push(expense.accountNumber);
  return parts.length > 0 ? parts.join(" / ") : "-";
}

export function generateExpenseWordDocument(expenses: Expense[]): Document {
  const children: (Paragraph | Table)[] = [];

  expenses.forEach((expense, index) => {
    // 제목
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "지 출 결 의 서",
            bold: true,
            size: 36,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        heading: HeadingLevel.HEADING_1,
      })
    );

    // 문서 정보
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `결의일자: ${formatDate(expense.executionDate)}`,
            size: 22,
          }),
          new TextRun({
            text: `          문서번호: ${String(expense.serialNumber).padStart(3, "0")}`,
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // 도서관장 허가
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "도서관장 허가: ☑ 전결",
            size: 22,
            bold: true,
          }),
        ],
        spacing: { after: 300 },
      })
    );

    // 기본 정보 테이블
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          createTableRow("지불금액", formatCurrency(expense.amount)),
          createTableRow("사용목적", expense.purpose),
          createTableRow("집행일자", formatDate(expense.executionDate)),
          createTableRow("품목", expense.item),
          createTableRow("증빙유형", expense.evidenceType),
          createTableRow("거래처명", expense.vendorName || "-"),
          createTableRow("계좌번호", formatAccountInfo(expense)),
          createTableRow("보조세목", expense.subsidyCategory || "-"),
        ],
      })
    );

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

    // 항목 상세 테이블
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell("품번", 15),
              createHeaderCell("내역", 40),
              createHeaderCell("금액", 25),
              createHeaderCell("비고", 20),
            ],
          }),
          new TableRow({
            children: [
              createDataCell("1", AlignmentType.CENTER),
              createDataCell(expense.item, AlignmentType.LEFT),
              createDataCell(formatCurrency(expense.amount), AlignmentType.RIGHT),
              createDataCell(expense.note || "", AlignmentType.CENTER),
            ],
          }),
        ],
      })
    );

    // 페이지 구분 (마지막 항목 제외)
    if (index < expenses.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  });

  return new Document({
    sections: [{
      properties: {},
      children: children.length > 0 ? children : [
        new Paragraph({ children: [new TextRun({ text: "데이터가 없습니다." })] })
      ],
    }],
  });
}
