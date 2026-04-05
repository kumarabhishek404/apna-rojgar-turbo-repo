import express from "express";
import fs from "fs";
const router = express.Router();
import User from "../models/user.model.js";
import Service from "../models/service.model.js";
import logError from "../utils/addErrorLog.js";

export const getAllCompanyStats = async (req, res) => {
  try {
    // Fetch all users and services from the database
    const users = await User.find();
    const services = await Service.find();

    // Create the response object
    const response = {
      users: users?.length,
      services: services?.length,
    };

    // Send the response as JSON
    return res.status(200).json(response);
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const compareAndUpdateJSON = (file1, file2) => {
  const updatedFile2 = { ...file2 };

  Object.keys(file1).forEach((key) => {
    if (!(key in updatedFile2)) {
      updatedFile2[key] = file1[key]; // Add missing key at the end
    }
  });

  return updatedFile2;
};

export const compareJSON = async (req, res) => {
  try {
    if (!req.files || !req.files.file1 || !req.files.file2) {
      return res
        .status(400)
        .json({ error: "Both JSON files (file1 and file2) are required" });
    }

    // Read the uploaded files
    const file1Content = fs.readFileSync(req.files.file1[0].path, "utf8");
    const file2Content = fs.readFileSync(req.files.file2[0].path, "utf8");

    // Parse JSON
    const file1 = JSON.parse(file1Content);
    const file2 = JSON.parse(file2Content);

    // Compare and update file2
    const updatedFile2 = compareAndUpdateJSON(file1, file2);

    // Cleanup uploaded files
    fs.unlinkSync(req.files.file1[0].path);
    fs.unlinkSync(req.files.file2[0].path);

    res.status(200).json({ updatedFile2 });
  } catch (error) {
    logError(error, req, 500);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

export default router;
