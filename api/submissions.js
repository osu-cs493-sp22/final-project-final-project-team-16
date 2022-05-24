
const { ObjectId } = require('mongodb')
const { getDbInstance } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const SubmissionsSchema = {
    courseId: {required: true},
    title: {required: true},
    name: {required: true},
    due: {required: true},
}