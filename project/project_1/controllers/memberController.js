const pool = require('../db/db');

exports.addMemberPage = (req, res) => {
    res.render("addMember");
};

exports.addMemberProcess = async (req, res) => {
    let { name, gender, Pnumber1, Pnumber2, Pnumber3, ssn, regions, insurance_name, join_date } = req.body;

	// 필수 입력 체크
	if (!name || name.trim() === "") return res.status(400).send("이름을 입력해주세요.");
	if (!gender) return res.status(400).send("성별을 선택해주세요.");
	if (!Pnumber1 || !Pnumber2 || !Pnumber3) return res.status(400).send("전화번호를 모두 입력해주세요.");
	if (!ssn || ssn.trim() === "") return res.status(400).send("생년월일을 입력해주세요.");

	// 지역
	let regionStr = null;
	if (regions) {
		if (Array.isArray(regions)) {
			regionStr = regions.join(",");
		} else if (typeof regions === "string") {
			regionStr = regions;
		}
	}

	const Pnumber = `${Pnumber1}${Pnumber2}${Pnumber3}`;

	if (!insurance_name || insurance_name.trim() === "") insurance_name = null;
	if (!join_date || join_date.trim() === "") join_date = null;

    try {
        await pool.query(
            `INSERT INTO member(name, gender, Pnumber, ssn, regions, insurance_name, join_date)
             VALUES(?, ?, ?, ?, ?, ?, ?);`,
            [name, gender, Pnumber, ssn, regionStr, insurance_name, join_date]
        );

        res.redirect("/members");

    } catch (err) {
        console.error(err);

		// DB 오류에 따른 상세 로그
		if (err.code === 'ER_NO_DEFAULT_FOR_FIELD') {
			return res.status(500).send("필수 입력이 누락되었습니다.");
		}

		res.status(500).send({ error: "DB 오류" });
	}
};
// 회원 목록
exports.getMembers = async (req, res) => {
	try {
		const [rows] = await pool.query("SELECT * FROM member");

		const masked = rows.map(r => {
			// 전화번호 010-****-5678
			let phone = r.Pnumber || '';
			let maskedPhone = phone
				? `${phone.slice(0,3)}-****-${phone.slice(7,11)}`
				: '미입력';

			// 주민번호 950110
			let ssn = r.ssn || '';
			let maskedSSN = ssn
				? `${ssn}`
				: '미입력';

			let insuranceName = r.insurance_name
				? r.insurance_name.toISOString().split('T')[0]
				: '미입력';

			// 가입일자 처리
			let joinDate = r.join_date
				? r.join_date.toISOString().split('T')[0]
				: '미입력';

			r.regions = r.regions ? r.regions.split(",") : [];

			return {
				...r,
				Pnumber: maskedPhone,
				ssn: maskedSSN,
				join_date: joinDate
			};
		});

		res.render("index", { members: masked });

	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "DB 오류" });
	}
};

// 회원 상세보기
exports.getMemberById = async (req, res) => {
	const id = req.params.id; // URL에서 회원 id 받기

	try {
		const [rows] = await pool.query("SELECT * FROM member WHERE id = ?", [id]);

		if (!rows.length) {
			return res.status(404).send("회원이 없습니다.");
		}

		const member = rows[0];

		// 전화번호 010-1234-5678 형태로
		if (member.Pnumber && member.Pnumber.length === 11) {
			member.Pnumber = `${member.Pnumber.slice(0,3)}-${member.Pnumber.slice(3,7)}-${member.Pnumber.slice(7,11)}`;
		} else {
			member.Pnumber = member.Pnumber || '미입력';
		}

		// 생년월일 950110 형태로
		if (member.ssn && member.ssn.length === 6) {
			member.ssn = member.ssn;
		} else {
			member.ssn = member.ssn || '미입력';
		}

		member.regions = member.regions ? member.regions.split(",") : [];

		member.insurance_name = member.insurance_name ? member.insurance_name.toISOString().split('T')[0] : '미입력';
		// 가입일자 처리
		member.join_date = member.join_date ? member.join_date.toISOString().split('T')[0] : '미입력';

		res.render("viewMember", { member });

	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "DB 오류" });
	}
};

