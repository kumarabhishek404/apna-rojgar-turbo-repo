import mongoose from "mongoose";
import User from "./user.model.js";
import Role from "./role.model.js";
import Service from "./service.model.js";
import Image from "./image.model.js";
import Review from "./review.model.js";
import Device from "./device.model.js";
import Team from "./team.model.js";

// eslint-disable-next-line no-undef
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = db;

db.user = User;
db.device = Device;
db.role = Role;
db.service = Service;
db.image = Image;
db.review = Review;
db.team = Team;

db.ROLES = ["worker", "employer", "admin"];

export default db;
