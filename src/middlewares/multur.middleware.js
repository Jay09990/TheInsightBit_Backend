import multer from 'multer';
const { uploads } = multer;
import express from "express"

const app = express()

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "./public/temp")
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname)
//     }
// })

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
})