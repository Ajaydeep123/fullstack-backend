import mongoose, {Schema} from "mongoose";
import { Jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    user:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true   //makes it get find easily
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        index:true,
        trim:true,
    },
    avatar:{
        type:String,   //cloudinary url
        required:true,
    },
    coverImage:{
        type:String,   //cloudinary url
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    }
},{
    timestamps:true
});

//in these middlewares/hooks we will not use arrow functions as we need to keep the context of this to the userschema
userSchema.pre("save", async function(next){
    //we'll encrypt the password just before saving it to the db
    //hash it only if it is modified, not on every change to the data

    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName            
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)