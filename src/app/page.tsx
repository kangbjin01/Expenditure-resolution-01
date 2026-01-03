"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import StatCard from "@/components/StatCard";
import Button from "@/components/Button";

interface Expense {
  id: number;
  serialNumber: number;
  executionDate: string;
  purpose: string;
  amount: number;
  approvalStatus: string;
}

interface Stats {
  total: number;
  totalAmount: number;
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    totalAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setError(null);
      const response = await fetch("/api/expenses");
      
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setExpenses(data);
        const total = data.length;
        const totalAmount = data.reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0);
        setStats({ total, totalAmount });
      } else {
        setExpenses([]);
        setStats({ total: 0, totalAmount: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
      setExpenses([]);
      setStats({ total: 0, totalAmount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground mt-1">
          엑셀 파일을 업로드하여 지출 결의서를 관리하세요
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 엑셀 업로드 */}
      <section>
        <h2 className="text-sm font-medium mb-3">파일 업로드</h2>
        <FileUpload onUploadSuccess={fetchExpenses} />
      </section>

      {/* 통계 */}
      {!isLoading && stats.total > 0 && (
        <section>
          <h2 className="text-sm font-medium mb-3">요약</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              title="전체 건수" 
              value={stats.total} 
              subtitle="건" 
            />
            <StatCard 
              title="총 금액" 
              value={formatCurrency(stats.totalAmount)} 
            />
          </div>
        </section>
      )}

      {/* 최근 지출 목록 */}
      {!isLoading && recentExpenses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">최근 지출</h2>
            <Link href="/expenses">
              <Button variant="ghost" size="sm">
                전체 보기 →
              </Button>
            </Link>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">
                    번호
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">
                    집행목적
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3">
                    금액
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-3">
                    허가
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3 text-sm">{expense.serialNumber}</td>
                    <td className="p-3">
                      <Link
                        href={`/expenses/${expense.id}`}
                        className="text-sm hover:underline"
                      >
                        {expense.purpose}
                      </Link>
                    </td>
                    <td className="p-3 text-sm text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                        전결
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && expenses.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">
            아직 업로드된 데이터가 없습니다
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            위의 업로드 영역에 엑셀 파일을 드래그하세요
          </p>
        </div>
      )}
    </div>
  );
}
