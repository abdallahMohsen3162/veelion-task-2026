import { NextResponse } from "next/server";
import { BackendError, updateTaskInBackend } from "@/lib/backendApi";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  let payload: { completed?: boolean };
  try {
    payload = (await request.json()) as { completed?: boolean };
  } catch {
    return NextResponse.json(
      { error: { message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  if (typeof payload.completed !== "boolean") {
    return NextResponse.json(
      { error: { message: "completed must be boolean" } },
      { status: 400 }
    );
  }

  try {
    const task = await updateTaskInBackend(params.id, payload.completed);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }
    return NextResponse.json(
      { error: { message: "Unable to update task." } },
      { status: 500 }
    );
  }
}
