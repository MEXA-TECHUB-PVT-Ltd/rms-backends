const { Router } = require("express");
const {
    uploadFile,
    deleteFile
} = require("../../controller/fileUpload/fileUploadController");

const upload = require("../../middleware/multer");

const router = Router();

router.route("/upload").post(upload.single('image'), uploadFile);
router.route("/delete").delete(deleteFile);

module.exports = router;