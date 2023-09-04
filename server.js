const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
const port = 8080;
// const db = require('./db.js'); // db 불러오기
// creating 24 hours from millisecond'
const oneDay = 1000 * 60 * 60 * 24;
const uri = process.env.ATLAS_URI;
mongoose.set('strictQuery', false);
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('mongodb connected');
  })
  .catch((err) => console.log(err));

// mongoose.connection.on('disconnected', connect);
const whitelist = [
  'http://localhost:3000',
  'https://notice-board-eta.vercel.app',
];
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// };
// Serve static files from the 'uploads' directory
app.use(
  cors({
    credentials: true,
    origin: whitelist,
  })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cookieParser());

// 라우터 모듈
const postRouter = require('./routes/post');
const usersRouter = require('./routes/users');
const activityRouter = require('./routes/activity');
// 라우터 연결
app.use('/post', postRouter); // post에 관한 요청
app.use('/user', usersRouter); // user 관한 요청
app.use('/', activityRouter); // activity에 관한 요청
app.get('/', (req, res) => {
  res.send('hello world!');
});
// db(); // 실행
app.listen(port, () => {
  console.log('서버 실행! url: ', 'http://localhost:8080');
});
