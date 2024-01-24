const asyncHandler = (requestHandler) =>{
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}

export { asyncHandler }

//Instead of handling Promise logic for every controller function individually and repetetively, we are moving it to this util function.
/* 
const asyncHandler =  (fn) => async(req, res, next) =>{
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
    }
} */