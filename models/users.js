const User = require('../lib/mongo').User;

module.exports = {
  // 注册一个用户
  create: function create (user) {
    return User.create(user).exec();
  },

  // 通过用户名获取用户信息
  getUserByName: function getUserByName (name) {
    return User
      .findOne({ name:name })
      .addCreatedAt()
      .exec()
  },

  // 通过用户 id 更新用户信息
  updateById: function updateById (id,gender,bio) {
    return User
      .findOneAndUpdate({ _id: id },{$set:{bio:bio,gender:gender}})
      .exec()
  },

  // 通过 name 更新用户密码
  updataPassWordByName: function updataPassWordByName (name,newpassword) {
    return User
      .findOneAndUpdate({ name: name },{$set:{password:newpassword}})
      .exec()
  }
};
