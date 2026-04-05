import mongoose from "mongoose";

const Image = mongoose.model(
  "Image",
  new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    data: {type: Buffer, required: true},
    contentType: {type: String, required: true},
  })
);


export default Image;
