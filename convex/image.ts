import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    //this generates a short-lived url for uploading a file into storage
    //if a POST request is sent to this url with the file you want to upload
    // it's going to return the location or whatever it was uploaded to that url
    return await ctx.storage.generateUploadUrl()
})