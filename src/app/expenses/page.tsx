"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";

interface Expense {
  id: number;
  serialNumber: number;
  executionDate: string;
  purpose: string;
  evidenceType: string;
  item: string;
  vendorName: string | null;
  amount: number;
  approvalStatus: string;
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses");
      const data = await response.json();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    let filtered = expenses;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.purpose.toLowerCase().includes(searchLower) ||
          e.item.toLowerCase().includes(searchLower) ||
          (e.vendorName && e.vendorName.toLowerCase().includes(searchLower))
      );
    }

    setFilteredExpenses(filtered);
  }, [search, expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredExpenses.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleExportWord = async (exportAll: boolean) => {
    setIsExporting(true);
    try {
      const ids = exportAll ? [] : selectedIds;
      
      if (!exportAll && ids.length === 0) {
        alert("내보낼 항목을 선택해주세요.");
        setIsExporting(false);
        return;
      }

      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: exportAll ? null : ids }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `지출결의서_${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("워드 파일 생성에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingle = async (id: number, serialNumber: number) => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `지출결의서_${serialNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("워드 파일 생성에 실패했습니다.");
    }
  };

  const isAllSelected =
    filteredExpenses.length > 0 &&
    filteredExpenses.every((e) => selectedIds.includes(e.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">지출 목록</h1>
          <p className="text-muted-foreground mt-1">
            총 {filteredExpenses.length}건의 지출 내역
            {selectedIds.length > 0 && (
              <span className="ml-2 text-foreground">
                ({selectedIds.length}건 선택됨)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 검색 및 액션 버튼 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="검색 (집행목적, 품목, 거래처)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </div>

        {/* 워드 저장 버튼 */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExportWord(true)}
            disabled={isExporting || expenses.length === 0}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isExporting ? "생성 중..." : "전체 워드 저장"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExportWord(false)}
            disabled={selectedIds.length === 0 || isExporting}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            선택 워드 저장 ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      {filteredExpenses.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-center text-xs font-medium text-muted-foreground p-3 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    번호
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    집행일자
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    집행목적
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    증빙유형
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    품목
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    거래처명
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    금액
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    허가
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-3 whitespace-nowrap">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${
                      selectedIds.includes(expense.id) ? "bg-muted/20" : ""
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(expense.id)}
                        onChange={(e) =>
                          handleSelectOne(expense.id, e.target.checked)
                        }
                        className="w-4 h-4 rounded border-border"
                      />
                    </td>
                    <td className="p-3 text-sm">{expense.serialNumber}</td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      {formatDate(expense.executionDate)}
                    </td>
                    <td className="p-3 text-sm max-w-[200px] truncate">
                      {expense.purpose}
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      {expense.evidenceType}
                    </td>
                    <td className="p-3 text-sm max-w-[150px] truncate">
                      {expense.item}
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      {expense.vendorName || "-"}
                    </td>
                    <td className="p-3 text-sm text-right font-medium whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                        전결
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/expenses/${expense.id}`}>
                          <Button variant="ghost" size="sm">
                            상세
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleExportSingle(expense.id, expense.serialNumber)}
                        >
                          워드
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
