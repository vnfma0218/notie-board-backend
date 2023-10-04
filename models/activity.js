const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema; // ObjectId 타입은 따로 꺼내주어야 한다.

const activitySchema = new Schema({
  text: {
    type: String,
    required: true, // null 여부
  },
  user: {
    type: ObjectId,
    ref: 'User',
  },
  targetuUser: {
    type: ObjectId,
    ref: 'User',
  },
  post: { type: ObjectId, ref: 'Post' },
  isPosting: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: String,
    default: Date.now, // 기본값
  },
});

activitySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

module.exports = mongoose.model('Activity', activitySchema);
