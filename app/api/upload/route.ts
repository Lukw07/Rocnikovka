import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "No file received." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Sanitize filename
  const filename = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  
  // Ensure directory exists
  const uploadDir = path.join(process.cwd(), "public/uploads");
  if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
  }

  try {
    await writeFile(
      path.join(uploadDir, filename),
      buffer
    );
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
