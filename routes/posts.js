const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/check').checkLogin;
const PostModel = require('../models/posts');
const CommentModel = require('../models/comments');

router.get('/',function (req, res, next) {
  const author = req.query.author;
  const key = req.query.key;
  PostModel.getPostsCount(author, key).then(function (count) {
    count = count%5?Math.floor(count/5)+1:count/5;
    return pageCount = count;
  });
  var page = req.query.page;
  if(!page){
    page=1;
  }
  PostModel.getPosts(author,page,key)
    .then(function (posts) {
      res.render('posts',{
        posts: posts,
        page: page,
        author: author,
        key: key,
        pageCount: pageCount
      });
    })
    .catch(next)
});

router.post('/create',checkLogin,function(req, res, next){
  const author = req.session.user._id;
  const title = req.fields.title;
  const content = req.fields.content;

  // 校验参数
  try{
    if(!title.length) {
      throw new Error('请填写标题');
    }
    if(!content.length) {
      throw new Error('请填写内容');
    }
  } catch (e){
    req.flash('error',e.message);
    return res.redirect('back');
  }

  var post = {
    author: author,
    title: title,
    content: content
  };

  PostModel.create(post)
    .then(function (result) {
      // 此 post 是插入 mongodb 后的值，包含 _id
      post = result.ops[0];
      req.flash('success','发表成功');
      // 发表成功后跳转到该文章页
      res.redirect('/posts/'+ post._id);
    })
    .catch(next)
});

router.get('/create',checkLogin,function(req, res, next){
  res.render('create');
});

router.get('/:postId',function(req, res, next){
  const postId = req.params.postId;

  Promise.all([
    PostModel.getPostById(postId), // 获取文章信息
    CommentModel.getComments(postId), // 获取文章留言
    PostModel.incPv(postId) // pv 加 1
  ])
    .then(function (result) {
      const post = result[0];
      const comments = result[1];
      if (!post){
        throw new Error('该文章不存在')
      }

      res.render('post',{
        post: post,
        comments: comments
      })
    })
    .catch(next)
});

router.get('/:postId/edit',checkLogin,function(req, res, next){
  const postId = req.params.postId;
  const author = req.session.user._id;

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if(!post) {
        throw new Error('该文章不存在')
      }
      if(author.toString() !== post.author._id.toString()) {
        throw new Error('权限不足')
      }
      res.render('edit',{
        post: post
      })
    })
    .catch(next)
});

router.post('/:postId/edit',function(req, res, next){
  const postId = req.params.postId;
  const author = req.session.user._id;
  const title = req.fields.title;
  const content = req.fields.content;

  // 校验参数
  try {
    if (!title) {
      throw new Error('请填写标题')
    }
    if (!content) {
      throw new Error('请填写内容')
    }
  } catch (e){
    req.flash('error',e.message);
    return res.redirect('back');
  }

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if(!post){
        throw new Error('文章不存在')
      }
      if(author.toString() !== post.author._id.toString()){
        throw new Error('没有权限')
      }
      PostModel.updatePostById(postId,{ title: title, content: content })
        .then(function () {
          req.flash('success','编辑文章成功');
          res.redirect('/posts/'+postId);
        })
        .catch(next)
    })
});

router.get('/:postId/remove',function(req, res, next){
  const postId = req.params.postId;
  const author = req.session.user._id;

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if(!post) {
        throw new Error('该文章不存在')
      }
      if(author.toString() !== post.author._id.toString()) {
        throw new Error('权限不足')
      }
      PostModel.delPostById(postId,author)
        .then(function () {
          req.flash('success','删除文章成功');
          // 删除成功后跳转到主页
          res.redirect('/posts')
        })
        .catch(next)
    })
});

module.exports = router;
