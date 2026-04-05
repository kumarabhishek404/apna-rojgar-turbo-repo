import mongoose from "mongoose";

// 1. Ensure the models are defined
const User = mongoose.model("User");
const Service = mongoose.model("Service");
const Team = mongoose.model("Team");

// 2. Create indexes
export const createIndexes = async () => {
  try {
    // ----- USER INDEXES -----
    console.log("Creating User indexes...");
    await User.collection.createIndex({ status: 1 }, { background: true });
    await User.collection.createIndex(
      { "rating.average": 1 },
      { background: true },
    );
    await User.collection.createIndex(
      { email: 1 },
      { sparse: true, background: true },
    );
    await User.collection.createIndex(
      { "skills.skill": 1 },
      { background: true },
    );
    await User.collection.createIndex({ workHistory: 1 }, { background: true });

    // mobile index - skip if exists
    const indexes = await User.collection.indexes();
    const mobileIndexExists = indexes.some((idx) => idx.name === "mobile_1");
    if (!mobileIndexExists) {
      await User.collection.createIndex(
        { mobile: 1 },
        { unique: true, sparse: true, background: true },
      );
    }

    // geospatial index for geoLocation
    const locationIndexExists = indexes.some(
      (idx) => idx.name === "location_2dsphere",
    );
    if (!locationIndexExists) {
      await User.collection.createIndex({ geoLocation: "2dsphere" });
    }

    // ----- SERVICE INDEXES -----
    console.log("Creating Service indexes...");
    await Service.collection.createIndex({ employer: 1 }, { background: true });
    // no need to index _id

    // ----- TEAM INDEXES -----
    console.log("Creating Team indexes...");
    await Team.collection.createIndex(
      { mediator: 1 },
      { unique: true, background: true },
    );
    await Team.collection.createIndex({ workers: 1 }, { background: true });

    console.log("Indexes created successfully!");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
};
