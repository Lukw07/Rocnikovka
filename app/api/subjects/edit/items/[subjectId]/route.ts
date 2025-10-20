import { updateSubjectItems } from "../../../../../lib/fns/subjectFunctions";
import { NextResponse } from "next/server";

export const POST = async (req: Request, { params }: { params: Promise<{ subjectId: string }>}) => {
    const { subjectId } = await params;
    const body = await req.json();

    try {
        const data = await updateSubjectItems(Number(subjectId), body.items);
        return NextResponse.json({success: true, message: "Subject updated successfully", data: data});
    } catch (error) {
        return NextResponse.json({success: false, message: "Subject update failed", error: error}, {status: 500});
    }
}