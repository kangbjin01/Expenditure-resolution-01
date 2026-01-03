import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: 모든 지출 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { purpose: { contains: search } },
        { item: { contains: search } },
        { vendorName: { contains: search } },
      ];
    }

    if (status && status !== "all") {
      where.approvalStatus = status;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { serialNumber: "asc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    // 테이블이 없는 경우 빈 배열 반환
    return NextResponse.json([]);
  }
}

// POST: 새 지출 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const expense = await prisma.expense.create({
      data: {
        serialNumber: body.serialNumber,
        executionDate: new Date(body.executionDate),
        purpose: body.purpose,
        evidenceType: body.evidenceType,
        item: body.item,
        vendorName: body.vendorName || null,
        bankName: body.bankName || null,
        accountHolder: body.accountHolder || null,
        accountNumber: body.accountNumber || null,
        amount: body.amount,
        subsidyCategory: body.subsidyCategory || null,
        fundSource: body.fundSource || null,
        supplyPrice: body.supplyPrice || null,
        vat: body.vat || null,
        balance: body.balance || null,
        approvalStatus: body.approvalStatus || "pending",
        note: body.note || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

// DELETE: 모든 지출 삭제 (엑셀 재업로드 시 사용)
export async function DELETE() {
  try {
    await prisma.expense.deleteMany();
    return NextResponse.json({ message: "All expenses deleted" });
  } catch (error) {
    console.error("Failed to delete expenses:", error);
    return NextResponse.json(
      { error: "Failed to delete expenses" },
      { status: 500 }
    );
  }
}
