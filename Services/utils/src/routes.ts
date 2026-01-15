import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "file is required" });
    }

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            folder: "resumes",
          },
          (error, uploaded) => {
            if (error) return reject(error);
            resolve(uploaded);
          }
        )
        .end(file.buffer);
    });

    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.log("❌ Cloudinary Upload Error FULL:", error);

    return res.status(500).json({
      message: "resume upload error",
      reason: error?.message,
    });
  }
});

export default router;
