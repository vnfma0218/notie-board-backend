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
    type: ObjectId, // 몽고디비에서 ObjectId타입으로 데이터를 다룸
    ref: 'User', // user.js스키마에 reference로 연결되어 있음. join같은 기능. 나중에 populate에 사용
  },
  targetuUser: {
    type: ObjectId, // 몽고디비에서 ObjectId타입으로 데이터를 다룸
    ref: 'User', // user.js스키마에 reference로 연결되어 있음. join같은 기능. 나중에 populate에 사용
  },
  post: { type: ObjectId, ref: 'Post' },

  createdAt: {
    type: String,
    default: Date.now, // 기본값
  },
});

module.exports = mongoose.model('Activity', activitySchema);
