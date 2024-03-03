import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user?._id;

    if(!videoId || !isValidObjectId(videoId)){
    throw new ApiError(400,"This video id is not valid!")
    }
    
    try {
        const video = await Video.findById(videoId)
        if(!video || ( video.owner.toString() !== req.user?._id.toString() && !video.isPublished) ){
            throw new ApiError(404,"Video Not found")
        }
        const existingLike = await Like.findOne({ likedBy: userId, video: videoId });

        if(existingLike){
            const dislike = await Like.findOneAndDelete({
                video:videoId,
                likedBy:userId
            });

            if(!dislike){
                throw new ApiError(500, "Unable to dislike the video")
            }

            return res.
            status(200)
            .json( new ApiResponse(200,{}, "Video disliked successfully!"))
        }else{
            const addLike = await Like.create({
                likedBy:userId,
                video:videoId
            })
            
            return res
            .status(200)
            .json(new ApiResponse(200,{},"Video Liked successfully"))
        }

        
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while toggling video like");
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment;
    const userId = req.user?._id;

    if(!commentId || !isValidObjectId(commentId)){
    throw new ApiError(400,"This comment id is not valid!")
    }
    
    try {
        const comment = await Comment.findById(commentId)
        if(!comment || ( comment.owner.toString() !== req.user?._id.toString()) ){
            throw new ApiError(404,"comment Not found")
        }
        const existingLike = await Like.findOne({ likedBy: userId, comment: commentId });

        if(existingLike){
            const dislike = await Like.findOneAndDelete({
                comment:commentId,
                likedBy:userId
            });

            if(!dislike){
                throw new ApiError(500, "Unable to dislike the comment")
            }

            return res.
            status(200)
            .json( new ApiResponse(200,{}, "comment disliked successfully!"))
        }else{
            const addLike = await Like.create({
                likedBy:userId,
                comment:commentId
            })
            
            return res
            .status(200)
            .json(new ApiResponse(200,{},"comment Liked successfully"))
        }

        
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while toggling comment like");
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user?._id;

    if(!tweetId || !isValidObjectId(tweetId)){
    throw new ApiError(400,"This tweet id is not valid!")
    }
    
    try {
        const tweet = await Tweet.findById(tweetId)
        if(!tweet || ( tweet.owner.toString() !== req.user?._id.toString()) ){
            throw new ApiError(404,"tweet Not found")
        }
        const existingLike = await Like.findOne({ likedBy: userId, tweet: tweetId });

        if(existingLike){
            const dislike = await Like.findOneAndDelete({
                tweet:tweetId,
                likedBy:userId
            });

            if(!dislike){
                throw new ApiError(500, "Unable to dislike the tweet")
            }

            return res.
            status(200)
            .json( new ApiResponse(200,{}, "tweet disliked successfully!"))
        }else{
            const addLike = await Like.create({
                likedBy:userId,
                tweet:tweetId
            })
            
            return res
            .status(200)
            .json(new ApiResponse(200,{},"tweet Liked successfully"))
        }

        
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while toggling tweet like");
    }
    
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    /* 
    We need:
    title, thumbnail,views, createdAt, duration, id, owner:{avatar, fullname} 
    */
    /*STEPS:
    1. Match docs wheren the likedby field matches the user?._id
    2. Since we want to get all the liked videos details, we'll perform the left join b/w like and video model
    3. Video field in like model stores the object id of video model's id, so we execute another subpipeline to extract the videos
    that are matching the criteria
    4. Now that we have the videos, we see that the video schema's owner field is related to user schema. So we perform another join operation
    using the lookup and project the necessary fields if the video's owner's id matched the user's id.
    5. At this point, we have our document, but they are present as objects inside and array of object -> LikedVideos array
    6. Now, we unwind the LikedVideos array and destructure the LikedVideos to further proceed with our operations
    7. Once we have our documents value, we project the details that we desire.   
    */
   
    try {
            const likedVideos = await Like.aggregate([
                {
                    $match:{
                        likedBy: new mongoose.Types.ObjectId(req.user?._id)
                    }
                },
                {
                    $lookup:{
                        from:"videos",
                        let:{videoId:"$video"},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{$eq: ["$_id", "$$videoId"]},
                                },
                            },
                            {
                                $lookup: {
                                from: "users",
                                let: { owner_id: "$owner" }, // Sub-pipeline to join 'Videos' with 'Users' collection based on the 'owner' field
                                pipeline: [
                                    {
                                    $match: {
                                        $expr: { $eq: ["$_id", "$$owner_id"] }, // Match documents where '_id' equals the 'owner' field value
                                    },
                                    },
                                    {
                                    $project: { avatar: 1, fullName: 1, _id: 0 }, // Project specific fields from the 'Users' collection
                                    },
                                ],
                                as: "owner", // Store the joined user data in the 'owner' array
                                },
                            },
                            {
                                $project: {
                                    _id: 1,
                                    title: 1,
                                    thumbnail: 1,
                                    duration: 1,
                                    createdAt: 1,
                                    views: 1,
                                    owner: { $arrayElemAt: ["$owner", 0] }, // Restructure the 'owner' array to a single object
                                },
                            },
                        ],
                        as:"likedVideos",
                    },
                },
                {
                    $unwind:"$likedVideos",
                },
                {
                    $project: {
                    _id: "$likedVideos._id",
                    title: "$likedVideos.title",
                    thumbnail: "$likedVideos.thumbnail",
                    duration: "$likedVideos.duration",
                    createdAt: "$likedVideos.createdAt",
                    views: "$likedVideos.views",
                    owner: "$likedVideos.owner",             
                        },
                }
            ])

            if (likedVideos.length === 0) {
                    return res
                        .status(204)
                        .json(new ApiResponse(204, [], "No liked videos found"));
                }

            return res.
                status(200).
                json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully!"))

    } catch (error) {
        throw new ApiError(500,  error?.message||"Something went wrong while trying to fetch the Liked Videos")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}