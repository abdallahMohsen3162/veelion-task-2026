import { NextResponse } from "next/server";
import { BackendError, getActivityFromBackend } from "@/lib/backendApi";
import { activityListResponseSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const logs = await getActivityFromBackend();
    const parsed = activityListResponseSchema.safeParse(logs);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Upstream activity shape changed." } },
        { status: 502 }
      );
    }
    return NextResponse.json(parsed.data, { status: 200 });
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
