export const config = {
  ollama: {
    apiKey: process.env.OLLAMA_API_KEY ?? "",
    apiUrl: process.env.OLLAMA_API_URL ?? "https://api.ollama.com/v1",
    model: process.env.OLLAMA_MODEL ?? "llama3",
  },
  upload: {
    maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 5242880),
    uploadDir: process.env.UPLOAD_DIR ?? "./public/uploads",
  },
  db: {
    url: process.env.DATABASE_URL ?? "",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
} as const;
