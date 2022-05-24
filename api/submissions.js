
const { ObjectId } = require('mongodb')
const { getDbInstance } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const SubmissionsSchema = {
    assugnmentId: {required: true},
    studentId: {required: true},
    timestamp: {required: true},
    grade: {required: true},
    submission: {required: true}
}

exports.SubmissionsSchema = SubmissionsSchema