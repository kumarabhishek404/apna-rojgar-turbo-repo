import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import logError from "../utils/addErrorLog.js"; // Import error logging utility

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, "../public/images");
      cb(null, uploadPath);
    } catch (error) {
      logError(error, req, 500, "middleware - multerStorage");
      console.error("⚠️ [File Upload] Error setting destination path:", error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileExt = file.originalname.split(".").pop();
      const newFileName = `${file.originalname}-${uniqueSuffix}.${fileExt}`;
      cb(null, newFileName);
    } catch (error) {
      logError(error, req, 500, "middleware - multerFilename");
      console.error("⚠️ [File Upload] Error generating file name:", error);
      cb(error, null);
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: async (req, file, cb) => {
    try {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

      if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error(
          "Invalid file type! Only JPEG, PNG, and GIF allowed.",
        );

        console.error("⚠️ Invalid file type:", file.mimetype);

        await logError(error, req, 400, "multer-fileFilter");

        return cb(error, false);
      }

      cb(null, true);
    } catch (error) {
      await logError(error, req, 500, "multer-fileFilter");
      cb(error, false);
    }
  },
});

export const uploadServiceImages = (req, res, next) => {
  const uploader = upload.fields([{ name: "images", maxCount: 3 }]);

  uploader(req, res, async (err) => {
    if (err) {
      console.error("⚠️ Multer Upload Error:", err);

      let message = err.message;

      if (err.code === "LIMIT_FILE_SIZE") {
        message = "Image size exceeds 10MB limit";
      }

      await logError(err, req, 400, "multer-upload");

      return res.status(400).json({
        success: false,
        message,
      });
    }

    next();
  });
};

export { upload };
