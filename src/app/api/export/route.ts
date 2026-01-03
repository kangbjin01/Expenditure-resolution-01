import { NextRequest, NextResponse } from "next/server";
import { Packer } from "docx";
import prisma from "@/lib/db";
import { generateExpenseWordDocument } from "@/lib/word";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    let expenses;

    if (ids && ids.length > 0) {
      // 선택된 항목만
      expenses = await prisma.expense.findMany({
        where: {
          id: { in: ids },
        },
        orderBy: { serialNumber: "asc" },
      });
    } else {
      // 전체 항목
      expenses = await prisma.expense.findMany({
        orderBy: { serialNumber: "asc" },
      });
    }

    if (expenses.length === 0) {
      return NextResponse.json(
        { error: "No expenses found" },
        { status: 404 }
      );
    }

    const doc = generateExpenseWordDocument(expenses);
    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="expense-reports.docx"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate Word document:", error);
    return NextResponse.json(
      { error: "Failed to generate Word document" },
      { status: 500 }
    );
  }
}
