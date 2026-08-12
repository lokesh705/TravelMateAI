const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    phone: {
      type: String,
      required: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    savedTrips: [{
      placeId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      formatted: {
        type: String,
        default: "",
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      imageUrl: {
        type: String,
        default: "",
      },
      categories: {
        type: [String],
        default: [],
      },
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
