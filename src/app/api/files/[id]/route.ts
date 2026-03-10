import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { withAuth } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/errors";
import { config } from "@/config";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const DELETE = withAuth(async (_req, { params }) => {
  const { id } = await params;

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new AppError("File not found", 404);

  if (file.publicId) {
    try {
      await cloudinary.uploader.destroy(file.publicId, { resource_type: "auto" });
    } catch {
      // Continue even if Cloudinary deletion fails
    }
  }

  await prisma.file.delete({ where: { id } });

  return NextResponse.json({ data: { success: true } });
});
