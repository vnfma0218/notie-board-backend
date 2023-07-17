const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/commnet');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { body, validationResult } = require('express-validator');
const { paginatedResults } = require('../middleware/paginate');
const { authenticateToken } = require('../middleware/authenticationToken');

// 검사 미들웨어 분리
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(403).json({ message: errors.array()[0].msg });
};
// 게시글 전체목록
router.get('/', paginatedResults(Post), async (req, res, next) => {
  res.status(200).json(res.paginatedResults);
});
// 게시글 상세
router.get('/:id', async (req, res) => {
  const token = req.cookies.accessToken;
  let email = null;
  let user = null;
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_PRIVATE_KEY, (err, userInfo) => {
      email = userInfo ? userInfo.email : null;
    });
  }
  if (email) {
    user = await User.findOne({ email });
  }

  const id = req.params.id;
  const foundedPost = await Post.findById(id)
    .lean()
    .populate({
      path: 'comment',
      populate: { path: 'user', select: 'nickname' },
    });
  foundedPost.comment = foundedPost.comment.map((el) => ({
    ...el,
    isMine: user ? el.user._id.equals(user._id) : false,
  }));
  if (foundedPost) {
    return res.status(200).json({
      ...foundedPost,
      isMine: user ? foundedPost.user._id.equals(user._id) : false,
    });
  } else {
    return res.status(404).json({
      message: 'not found',
    });
  }
});
// 새 게시글 등록
router.post(
  '/new',
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 30 })
      .withMessage('제목은 5~30자를 입력해주세요.'),
    body('content').notEmpty().withMessage('내용을 입력해주세요.'),
    validate,
  ],
  authenticateToken,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.user.email });
      const newPost = await Post.create({
        user: user._id,
        title: req.body.title,
        content: req.body.content,
        commentCount: 0,
      });

      res.status(201).json({ id: newPost._id });
    } catch (err) {
      next(err);
    }
  }
);

// 게시글 답글
router.post('/comment', authenticateToken, async (req, res) => {
  const text = req.body.text;
  try {
    const user = await User.findOne({ email: req.user.email });
    const post = await Post.findById(req.body.id);

    if (!user) {
      res.status(401).json({ message: 'no uesr' });
    }
    // 답글 생성
    const createdComment = await Comment.create({
      text,
      user,
    });

    user.comment.push(createdComment);
    post.comment.push(createdComment);
    await user.save();
    await post.save();
    res.status(200).json({ resultCode: 2000 });
  } catch (error) {
    res.status(500).json({ message: 'something went wrong' });
  }
});

// 게시글 답글 삭제
router.delete('/comment', authenticateToken, async (req, res) => {
  const commentId = req.body.commentId;
  const postId = req.body.postId;

  const user = await User.findOne({ email: req.user.email });
  const post = await Post.findById(postId);

  user.comment = user.comment.filter((c) => {
    return c.toString() !== commentId;
  });
  post.comment = post.comment.filter((c) => {
    return c.toString() !== commentId;
  });
  await user.save();
  await post.save();
  res.status(200).json({ resultCode: 2000 });
});

module.exports = router;
