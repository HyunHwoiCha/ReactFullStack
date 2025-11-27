const express = require('express');
const session = require('express-session');
const path = require("path");

const app = express();

const authRoute = require('./routes/auth');
const memberRoute = require('./routes/member');

// 뷰 엔진
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 정적 파일
app.use("/CSS", express.static(path.join(__dirname, "CSS")));
app.use("/js", express.static(path.join(__dirname, "js")));

// POST 데이터 처리
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 프록시 뒤 세션 처리
app.set('trust proxy', 1);
app.use(session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
		secure: false, // HTTPS 동작 시 true 필요
		httpOnly : true,
		sameSite : 'lax'
	}
}));

// 라우터 연결
app.use('/', authRoute);
app.use('/members', memberRoute);

// 404 처리
app.use((req, res) => {
    res.status(404).send("페이지를 찾을 수 없습니다.");
});

const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node.js 서버 실행 : http://127.0.0.1:${PORT}`);
});