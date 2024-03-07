import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const isUserAuthorized = async (playlistId, userId) =>{
    try {
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
        throw new ApiError(404, "playlist does not exist");
        }

        if (playlist.owner.toString() !== userId.toString()) {
        return false;
        }

        return true;
  } catch (error) {
         throw new ApiError(500, error?.message || "Playlist Not Found");
  }
}

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name){
      throw new ApiError(400, "Playlist name is required");        
    }

    let playlistDescription = description||"Add description for the playlist...."
    try {
        const playlist = await Playlist.create({
            name,
            description:playlistDescription,
            owner:req.user?._id,
            videos:[],
        });

        if(!playlist){
            throw new ApiError(500,"Something went wrong while creating the playlist!");
        }

        return res.
        status(200). 
        json(new ApiResponse(200, playlist, "Playlist created successfully!"));
        
    } catch (error) {
        throw new ApiError(500, error?.message || "Unable to create playlist");           
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}