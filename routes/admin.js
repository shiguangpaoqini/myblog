const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/check').checkLogin;
const UserModel = require('../models/users');
const PostModel = require('../models/posts');
const CommentModel = require('../models/comments');
const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');
const adminList = require('../config/adminList')

router.get('/',function (req, res, next) {
  return res.redirect('/admin/login');
});

router.get('/login',function (req, res, next) {
  return res.render('adminLogin')
});

router.post('/login',function (req, res, next) {
  const name = req.fields.name;
  const password = req.fields.password;

  // 校验参数
  try{
    if(!name.length) {
      throw new Error('请填写用户名')
    }
    if(!password.length) {
      throw new Error('请填写密码')
    }
  } catch(e) {
    req.flash('error',e.message);
    return res.redirect('back');
  }

  UserModel.getUserByName(name)
    .then(function (user) {
      if(!user){
        req.flash('error','用户不存在');
        return res.redirect('back');
      }
      if(adminList.indexOf(user.name) == -1){
        req.flash('error','用户非管理员');
        return res.redirect('back');
      }
      // 检查密码是否匹配
      if(sha1(password) !== user.password){
        req.flash('error','用户名或密码错误');
        return res.redirect('back');
      }
      req.flash('success','登录成功');
      // 用户信息写入session
      delete user.password;
      user.isAdmin = true;
      req.session.user = user;
      // 跳转到主页
      res.redirect('/admin/userList');
    })
    .catch(next)
});

router.get('/userList', checkLogin, function (req, res, next) {
  const isAdmin = req.session.user.isAdmin;
  if(!isAdmin){
    req.flash('error','用户非管理员');
    return res.redirect('/posts');
  }
  UserModel.getUsers()
  .then(function (users) {
    res.render('userList',{
      users: users
    });
  })
  .catch(next)
});

router.get('/user/remove', checkLogin, function (req, res, next) {
  const userId = req.query.userId;
  const isAdmin = req.session.user.isAdmin;
  if(!isAdmin){
    req.flash('error','用户非管理员');
    return res.redirect('/posts');
  }
  UserModel.removeUserById(userId)
  .then(function () {
    req.flash('success','删除用户成功');
    res.redirect('/admin/userList')
  })
  .catch(next)
});

router.get('/postsList', checkLogin, function (req, res, next) {
  const isAdmin = req.session.user.isAdmin;
  if(!isAdmin){
    req.flash('error','用户非管理员');
    return res.redirect('/posts');
  }
  PostModel.getPosts()
  .then(function (posts) {
    console.log(posts)
    res.render('postsList',{
      posts: posts
    });
  })
  .catch(next)
});

router.get('/post/remove', checkLogin, function (req, res, next) {
  const postId = req.query.postId;
  const isAdmin = req.session.user.isAdmin;
  if(!isAdmin){
    req.flash('error','用户非管理员');
    return res.redirect('/posts');
  }
  PostModel.delPostById(postId)
  .then(function () {
    req.flash('success','删除文章成功');
    res.redirect('/admin/postsList')
  })
  .catch(next)
});

router.get('/commentslist', checkLogin, function (req, res, next) {
  const isAdmin = req.session.user.isAdmin;
  if(!isAdmin){
    req.flash('error','用户非管理员');
    return res.redirect('/posts');
  }
  CommentModel.getAllComments()
  .then(function (comments) {
    res.render('commentsList',{
      comments: comments
    });
  })
  .catch(next)
});

router.get('/comment/remove', checkLogin, function (req, res, next) {
  const commentId = req.query.commentId;
  const isAdmin = req.session.user.isAdmin;
  if(!isAdmin){
    req.flash('error','用户非管理员');
    return res.redirect('/posts');
  }
  CommentModel.delCommentById(commentId)
  .then(function () {
    req.flash('success','删除评论成功');
    res.redirect('/admin/commentsList')
  })
  .catch(next)
});

module.exports = router;
