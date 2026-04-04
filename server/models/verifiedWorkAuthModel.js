// models/verifiedWorkAuthModel.js - MongoDB schema for verified work experience records
import mongoose from 'mongoose'

const verifiedWorkAuthSchema = new mongoose.Schema(
  {
    // Link back to the in-progress work auth record
    workAuthRecordId: {
      type: String,
      required: true,
      index: true,
    },

    // Link back to the analyzed resume
    resumeId: {
      type: String,
      default: null,
      index: true,
    },

    // Candidate & org details
    candidateName: { type: String, default: '' },
    organizationName: { type: String, default: '' },

    // POC contact used for verification
    pocPhone: { type: String, required: true },
    pocEmail: { type: String, required: true },

    // Verification outcome
    verificationMethod: {
      type: String,
      enum: ['email', 'call', 'both'],
      default: 'email',
    },
    finalStatus: {
      type: String,
      enum: ['correct', 'rejected'],
      required: true,
    },

    // Timestamps handled by Mongoose
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
)

export const VerifiedWorkAuth =
  mongoose.models.VerifiedWorkAuth ||
  mongoose.model('VerifiedWorkAuth', verifiedWorkAuthSchema)
