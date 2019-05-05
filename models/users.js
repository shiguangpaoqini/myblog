const User = require('../lib/mongo').User;
const PostsModel = require('./posts');

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
  updateById: function updateById (id,info) {
    return User
      .updateOne({ _id: id },{$set:info})
      .exec()
  },

  // 通过 name 更新用户密码
  updataPassWordByName: function updataPassWordByName (name,newpassword) {
    return User
      .findOneAndUpdate({ name: name },{$set:{password:newpassword}})
      .exec()
  },

  // 查看所有用户
  getUsers: function getUsers () {
    return User
      .find()
      .addCreatedAt()
      .exec()
  },

    // 删除用户
  removeUserById: function removeUserById (userId) {
    return User
      .deleteOne({_id: userId})
      .exec()
      .then(function (res) {
        if (res.result.ok && res.result.n > 0) {
          return PostsModel.delPostsByUserId(userId)
        }
      })
  },
};
