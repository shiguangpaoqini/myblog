module.exports = {
  port: 6000,
  session: {
    secret: 'myblog',
    key: 'myblog',
    maxAge: 2592000000
  },
  mongodb: 'mongodb://huoys:453822@localhost:27017/huoys_db'
}
