const mysql = require("mysql2/promise");

// MySQL 연결 풀 생성
const pool = mysql.createPool({
	host : "localhost",
	user : "root",
	password : "1234",
	database : "testdb"
});

async function testConnect() {
	try {
		const [rows] = await pool.query("SELECT NOW() AS now");
		console.log ("DB 연결 성공 :", rows);
	} catch (err) {
		console.log ("DB 연결 실패 :", err);
	}
}

testConnect ();