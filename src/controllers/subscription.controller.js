import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user?._id;
    // TODO: toggle subscription
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400, "Channel Id is required");
    }
    const filterOrCredential = {subscriber:userId, channel:channelId }
    try {

        const channel = await User.findById(channelId)
        if(!channel){
            throw new ApiError(400,"This channel does not Exists")
        }            
        const subscribed = await Subscription.findOne(filterOrCredential);

        if(!subscribed){
            const subscribe = await Subscription.create(filterOrCredential);
            if(!subscribe){
                throw new ApiError(500, "failed to subscribe the channel")
            }

            return res.
            status(200).
            json(new ApiResponse(200, subscribe, "Successfully subscribed to this channel!"))
        }else{
            const unsubscribe = await Subscription.findOneAndDelete(filterOrCredential)
            if(!unsubscribe){
                throw new ApiError(500, "failed to unsubscribe the channel")
            }

            return res.
            status(200).
            json(new ApiResponse(200, unsubscribe, "Successfully unsubscribed to this channel!"))
        }
    } catch (error) {
        throw new ApiError(500, error?.message||"Failed to toggle subscription")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
        if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(
            400,
            "This channel id is not valid"
        )
    }


    try {
        const channelSubscribers = await Subscription.aggregate([
            {
                $match:{
                    subscriber: new mongoose.Types.ObjectId(channelId)   
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channelInfo",
                },
            },
            {
                $unwind:"$channelInfo",
            },
            {
                 $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscriberInfo",
                },
            },
            {
                $unwind:"$subscriberInfo",
            },
            {
                $project:{
                    _id:1,
                    channel:1,
                    channelInfo:{
                        channel_id: "$channelInfo._id",
                        channelName: "$channelInfo.username",
                        avatar: "$channelInfo.avatar",             
                        createdAt:"$channelInfo.createdAt",   
                    },
                    subscriberInfo:{
                        subscriber_id:"$subscriberInfo._id",
                        username:"$subscriberInfo.username",
                        avatar:"$subscriberInfo.avatar",
                        fullname:"$subscriberInfo.fullName",
                    },
                },
            },
            {
                $group:{
                    _id:"$channel",
                    subscribers:{
                        $push:"$subscriberInfo"
                    },
                    channelInfo:{
                        $first:"$channelInfo"
                    },
                },
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                },
            },
            {
                $project:{
                    _id:0,
                },
            },
        ]);

        if (!channelSubscribers || channelSubscribers.length === 0) {
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "No Subscribers found"));
        }
        return res.status(200).json(new ApiResponse(200,channelSubscribers,"user channel subscribed successfully"));  

    } catch (error) {
        throw new ApiError(500, error?.message|| "something went wrong while fetching the user channel's subscribers")
    }

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
// We need : Channel's username, subscribers count, avatar
    if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(
            400,
            "This subscriber id is not valid"
        )
    }

    try {
        const channelList = await Subscription.aggregate([
            {
                $match:{
                    subscriber: new mongoose.Types.ObjectId(channelId)   
                },
            },
            {
                 $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscriberInfo",
                },
            },
            {
                $unwind:"$subscriberInfo",
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channelInfo",
                },
            },
            {
                $unwind:"$channelInfo",
            },   
            {
                $project:{
                    _id:1,
                    channel:1,
                    channelInfo:{
                        channel_id: "$channelInfo._id",
                        channelName: "$channelInfo.username",
                        avatar: "$channelInfo.avatar",             
                        createdAt:"$channelInfo.createdAt",   
                    },
                    subscriberInfo:{
                        subscriber_id:"$subscriberInfo._id",
                        username:"$subscriberInfo.username",
                        avatar:"$subscriberInfo.avatar",
                        fullname:"$subscriberInfo.fullName",
                    },
                },
            },      
            {
                $group:{
                    _id:"$subscriber",
                    subscribedChannels:{
                        $push:"$channelInfo",
                    },
                    userInfo:{
                        $first:"$subscriberInfo",
                    },
                },
            },
            {
                $addFields:{
                    sunscribedChannelCount:{
                        $size:"$subscribedChannels",
                    },
                },
            },
            {
                $project:{
                    _id:0,
                },
            },  
        ]);

        if(!channelList || channelList.length === 0){
            return res.
            status(200).
            json(new ApiResponse(200,[], "No subscribed Channels found for the user!!"))
        }

        return res.
        status(200).
        json(new ApiResponse(200, channelList,"All Subscribed Channels fetched Successfully!!"))

    } catch (error) {
        throw new ApiError(500, error?.message|| "something went wrong while fetching the user's subscribed channels.")

    }



})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
