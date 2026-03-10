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

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "application/msword", "text/plain"];
const MAX_SIZE = 5 * 1024 * 1024;

export const POST = withAuth(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const todoId = formData.get("todoId") as string | null;

  if (!file) throw new AppError("No file provided", 400);
  if (!todoId) throw new AppError("todoId is required", 400);

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError("File type not allowed. Allowed: PNG, JPG, PDF, DOC, TXT", 400);
  }

  if (file.size > MAX_SIZE) {
    throw new AppError("File too large. Max size is 5MB", 400);
  }

  const todo = await prisma.todo.findUnique({ where: { id: todoId } });
  if (!todo) throw new AppError("Todo not found", 404);

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: "todo-app",
    resource_type: "auto",
    public_id: `${Date.now()}-${file.name.replace(/\s+/g, "_").replace(/\.[^/.]+$/, "")}`,
  });

  const record = await prisma.file.create({
    data: {
      fileName: file.name,
      filePath: uploaded.secure_url,
      fileType: file.type,
      fileSize: file.size,
      publicId: uploaded.public_id,
      todoId,
    },
  });

  return NextResponse.json({ data: record }, { status: 201 });
});
