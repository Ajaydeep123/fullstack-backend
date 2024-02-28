 //Approach for file uploading, We'll use multer to get client to upload the file and store it temporarily in public/temp, 
//once the file is uploaded to cloudinary we'll delete it using fs.unlinkSync()


import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
 
const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null;
        //uplaoding on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        }) 
        //file uploaded 
        console.log("file uploaded on cloudinary: ", response.url);

        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

// A cloudinary assest url looks like this: https://res.cloudinary.com/<cloud_name>/<resource_type>/<delivery_type>[/<transformations>]/<version>/<public_id>
//So to perform updates and delete files on cloudinary we'll have to extract the public_id from the url itself

const getPublicId = (assetUrl) =>{
    const parts = assetUrl.split("/")
    const assetPart = parts[parts.length-1] 
    const publicId = assetPart.split(".")[0] //splitting and selecting only the public id not the extension
    return publicId
}

const deleteOnCloudinary = async (public_id, resource_type)=>{
    try {
        if(!public_id) return null
    
        const response = await cloudinary.uploader.destroy(public_id,{
            resource_type
        })
        console.log("file deleted successfully :", response.result)
        return response
    } catch (error) {
        console.log(error)
        return null
    }
}

export { uploadOnCloudinary,deleteOnCloudinary, getPublicId }
