"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

interface Expense {
  id: number;
  serialNumber: number;
  executionDate: string;
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
  approvalStatus: string;
  note: string | null;
}

export default function ExpensePrint({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(`/api/expenses/${resolvedParams.id}`);
        if (!response.ok) throw new Error("Not found");
        const data = await response.json();
        setExpense(data);
      } catch (error) {
        console.error("Failed to fetch expense:", error);
        router.push("/expenses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpense();
  }, [resolvedParams.id, router]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "0원";
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!expense) return null;

  return (
    <div className="space-y-6">
      {/* 액션 버튼 (인쇄 시 숨김) */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 뒤로가기
        </button>
        <Button onClick={handlePrint}>인쇄하기</Button>
      </div>

      {/* 지출 결의서 */}
      <div className="bg-white border-2 border-black p-8 max-w-3xl mx-auto print:border-2 print:shadow-none">
        {/* 제목 */}
        <h1 className="text-2xl font-bold text-center tracking-widest mb-8 border-b-2 border-black pb-4">
          지 출 결 의 서
        </h1>

        {/* 문서 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex">
            <span className="font-medium w-24">결의일자:</span>
            <span>{formatDate(expense.executionDate)}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-24">문서번호:</span>
            <span>{String(expense.serialNumber).padStart(3, "0")}</span>
          </div>
        </div>

        {/* 도서관장 허가 - 전결 고정 */}
        <div className="border-2 border-black mb-6">
          <div className="bg-gray-100 px-4 py-2 font-medium border-b border-black">
            도서관장 허가
          </div>
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-black flex items-center justify-center bg-black">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span className="font-medium">전결</span>
          </div>
        </div>

        {/* 기본 정보 테이블 */}
        <table className="w-full border-2 border-black mb-6">
          <tbody>
            <tr className="border-b border-black">
              <th className="bg-gray-100 px-4 py-2 text-left font-medium w-32 border-r border-black">
                지불금액
              </th>
              <td className="px-4 py-2 font-semibold">{formatCurrency(expense.amount)}</td>
            </tr>
            <tr className="border-b border-black">
              <th className="bg-gray-100 px-4 py-2 text-left font-medium border-r border-black">
                사용목적
              </th>
              <td className="px-4 py-2">{expense.purpose}</td>
            </tr>
            <tr className="border-b border-black">
              <th className="bg-gray-100 px-4 py-2 text-left font-medium border-r border-black">
                집행일자
              </th>
              <td className="px-4 py-2">{formatDate(expense.executionDate)}</td>
            </tr>
            <tr className="border-b border-black">
              <th className="bg-gray-100 px-4 py-2 text-left font-medium border-r border-black">
                품목
              </th>
              <td className="px-4 py-2">{expense.item}</td>
            </tr>
            <tr className="border-b border-black">
              <th className="bg-gray-100 px-4 py-2 text-left font-medium border-r border-black">
                증빙유형
              </th>
              <td className="px-4 py-2">{expense.evidenceType}</td>
            </tr>
            <tr className="border-b border-black">
              <th className="bg-gray-100 px-4 py-2 text-left font-medium border-r border-black">
                거래처명
              </th>
              <td className="px-4 py-2">{expense.vendorName || "-"}</td>
            </tr>
            <tr>
              <th className="bg-gray-100 px-4 py-2 text-left font-medium border-r border-black">
                보조세목
              </th>
              <td className="px-4 py-2">{expense.subsidyCategory || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* 항목 상세 테이블 */}
        <table className="w-full border-2 border-black mb-6">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="px-4 py-2 text-center font-medium border-r border-black w-16">
                품번
              </th>
              <th className="px-4 py-2 text-center font-medium border-r border-black">
                내역
              </th>
              <th className="px-4 py-2 text-center font-medium border-r border-black w-32">
                금액
              </th>
              <th className="px-4 py-2 text-center font-medium w-32">비고</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="px-4 py-3 text-center border-r border-black">1</td>
              <td className="px-4 py-3 border-r border-black">{expense.item}</td>
              <td className="px-4 py-3 text-right border-r border-black">
                {formatCurrency(expense.amount)}
              </td>
              <td className="px-4 py-3 text-center">{expense.note || ""}</td>
            </tr>
          </tbody>
        </table>

        {/* 금액 요약 */}
        <div className="border-2 border-black">
          <div className="grid grid-cols-3 divide-x divide-black">
            <div className="px-4 py-3">
              <span className="text-sm text-gray-600">공급가액</span>
              <p className="font-semibold mt-1">
                {formatCurrency(expense.supplyPrice ?? expense.amount)}
              </p>
            </div>
            <div className="px-4 py-3">
              <span className="text-sm text-gray-600">부가세</span>
              <p className="font-semibold mt-1">{formatCurrency(expense.vat ?? 0)}</p>
            </div>
            <div className="px-4 py-3 bg-gray-100">
              <span className="text-sm text-gray-600">합계</span>
              <p className="font-bold text-lg mt-1">{formatCurrency(expense.amount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
