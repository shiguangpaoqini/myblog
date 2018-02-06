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
  const name = req.fields.name;
  const gender = req.fields.gender;
  const bio = req.fields.bio;
  const id = req.session.user._id;

  try{
    if (!(name.length >= 1 && name.length <= 10)) {
      throw new Error('名字请限制在 1-10 个字符');
    }
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

  // 待写入数据库的用户信息
  var user = {
    name: name,
    gender: gender,
    bio: bio
  };

  // 用户信息写入数据库
  UserModel.updateById(id,name,gender,bio)
    .then(function (result){
      // 写入 flash
      req.flash('success','更改成功');
      // 跳转到首页
      res.redirect('/posts')
    })
    .catch(function (e) {
      // 用户名被占用则跳回注册页
      if(e.message.match('duplicate key')){
        req.flash('error','用户名已被占用');
        return res.redirect('/edit')
      }
      next(e);
    })
});

module.exports = router;