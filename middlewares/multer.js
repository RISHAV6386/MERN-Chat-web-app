import  multer  from "multer";

export const multerUpload=multer({
    limits:{
        filesSize:1024*1024*5,
    }
})
