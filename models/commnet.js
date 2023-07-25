const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema; // ObjectId 타입은 따로 꺼내주어야 한다.

const commentSchema = new Schema({
  text: {
    type: String,
    required: true, // null 여부
  },
  user: {
    type: ObjectId, // 몽고디비에서 ObjectId타입으로 데이터를 다룸
    required: true,
    ref: 'User', // user.js스키마에 reference로 연결되어 있음. join같은 기능. 나중에 populate에 사용
  },
  createdAt: {
    type: Date,
    default: Date.now, // 기본값
  },
  likeCount: {
    type: Number,
    required: false,
    default: 0,
  },
});

// _id로 된 필드를 삭제하고 id값으로 바꿈
// 가상버전으로 설정하였기 때문에 실제 스키마에 영향 x
commentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

module.exports = mongoose.model('Comment', commentSchema);
