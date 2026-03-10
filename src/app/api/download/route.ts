import { v2 as cloudinary } from "cloudinary";
import { config as appConfig } from "@/config";

cloudinary.config({
  cloud_name: appConfig.cloudinary.cloudName,
  api_key: appConfig.cloudinary.apiKey,
  api_secret: appConfig.cloudinary.apiSecret,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storedUrl = searchParams.get("url");
  const fileName = searchParams.get("name") ?? "download";

  if (!storedUrl) return new Response("Missing url", { status: 400 });

  try {
    const urlPath = new URL(storedUrl).pathname;
    const uploadIndex = urlPath.indexOf("/upload/");
    if (uploadIndex === -1) return new Response("Invalid URL", { status: 400 });

    // Get everything after /upload/ and strip version (v1234/)
    const afterUpload = urlPath.slice(uploadIndex + 8).replace(/^v\d+\//, "");
    // Extract format extension, then strip it to get the public_id
    const formatMatch = afterUpload.match(/\.([a-zA-Z0-9]+)$/);
    const format = formatMatch ? formatMatch[1] : "pdf";
    const publicId = afterUpload.replace(/\.[^/.]+$/, "");

    const resourceType = urlPath.includes("/video/upload/") ? "video" as const :
                         urlPath.includes("/raw/upload/") ? "raw" as const : "image" as const;

    // Generate an authorized download URL via Cloudinary's download endpoint
    const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: "upload",
      expires_at: Math.round(Date.now() / 1000) + 3600,
    });

    console.log("[download] downloadUrl:", downloadUrl);

    const cloudRes = await fetch(downloadUrl);
    if (!cloudRes.ok) {
      const body = await cloudRes.text();
      console.log("[download] cloudinary status:", cloudRes.status, body);
      return new Response(`Cloudinary error: ${cloudRes.status}`, { status: 502 });
    }

    const contentType = cloudRes.headers.get("content-type") ?? "application/octet-stream";
    const data = await cloudRes.arrayBuffer();

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": data.byteLength.toString(),
      },
    });
  } catch (e) {
    console.log("[download] error:", e);
    return new Response(`Error: ${e}`, { status: 500 });
  }
}
