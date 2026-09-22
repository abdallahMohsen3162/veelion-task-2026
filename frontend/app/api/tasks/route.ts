import { NextResponse } from "next/server";
import { BackendError, getTasksFromBackend } from "@/lib/backendApi";
import { tasksPaginatedResponseSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = {
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };
    const result = await getTasksFromBackend(
      params as { search?: string; status?: "all" | "completed" | "pending" }
    );
    const parsed = tasksPaginatedResponseSchema.safeParse(result);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Upstream tasks shape changed." } },
        { status: 502 }
      );
    }
    return NextResponse.json(parsed.data, { status: 200 });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { message: "Unable to fetch tasks." } }, { status: 500 });
  }
}
