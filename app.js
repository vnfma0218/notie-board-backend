const express = require('express');
const app = express();
const port = 8080;
const db = require('./db.js'); // db 불러오기

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
