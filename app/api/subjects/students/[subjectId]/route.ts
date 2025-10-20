// Update the import path if the actual location is different, for example:
import { getSubjectStudents} from "../../../../lib/fns/studentFunctions";
import { NextResponse } from "next/server";

export const GET = async (req: Request, { params }: { params: Promise<{ subjectId: string }>}) => {
    const { subjectId } = await params;
    const data = await getSubjectStudents(String(subjectId));
    return NextResponse.json({success: true, message: "Students retrieved successfully", data: data});
}