// 회원 삭제
exports.deleteMember = async (req, res) => {
	const id = req.params.id;

	try {
		// 기존 데이터 조회
		const [rows] = await pool.query("SELECT * FROM member WHERE id = ?", [id]);
		if (!rows[0]) return res.redirect("/members?error=notfound");

		const member = rows[0];

		// delete_members 테이블에 백업 저장
		await pool.query(
			`INSERT INTO deleted_member
			(member_id, name, gender, Pnumber, ssn, regions, insurance_name, join_date, deleted_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());`,
			[
				member.id,
				member.name,
				member.gender,
				member.Pnumber,
				member.ssn,
				member.regions,
				member.insurance_name,
				member.join_date,
			]
		);

		// 원본 데이터 삭제
		await pool.query(`DELETE FROM member WHERE id = ?`, [id]);

		res.redirect("/members?deleted=1");
	} catch (err) {
		console.error (err);
		res.redirect("/members?error=db");
	}
}

// 다중 회원 삭제
exports.deleteSelectedMembers = async (req, res) => {
	const memberIds = req.body.memberIds;
	if (!memberIds) return res.redirect("/members?error=noselect");

	try {
		for (let id of memberIds) {
			await exports.deleteMemberById(id);
		}
		res.redirect("/members?deleted=1");
	} catch (err) {
		console.error (err);
		res.redirect("/members?error=db");
	}
}
exports.deleteMemberById = async (id) => {
	const [rows] = await pool.query("SELECT * FROM member WHERE id = ?", [id]);
	if (!rows[0]) return;

	const member = rows[0];

	await pool.query(
		`INSERT INTO deleted_member
		(member_id, name, gender, Pnumber, ssn, regions, insurance_name, join_date, deleted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());`,
		[
			member.id,
			member.name,
			member.gender,
			member.Pnumber,
			member.ssn,
			member.regions,
			member.insurance_name,
			member.join_date,
		]
	);

	// 원본 데이터 삭제
	await pool.query(`DELETE FROM member WHERE id = ?`, [id]);
}

// 회원 수정 페이지
exports.editMemberPage = async (req, res) => {
	const id = req.params.id;

	const [rows] = await pool.query("SELECT * FROM member WHERE id = ?", [id]);

	if (!rows.length) return res.status(404).send("회원이 없습니다.");

	const m = rows[0];

	res.render("editMember", {
		member: {
			...m,
			PnumberRaw: m.Pnumber,     // 원본 전화번호
			join_dateRaw: m.join_date
				? m.join_date.toISOString().split("T")[0]
				: ""                    // date input에 넣기 좋게 변환
		}
	});
};

// 회원 수정
exports.editMemberProcess = async (req, res) => {
	const id = req.params.id;
	let { name, gender, Pnumber1, Pnumber2, Pnumber3, ssn, regions, insurance_name, join_date } = req.body;

	// 필수 입력 체크
	if (!name || name.trim() === "") return res.status(400).send("이름을 입력해주세요.");
	if (!gender) return res.status(400).send("성별을 선택해주세요.");
	if (!Pnumber1 || !Pnumber2 || !Pnumber3) return res.status(400).send("전화번호를 모두 입력해주세요.");
	if (!ssn || ssn.trim() === "") return res.status(400).send("생년월일을 입력해주세요.");

	// 지역
	let regionStr = null;
	if (regions) {
		if (Array.isArray(regions)) {
			regionStr = regions.join(",");
		} else if (typeof regions === "string") {
			regionStr = regions;
		}
	}

	const Pnumber = `${Pnumber1}${Pnumber2}${Pnumber3}`;

	if (!insurance_name || insurance_name.trim() === "") insurance_name = null;
	if (!join_date || join_date.trim() === "") join_date = null;

	try {
		await pool.query(
			`UPDATE member
             SET name=?, gender=?, Pnumber=?, ssn=?, regions=?, insurance_name=?, join_date=?
             WHERE id=?`,
			[name, gender, Pnumber, ssn, regionStr, insurance_name, join_date, id]
		);

		res.redirect(`/members/view/${id}`);

	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "DB 오류" });
	}
};