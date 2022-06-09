const router =  require('express').Router()
exports.router = router

const { ObjectId } = require('mongodb')
const { UserSchema,insertNewUser } = require('../models/user')
const { generateAuthToken, requireAuthentication } = require('../lib/auth')

const { extractValidFields, validateAgainstSchema} = require('../lib/validation')
const { getDbReference } = require('../lib/mongo')

const bcrypt = require('bcryptjs');



router.post('/', async function (req, res, next) {
    if (validateAgainstSchema(req.body, UserSchema)) {
        //console.log("body===", req.body);
        try{
            var user = extractValidFields(req.body, UserSchema);
            const db = getDbReference()
            const email = req.body.email
            const collection = db.collection('users')
            const check_first = await collection
            .find({})
            .toArray()
            //console.log("check_first===", check_first)
            const results = await collection
            .find({ email: email })
            .toArray()
            if (check_first.length == 0){
                user.role = "admin"
            } 
            if (results[0] || (user.role == "admin" && check_first.length != 0)){
                res.status(400).json({
                    error: "user creat fail"
                });
            }
            else{
                user.password = await bcrypt.hash(user.password, 8);
                const id = await insertNewUser(user)
                //console.log("user===", user)
                res.status(201).json({
                    id: id, 
                });
            }
        }catch(err){
            console.log("===error", err);
            next()
        }
    } else {
        res.status(400).json({
            error: "user creat fail"
        });
    }
  })
  
  router.post('/admin',requireAuthentication, async function (req, res, next) {
    if (validateAgainstSchema(req.body, UserSchema)) {
        //console.log("body===", req.body);
        try{
            var user = extractValidFields(req.body, UserSchema);
            const db = getDbReference()
            const email = req.body.email
            const collection = db.collection('users')
            const results = await collection
            .find({ email: email })
            .toArray()
            if (results[0] || req.admin !== "admin"){
                res.status(400).json({
                    error: "user creat fail"
                });
            }
            else{
                user.password = await bcrypt.hash(user.password, 8);
                const id = await insertNewUser(user)
               // console.log("user===", user)
                res.status(201).json({
                    id: id, 
                });
            }
        }catch(err){
            console.log("===error", err);
            next()
        }
    } else {
        res.status(400).json({
            error: "user creat fail"
        });
    }
  })

  router.post('/login', async function (req, res, next) {
    if (req.body && req.body.email && req.body.password) {
        const db = getDbReference()
        const collection = db.collection('users')
        const email = req.body.email
        var user = null
        const results = await collection
        .find({ email: email })
        .toArray()
        user = results[0]
        if (user) {
            const authenticated = user && await bcrypt.compare(
                req.body.password,
                user.password
            )
            if (authenticated) {
                //console.log("role===", user.role)
                const token = generateAuthToken(user._id, user.role)
                res.status(200).send({token : token})
            } else {
                res.status(401).send({
                error: "Invalid credentials"
            })
        }
        } else {
            res.status(400).send({
                error: "Request needs correct user ID and password."
            })
        }
    } else {
        res.status(400).send({
            error: "Request needs correct user ID and password."
        })
    }
  })

  
  router.get('/:userId',requireAuthentication, async function (req, res, next) {
    const db = getDbReference()
    const collection = db.collection('users')
    const course_collection = db.collection('courses')
    var id_target = req.params.userId
    var id = req.user
    var user_target = null

    //console.log("id_target===", req.params.userId)
    //console.log("id===", req)
    //console.log("role===", req.admin)

    if (!ObjectId.isValid(id_target)) {
        user_target = null
    } else {
        const result = await collection
        .find({ _id: new ObjectId(id_target) })
        .toArray()
        user_target = result[0]
    }
    if (user_target) {
        if (req.admin === "student") {
            if (id !== id_target) {
                res.status(403).send({
                err: "Unauthorized to access the specified resource"
                })
            }else {
                res.status(200).json({
                    user_target
                })
            }
        }
        else if (req.admin === "instructor") {
            if (id !== id_target) {
                res.status(403).send({
                err: "Unauthorized to access the specified resource"
                })
            }else {
                const CourseResult = await course_collection
                .find({ 
                    instructorId: id
                })
                .toArray()
                res.status(200).json({
                    user : user_target,
                    CourseList : CourseResult
                })
            }
        }
        else {
            res.status(200).json({
                user_target
            })
        }
    } else {
        res.status(400).json({
            error: "Unauthorized to access the specified resource"
        })
    }
  })
  