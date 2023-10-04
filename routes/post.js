const express = require('express');

const User = require('../models/user');
const Post = require('../models/post');
const Activity = require('../models/activity');
const Comment = require('../models/commnet');
const Like = require('../models/like');

const moment = require('moment');
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
router.get(
  '/',
  paginatedResults(Post, {
    path: 'user',
    select: 'nickname avatar defaultAvatar',
  }),
  async (req, res) => {
    res.paginatedResults.results = res.paginatedResults.results.map((el) => {
      return {
        ...el.toObject(),
        user: {
          nickname: el.user.nickname,
          avatar: el.user.defaultAvatar
            ? el.user.defaultAvatar
            : req.protocol +
              '://' +
              req.get('host') +
              '/uploads/' +
              el.user.avatar.filename,
        },
      };
    });

    res.status(200).json(res.paginatedResults);
  }
);
// 게시글 수정
router.put('/', async (req, res) => {
  const postId = req.body.id;
  const title = req.body.title;
  const content = req.body.content;

  const foundedPost = await Post.findById(postId);
  foundedPost.title = title;
  foundedPost.content = content;
  await foundedPost.save();
  res.status(200).json({ resultCode: 2000 });
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
    .populate({ path: 'user', select: '-password' })
    .populate({
      path: 'comment',
      populate: { path: 'user', select: 'nickname avatar defaultAvatar' },
    });
  if (foundedPost.comment) {
    foundedPost.comment = foundedPost.comment.map((el) => ({
      ...el,
      user: { ...el.user, avatar: el.user.defaultAvatar },
      isMine: user ? el.user._id.equals(user._id) : false,
    }));
  }

  const foundedLike = await Like.findOne({ post: foundedPost });

  if (foundedLike) {
    foundedPost.isLiked = foundedLike.user._id.equals(user._id);
  }
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
      // activity 스키마 추가
      await Activity.create({
        text: '게시판에 게시물을 작성하였습니다.',
        user: user._id,
        post: newPost._id,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
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
    const postingUser = await User.findById(post.user);

    if (!user) {
      res.status(401).json({ message: 'no uesr' });
    }
    // 답글 생성
    const createdComment = await Comment.create({
      text,
      user,
    });

    // activity 스키마 추가
    await Activity.create({
      text: `${postingUser.nickname}님의 게시물에 답변을 작성하였습니다.`,
      user: user._id,
      post: post,
      isPosting: false,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
    });

    user.comment.push(createdComment);
    post.comment.push(createdComment);
    post.commentCount += 1;
    await user.save();
    await post.save();
    res.status(200).json({ resultCode: 2000 });
  } catch (error) {
    res.status(500).json({ message: 'something went wrong' });
  }
});

// 게시글 답글 삭제
router.delete('/comment', authenticateToken, async (req, res) => {
  console.log('---------게시글 댓글 삭제 ---------------');
  const commentId = req.body.commentId;
  const postId = req.body.postId;

  const user = await User.findOne({ email: req.user.email });
  const post = await Post.findById(postId);

  // 댓글 삭제
  await Comment.findByIdAndDelete(commentId);
  await user.updateOne({
    $pull: {
      comment: commentId,
    },
  });
  await post.updateOne({
    $pull: {
      comment: commentId,
    },
    $set: {
      commentCount: post.commentCount - 1,
    },
  });
  return res.status(200).json({ resultCode: 2000 });
});

// 게시글 답글 수정
router.put('/comment', authenticateToken, async (req, res) => {
  const commentId = req.body.commentId;
  const text = req.body.text;
  const foundedComment = await Comment.findById(commentId);
  foundedComment.text = text;
  const result = await foundedComment.save();

  res.status(200).json({ resultCode: 2000 });
});
// 게시글 좋아요
router.post('/like', authenticateToken, async (req, res) => {
  const postId = req.body.postId;
  const foundedPost = await Post.findById(postId);
  const user = await User.findOne({ email: req.user.email });

  foundedPost.likeCount = foundedPost.likeCount ? foundedPost.likeCount + 1 : 1;
  await foundedPost.save();
  await Like.create({ post: foundedPost, user });

  res.status(200).json({ resultCode: 2000 });
});
// 게시글 좋아요 취소
router.delete('/like', authenticateToken, async (req, res) => {
  const postId = req.body.postId;
  const foundedPost = await Post.findById(postId);

  foundedPost.likeCount = foundedPost.likeCount ? foundedPost.likeCount - 1 : 0;
  await foundedPost.save();
  await Like.deleteOne({ post: foundedPost });

  res.status(200).json({ resultCode: 2000 });
});

module.exports = router;
