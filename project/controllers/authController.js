const bcrypt = require('bcrypt');
const pool = require('../db/db');

exports.loginPage = (req, res) => {
    res.render("login");
}

exports.loginProcess = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM admin WHERE username = ?",
            [username]
        );

        if (rows.length === 0)
            return res.render("login", { error: "존재하지 않는 계정입니다." });

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.render("login", { error: "비밀번호 오류" });

        req.session.user = { id: user.id, username: user.username };
        res.redirect("/members");

    } catch (err) {
        console.log(err);
        res.render("login", { error: "서버 오류" });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};