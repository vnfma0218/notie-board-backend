const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
  // _id 부분은 기본적으로 생략. 알아서 Object.id를 넣어줌
  title: {
    type: String,
    required: true, // null 여부
    // unique: true, // 유니크 여부
  },
  content: {
    type: String,
    required: true, // null 여부
  },
  commentCount: {
    type: Number,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now, // 기본값
  },
});

module.exports = mongoose.model('Post', postSchema);
