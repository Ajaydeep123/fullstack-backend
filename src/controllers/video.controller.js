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
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Validate and adjust page and limit values
    page = Math.max(1, page); // Ensure page is at least 1
    limit = Math.min(20, Math.max(1, limit)); // Ensure limit is between 1 and 20

    const pipeline = [];
    
    // Match videos by owner userId if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "userId is invalid");
        }

        pipeline.push({
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Match videos based on search query
    if (query) {
        pipeline.push({
            $match: {
                $text: {
                    $search: query
                }
            }
        });
    }

    // Sort pipeline stage based on sortBy and sortType
    const sortCriteria = {};
    if (sortBy && sortType) {
        sortCriteria[sortBy] = sortType === "asc" ? 1 : -1;
        pipeline.push({
            $sort: sortCriteria
        });
    } else {
        // Default sorting by createdAt if sortBy and sortType are not provided
        sortCriteria["createdAt"] = -1;
        pipeline.push({
            $sort: sortCriteria
        });
    }

    // Apply pagination using skip and limit
    pipeline.push({
        $skip: (page - 1) * limit
    });
    pipeline.push({
        $limit: limit
    });

    // Execute aggregation pipeline
    const Videos = await Video.aggregate(pipeline);

    if (!Videos || Videos.length === 0) {
        throw new ApiError(404, "Videos not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, Videos, "Videos fetched Successfully"));
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    try {
        if(!(title && title.trim() !== "") || !(description && description.trim() !== "")) {
                throw new ApiError(400, "Thumbnail, title, and description are required for update");
        }    
        const videolocalpath = req.files?.videoFile[0]?.path;
        const thumbnaillocalpath = req.files?.thumbnail[0]?.path;
    
        if(!videolocalpath){
            throw new ApiError(404,"Video is required!!!")
        }
        if(!thumbnaillocalpath){
            throw new ApiError(404,"Thumbnail is required!!!")
        }
    
        const video = await uploadOnCloudinary(videolocalpath);
        const thumbnail = await uploadOnCloudinary(thumbnaillocalpath);
    
        if(!video?.url){
            throw new ApiError(500,"Something went wrong while uploading the video")
        }
        if(!thumbnail?.url){
            throw new ApiError(500,"Something went wrong while uplaoding the thumbnail")
        }
        
        const publishedVideo =  await Video.create({
            videoFile:video?.url,
            thumbnail:thumbnail?.url,
            title,
            description,
            duration:video?.duration,
            isPublished:true,
            owner:req.user?._id 
        })
        
        return res
        .status(200)
        .json(new ApiResponse(200,publishedVideo,"Video Published Successfully"))
    } catch (error) {
        throw new ApiError(400,error?.message || "Failed to publish the video!")
    }
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
    const {title,description} = req.body;
    const thumbnailfileLocalPath = req.file?.path
    //TODO: update video details like title, description, thumbnail
    try {
        if(!videoId || !isValidObjectId(videoId)){
            throw new ApiError(400,"This video id is not valid!")
        }

        if (!thumbnailfileLocalPath || !(title && title.trim() !== "") || !(description && description.trim() !== "")) {
            throw new ApiError(400, "Thumbnail, title, and description are required for update");
        }

        const video = await Video.findById(videoId)
    
        if(!video){
            throw new ApiError(404, "video not found")
        }

        if(video?.owner.toString() !== req.user?._id.toString()){
            throw new ApiError(401, "Unauthorized: You are not allowed to perform this operation!");
        }
        
        if(video?.thumbnail){
            throw new ApiError(404, "Bad request")
        }

        const thumbnailPublicId = getPublicId(video.thumbnail)
        await deleteOnCloudinary(thumbnailPublicId, "image")

        let newThumbnail = await uploadOnCloudinary(thumbnailfileLocalPath)

        if(!newThumbnail?.url){
            throw new ApiError(500, "Something went wrong")
        }

        const updatedVideoDetails = await Video.findByIdAndUpdate(videoId,{
            $set:{
                title:title,
                description:description,
                thumbnail:newThumbnail?.url
            }
        },{
            new:true
        })

        if(!updatedVideoDetails){
            throw new ApiError(500, "Something went wrong while updating the video details")
        }

        return res.
        status(200)
        .json(new ApiResponse(200, updatedVideoDetails, "Video Updated Successfully"))
    } catch (error) {
        throw new ApiError (400, error?.message|| "Couldn't update the video details.")
    }
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
    
        const video = await Video.findById(videoId)
    
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