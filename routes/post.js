const { body, validationResult } = require('express-validator');
const { paginatedResults } = require('../middleware/paginate');
const express = require('express');
const Post = require('../models/post');

const router = express.Router();

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
router.get('/:id', async (req, res, next) => {
  const id = req.params.id;
  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.json(404);
    }
    if (post) {
      return res.json(post);
    }
  } catch (error) {}
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
  async (req, res, next) => {
    try {
      console.log('req.body', req.body);
      const newPost = await Post.create({
        title: req.body.title,
        content: req.body.content,
        commentCount: 0,
      });

      res.status(201).json({ id: newPost._id });
      // res.render('mongoose', { users });
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

module.exports = router;
