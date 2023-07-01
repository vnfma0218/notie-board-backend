const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;
const db = require('./db.js'); // db 불러오기

const whitelist = ['http://localhost:3000'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// 라우터 모듈
const indexRouter = require('./routes');
const postRouter = require('./routes/post');
// 라우터 연결
app.use('/', indexRouter); // 기본 요청
app.use('/post', postRouter); // post에 관한 요청
app.get('/', (req, res) => {
  res.send('hello world!');
});
db(); // 실행
app.listen(port, () => {
  console.log('서버 실행!');
});
