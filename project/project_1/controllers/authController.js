const pool = require('../db/db');

// 로그인 페이지 렌더링
exports.loginPage = (req, res) => {
	res.render("login");
}

// 로그인 처리
exports.loginProcess = async (req, res) => {
	const { username, password } = req.body;

	try {
		// DB에서 사용자 조회
		const [rows] = await pool.query(
			"SELECT * FROM admin WHERE username = ?",
			[username]
		);

		if (rows.length === 0) {
			return res.render("login", { error: "존재하지 않는 계정입니다." });
		}

		const user = rows[0];

		if (password !== user.password) {
			return res.render("login", { error: "비밀번호 오류" });
		}

		req.session.user = { id: user.id, username: user.username };
		res.redirect("/members");

	} catch (err) {
		console.error(err);
		res.render("login", { error: "서버 오류" });
	}
}

// 로그아웃
exports.logout = (req, res) => {
	req.session.destroy(() => {
		res.redirect("/login");
	});
};