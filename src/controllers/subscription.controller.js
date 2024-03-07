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

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
