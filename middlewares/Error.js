import { envMode } from "../app.js"

const errorMiddleWare = (err, req, res, next) => {

    err.message ||= "Internal Server Error"
    err.statuscode ||= 500
    if (err.code === 11000) {
        const error = Object.keys(err.keyPattern).join(",")
        err.message = `Duplicate field ${error}`
        err.statuscode = 400
    }
    if (err.name === "CastError") {
        err.message = `Invalid Fromate of${err.path}`
        err.statuscode = 400
    }
    const response = {
        success: false,
        message: err.message,
    };
    if (envMode === "DEVELOPMENT") { response.error = err }
    return res.status(err.statuscode).json({ response })
}
const TryCatch = (passfunc) => async (req, res, next) => {

    try {
        await passfunc(req, res, next)
    } catch (error) {
        next(error)
    }
}


export { errorMiddleWare, TryCatch }


