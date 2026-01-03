import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { parseExcelFile } from "@/lib/excel";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Only Excel files (.xlsx, .xls) are allowed" },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 엑셀 파싱
    const expenses = parseExcelFile(buffer);

    if (expenses.length === 0) {
      return NextResponse.json(
        { error: "No valid data found in the Excel file" },
        { status: 400 }
      );
    }

    // 기존 데이터 삭제 후 새 데이터 삽입
    await prisma.expense.deleteMany();
    
    const created = await prisma.expense.createMany({
      data: expenses.map((expense) => ({
        ...expense,
        approvalStatus: "pending",
      })),
    });

    return NextResponse.json({
      message: `Successfully imported ${created.count} expenses`,
      count: created.count,
    });
  } catch (error) {
    console.error("Failed to upload file:", error);
    return NextResponse.json(
      { error: "Failed to process the Excel file" },
      { status: 500 }
    );
  }
}



