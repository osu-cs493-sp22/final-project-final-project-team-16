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
    collection.update({_id: new ObjectId(id)}, { $set: course})
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

async function getCourseAssignments(id) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.aggregate([
    { "$addFields": { "stringId": { "$toString": "$_id" }} },
    { $lookup: {
      from: "assignments",
      localField: "stringId",
      foreignField: "courseId",
      as: "assignments"
    }}
    ]).toArray()
    return results[0]
}
exports.getCourseAssignments = getCourseAssignments

async function enrollStudents(id, enrollList) {
    var results = null
    var results2 = null
    const db = getDbReference()
    console.log(enrollList.add)
    console.log(enrollList.remove)
    const collection = db.collection('courses')
    if(enrollList.add && enrollList.add.length) {
        results = await collection.updateOne(
            {_id: new ObjectId(id)},
            {$push: {enrolled: { $each: enrollList.add} }}
        )
    }
    if(enrollList.remove && enrollList.remove.length) {
        results2 = await collection.updateOne(
            {_id: new ObjectId(id)},
            {$pull: {enrolled: { $in: enrollList.remove}}}
        ) 
    }
    if (results && results2) {
        return (results.matchedCount || results2.matchedCount) > 0
    } else if (!results && results2) {
        return (results2.matchedCount) > 0
    } else {
        return (results.matchedCount) > 0
    }
}
exports.enrollStudents = enrollStudents