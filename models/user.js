const { ObjectId } = require('mongodb')
const { extractValidFields } = require('../lib/validation')
const { getDbReference } = require('../lib/mongo')

const UserSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    role: { required: false }
}

exports.UserSchema = UserSchema