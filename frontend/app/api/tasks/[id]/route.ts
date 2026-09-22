import { NextResponse } from "next/server";
import { BackendError, updateTaskInBackend } from "@/lib/backendApi";
import { taskResponseSchema, updateTaskPayloadSchema } from "@/lib/schemas";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  const parsedPayload = updateTaskPayloadSchema.safeParse(rawBody);
  if (!parsedPayload.success) {
    const firstIssue = parsedPayload.error.issues[0];
    return NextResponse.json(
      {
        error: {
          message: firstIssue?.message || "Invalid request body.",
          details: parsedPayload.error.issues,
        },
      },
      { status: 400 }
    );
  }

  try {
    const task = await updateTaskInBackend(params.id, parsedPayload.data.completed);
    const parsedResponse = taskResponseSchema.safeParse({ data: task });
    if (!parsedResponse.success) {
      return NextResponse.json(
        { error: { message: "Upstream task shape changed." } },
        { status: 502 }
      );
    }
    return NextResponse.json(parsedResponse.data, { status: 200 });
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
