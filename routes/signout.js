const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/check').checkLogin;

router.get('/',checkLogin,function(req,res,next){
  // 清空 session 中的用户信息
  req.session.user = null;
  req.flash('success','登出成功');
  // 登出后跳转到主页
  res.redirect('/posts');
});

module.exports = router;
