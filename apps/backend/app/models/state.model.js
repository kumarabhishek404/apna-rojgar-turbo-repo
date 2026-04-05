import mongoose from "mongoose";


const SubDistrictSchema = new mongoose.Schema({
  subDistrict: { type: String, required: true },
  villages: [{ type: String, required: true }], // Array of strings
});

// Define District Schema
const DistrictSchema = new mongoose.Schema({
  district: { type: String, required: true },
  subDistricts: [SubDistrictSchema], // Array of sub-districts
});

// Define State Schema
const StateSchema = new mongoose.Schema({
  state: { type: String, required: true },
  districts: [DistrictSchema], // Array of districts
});

// Create Mongoose Model
const State = mongoose.model("State", StateSchema);

export default State;