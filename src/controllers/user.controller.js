import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"



const registerUser = asyncHandler(async (req,res)=>{

      /* Steps:
        1. Get user details from client, ones that we defined in the model.
        2. Validation
        3. Check if use already existes or not usin email and username
        4. Check for images, check for avatar
        5. Upload the images to cloudinary
        6. Create user object and create entry in the db
        7. Remove the password and refresh token field from repsonse
        8. Check for user creation
        9. Return response     
    */

//1. 

    const {fullName, username, email, password} = req.body
//2.
    if([fullName, username, email, password].some((field)=>field?.trim()==="")){
        throw new ApiError(400, "All fields are required!")
    }
//3.        
    const existingUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existingUser){
        throw new ApiError(409, "User with this email or username already exists")
    }

       
//4.    
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

//5.

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

//6.
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()        
    })

//7.

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

//8.
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    
//9.    
    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully!")
    )
})

export {registerUser}