import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();
console.log("✅ CLOUD_NAME:", process.env.CLOUD_NAME);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/utils", routes);

app.listen(process.env.PORT, () => {
  console.log(`✅ Utils Service running on http://127.0.0.1:${process.env.PORT}`);
});
