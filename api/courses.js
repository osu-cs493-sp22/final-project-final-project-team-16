const router = require('express').Router()
exports.router = router;

const { requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation')
const { courseSchema, getCoursesPage, insertNewCourse, getCourseById, updateCourse, deleteCourse, getCourseAssignments, enrollStudents} = require('../models/course')

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
  /*  if(!req.admin) {
        res.status(403).send({
            error: "Unathorized to access the specified resource"
        })
    } */
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

router.get('/:courseId', async function (req, res, next) {
    const course = await getCourseById(req.params.courseId)
    if (course) {
        res.status(200).json(course);
    } else {
        next();
    }
})

router.patch('/:courseId', requireAuthentication, async function (req, res, next) {
  /*  if(!req.admin) {
        res.status(403).send({
            error: "Unathorized to access the specified resource"
        })
    } */
    try{
        const courseid = req.params.courseId
        const updatecourse = req.body
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

router.delete('/:courseId', async function (req, res, next) {
    if(!req.admin) {
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

//router.get
router.post ('/:courseId/students', async function (req, res, next) {
    const id = req.params.courseId
    const enrollList = req.body
    const addedStudents = await enrollStudents(id, req.body)
    if(addedStudents) {
        res.status(200).send(addedStudents)
    } else {
        next()
    }
})
//router.get

router.get('/:courseId/assignments', async function (req, res, next) {
        const id = req.params.courseId
        const assignments = await getCourseAssignments(id)
        if(assignments) {
            res.status(200).json(assignments.assignments);
        } else {
            next()
        }
})