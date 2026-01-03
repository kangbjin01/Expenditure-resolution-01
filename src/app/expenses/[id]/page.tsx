"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
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

export default function ExpenseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({});

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(`/api/expenses/${resolvedParams.id}`);
        if (!response.ok) throw new Error("Not found");
        const data = await response.json();
        setExpense(data);
        setFormData(data);
      } catch (error) {
        console.error("Failed to fetch expense:", error);
        router.push("/expenses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpense();
  }, [resolvedParams.id, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/expenses/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save");

      const updated = await response.json();
      setExpense(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert("저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await fetch(`/api/expenses/${resolvedParams.id}`, {
        method: "DELETE",
      });
      router.push("/expenses");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("삭제에 실패했습니다");
    }
  };

  const handleExportWord = async () => {
    if (!expense) return;
    setIsExporting(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [expense.id] }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `지출결의서_${expense.serialNumber}.docx`;
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

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
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
    <div className="space-y-6 animate-fadeIn">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/expenses"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← 목록으로
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            지출 상세 #{expense.serialNumber}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(expense);
                }}
              >
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                수정
              </Button>
              <Button 
                variant="primary" 
                onClick={handleExportWord}
                disabled={isExporting}
              >
                {isExporting ? "생성 중..." : "워드 저장"}
              </Button>
              <Button variant="ghost" onClick={handleDelete}>
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* 기본 정보 */}
          <div className="p-6 space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">기본 정보</h2>
            
            <FormField
              label="연번"
              name="serialNumber"
              value={formData.serialNumber}
              isEditing={isEditing}
              onChange={handleInputChange}
              type="number"
            />

            <FormField
              label="집행일자"
              name="executionDate"
              value={isEditing ? formatDateForInput(formData.executionDate || "") : formatDate(expense.executionDate)}
              isEditing={isEditing}
              onChange={handleInputChange}
              type="date"
            />

            <FormField
              label="집행목적"
              name="purpose"
              value={formData.purpose}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="증빙유형"
              name="evidenceType"
              value={formData.evidenceType}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="품목"
              name="item"
              value={formData.item}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="보조세목"
              name="subsidyCategory"
              value={formData.subsidyCategory}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="재원"
              name="fundSource"
              value={formData.fundSource}
              isEditing={isEditing}
              onChange={handleInputChange}
            />
          </div>

          {/* 금액 및 거래처 정보 */}
          <div className="p-6 space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">금액 및 거래처</h2>

            <FormField
              label="거래처명"
              name="vendorName"
              value={formData.vendorName}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="입금은행"
              name="bankName"
              value={formData.bankName}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="예금주명"
              name="accountHolder"
              value={formData.accountHolder}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="계좌번호"
              name="accountNumber"
              value={formData.accountNumber}
              isEditing={isEditing}
              onChange={handleInputChange}
            />

            <FormField
              label="집행금액"
              name="amount"
              value={isEditing ? formData.amount : formatCurrency(expense.amount)}
              isEditing={isEditing}
              onChange={handleInputChange}
              type="number"
            />

            <FormField
              label="공급가액"
              name="supplyPrice"
              value={isEditing ? formData.supplyPrice : formatCurrency(expense.supplyPrice)}
              isEditing={isEditing}
              onChange={handleInputChange}
              type="number"
            />

            <FormField
              label="부가세"
              name="vat"
              value={isEditing ? formData.vat : formatCurrency(expense.vat)}
              isEditing={isEditing}
              onChange={handleInputChange}
              type="number"
            />

            <FormField
              label="잔액"
              name="balance"
              value={isEditing ? formData.balance : formatCurrency(expense.balance)}
              isEditing={isEditing}
              onChange={handleInputChange}
              type="number"
            />
          </div>
        </div>

        {/* 허가 상태 및 비고 */}
        <div className="border-t border-border p-6 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">기타 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">도서관장 허가</label>
              <p className="mt-1 text-sm font-medium">
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                  전결
                </span>
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">비고</label>
              {isEditing ? (
                <textarea
                  name="note"
                  value={formData.note || ""}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                />
              ) : (
                <p className="mt-1 text-sm">{expense.note || "-"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  isEditing,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string | number | null | undefined;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          className="w-full mt-1 h-10 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      ) : (
        <p className="mt-1 text-sm font-medium">{value || "-"}</p>
      )}
    </div>
  );
}
