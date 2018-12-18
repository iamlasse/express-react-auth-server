var mongoose = require('mongoose')
var Account = require('./modules/users/model')
mongoose
  .connect('mongodb://localhost/passport_local_mongoose_express4')
  .then(() => {
    // Seed database
    seed()
    // user.save().then(() => {
    //   console.log('User saved: ', user.username)
    // })
  })

const seed = async () => {
  const user = new Account({ username: 'test', email: 'test@test.com' })
  user.hashPassword('password')
  await user.save()
  const { userSaved } = await Account.authenticate()('test', 'password')
  console.log(userSaved)
}
