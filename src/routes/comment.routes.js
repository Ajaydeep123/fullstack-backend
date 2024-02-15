import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // since comment will only be made by a logged in user i.e, a verified user, so it doesn't makes sense to attach verifyJWT on individual routes
//so insted of router.route, we use router.use and attach our verifyJWT middleware on the entire comment.routes.js file, therefore every comment route will be protected

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router