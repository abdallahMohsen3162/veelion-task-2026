import { NextResponse } from "next/server";
import { BackendError, getActivityFromBackend } from "@/lib/backendApi";
import { activityPaginatedResponseSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = {
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };
    const result = await getActivityFromBackend(
      params as { search?: string; sort?: "when" | "action"; order?: "asc" | "desc" }
    );
    const parsed = activityPaginatedResponseSchema.safeParse(result);
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
