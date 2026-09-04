import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getR2UploadPresignedUrl, getR2DownloadPresignedUrl } from "@/lib/r2";

/**
 * POST /api/upload/r2-presign
 * Generates a pre-signed URL for direct client-side upload or secure download.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, fileName, fileType, folder = "documents", fileKey } = body;

    // Handle Download URL generation
    if (action === "download") {
      if (!fileKey) {
        return NextResponse.json({ error: "fileKey is required for download" }, { status: 400 });
      }
      const downloadUrl = await getR2DownloadPresignedUrl(fileKey);
      return NextResponse.json({ downloadUrl });
    }

    // Default: Handle Upload URL generation
    if (!fileName) {
      return NextResponse.json({ error: "fileName is required for upload" }, { status: 400 });
    }

    const { uploadUrl, key, publicUrl, fileId, accountId } = await getR2UploadPresignedUrl({
      fileName,
      fileType: fileType || "application/octet-stream",
      category: folder,
      uploadedById: userId,
    });

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
      fileId,
      accountId,
    });
  } catch (error: any) {
    console.error("R2 presign error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate R2 presigned URL" },
      { status: 500 }
    );
  }
}
