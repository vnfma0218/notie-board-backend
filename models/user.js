const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema; // ObjectId 타입은 따로 꺼내주어야 한다.

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  snsType: {
    type: String,
  },
  password: {
    type: String,
  },
  nickname: {
    type: String,
    required: true,
  },
  avatar: {
    filename: String,
    path: String,
  },
  defaultAvatar: {
    type: String,
  },
  comment: [{ type: mongoose.Types.ObjectId, ref: 'Comment' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// _id로 된 필드를 삭제하고 id값으로 바꿈
// 가상버전으로 설정하였기 때문에 실제 스키마에 영향 x
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

module.exports = mongoose.model('User', userSchema);
