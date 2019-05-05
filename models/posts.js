const marked = require('marked');
const Post = require('../lib/mongo').Post;
const CommentModel = require('./comments');

// 将 post 的 content 从 markdown 转换成 html
Post.plugin('contentToHtml', {
  afterFind: function (posts) {
    return posts.map(function (post) {
      post.content = marked(post.content);
      return post;
    })
  },
  afterFindOne: function (post) {
    if(post) {
      post.content = marked(post.content);
    }
    return post;
  }
});

Post.plugin('addCommentsCount', {
  afterFind: function (posts) {
    return Promise.all(posts.map(function (post) {
      return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
        post.commentsCount = commentsCount;
        return post
      })
    }))
  },
  afterFindOne: function (post) {
    if(post) {
      return CommentModel.getCommentsCount(post._id).then(function (count) {
        post.commentsCount = count;
        return post
      })
    }
    return post
  }
});

module.exports = {
  // 创建一篇文章
  create: function create (post) {
    return Post.create(post).exec();
  },

  // 通过文章 id 获取一篇文章
  getPostById: function getPostById (postId) {
    return Post
      .findOne({ _id:postId })
      .populate({ path: 'author',model: 'User' })
      .addCreatedAt()
      .addCommentsCount()
      .contentToHtml()
      .exec()
  },
  // (指定字段的)获取所有用户文章数量或者特定用户的所有文章数量
  getPostsCount:function getPostsCount (author, type, key) {
    const query = {};
    if(author){
      query.author = author;
    }
    if(type){
      query.type = type;
    }
    if(key){
      query.title = {$regex:new RegExp(key)};
    }
    return Post.count(query).exec()
  },

  // (指定字段的)按创建时间降序获取指定页用户文章或者特定用户的指定页文章
  getPosts: function getPosts (author, page, type, key, sort) {
    const query = {};
    var start = 0;
    var Sort = sort==='pv'?{pv:-1}:{_id:-1};
    if(author){
      query.author = author;
    }
    if(type){
      query.type = type;
    }
    if(key){
      query.title = {$regex:new RegExp(key)};
    }
    if(page) {
      start = (page - 1) * 5;
    }
    return Post
      .find(query)
      .populate({ path: 'author',model: 'User' })
      .sort(Sort)
      .skip(start)
      // .limit(5)
      .addCreatedAt()
      .addCommentsCount()
      .contentToHtml()
      .exec()
  },

  // 通过文章 id 给 pv 加 1
  incPv: function incPv (postId) {
    return Post
      .update({ _id: postId }, { $inc: { pv:1 } })
      .exec()
  },

  // 通过文章 id 获取一篇原生文章（编辑文章）
  getRawPostById: function getRawPostById (postId) {
    return Post
      .findOne({_id: postId})
      .populate({path: 'author', model: 'User' })
      .exec()
  },

  // 通过文章 id 更新一篇文章
  updatePostById: function updatePostById (postId, data) {
    return Post.update({ _id: postId }, { $set: data }).exec()
  },

  // 通过文章 id 删除一篇文章
  delPostById: function delPostById (postId, author) {
    const query = {}
    if(postId){
      query._id = postId
    }
    if(author){
      query.author = author
    }
    return Post.deleteOne(query)
      .exec()
      .then(function (res) {
        //文章删除后，再删除文章下留言
        if (res.result.ok && res.result.n > 0) {
          return CommentModel.delCommentsByPostId(postId)
        }
      })
  },

  delPostsByUserId: function delPostsByUserId(userId) {
    Post.deleteMany({author: userId})
    .exec()
    .then(function (res){
      if (res.result.ok && res.result.n > 0) {
        return CommentModel.delCommentsByUserId(userId)
      }
    })
  }
};
