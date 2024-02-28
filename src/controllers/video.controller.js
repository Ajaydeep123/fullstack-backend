import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {PlayList} from "../models/playlist.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary, getPublicId} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"This video id is not valid!")
    }

    const video = await Video.findById(videoId)

    if( !video || ( !video?.isPublished &&  !(video?.owner.toString() === req.user?._id.toString()) ) ){
        throw new ApiError(404,"Video not found")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video Fetched Successfully!"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    try {
        if(!videoId || !isValidObjectId(videoId)){
            throw new ApiError(400,"This video id is not valid!")
        }
    
        const video = await Video.findById(videoId)
    
        if(!video){
            throw new ApiError(404, "video not found")
        }
    
        // owner field in the document is objectId of the person who uploaded the video
        // We'll check whether the current user's _id is same as Owner's objectId, if not then they are not authorized to access that video
        if(video?.owner.toString() !== req.user?._id.toString()){
            throw new ApiError(401, "Unauthorized: You are not allowed to delete this video");
        }
    
        //We'll delete the files from cloudinary and then remove the corresponding document from our collections
    
        if(video?.videoFile){
            const videoPublicId = getPublicId(video.videoFile)
            await deleteOnCloudinary(videoPublicId,"video")
        }
    
        if(video?.thumbnail){
            const thumbnailPublicId = getPublicId(video.thumbnail)
            await deleteOnCloudinary(thumbnailPublicId, "image")
        }
    
        //delete video and associated relations from db
        await Promise.all([
            Like.deleteMany({video:videoId}),
            Comment.deleteMany({video:videoId}),
            PlayList.updateMany({},{$pull:{videos:videoId}}),
            User.updateMany({},{$pull:{watchHistory: videoId}})
        ])
    
        const deleteResponse = await Video.findByIdAndDelete(videoId);
    
        if(!deleteResponse){
            throw new ApiError(500, "something went wrong while deleting video !!")
        }
    
        return res.
        status(200)
        .json(
            new ApiResponse(200, deleteResponse, "Video deleted successfully")
        )
    } catch (error) {
        throw new ApiError(400, "Something went wrong while deleting the Video!!")
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        if(!videoId || !isValidObjectId(videoId)){
            throw new ApiError(400,"This video id is not valid!")
        }
    
        const video = await Video.findById({
            _id:videoId
        })
    
        if(!video){
            throw new ApiError(404, "video not found")
        }

        if(video?.owner.toString() !== req.user?._id.toString()){
            throw new ApiError(401, "Unauthorized: You are not allowed to toggle publish status of this video");
        }

        const toggleVideoPublishStatus = await Video.findByIdAndUpdate(videoId,
            {$set:{isPublished: !video.isPublished}}
            ,{new:true} 
        );

        if(!toggleVideoPublishStatus){
            throw new ApiError(500, "Something went wrong while toggeling the status")
        }

        return res.
        status(200)
        .json(
            new ApiResponse(200,toggleVideoPublishStatus, "Video Publish status toggled successfully!")
        )
        } catch (error) {
        throw new ApiError(500, error?.message||"Failed to toggle publish status.")
    }})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}