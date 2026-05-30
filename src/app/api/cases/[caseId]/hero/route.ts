import { readFile, readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const CASE_ID = /^[a-z0-9][a-z0-9-]*$/;
const IMAGE_EXTENSIONS = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);
const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { caseId } = await context.params;

  if (!CASE_ID.test(caseId)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const uiRoot = path.resolve(process.cwd(), "cases", caseId, "ui");

  try {
    const files = await readdir(uiRoot);
    const imageFile = files.find((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()));

    if (!imageFile) {
      return new NextResponse("Not found", { status: 404 });
    }

    const resolved = path.resolve(uiRoot, imageFile);
    if (!resolved.startsWith(uiRoot + path.sep)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const extension = path.extname(imageFile).toLowerCase();
    const file = await readFile(resolved);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": CONTENT_TYPES[extension],
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
