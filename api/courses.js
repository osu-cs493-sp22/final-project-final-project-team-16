const fastcsv = require('fast-csv')
const fs = require('fs')
const router = require('express').Router()
exports.router = router;

const { validateAgainstSchema } = require('../lib/validation')
const { courseSchema, addRemoveRosterSchema, getCoursesPage, insertNewCourse, getCourseById, updateCourse, deleteCourse} = require('../models/course')
const { requireAuthentication } = require('../lib/auth')

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
router.post('/', async function (req, res, next) {
    //
    //Validate if user is an admin here
    //
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

router.patch('/:courseId', async function (req, res, next) {
    //
    // Validate user here
    //
    try {
        const updateSuccessful = await updateCourse(req.params.courseId, req.body);
        if (updateSuccessful) {
            res.status(200).json({
                links: {
                    course: `/courses/${req.params.courseId}`
                }
            })
        } else {
            next()
        }
    } catch(err) {
        next()
    }
})

router.delete('/:courseId', async function (req, res, next) {
    //
    // validate user here
    //
    const deleteSucess = await deleteCourse(req.params.courseId)
    if (deleteSucess) {
        res.status(204).end()
    } else {
        next()
    }
})

const data = [
    {
        studentId: "1234",
        name: "John"
    },
    {
        studentId: "5678",
        name: "Sally"
    }
]

router.get('/:courseId/roster', requireAuthentication, async function(req, res, next){
    try{
        const course = await getCourseById(req.params.courseId)
        if (course) {
            if(req.admin == "instructor" || req.admin == "admin" && req.user == course.instructorId){
                var ws = fs.createWriteStream('./out.csv')
                fastcsv
                    .write(course.roster, { headers: true })
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