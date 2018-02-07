const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');
const express = require('express');
const router = express.Router();

const UserModel = require('../models/users');
const checkLogin = require('../middlewares/check').checkLogin;

router.get('/',checkLogin,function(req,res,next){
  const user = req.session.user;
  res.render('userinfo',{
    user: user
  });
});


router.get('/edit',checkLogin,function (req, res, next) {
  const user = req.session.user;
  res.render('infoedit',{
    user: user
  })
});

router.post('/edit',checkLogin,function(req,res,next){
  const gender = req.fields.gender;
  const bio = req.fields.bio;
  const id = req.session.user._id;

  try{
    if (['m','f','x'].indexOf(gender) === -1) {
      throw new Error('性别只能是m,f或x');
    }
    if (!(bio.length >= 1 && bio.length <= 30)) {
      throw new Error('个人简介请限制在1-30个字符');
    }
  } catch(e){
    req.flash('error',e.message);
    return res.redirect('/edit');
  }

  // 用户信息写入数据库
  UserModel.updateById(id,gender,bio)
    .then(function (result){
      //将用户信息存入 session
      console.log(result);
      req.session.user = result.value;
      // 写入 flash
      req.flash('success','更改成功');
      // 跳转到首页
      res.redirect('/posts')
    })
    .catch(function (e) {
      next(e);
    })
});

router.get('/changepassword',checkLogin,function (req, res, next) {
  const user = req.session.user;
  res.render('changepassword',{
    user: user
  });
});

router.post('/changepassword',checkLogin,function (req, res, next) {
  const user = req.session.user;
  const name = user.name;
  const oldpassword = req.fields.oldpassword;
  const newpassword = req.fields.newpassword;
  const repassword = req.fields.repassword;

  UserModel.getUserByName(name)
    .then(function (user) {
      if (sha1(oldpassword) !== user.password) {
        req.flash('error', '用户名或密码错误');
        return res.redirect('back');
      }
      if (newpassword !== repassword) {
        req.flash('error','两次输入密码不一致');
        return res.redirect('back');
      }
      UserModel.updataPassWordByName(name,sha1(newpassword))
        .then(function () {
          req.session.user = null;
          req.flash('success','修改成功');
          return res.redirect('/signin');
        })
    })
    .catch(next)
});

module.exports = router;
