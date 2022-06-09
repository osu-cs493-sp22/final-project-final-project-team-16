const fastcsv = require('fast-csv')
const fs = require('fs')
const router = require('express').Router()
exports.router = router;

const { requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation')
const { courseSchema, enrollSchema, getCoursesPage, insertNewCourse, getCourseById, updateCourse, 
        deleteCourse, getCourseAssignments, enrollStudents, getStudentsFromCourse} = require('../models/course')

//Get a list of all courses, 10 courses listed per page
router.get('/', async (req, res) => {
    try {
        const coursesPage = await getCoursesPage(parseInt(req.query.page) || 1)
        coursesPage.links = {}
        if (coursesPage.page < coursesPage.totalPages) {
            coursesPage.links.nextPage = `/courses?page=${coursesPage.page + 1}`
            coursesPage.links.lastPage = `/courses?page=${coursesPage.totalPages}`
        }
        if (coursesPage.page > 1) {
            coursesPage.links.prevPage = `/courses?page=${coursesPage.page - 1}`
            coursesPage.links.firstPage = '/courses?page=1'
        }
        res.status(200).send(coursesPage)
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Error fetching courses. Please try again later."
        })
    }
})

//Add a new course to the database
router.post('/', requireAuthentication, async function (req, res, next) {
    if(!req.admin) {
        res.status(403).send({
            error: "Unathorized to access the specified resource"
        })
    }
    if(validateAgainstSchema(req.body, courseSchema)) {
        const id = await insertNewCourse(req.body)
        res.status(201).json({
            id: id,
            links: {
                course: `/courses/${id}`
            }
        })
    } else {
        res.status(400).json({
            error: "Request body is not a course object"
        })
    }
})

//Get information about a course from its Id
router.get('/:courseId', async function (req, res, next) {
    const course = await getCourseById(req.params.courseId)
    if (course) {
        res.status(200).json(course);
    } else {
        next();
    }
})

//Update course info
router.patch('/:courseId', requireAuthentication, async function (req, res, next) {
    try{
        const courseid = req.params.courseId
        const updatecourse = req.body
        const course = await getCourseById(req.params.courseId)
        if(!(req.admin == "admin") && !(req.admin == "instructor" && req.user == course.instructorId)) {
            res.status(403).send({
                error: "Unathorized to access the specified resource"
            })
        }
        await updateCourse(courseid, updatecourse)
        res.status(200).json({
            links: {
                assignment: `/courses/${courseid}`
            }
        });
    }catch(err){
        next()
    }
})

//Delete a course from the database
router.delete('/:courseId', requireAuthentication, async function (req, res, next) {
    if(!(req.admin == "admin")) {
        res.status(403).send({
            error: "Unathorized to access the specified resource"
        })
        return
    }
    const deleteSucess = await deleteCourse(req.params.courseId)
    if (deleteSucess) {
        res.status(204).end()
    } else {
        next()
    }
})

//Return all students enrolled in the course
router.get('/:courseId/students', requireAuthentication, async function (req, res, next) {
    const id = req.params.courseId
    const course = await getStudentsFromCourse(id)
    if(!(req.admin == "admin") && !(req.admin == "instructor" && req.user == course.instructorId)) {
        res.status(403).send({
            error: "Unathorized to access the specified resource"
        })
    }
    if(course) {
        res.status(200).send(course.students)
    } else {
        next()
    }
})

//Enroll or remove students from the course
router.post ('/:courseId/students', requireAuthentication, async function (req, res, next) {
  //  if(validateAgainstSchema(req.body, enrollSchema)) {
        const id = req.params.courseId
        const enrollList = req.body
        const course = await getCourseById(req.params.courseId)
        const addedStudents = await enrollStudents(id, req.body)
        if(!(req.admin == "admin") && !(req.admin == "instructor" && req.user == course.instructorId)) {
            res.status(403).send({
                error: "Unathorized to access the specified resource"
            })
        }
        if(addedStudents) {
            res.status(200).end()
        } else {
            next()
        }
 /*   } else {
        res.status(400).json({
            error: "Request body is not correct to enroll students"
        })      
    } */
})

//Return a csv containing students enrolled in a course
router.get('/:courseId/roster', requireAuthentication, async function(req, res, next){
    try{
        const id = req.params.courseId
        const course = await getStudentsFromCourse(id)
        if (course) {
            if(req.admin == "admin" || (req.admin == "instructor" && req.user == course.instructorId)){
                var ws = fs.createWriteStream('./out.csv')
                fastcsv
                    .write(course.students, { headers: true })
                    .pipe(ws)
                var rs = fs.createReadStream('./out.csv')
                rs.pipe(res)
            }else{
                req.status(403).end()
            }
        } else {
            next();
        }
    }catch(err){
        next()
    }
})

//Return all assignments for a specific course
router.get('/:courseId/assignments', async function (req, res, next) {
        const id = req.params.courseId
        const assignments = await getCourseAssignments(id)
        if(assignments) {
            res.status(200).json(assignments.assignments);
        } else {
            next()
        }
})