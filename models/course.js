const {ObjectId} = require ('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const courseSchema = {
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorId: { required: true }
}
exports.courseSchema = courseSchema

//Returns a page of courses
async function getCoursesPage(page) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const count = await collection.countDocuments()

    const pageSize = 10
    const lastPage = Math.ceil(count / pageSize)
    page = page > lastPage ? lastPage : page
    page = page < 1 ? 1 : page
    const offset = (page - 1) * pageSize

    const results = await collection.find({})
        .sort({_id: 1})
        .skip(offset)
        .limit(pageSize)
        .toArray()
    return {
        courses: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    }
}
exports.getCoursesPage = getCoursesPage

async function insertNewCourse(course) {
    const db = getDbReference()
    const collection = db.collection('courses')
    course = extractValidFields(course, courseSchema)
    const result = await collection.insertOne(course)
    return result.insertedId 
}
exports.insertNewCourse = insertNewCourse

async function getCourseById(id) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.find(
        { _id: new ObjectId(id)}
    ).toArray()
    return results[0]
}
exports.getCourseById = getCourseById

async function updateCourse(id, course) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.updateOne({_id: new ObjectId(id)}, { $set: course})
    console.log(results.updatedCount)
}
exports.updateCourse = updateCourse

async function deleteCourse(id) {
    const db = getDbReference()
    const collection = db.collection('courses')
    console.log(new ObjectId(id))
    const result = await collection.deleteOne ({
        _id: new ObjectId(id)
    })
    return result.deletedCount > 0
}
exports.deleteCourse = deleteCourse