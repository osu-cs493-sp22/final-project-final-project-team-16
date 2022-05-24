const router = module.exports = require('express').Router();

router.use('/assignments', require('./assignments').router);
