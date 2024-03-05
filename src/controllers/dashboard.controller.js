import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const allLikes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group: {
                _id: null,
                totalVideoLikes: {
                    $sum: {
                        $cond: [
                            { $ifNull: ["$video", false] },
                            1, // not null then add 1
                            0 // else 0
                        ]
                    }
                },
                totalTweetLikes: {
                    $sum: {
                        $cond: [
                            { $ifNull: ["$tweet", false] },
                            1,
                            0
                        ]
                    }
                },
                totalCommentLikes:{
                    $sum: {
                        $cond: [
                            { $ifNull: ["$comment", false] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    const allSubscriptions = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $count: "subscribers"
        }
    ])    
    const allVideo = await Video.aggregate([
        {
            $match: {
                videoOwner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $count: "Videos"
        }
    ])  
    const allViews = await Video.aggregate([
        {
            $match:{
                videoOwner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group: {
                _id: null,
                allVideosViews: {
                    $sum: "$views"
                }
            }
        }
    ])  

    const stats = {
        Subscribers: allSubscriptions[0].subscribers,
        totalVideos: allVideo[0].Videos,
        totalVideoViews: allViews[0].allVideosViews,
        totalVideoLikes: allLikes[0].totalVideoLikes,
        totalTweetLikes: allLikes[0].totalTweetLikes,
        totalCommentLikes: allLikes[0].totalCommentLikes 
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            stats,
            "Channel stats fetched successfully!"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    try {
        const allVideos = await Video.find({
            owner:req.user?._id
        })
        
        if(!allVideos){
            throw new ApiError(500, "Failed to get videos")
        }

        return res.
        status(200).
        json(new ApiResponse(200, allVideos, "All Videos fetched successfully!"))
    } catch (error) {
        throw new ApiError(400, error?.message||"Failed to fetch the videos!")
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }