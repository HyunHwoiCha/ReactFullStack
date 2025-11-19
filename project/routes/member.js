const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");

// 로그인 체크 미들웨어
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.username === "admin"){
        return next();
    }
    res.redirect("/login");
}

// 회원 목록
router.get("/", isAdmin, memberController.getMembers);
router.get("/add", isAdmin, memberController.addMemberPage);
router.post("/add", isAdmin, memberController.addMemberProcess);

module.exports = router;