const express = require('express');
const Post = require('../models/post');

const router = express.Router();

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
router.post('/new', async (req, res, next) => {
  try {
    console.log(req.body);
    const post = await Post.create({
      title: req.body.name,
      content: req.body.age,
      commentCount: 0,
    });
    res.json('post list');
    // res.render('mongoose', { users });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
