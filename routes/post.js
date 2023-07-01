const { body, param, validationResult } = require('express-validator');
const express = require('express');
const Post = require('../models/post');

const router = express.Router();

// 검사 미들웨어 분리
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(400).json({ message: errors.array()[0].msg });
};

router.get('/', async (req, res, next) => {
  try {
    const post = await Post.find();
    res.json('post list');
    // res.render('mongoose', { users });
  } catch (err) {
    console.error(err);
    next(err);
  }
});
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

      res.status(201).json(newPost);
      // res.render('mongoose', { users });
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

module.exports = router;
