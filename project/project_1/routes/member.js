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
// 회원 상세 페이지
router.get("/view/:id", isAdmin, memberController.getMemberById);
// 회원 수정 페이지
router.get("/edit/:id", isAdmin, memberController.editMemberPage);
router.post("/edit/:id", isAdmin, memberController.editMemberProcess);
// 회원 삭제
router.get("/delete/:id", isAdmin, memberController.deleteMember);
router.post("/delete", isAdmin, memberController.deleteSelectedMembers);

module.exports = router;