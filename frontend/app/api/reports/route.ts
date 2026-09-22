import { NextResponse } from "next/server";
import { BackendError, getReportsSummaryFromBackend } from "@/lib/backendApi";
import { tasksSummarySchema } from "@/lib/schemas";

export async function GET() {
  try {
    const summary = await getReportsSummaryFromBackend();
    const parsed = tasksSummarySchema.safeParse(summary);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Upstream reports shape changed." } },
        { status: 502 }
      );
    }
    return NextResponse.json(parsed.data, { status: 200 });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    return NextResponse.json(
      { error: { message: "Unable to fetch reports." } },
      { status: 500 }
    );
  }
}
