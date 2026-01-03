import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: 개별 지출 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to fetch expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// PUT: 지출 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        serialNumber: body.serialNumber,
        executionDate: body.executionDate ? new Date(body.executionDate) : undefined,
        purpose: body.purpose,
        evidenceType: body.evidenceType,
        item: body.item,
        vendorName: body.vendorName ?? null,
        bankName: body.bankName ?? null,
        accountHolder: body.accountHolder ?? null,
        accountNumber: body.accountNumber ?? null,
        amount: body.amount,
        subsidyCategory: body.subsidyCategory ?? null,
        fundSource: body.fundSource ?? null,
        supplyPrice: body.supplyPrice ?? null,
        vat: body.vat ?? null,
        balance: body.balance ?? null,
        approvalStatus: body.approvalStatus,
        note: body.note ?? null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to update expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE: 지출 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}


