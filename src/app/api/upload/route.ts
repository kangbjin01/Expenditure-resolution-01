import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { parseExcelFile } from "@/lib/excel";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 업로드되지 않았습니다" },
        { status: 400 }
      );
    }

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "엑셀 파일(.xlsx, .xls)만 지원됩니다" },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err) {
      console.error("File read error:", err);
      return NextResponse.json(
        { error: "파일을 읽는 중 오류가 발생했습니다" },
        { status: 400 }
      );
    }

    // 엑셀 파싱
    let expenses;
    try {
      expenses = parseExcelFile(buffer);
      console.log(`Parsed ${expenses.length} expenses from Excel`);
    } catch (err) {
      console.error("Excel parsing error:", err);
      return NextResponse.json(
        { error: "엑셀 파일을 파싱하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요." },
        { status: 400 }
      );
    }

    if (expenses.length === 0) {
      return NextResponse.json(
        { error: "엑셀 파일에서 유효한 데이터를 찾을 수 없습니다. 헤더 행에 '연번' 컬럼이 있는지 확인해주세요." },
        { status: 400 }
      );
    }

    // 기존 데이터 삭제 후 새 데이터 삽입
    try {
      await prisma.expense.deleteMany();
      console.log("Deleted existing expenses");
    } catch (err) {
      console.error("Delete error:", err);
      // 테이블이 없을 수 있으므로 무시
    }
    
    try {
      const created = await prisma.expense.createMany({
        data: expenses.map((expense) => ({
          ...expense,
          approvalStatus: "approved",
        })),
      });
      console.log(`Created ${created.count} expenses`);

      return NextResponse.json({
        message: `${created.count}건의 데이터를 성공적으로 가져왔습니다`,
        count: created.count,
      });
    } catch (err) {
      console.error("Database insert error:", err);
      return NextResponse.json(
        { error: "데이터베이스에 저장하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "파일 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
