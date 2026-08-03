import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import { getCurrentAdmin } from "~/lib/auth";

const utapi = new UTApi();

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("Received file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // try direct upload first
    let response;
    try {
      console.log("Trying direct uploadFiles...");
      response = await utapi.uploadFiles([file]);
      console.log("Direct upload response:", JSON.stringify(response, null, 2));
    } catch (directError) {
      console.log("Direct upload failed, trying data URL method...", directError);
      // fallback to data url method
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;
      response = await utapi.uploadFilesFromUrl([dataUrl]);
      console.log("Data URL upload response:", JSON.stringify(response, null, 2));
    }

    console.log("Upload response:", JSON.stringify(response, null, 2));

    if (!response || response.length === 0) {
      console.error("Empty response from uploadFiles");
      throw new Error("Upload failed: no response");
    }

    const uploadResult = response[0];
    if (!uploadResult || uploadResult.error || !uploadResult.data) {
      console.error("Invalid upload result:", uploadResult);
      throw new Error(uploadResult?.error?.message || "Upload failed: invalid response");
    }

    const uploadedFile = uploadResult.data;
    
    // use ufsUrl instead of deprecated url
    return NextResponse.json({
      url: uploadedFile.ufsUrl || uploadedFile.url,
      key: uploadedFile.key,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

