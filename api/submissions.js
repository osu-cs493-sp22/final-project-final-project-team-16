const fs = require('fs/promises')
const crypto = require('crypto')
const multer = require('multer')
const router = require('express').Router()
exports.router = router;

const { validateAgainstSchema } = require('../lib/validation')
const {
    SubmissionsSchema,
    getSubmissionById,
    saveFileInfo,
    saveSubmissionFile,
    getImageDownloadStream
  } = require('../models/submission')


const fileTypes = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png'
  }
  
  const upload = multer({
    storage: multer.diskStorage({
      destination: `${__dirname}/uploads`,
      filename: function(req,file,callback){
        const ext = fileTypes[file.mimetype]
        const filename = crypto.pseudoRandomBytes(16).toString('hex')
        callback(null,`${filename}.${ext}`)
      }
    }),
    fileFilter: function(req,file,callback){
      callback(null,!!fileTypes[file.mimetype])
    }
  })
  
  /*
   * POST /photos - Route to create a new photo.
   */
  router.post('/', upload.single('file'), async function(req,res,next){
    console.log("==req.file:", req.file)
    console.log("==req.body:", req.body)
    if(req.file && validateAgainstSchema(req.body, SubmissionsSchema)){
      try{
        const submission = {
          assignmentId: req.body.assignmentId,
          studentId: req.body.studentId,
          timestamp: req.body.timestamp,
          grade: req.body.grade,
          path: req.file.path,
          filename: req.file.filename,
          mimetype: req.file.mimetype
        }
        //const id = await saveFileInfo(photo)
        const id = await saveSubmissionFile(submission)
        await fs.unlink(req.file.path)
  
        res.status(200).send({id: id})
      }catch(err){
        next(err)
      }
    }else{
      res.status(400).send({
        err: 'Request body needs an "image" and a "assignmentId"'
      })
    }
  })

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
    try {
      const submission = await getSubmissionById(req.params.id)
      if (submission) {
        const resBody = {
          _id: submission._id,
          url: `/media/photos/${submission.filename}`,
          mimetype: submission.metadata.mimetype,
          assignmentId: submission.metadata.assignmentId,
          studentId: submission.metadata.studentId,
          timestamp: submission.metadata.timestamp,
          grade: submission.metadata.grade,
        }
        //photo.url = `/media/photos/${photo.filename}`
        res.status(200).send(resBody)
      } else {
        next()
      }
    } catch (err) {
      console.error(err)
      res.status(500).send({
        error: "Unable to fetch photo.  Please try again later."
      })
    }
  })

  router.get('/media/photos/:filename', function(req,res,next){
    getImageDownloadStream(req.params.filename)
      .on('file', function(file){
        res.status(200).type(file.metadata.mimetype)
      })
      .on('error', function(err){
        if(err.code === 'ENOENT'){
          next()
        }else{
          next(err)
        }
      })
      .pipe(res)
  })