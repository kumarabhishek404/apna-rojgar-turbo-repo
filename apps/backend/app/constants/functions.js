import Counter from "../models/counter.model.js";

export const generateJobID = async () => {
  try {
    const year = new Date().getFullYear();

    const counter = await Counter.findOneAndUpdate(
      { _id: "jobID" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, useFindAndModify: false }
    );

    if (!counter) {
      throw new Error("Failed to create or find counter");
    }

    const jobID = `JOB${year}${String(counter.seq).padStart(6, "0")}`;
    return jobID;
  } catch (error) {
    console.error("Error generating jobID:", error);
    throw new Error("Error generating jobID");
  }
};
