import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { UserRole } from "@/app/lib/generated";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== UserRole.OPERATOR && session.user.role !== UserRole.TEACHER)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  console.log("Upload dir:", uploadDir);
  
  try {
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }
    
    await writeFile(
      path.join(uploadDir, filename),
      buffer
    );
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ 
      error: "Failed to upload file", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
