const {ObjectId} = require ('mongodb')

const { getDbInstance } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const courseSchema = {
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorId: { required: true }
}