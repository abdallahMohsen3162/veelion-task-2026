import { NextResponse } from "next/server";
import { BackendError, getTasksFromBackend } from "@/lib/backendApi";
import { tasksResponseSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const tasks = await getTasksFromBackend();
    const parsed = tasksResponseSchema.safeParse({ data: tasks });
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
