import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    aadhaarNumber: {
      type: String,
      default: "",
    },
    age: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    countryCode: {
      type: String,
      default: "91",
    },
    mobile: {
      type: String,
      default: "",
      index: true, // ✅ Add this
    },
    email: {
      value: {
        type: String,
        default: "",
        required: false,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    role: {
      type: String,
      defaul: "WORKER",
      enum: ["WORKER", "MEDIATOR", "EMPLOYER"],
    },
    address: {
      type: String,
      default: "",
    },
    savedAddresses: {
      type: [String],
      default: [],
    },
    locale: {
      language: {
        type: String,
        default: "hi",
      },
    },
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    skills: {
      type: [Object],
      default: [],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    notificationConsent: {
      type: Boolean,
      default: true,
    },
    registrationSource: {
      type: String,
      default: null,
      validate: {
        validator: (v) => v == null || ["android", "ios", "web"].includes(v),
        message: "Invalid registration source",
      },
    },
    likedServices: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Service",
        default: [],
      },
    ],
    likedUsers: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    likedBy: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    teamJoiningRequestBy: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    employedBy: {
      type: Object,
      default: null,
    },
    bookingRequestBy: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    myBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    bookedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    workDetails: {
      byService: {
        appliedIndividually: {
          applied: {
            type: Number,
            default: 0,
          },
          cancelledApply: {
            byMySelf: {
              type: Number,
              default: 0,
            },
            byEmployer: {
              type: Number,
              default: 0,
            },
          },
          selected: {
            type: Number,
            default: 0,
          },
          cancelledSelection: {
            byMySelf: {
              type: Number,
              default: 0,
            },
            byEmployer: {
              type: Number,
              default: 0,
            },
          },
          completed: {
            type: Number,
            default: 0,
          },
          total: {
            type: Number,
            default: 0,
          },
        },
        appliedByMediator: {
          applied: {
            type: Number,
            default: 0,
          },
          cancelledApply: {
            byMySelf: {
              type: Number,
              default: 0,
            },
            byMediator: {
              type: Number,
              default: 0,
            },
            byEmployer: {
              type: Number,
              default: 0,
            },
          },
          selected: {
            type: Number,
            default: 0,
          },
          cancelledSelection: {
            byMySelf: {
              type: Number,
              default: 0,
            },
            byMediator: {
              type: Number,
              default: 0,
            },
            byEmployer: {
              type: Number,
              default: 0,
            },
          },
          completed: {
            type: Number,
            default: 0,
          },
          total: {
            type: Number,
            default: 0,
          },
        },
      },
      directBooking: {
        recievedRequests: {
          type: Number,
          default: 0,
        },
        bookingRequestPending: {
          type: Number,
          default: 0,
        },
        requestRejected: {
          type: Number,
          default: 0,
        },
        requestAccepted: {
          type: Number,
          default: 0,
        },
        requestCancelled: {
          type: Number,
          default: 0,
        },
        bookingPending: {
          type: Number,
          default: 0,
        },
        bookingCancelled: {
          byMySelf: {
            type: Number,
            default: 0,
          },
          byEmployer: {
            type: Number,
            default: 0,
          },
        },
        bookingCompleted: {
          type: Number,
          default: 0,
        },
      },
    },
    serviceDetails: {
      byService: {
        total: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Number,
          default: 0,
        },
        pending: {
          type: Number,
          default: 0,
        },
        cancelled: {
          type: Number,
          default: 0,
        },
      },
      directBooking: {
        sentRequests: {
          type: Number,
          default: 0,
        },
        bookingRequestPending: {
          type: Number,
          default: 0,
        },
        requestRejected: {
          type: Number,
          default: 0,
        },
        requestAccepted: {
          type: Number,
          default: 0,
        },
        requestCancelled: {
          type: Number,
          default: 0,
        },
        bookingPending: {
          type: Number,
          default: 0,
        },
        bookingCancelled: {
          byMySelf: {
            type: Number,
            default: 0,
          },
          byWorker: {
            type: Number,
            default: 0,
          },
        },
        bookingCompleted: {
          type: Number,
          default: 0,
        },
      },
    },
    mediatorDetails: {
      applied: {
        type: Number,
        default: 0,
      },
      cancelledApply: {
        byMySelf: {
          type: Number,
          default: 0,
        },
        byWorkers: {
          type: Number,
          default: 0,
        },
        byEmployer: {
          type: Number,
          default: 0,
        },
      },
      selected: {
        type: Number,
        default: 0,
      },
      cancelledSelection: {
        byMySelf: {
          type: Number,
          default: 0,
        },
        byWorkers: {
          type: Number,
          default: 0,
        },
        byEmployer: {
          type: Number,
          default: 0,
        },
      },
      completed: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    earnings: {
      work: {
        type: Number,
        default: 0,
      },
      rewards: {
        type: Number,
        default: 0,
      },
    },
    spent: {
      work: {
        type: Number,
        default: 0,
      },
      tip: {
        type: Number,
        default: 0,
      },
    },
    serviceHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        default: [],
      },
    ],
    workHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        default: [],
      },
    ],
    password: {
      type: String,
      required: false,
    },
    resetPasswordToken: {
      type: String,
      default: "",
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    emailVerificationCode: {
      type: String,
      default: "",
    },
    emailVerificationCodeExpires: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "SUSPENDED", "DISABLED", "DELETED"],
      default: "PENDING",
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

// ⭐ index must be on SCHEMA
UserSchema.index({ geoLocation: "2dsphere" });

const User = mongoose.model("User", UserSchema);

export default User;
