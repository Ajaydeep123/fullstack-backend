import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;

    if(!content || content?.trim()===""){
        throw new ApiError(400, "content is required")
    }
    
    try {
        const tweet =  await Tweet.create({
            content,
            owner: req.user._id
        })
    
        if(!tweet){
            throw new ApiError(500, "something went wrong while creating tweet")
        }
        return res.status(201).json(
            new ApiResponse(200, tweet, "tweet created successfully!!")
        );
    } catch (error) {
        throw new ApiError(400,error?.message||"Failed to create the tweet!")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // Need: avatar, fullName, createdAt, content, _id, Likes count

    const {userId} = req.params;
    let {page=1,limit=10} = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    page = Math.max(1, page);
    limit= Math.max(1, limit);

    
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "userId is required or invalid");
    }

    try {
        const tweets = await Tweet.aggregate([
//ownerInfo            
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(user)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"ownerInfo"    //returns ownerInfo array
                }
            },
            {
                $unwind:"$ownerInfo"  // this will return us individual documents with owner field as an object
            },
//like info, likedBy, like count            
            {
                $lookup:{
                    from:"likes",
                    let:{ tweetId:"$_id"},
                    pipeline:[
                        {
                            $match:{
                                $expr:{
                                    $eq:["$tweet","$$tweetId"]  //this checks whether tweet schema's id is same as like schema's tweet value (_id)
                                }
                            }
                        },
                        {
                            $lookup:{
                                from:"users",
                                localField:"likedBy",
                                foreignField:"_id",
                                as:"likedByUsersInfo",
                            },
                        },
                        {
                            $unwind:"$likedByUsersInfo",
                        },
                        {
                            $project:{
                                _if:1,
                                likedBy:1,
                                userInfo:{
                                    username:"$likedByUsersInfo.username",
                                    avatar:"$likedByUsersInfo.avatar",
                                    fullName:"$likedByUsersInfo.fullName",
                                },
                            },
                        }, 
                    ],
                    as:"likedByUsers"
                },
            },
            {
                $addFields:{
                    likesCount:{
                        $size:"$likedByUsers",
                    },
                    isLiked:{
                        $cond:{
                            if:{
                                $in:[ new mongoose.Types.ObjectId(req.user?._id),"$likedByUsers.likedBy"],
                            },
                            then:true,
                            else:false,
                        },
                    },
                },
            },
            {
                $project:{
                    ownerInfo:{
                        _id:"$ownerInfo._id",
                        username:"$ownerInfo.username",
                        avatar:"$ownerInfo.avatar",
                        fullName:"$ownerInfo.fullName",
                    },
                    _id:1,
                    likesCount:1,
                    isLiked:1,
                    createdAt:1,
                    content:1,
                    likedByUsers:{
                        $map:{
                            input:"$likedByUsers",
                            as:"likedByUser",
                            in:{
                                _id:"$$likedByUser._id",
                                likedBy:"$$likedByUser.likedBy",
                                userInfo:"$$likedByUser.userInfo",
                            }
                        }
                    }

                }
            },
            {
                $skip:(page-1) *limit,
            },
            {
                $limit:limit,
            },
        ]);

        if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No Tweets");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
    } catch (error) {
        throw new ApiError(
        500,
        error?.message || "something went wrong while fetching tweets by userId"
      );
    }


    

    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body
    if (!tweetId || !isValidObjectId(tweetId)) {
      throw new ApiError(400, "TweetId is required or invalid");
    }

    if(!content || content?.trim()==""){
        throw new ApiError(400, "Content is required to make update")
    }

    try {
        const tweet = await Tweet.findById(tweetId);
        if(!tweet){
            throw new ApiError(400,"No such tweet exists!")            
        }
        if(req.user?._id.toString()!== tweet?.owner.toString()){
            throw new ApiError(403," You are not authorized to delete this tweet.")
        }
        
        const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
            $set:{
                content: content
            },
        },
        {
            new:true
        }
        );
        if (!updatedTweet) {
            throw new ApiError(500, "Something went wrong while updating tweet");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, updatedTweet, "Tweet updated Successfully"));

    } catch (error) {
       throw new ApiError(
        500,
        error?.message || "something went wrong while updating tweet..."
      );       
    }


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    if (!tweetId || !isValidObjectId(tweetId)) {
      throw new ApiError(400, "TweetId is required or invalid");
    }
    try {
        const tweet = await Tweet.findById(tweetId);
        if(!tweet){
            throw new ApiError(400,"No such tweet exists!")            
        }
        if(req.user?._id.toString()!== tweet?.owner.toString()){
            throw new ApiError(403," You are not authorized to delete this tweet.")
        }

        const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

        if (!deletedTweet) {
            throw new ApiError(500, "Unable to delete tweet");
        }        

        return res.
        status(200).
        json(new ApiResponse(200,deletedTweet, "Tweet deleted successfully!"))

    } catch (error) {
      throw new ApiError(
        500,
        error?.message || "Something went wrong while deleting tweet"
      );        
    }    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}