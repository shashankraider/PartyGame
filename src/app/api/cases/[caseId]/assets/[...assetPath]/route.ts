import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const CASE_ID = /^[a-z0-9][a-z0-9-]*$/;
const ASSET_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

type RouteContext = {
  params: Promise<{ caseId: string; assetPath: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { caseId, assetPath } = await context.params;

  if (!CASE_ID.test(caseId) || assetPath.length === 0 || !assetPath.every((part) => ASSET_SEGMENT.test(part))) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const extension = path.extname(assetPath.at(-1) ?? "").toLowerCase();
  const contentType = CONTENT_TYPES[extension];

  if (!contentType) {
    return new NextResponse("Unsupported media type", { status: 415 });
  }

  const assetsRoot = path.resolve(process.cwd(), "cases", caseId, "assets");
  const resolved = path.resolve(assetsRoot, ...assetPath);

  if (!resolved.startsWith(assetsRoot + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const file = await readFile(resolved);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": contentType,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
