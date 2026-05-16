import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const CASE_ID = /^[a-z0-9][a-z0-9-]*$/;
const PRINTABLE_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/;

type RouteContext = {
  params: Promise<{ caseId: string; file: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { caseId, file } = await context.params;

  if (!CASE_ID.test(caseId) || !PRINTABLE_FILE.test(file)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const printablesRoot = path.resolve(process.cwd(), "cases", caseId, "printables");
  const resolved = path.resolve(printablesRoot, file);

  if (!resolved.startsWith(printablesRoot + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const html = await readFile(resolved, "utf8");
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
