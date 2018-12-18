var express = require('express')
var router = express.Router()
var controller = require('./controller')
/* GET users listing. */
router.get('/', controller.getUsers)
router.get('/:id(\\d+)/', controller.getBy)
router.post('/:id(\\d+)/', controller.postUsers)
module.exports = router
