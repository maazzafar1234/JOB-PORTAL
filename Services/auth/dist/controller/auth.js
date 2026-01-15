import errorHandler from "../utils/errorHandler.js";
import { tryCatch } from "../utils/TryCatch.js";
import { sql } from "../utils/db.js";
import bcrypt from "bcrypt";
import FormData from "form-data";
import axios from "axios";
export const registerUser = tryCatch(async (req, res, next) => {
    const { name, email, password, phoneNumber, role, bio } = req.body;
    if (!name || !email || !password || !phoneNumber || !role) {
        throw new errorHandler("Please fill all details", 400);
    }
    const existingUsers = await sql `
    SELECT user_id FROM users WHERE email = ${email}
  `;
    if (existingUsers.length > 0) {
        throw new errorHandler("User with this email already exists", 409);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (role === "recruiter") {
        await sql `
      INSERT INTO users (name, email, password, phone_number, role)
      VALUES (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role})
    `;
        return res.status(201).json({
            message: "✅ User data stored successfully",
        });
    }
    if (role === "jobseeker") {
        const file = req.file;
        if (!file) {
            throw new errorHandler("Please upload your resume", 400);
        }
        if (!process.env.UPLOAD_SERVICE) {
            throw new errorHandler("UPLOAD_SERVICE missing in env", 500);
        }
        const uploadUrl = `${process.env.UPLOAD_SERVICE}/api/utils/upload`;
        const formData = new FormData();
        formData.append("file", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });
        let uploadData;
        try {
            const response = await axios.post(uploadUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 15000,
            });
            uploadData = response.data;
        }
        catch (err) {
            const error = err;
            console.log("❌ Upload API Error:", error.response?.data || error.message);
            throw new errorHandler(error.response?.data?.message || error.message || "Resume upload failed", 500);
        }
        if (!uploadData?.url || !uploadData?.public_id) {
            throw new errorHandler("Upload service did not return url/public_id", 500);
        }
        await sql `
      INSERT INTO users (name, email, password, phone_number, role, bio, resume, resume_public_id)
      VALUES (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}, ${bio}, ${uploadData.url}, ${uploadData.public_id})
    `;
        return res.status(201).json({
            message: "✅ User data stored successfully",
        });
    }
    throw new errorHandler("Invalid role", 400);
});
