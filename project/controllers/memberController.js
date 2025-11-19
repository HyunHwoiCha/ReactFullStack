const pool = require('../db/db');

exports.addMemberPage = (req, res) => {
    res.render("addMember");
};

exports.addMemberProcess = async (req, res) => {
    const { name, Pnumber, ssn, insurance_name, join_date } = req.body;

    try {
        await pool.query(
            `INSERT INTO member(name, Pnumber, ssn, insurance_name, join_date)
             VALUES(?, ?, ?, ?, ?)`,
            [name, Pnumber, ssn, insurance_name, join_date]
        );

        res.redirect("/members");

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "DB 오류" });
    }
};

exports.getMembers = async (req, res) => {

    try {
        const [rows] = await pool.query("SELECT * FROM member");

        // 주민 번호 뒷자리 7자리 마스킹
        const masked = rows.map( r => ({
            ...r,
            ssn: r.ssn.replace(/(\d{6})-(\d{7})/, "$1-*******")
        }));
        res.render("index", { members: masked });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "DB 오류" });
    }
};