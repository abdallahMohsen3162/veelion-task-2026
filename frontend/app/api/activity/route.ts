import { NextResponse } from "next/server";
import { BackendError, getActivityFromBackend } from "@/lib/backendApi";

export async function GET() {
  try {
    const logs = await getActivityFromBackend();
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    return NextResponse.json(
      { error: { message: "Unable to fetch activity logs." } },
      { status: 500 }
    );
  }
}
