const router = module.exports = require('express').Router();

router.use('/assignments', require('./assignments').router);
router.use('/submissions', require('./submissions').router);