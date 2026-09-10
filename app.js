const config = window.APP_CONFIG || {};
const app = document.querySelector("#app");
const authDialog = document.querySelector("#auth-dialog");
const authForm = document.querySelector("#auth-form");
const authButton = document.querySelector("#auth-button");
const userChip = document.querySelector("#user-chip");
const toast = document.querySelector("#toast");
const PASS_PERCENT = config.passPercent || 85;

const state = {
  route: "home",
  session: JSON.parse(localStorage.getItem("rc-session") || "null"),
  attempt: JSON.parse(sessionStorage.getItem("rc-attempt") || "null"),
  timerHandle: null,
  result: JSON.parse(sessionStorage.getItem("rc-result") || "null"),
};

const questions = [
  {
    id: "q1", number: "1", title: "คำนวณค่าการเยื้องศูนย์ของฐานราก F5 ในแกน X และ Y พร้อมพิจารณาการผ่านเกณฑ์และการขยายฐานราก",
    image: "assets/questions/q1-pile-offset.png", alt: "ผังตำแหน่งเสาเข็ม F5 ตารางระยะคลาดเคลื่อนแกน X และ Y",
    help: "กรอกค่าเป็นเซนติเมตร ใช้เครื่องหมายบวกหรือลบตามผลคำนวณ บนโทรศัพท์ให้กรอกตัวเลขแล้วแตะปุ่ม +/− เพื่อสลับเครื่องหมาย",
    fields: [
      { name: "q1_x", label: "ค่าการเยื้องศูนย์แกน X (ซม.)", type: "number", step: "0.01", signed: true },
      { name: "q1_y", label: "ค่าการเยื้องศูนย์แกน Y (ซม.)", type: "number", step: "0.01", signed: true },
      { name: "q1_pass", label: "สรุปผลการตรวจสอบ", type: "select", options: [["pass","ผ่าน"],["fail","ไม่ผ่าน"]] },
      { name: "q1_expand", label: "ต้องขยายฐานรากหรือไม่", type: "select", options: [["yes","ต้องขยาย"],["no","ไม่ต้องขยาย"]] },
    ], columns: 2,
  },
  {
    id: "q2", number: "2", title: "เลือกข้อกำหนดคอนกรีตให้ตรงกับประเภทงานและกำลังอัดที่กำหนด",
    image: "assets/questions/q2-concrete-spec.png", alt: "ตาราง General Concrete Specification ของ RITTA",
    fields: [
      { name: "q2_1_wc", label: "2.1 คาน fc′ 280 ksc — W/C สูงสุด", type: "number", step: "0.01" },
      { name: "q2_1_water", label: "2.1 ปริมาณน้ำสูงสุด (ลิตร)", type: "number", step: "1" },
      { name: "q2_1_slump", label: "2.1 Slump ค่ากลาง (ซม.)", type: "number", step: "0.1" },
      { name: "q2_2_wc", label: "2.2 PTS fc′ 320 ksc — W/C สูงสุด", type: "number", step: "0.01" },
      { name: "q2_2_water", label: "2.2 ปริมาณน้ำสูงสุด (ลิตร)", type: "number", step: "1" },
      { name: "q2_2_slump", label: "2.2 Slump ค่ากลาง (ซม.)", type: "number", step: "0.1" },
    ], columns: 3,
  },
  {
    id: "q3", number: "3", title: "ระบุจำนวนวันขั้นต่ำที่เริ่มรื้อไม้แบบได้หลังเทคอนกรีต",
    help: "กรอกจำนวนวันเต็มตามข้อกำหนดในเอกสารอบรม",
    fields: [
      { name: "q3_1", label: "3.1 แบบข้างฐานราก", type: "number" },
      { name: "q3_2", label: "3.2 แบบข้างเสา", type: "number" },
      { name: "q3_3", label: "3.3 แบบข้างคาน", type: "number" },
      { name: "q3_4", label: "3.4 แบบท้องคาน (ช่วงไม่เกิน 6 ม.)", type: "number" },
      { name: "q3_5", label: "3.5 แบบท้องพื้น", type: "number" },
    ], columns: 3,
  },
  {
    id: "q4", number: "4", title: "คำนวณความยาวเหล็กเสริมตำแหน่ง L1, L2 และ L3 สำหรับ DB12, fc′ 280 ksc",
    images: [
      ["assets/questions/q4-beam-detail.png", "แบบขยายคานต่อเนื่องและตารางระยะฝังเหล็ก"],
      ["assets/questions/q4-standard-hook.png", "ตารางขนาดของอมาตรฐาน 90 และ 180 องศา"],
    ],
    fields: [
      { name: "q4_1", label: "4.1 ระยะฝังตรงก่อนดัด 90° ของ L1 (ซม.)", type: "number", step: "0.1" },
      { name: "q4_2", label: "4.2 ระยะงอขอปลายเหล็กบน L1 (ซม.)", type: "number", step: "0.1" },
      { name: "q4_3", label: "4.3 ความยาวเหล็กพิเศษบน L2 (ซม.)", type: "number", step: "0.1" },
      { name: "q4_4", label: "4.4 ความยาวเหล็กพิเศษล่าง L3 (ซม.)", type: "number", step: "0.1" },
    ], columns: 2,
  },
  {
    id: "q5", number: "5", title: "กำหนดเกณฑ์ควบคุมการตอกเสาเข็ม 0.40 × 0.40 ม. ยาว 9 ม. กำลังรับน้ำหนัก 63 ตัน/ต้น",
    image: "assets/questions/q5-pile-driving.png", alt: "ตาราง Danish formula, Blow Count และ Last 10 Blows",
    fields: [
      { name: "q5_1", label: "5.1 Blow Count ต้องมากกว่า (ครั้ง/ฟุต)", type: "number", step: "1" },
      { name: "q5_2", label: "5.2 Last 10 Blows ต้องไม่เกิน (ซม.)", type: "number", step: "0.01" },
      { name: "q5_3", label: "5.3 หากเสาเข็มจมหมดแล้วยังไม่ผ่านเกณฑ์ จะดำเนินการอย่างไร", type: "textarea", minlength: 20 },
    ], columns: 2,
  },
  {
    id: "q6", number: "6", title: "จากภาพจัดระเบียบและผูกเหล็กพื้นโพสต์เทนชั่น ต้องสั่งตรวจสอบและแก้ไขข้อใดก่อนอนุมัติเทคอนกรีต",
    image: "assets/questions/q6-pt-slab.png", alt: "ภาพหน้างานติดตั้งลวดอัดแรงพื้นโพสต์เทนชั่น",
    choices: [
      ["a","ก. ระดับลวดบริเวณกลางช่วงไม่เท่ากัน"],
      ["b","ข. ลวดเหนือหัวเสาจมลงแทนที่จะเป็น High Point"],
      ["c","ค. ระยะห่าง Uniform Tendon ไม่เท่ากัน"],
      ["d","ง. ถูกทุกข้อ"],
    ],
  },
  {
    id: "q7_1", number: "7.1", title: "จุดบกพร่องร้ายแรงที่สุดของระบบนั่งร้านในภาพคือข้อใด",
    image: "assets/questions/q7-shore-void.png", alt: "เสาค้ำยันตั้งชิดและภายในช่องเปิดพื้น",
    choices: [
      ["a","ก. ฐานเสาค้ำยันอยู่บนขอบ/ช่องเปิดโดยไม่มีคานรองรับกระจายน้ำหนัก"],
      ["b","ข. ถูกต้องตามมาตรฐาน เทคอนกรีตได้ทันที"],
      ["c","ค. พื้นคอนกรีตไม่เรียบ"],
      ["d","ง. ฐานเสาค้ำยันไม่ได้เจาะยึดกับพื้น"],
    ],
  },
  {
    id: "q7_2", number: "7.2", title: "จุดบกพร่องร้ายแรงที่สุดของระบบนั่งร้านสองภาพนี้คือข้อใด",
    image: "assets/questions/q7-jack-extension.png", alt: "ระบบนั่งร้านและ Jack Base ที่ยืดเกลียวยาวมาก",
    choices: [
      ["a","ก. Jack Base และ U-Head ยืดสูงเกินระยะที่ระบบ/แบบรับรอง"],
      ["b","ข. Base Plate ไม่ได้ยึดพุกกับพื้น"],
      ["c","ค. Base Plate บางกว่ามาตรฐาน มอก."],
      ["d","ง. ถูกต้องตามมาตรฐาน เทคอนกรีตได้ทันที"],
    ],
  },
  {
    id: "q8_1", number: "8.1", title: "Concrete Cover ขั้นต่ำของฐานรากที่หล่อติดดินและสัมผัสดินตลอดเวลา",
    choices: [["a","ก. 4.0 ซม."],["b","ข. 5.0 ซม."],["c","ค. 7.5 ซม."],["d","ง. 10.0 ซม."]],
  },
  {
    id: "q8_2", number: "8.2", title: "Concrete Cover ขั้นต่ำของเสาเหนือพื้นดินภายในอาคาร",
    choices: [["a","ก. 2.5 ซม."],["b","ข. 4.0 ซม."],["c","ค. 5.0 ซม."],["d","ง. 7.5 ซม."]],
  },
  {
    id: "q9", number: "9", title: "เลือกข้อกำหนดแนวหยุดเทของเสา พื้น คานหลัก และคานรองที่ถูกต้องที่สุด",
    choices: [
      ["a","ก. เสาหยุดกึ่งกลางความสูง; คานหยุด 1/4 ช่วง; พื้นหยุดขอบเสา"],
      ["b","ข. เสาหยุดใต้ท้องคานพอดี; คาน/พื้นหยุด 1/3–1/2; คานรองห่าง 2 เท่าความกว้างคานหลัก"],
      ["c","ค. เสาหยุดไม่เกิน 75 มม. ใต้ท้องคาน; คาน/พื้นหยุดใน Middle Third; รอยต่อคานรองห่างคานหลักอย่างน้อย 2 เท่าความกว้างคานรอง"],
      ["d","ง. หยุดเทจุดใดก็ได้ตามความสะดวก"],
    ],
  },
  {
    id: "q10", number: "10", title: "เลือกขั้นตอนเตรียมผิว Construction Joint ก่อนเทคอนกรีตต่อที่ถูกต้องที่สุด",
    choices: [
      ["a","ก. ขัดมันให้เรียบและไม่ล้างน้ำ"],
      ["b","ข. ทำผิวหยาบเห็นเม็ดหิน กำจัดฝ้าน้ำปูน/เศษหลุด ล้างสะอาด และทำให้ชื้นโดยไม่เปียกโชก"],
      ["c","ค. ล้างเฉพาะขยะ ปล่อยฝ้าน้ำปูนและขังน้ำไว้"],
      ["d","ง. เททับได้ทันทีโดยไม่เตรียมผิว"],
    ],
  },
];

function safeNum(val) {
  if (val === undefined || val === null || String(val).trim() === "") return NaN;
  const num = Number(val);
  return Number.isFinite(num) ? num : NaN;
}

function evaluateExam(answers = {}, durationSeconds = 0) {
  let totalScore = 0;
  const details = [];

  // Q1: 4 points
  let awardQ1 = 0;
  if (Math.abs(safeNum(answers.q1_x) - (-0.34)) <= 0.01) awardQ1 += 1;
  if (Math.abs(safeNum(answers.q1_y) - (-2.10)) <= 0.01) awardQ1 += 1;
  if (answers.q1_pass === "pass") awardQ1 += 1;
  if (answers.q1_expand === "no") awardQ1 += 1;
  totalScore += awardQ1;
  details.push({
    label: "ข้อ 1 — Pile eccentricity",
    awarded: awardQ1,
    points: 4,
    status: awardQ1 === 4 ? "correct" : awardQ1 === 0 ? "incorrect" : "partial",
    user_answer: `X=${answers.q1_x || "—"}, Y=${answers.q1_y || "—"}, ผล=${answers.q1_pass === "pass" ? "ผ่าน" : answers.q1_pass === "fail" ? "ไม่ผ่าน" : "—"}, ขยายฐาน=${answers.q1_expand === "yes" ? "ต้องขยาย" : answers.q1_expand === "no" ? "ไม่ต้องขยาย" : "—"}`,
    explanation: "X=(5.3−0.5−1.1−6.1+0.7)/5 = −0.34 ซม.; Y=(−1.3+5.6−0.6−6.3−7.9)/5 = −2.10 ซม. ระยะเยื้องศูนย์ลัพธ์ = √(X²+Y²) = √(0.34²+2.10²) = 2.127 ซม. หรือประมาณ 2.13 ซม. ซึ่งไม่เกินเกณฑ์ 7.5 ซม. จึงผ่านและไม่ต้องขยายฐานรากตามคำรับรองของผู้ออกข้อสอบ",
    reference: "TEST-01 หน้า 1; Detailing 2026 หน้า 130–138 (Pile Eccentricity); คำรับรองผู้ออกข้อสอบ 29 ส.ค. 2026",
  });

  // Q2: 6 points
  let awardQ2 = 0;
  if (Math.abs(safeNum(answers.q2_1_wc) - 0.45) <= 0.001) awardQ2 += 1;
  if (Math.abs(safeNum(answers.q2_1_water) - 170) <= 0.1) awardQ2 += 1;
  if (Math.abs(safeNum(answers.q2_1_slump) - 7.5) <= 0.1) awardQ2 += 1;
  if (Math.abs(safeNum(answers.q2_2_wc) - 0.40) <= 0.001) awardQ2 += 1;
  if (Math.abs(safeNum(answers.q2_2_water) - 180) <= 0.1) awardQ2 += 1;
  if (Math.abs(safeNum(answers.q2_2_slump) - 10) <= 0.1) awardQ2 += 1;
  totalScore += awardQ2;
  details.push({
    label: "ข้อ 2 — General Concrete Specification",
    awarded: awardQ2,
    points: 6,
    status: awardQ2 === 6 ? "correct" : awardQ2 === 0 ? "incorrect" : "partial",
    user_answer: `คาน: W/C ${answers.q2_1_wc || "—"}, น้ำ ${answers.q2_1_water || "—"}, slump ${answers.q2_1_slump || "—"}; PTS: W/C ${answers.q2_2_wc || "—"}, น้ำ ${answers.q2_2_water || "—"}, slump ${answers.q2_2_slump || "—"}`,
    explanation: "คาน RC.Normal (General Structure) fc′ 240–280: W/C ≤0.45, น้ำ ≤170 ลิตร, slump 75±25 มม. (ค่ากลาง 7.5 ซม.). PTS fc′ 320: W/C ≤0.40, น้ำ 170–180 ลิตรจึงใช้ค่าสูงสุด 180 ลิตร, slump 100±25 มม. (ค่ากลาง 10 ซม.)",
    reference: "TEST-01 หน้า 2; Detailing 2026 หน้า 11 และหน้า 13",
  });

  // Q3: 5 points
  let awardQ3 = 0;
  if (safeNum(answers.q3_1) === 2) awardQ3 += 1;
  if (safeNum(answers.q3_2) === 2) awardQ3 += 1;
  if (safeNum(answers.q3_3) === 2) awardQ3 += 1;
  if (safeNum(answers.q3_4) === 14) awardQ3 += 1;
  if (safeNum(answers.q3_5) === 14) awardQ3 += 1;
  totalScore += awardQ3;
  details.push({
    label: "ข้อ 3 — ระยะเวลาถอดแบบ",
    awarded: awardQ3,
    points: 5,
    status: awardQ3 === 5 ? "correct" : awardQ3 === 0 ? "incorrect" : "partial",
    user_answer: `3.1=${answers.q3_1 || "—"} วัน, 3.2=${answers.q3_2 || "—"} วัน, 3.3=${answers.q3_3 || "—"} วัน, 3.4=${answers.q3_4 || "—"} วัน, 3.5=${answers.q3_5 || "—"} วัน`,
    explanation: "แบบข้างฐานราก แบบข้างเสา และแบบข้างคานอย่างน้อย 2 วัน; แบบล่างรองรับคานและพื้น 14 วัน. ถ้าท้องคานยาวเกิน 6 ม. เอกสารกำหนด 21 วัน และต้องค้ำต่อ/ตรวจตามแบบและคำแนะนำวิศวกร",
    reference: "TEST-01 หน้า 2; Detailing 2026 หน้า 14 (การถอดแบบคอนกรีต)",
  });

  // Q4: 4 points
  let awardQ4 = 0;
  if (Math.abs(safeNum(answers.q4_1) - 25) <= 0.1) awardQ4 += 1;
  if (Math.abs(safeNum(answers.q4_2) - 20) <= 0.1) awardQ4 += 1;
  if (Math.abs(safeNum(answers.q4_3) - 240) <= 0.5) awardQ4 += 1;
  if (Math.abs(safeNum(answers.q4_4) - 300) <= 0.5) awardQ4 += 1;
  totalScore += awardQ4;
  details.push({
    label: "ข้อ 4 — Detailing เหล็กคาน",
    awarded: awardQ4,
    points: 4,
    status: awardQ4 === 4 ? "correct" : awardQ4 === 0 ? "incorrect" : "partial",
    user_answer: `4.1=${answers.q4_1 || "—"} ซม., 4.2=${answers.q4_2 || "—"} ซม., 4.3=${answers.q4_3 || "—"} ซม., 4.4=${answers.q4_4 || "—"} ซม.`,
    explanation: "DB12, fc′ 280: ระยะฝังสำหรับเหล็กงอขอ 25 ซม.; ของอ 90° ค่า J = 20 ซม. เหล็กพิเศษบนเหนือเสายื่น 0.30L แต่ละด้าน จึง L2=0.60×400=240 ซม. เหล็กพิเศษล่างเว้น 0.125L จากแต่ละปลาย จึง L3=(1−0.125−0.125)×400=300 ซม.",
    reference: "TEST-01 หน้า 3–4; Detailing 2026 หน้า 31–34 และ 43–44; ว.ส.ท. 1008-38 หัวข้อ 3401 (ของอมาตรฐาน)",
  });

  // Q5: 4 points
  let awardQ5 = 0;
  if (Math.abs(safeNum(answers.q5_1) - 100) <= 0.1) awardQ5 += 1;
  if (Math.abs(safeNum(answers.q5_2) - 3.02) <= 0.01) awardQ5 += 1;
  const q5Text = String(answers.q5_3 || "").toLowerCase().trim();
  if ((q5Text.includes("หยุด") || q5Text.includes("ห้าม")) && (q5Text.includes("วิศวกร") || q5Text.includes("ผู้ออกแบบ"))) {
    awardQ5 += 1;
  }
  if (/(ต่อเข็ม|splice|restrike|re-strike|ทดสอบ|dynamic|pda|static|เจาะสำรวจ|แก้ไขแบบ|เพิ่มเข็ม)/i.test(q5Text)) {
    awardQ5 += 1;
  }
  totalScore += awardQ5;
  details.push({
    label: "ข้อ 5 — เกณฑ์หยุดตอกเสาเข็ม",
    awarded: awardQ5,
    points: 4,
    status: awardQ5 === 4 ? "correct" : awardQ5 === 0 ? "incorrect" : "partial",
    user_answer: `Blow Count=${answers.q5_1 || "—"}, Last 10=${answers.q5_2 || "—"}; ${answers.q5_3 || "—"}`,
    explanation: "ที่ความยาว 9 ม. ตารางให้ 50 blows/ft และ Last 10 = 6.04 ซม. เกณฑ์ในสไลด์ให้เริ่ม/ควบคุมที่ Blow Count >2 เท่าของรายการคำนวณ (=มากกว่า 100 blows/ft) และหยุดได้เมื่อ Last 10 ไม่เกินครึ่งหนึ่ง (=3.02 ซม.) จำนวน 3 ครั้งติดต่อกัน. หากเข็มจมหมดแล้วยังไม่ผ่าน ต้องหยุดงาน แจ้งผู้ออกแบบ ตรวจข้อมูล/สภาพชั้นดิน และดำเนินมาตรการที่วิศวกรอนุมัติ เช่น restrike/PDA, ต่อเข็ม, ทดสอบเพิ่มเติม หรือแก้แบบ ไม่ควรตัดสินใจตอกหรือเพิ่มเข็มเอง",
    reference: "TEST-01 หน้า 5; Detailing 2026 หน้า 125 (ฐานรากเสาเข็ม Case 1–4)",
  });

  // Q6: 1 point
  const awardQ6 = answers.q6 === "d" ? 1 : 0;
  totalScore += awardQ6;
  details.push({
    label: "ข้อ 6 — พื้นโพสต์เทนชั่น",
    awarded: awardQ6,
    points: 1,
    status: awardQ6 === 1 ? "correct" : "incorrect",
    user_answer: answers.q6 ? answers.q6.toUpperCase() : "—",
    explanation: "ตอบ ง. ถูกทุกข้อ เพราะ tendon profile ต้องได้ Low Point ในช่วงกลางและ High Point เหนือแนวรองรับตามแบบ รวมทั้ง Uniform Tendon ต้องจัดแนว/ระยะให้สม่ำเสมอก่อนเท",
    reference: "TEST-01 หน้า 6; Detailing 2026 หน้า 82–95 (Post-tensioned Flat Slab); ให้ยึด shop drawing/PT layout ที่วิศวกรอนุมัติ",
  });

  // Q7: 2 points
  let awardQ7 = 0;
  if (answers.q7_1 === "a") awardQ7 += 1;
  if (answers.q7_2 === "a") awardQ7 += 1;
  totalScore += awardQ7;
  details.push({
    label: "ข้อ 7 — ระบบนั่งร้านและค้ำยัน",
    awarded: awardQ7,
    points: 2,
    status: awardQ7 === 2 ? "correct" : awardQ7 === 0 ? "incorrect" : "partial",
    user_answer: `7.1=${answers.q7_1 ? answers.q7_1.toUpperCase() : "—"}, 7.2=${answers.q7_2 ? answers.q7_2.toUpperCase() : "—"}`,
    explanation: "7.1 ตอบ ก: จุดรับแรงอยู่บน/ชิดช่องเปิดโดยไม่มีคานรองรับกระจายน้ำหนัก. 7.2 ตอบ ก: การยืด Jack Base/U-Head มากเกินค่าที่ผู้ผลิตและแบบค้ำยันรับรองเพิ่ม slenderness และลดกำลังรับแรง; ต้องแก้ตามแบบค้ำยัน ไม่ใช้ตัวเลขทั่วไปโดยเดา",
    reference: "TEST-01 หน้า 7–8; แบบค้ำยันที่วิศวกรอนุมัติ; OSHA 29 CFR 1926.703(a), (b)(5)–(7)",
  });

  // Q8: 2 points
  let awardQ8 = 0;
  if (answers.q8_1 === "c") awardQ8 += 1;
  if (answers.q8_2 === "b") awardQ8 += 1;
  totalScore += awardQ8;
  details.push({
    label: "ข้อ 8 — Concrete Cover",
    awarded: awardQ8,
    points: 2,
    status: awardQ8 === 2 ? "correct" : awardQ8 === 0 ? "incorrect" : "partial",
    user_answer: `8.1=${answers.q8_1 ? answers.q8_1.toUpperCase() : "—"}, 8.2=${answers.q8_2 ? answers.q8_2.toUpperCase() : "—"}`,
    explanation: "8.1 ตอบ ค 7.5 ซม. สำหรับคอนกรีตหล่อติดดินและสัมผัสดินตลอดเวลา. 8.2 ตอบ ข 4.0 ซม. สำหรับคาน/เสาภายในอาคารตามตารางอบรม",
    reference: "TEST-01 หน้า 9; Detailing 2026 หน้า 28; ACI 318-19 Table 20.5.1.3.1",
  });

  // Q9: 1 point
  const awardQ9 = answers.q9 === "c" ? 1 : 0;
  totalScore += awardQ9;
  details.push({
    label: "ข้อ 9 — ตำแหน่ง Construction Joint",
    awarded: awardQ9,
    points: 1,
    status: awardQ9 === 1 ? "correct" : "incorrect",
    user_answer: answers.q9 ? answers.q9.toUpperCase() : "—",
    explanation: "ตอบ ค. แนวหยุดเทต้องอยู่บริเวณแรงเฉือนต่ำ: คานและพื้นอยู่ใน middle third; รอยต่อในคานหลักต้องเยื้องจากคานที่มาตัดอย่างน้อย 2 เท่าความกว้างคานที่มาตัด และตำแหน่งเสาต้องเป็นไปตามรายละเอียดในข้อกำหนด/แบบ",
    reference: "TEST-01 หน้า 9; ACI 302.1R-04 ข้อ 3.3.8.1 และ ACI 318",
  });

  // Q10: 1 point
  const awardQ10 = answers.q10 === "b" ? 1 : 0;
  totalScore += awardQ10;
  details.push({
    label: "ข้อ 10 — การเตรียมผิว Construction Joint",
    awarded: awardQ10,
    points: 1,
    status: awardQ10 === 1 ? "correct" : "incorrect",
    user_answer: answers.q10 ? answers.q10.toUpperCase() : "—",
    explanation: "ตอบ ข. ทำผิวหยาบให้มวลรวมหยาบเปิดสม่ำเสมอ กำจัด laitance และชิ้นส่วนหลวม ล้างให้สะอาด แล้วทำผิวให้ชื้นโดยไม่มีน้ำขังก่อนเทใหม่ ทั้งนี้ให้ทำตาม project specification และรายละเอียดถ่ายแรงเฉือนของผู้ออกแบบ",
    reference: "TEST-01 หน้า 10; ACI 318-11 ข้อ 6.4.3 และ 11.6.9 / ACI 318-14 ข้อ 26.4.7",
  });

  return {
    score: totalScore,
    max_score: 30,
    duration_seconds: durationSeconds,
    submitted_at: new Date().toISOString(),
    details: details,
    post_exam_resources: config.postExamResources || [],
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2,"0")}:${String(remaining).padStart(2,"0")}` : `${minutes}:${String(remaining).padStart(2,"0")}`;
}

function scorePercentage(score, maxScore) {
  const earned = Number(score);
  const maximum = Number(maxScore);
  return Number.isFinite(earned) && Number.isFinite(maximum) && maximum > 0
    ? (earned / maximum) * 100
    : 0;
}

function formatPercentage(score, maxScore) {
  const percentage = scorePercentage(score, maxScore);
  return `${percentage.toFixed(2).replace(/\.?0+$/, "")}%`;
}

function passedExam(score, maxScore) {
  return scorePercentage(score, maxScore) >= PASS_PERCENT;
}

function userName() {
  return state.session?.full_name || "ผู้เข้าสอบ";
}

function getLeaderboardData() {
  return JSON.parse(localStorage.getItem("rc-leaderboard") || "[]");
}

function saveToLeaderboard(record) {
  const list = getLeaderboardData();
  list.push(record);
  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.duration_seconds - b.duration_seconds;
  });
  localStorage.setItem("rc-leaderboard", JSON.stringify(list));
}

function updateHeader() {
  const signedIn = Boolean(state.session?.full_name);
  userChip.classList.toggle("hidden", !signedIn);
  userChip.textContent = signedIn ? userName() : "";
  authButton.textContent = signedIn ? "เปลี่ยนผู้สอบ" : "กรอกชื่อ";
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.route === state.route));
}

function go(route) {
  if (state.timerHandle) window.clearInterval(state.timerHandle);
  state.timerHandle = null;
  state.route = route;
  location.hash = route;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHome() {
  const resume = state.attempt && !state.result;
  const startLabel = state.result ? "ดูผลสอบย้อนหลัง" : (resume ? "ทำข้อสอบต่อ" : "เริ่มทำข้อสอบ");
  app.innerHTML = `
    <section class="hero"><div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">ENGINEER / FOREMAN · 2026</p>
        <h1>แบบทดสอบ<br><span>RC DETAILING</span></h1>
        <p>ทดสอบการอ่านแบบ การควบคุมคอนกรีต เหล็กเสริม ฐานราก เสาเข็ม พื้นโพสต์เทนชั่น และความปลอดภัยงานค้ำยัน พร้อมเฉลยละเอียดและแหล่งเรียนรู้หลังส่งคำตอบ</p>
        <div class="hero-actions">
          <button class="button button-primary" id="start-button">${startLabel}</button>
          <button class="button button-dark" data-go="leaderboard">ดู Score Board</button>
        </div>
      </div>
      <aside class="hero-card">
        <h2>TEST–01 / FIELD KNOWLEDGE</h2>
        <div class="stat-list">
          <div class="stat"><span>หัวข้อหลัก</span><strong>10</strong></div>
          <div class="stat"><span>คะแนนเต็ม</span><strong>30</strong></div>
          <div class="stat"><span>เกณฑ์ผ่าน</span><strong>${PASS_PERCENT}%</strong></div>
          <div class="stat"><span>รูปประกอบจากโจทย์</span><strong>8</strong></div>
          <div class="stat"><span>ระบบตรวจข้อสอบ</span><strong>Instant</strong></div>
        </div>
      </aside>
    </div></section>
    <section class="section"><div class="container">
      <div class="section-title"><h2>วิธีทำข้อสอบ</h2><p>คำตอบจะยังไม่ถูกตรวจระหว่างทำ ต้องตอบให้ครบและกดส่งครั้งเดียว จากนั้นระบบจะแสดงคะแนน ผลวิเคราะห์ และเฉลยทั้งหมดทันที</p></div>
      <div class="feature-grid">
        <article class="feature-card"><span class="feature-index">01 / NAME</span><h3>กรอกชื่อผู้เข้าสอบ</h3><p>ใช้เพียงชื่อ–นามสกุล ไม่ต้องใช้อีเมลหรือรหัสผ่าน พร้อมเริ่มทำข้อสอบได้ทันที</p></article>
        <article class="feature-card"><span class="feature-index">02 / COMPLETE</span><h3>ทำให้ครบก่อนส่ง</h3><p>มีทั้งช่องตัวเลข ข้อเขียน และตัวเลือก พร้อมระบบจับเวลาอัตโนมัติ</p></article>
        <article class="feature-card"><span class="feature-index">03 / REVIEW</span><h3>เฉลยพร้อมเอกสาร</h3><p>ดูวิธีคิด หน้าเอกสารอ้างอิง ข้อกำหนดมาตรฐาน และปลดล็อกวิดีโออบรมหลังส่งคำตอบ</p></article>
      </div>
    </div></section>`;
  document.querySelector("#start-button").addEventListener("click", startExam);
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => go(button.dataset.go)));
}

function fieldHtml(field) {
  if (field.type === "select") {
    return `<label>${escapeHtml(field.label)}<select name="${field.name}" required><option value="">— เลือกคำตอบ —</option>${field.options.map(([v,l]) => `<option value="${v}">${escapeHtml(l)}</option>`).join("")}</select></label>`;
  }
  if (field.type === "textarea") {
    return `<label style="grid-column:1/-1">${escapeHtml(field.label)}<textarea name="${field.name}" minlength="${field.minlength || 1}" required placeholder="อธิบายลำดับการทำงาน เหตุผล และผู้ที่ต้องประสานงาน"></textarea></label>`;
  }
  const input = `<input name="${field.name}" type="number" step="${field.step || 1}" required inputmode="decimal" />`;
  if (field.signed) {
    return `<label>${escapeHtml(field.label)}<span class="signed-number-control">${input}<button class="sign-toggle" type="button" data-sign-target="${field.name}" aria-label="สลับค่าบวกหรือลบของ ${escapeHtml(field.label)}" aria-pressed="false">+/−</button></span></label>`;
  }
  return `<label>${escapeHtml(field.label)}${input}</label>`;
}

function setupSignedInputs(form) {
  form.querySelectorAll("[data-sign-target]").forEach((button) => {
    const input = form.elements[button.dataset.signTarget];
    if (!input) return;

    const sync = () => {
      const negative = String(input.value).startsWith("-");
      button.disabled = input.value === "";
      button.classList.toggle("negative", negative);
      button.setAttribute("aria-pressed", String(negative));
      button.title = negative ? "ค่าปัจจุบันเป็นลบ" : "ค่าปัจจุบันเป็นบวก";
    };

    button.addEventListener("click", () => {
      const value = input.value.trim();
      if (!value) return;
      input.value = value.startsWith("-") ? value.slice(1) : `-${value}`;
      sync();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
    input.addEventListener("input", sync);
    sync();
  });
}

function questionHtml(question) {
  const media = question.image
    ? `<img class="question-image" src="${question.image}" alt="${escapeHtml(question.alt)}" loading="lazy" />`
    : (question.images || []).map(([src, alt]) => `<img class="question-image" src="${src}" alt="${escapeHtml(alt)}" loading="lazy" />`).join("");
  const answers = question.fields
    ? `<div class="answer-fields field-grid ${question.columns === 3 ? "three" : "two"}">${question.fields.map(fieldHtml).join("")}</div>`
    : `<div class="choice-list">${question.choices.map(([value, label]) => `<label class="choice"><input type="radio" name="${question.id}" value="${value}" required /><span>${escapeHtml(label)}</span></label>`).join("")}</div>`;
  return `<article class="question-card" id="question-${question.id}" data-question="${question.id}">
    <div class="question-head"><span class="question-number">${question.number}</span><h2>${escapeHtml(question.title)}</h2></div>
    ${question.help ? `<p class="question-help">${escapeHtml(question.help)}</p>` : ""}${media}${answers}
  </article>`;
}

function renderExam() {
  if (!state.session?.full_name) return go("home");
  if (state.result) return go("results");
  app.innerHTML = `
    <section class="page-head"><div class="container"><p class="eyebrow">TEST–01 / ${escapeHtml(config.examVersion || "2026")}</p><h1>แบบทดสอบความรู้หน้างาน</h1><p>ผู้เข้าสอบ: <strong>${escapeHtml(userName())}</strong> · ตอบทุกข้อให้ครบก่อนกดส่ง ระบบจะไม่แสดงเฉลยระหว่างทำ</p></div></section>
    <div class="exam-toolbar"><div class="container"><div><span class="progress-text">เวลาที่ใช้</span><div class="timer" id="timer">0:00</div></div><div class="progress-text" id="progress">ตอบแล้ว 0 / ${questions.length} หัวข้อ</div></div></div>
    <form id="exam-form" class="container exam-layout">
      <section class="question-stack">${questions.map(questionHtml).join("")}</section>
      <aside class="exam-sidebar"><h3>ตรวจความครบถ้วน</h3><div class="question-nav">${questions.map((q, i) => `<button type="button" data-target="${q.id}" aria-label="ไปข้อ ${q.number}">${i + 1}</button>`).join("")}</div><p class="sidebar-note">ปุ่มสีเขียวหมายถึงหัวข้อนั้นตอบครบทุกช่องแล้ว</p><button class="button button-primary exam-submit" type="submit">ส่งคำตอบ</button></aside>
    </form>`;
  const form = document.querySelector("#exam-form");
  restoreDraft(form);
  setupSignedInputs(form);
  form.addEventListener("input", () => { saveDraft(form); updateProgress(form); });
  form.addEventListener("submit", submitExam);
  document.querySelectorAll("[data-target]").forEach((button) => button.addEventListener("click", () => document.querySelector(`#question-${button.dataset.target}`).scrollIntoView({ behavior: "smooth" })));
  updateProgress(form);
  updateTimer();
  state.timerHandle = window.setInterval(updateTimer, 1000);
}

function questionAnswered(form, question) {
  if (question.fields) return question.fields.every((field) => String(new FormData(form).get(field.name) || "").trim().length >= (field.minlength || 1));
  return Boolean(new FormData(form).get(question.id));
}

function updateProgress(form) {
  let answered = 0;
  questions.forEach((question, index) => {
    const complete = questionAnswered(form, question);
    answered += complete ? 1 : 0;
    document.querySelectorAll(".question-nav button")[index]?.classList.toggle("answered", complete);
  });
  document.querySelector("#progress").textContent = `ตอบแล้ว ${answered} / ${questions.length} หัวข้อ`;
}

function saveDraft(form) {
  const answers = Object.fromEntries(new FormData(form).entries());
  sessionStorage.setItem("rc-draft", JSON.stringify(answers));
}

function restoreDraft(form) {
  const draft = JSON.parse(sessionStorage.getItem("rc-draft") || "null");
  if (!draft) return;
  Object.entries(draft).forEach(([name, value]) => {
    const elements = form.elements[name];
    if (!elements) return;
    if (elements instanceof RadioNodeList) {
      [...elements].forEach((element) => { element.checked = element.value === value; });
    } else elements.value = value;
  });
}

function updateTimer() {
  const started = new Date(state.attempt?.started_at || Date.now()).getTime();
  const seconds = Math.floor((Date.now() - started) / 1000);
  const timer = document.querySelector("#timer");
  if (timer) timer.textContent = formatDuration(seconds);
}

function startExam() {
  if (!state.session?.full_name) { openAuth(); return; }
  if (state.result) { go("results"); return; }
  if (!state.attempt) {
    state.attempt = {
      attempt_id: crypto.randomUUID(),
      started_at: new Date().toISOString(),
    };
    sessionStorage.setItem("rc-attempt", JSON.stringify(state.attempt));
  }
  go("exam");
}

function submitExam(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  if (!window.confirm("ส่งคำตอบตอนนี้? ระบบจะตรวจคำตอบและแสดงผลคะแนนทันที")) return;

  const submitButton = form.querySelector("[type=submit]");
  submitButton.disabled = true;
  submitButton.textContent = "กำลังตรวจคำตอบ…";

  const answers = Object.fromEntries(new FormData(form).entries());
  const started = new Date(state.attempt?.started_at || Date.now()).getTime();
  const durationSeconds = Math.max(1, Math.floor((Date.now() - started) / 1000));

  const result = evaluateExam(answers, durationSeconds);
  result.full_name = userName();

  state.result = result;
  sessionStorage.setItem("rc-result", JSON.stringify(result));
  sessionStorage.removeItem("rc-draft");
  sessionStorage.removeItem("rc-attempt");
  state.attempt = null;

  saveToLeaderboard({
    full_name: userName(),
    score: result.score,
    max_score: result.max_score,
    duration_seconds: durationSeconds,
    submitted_at: result.submitted_at,
  });

  go("results");
}

function renderResults() {
  if (!state.result) return go("home");
  const result = state.result;
  const percentage = formatPercentage(result.score, result.max_score);
  const passed = passedExam(result.score, result.max_score);
  const resultTitle = "ผลการทดสอบ";
  const resultSummary = `ผู้เข้าสอบ: ${escapeHtml(userName())} · ใช้เวลา ${formatDuration(result.duration_seconds)} · ส่งเมื่อ ${new Date(result.submitted_at).toLocaleString("th-TH")}`;

  const postExamResources = (result.post_exam_resources || []).map((resource, index) => `
    <a class="lecture-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">
      <span class="lecture-index">RESOURCE ${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(resource.label)}</strong>
      <span>เปิดดูเอกสาร / วิดีโอ ↗</span>
    </a>`).join("");

  const detailCards = (result.details || []).map((item) => `
    <article class="result-card ${item.status || (item.awarded === item.points ? "correct" : "incorrect")}">
      <div class="result-meta"><h3>${escapeHtml(item.label)}</h3><strong>${item.awarded}/${item.points} คะแนน · ${formatPercentage(item.awarded, item.points)}</strong></div>
      <p><strong>คำตอบของคุณ:</strong> ${escapeHtml(item.user_answer || "—")}</p>
      <div class="answer-box"><strong>คำตอบและเหตุผล</strong><p>${escapeHtml(item.explanation)}</p></div>
      <p class="reference"><strong>อ้างอิง:</strong> ${escapeHtml(item.reference)}</p>
    </article>`).join("");

  app.innerHTML = `
    <section class="result-hero"><div class="container result-summary"><div><p class="eyebrow">EXAM RESULT</p><h1>${resultTitle}</h1><p>${resultSummary}</p></div><div class="result-score-panel"><div class="result-score">${result.score}<small> / ${result.max_score}</small></div><div class="result-percent">${percentage}</div><span class="status-pill ${passed ? "pass" : "fail"}">${passed ? "ผ่าน" : "ไม่ผ่าน"}</span><small>เกณฑ์ผ่าน ${PASS_PERCENT}%</small></div></div></section>
    <section class="container">
      <div style="margin: 1.5rem 0; display: flex; gap: 1rem; flex-wrap: wrap;">
        <button class="button button-primary" id="retake-button">ทำข้อสอบใหม่อีกครั้ง</button>
        <button class="button button-dark" data-go="leaderboard">ดู Score Board</button>
      </div>
      ${postExamResources ? `<section class="post-exam-resources"><p class="eyebrow">UNLOCKED AFTER SUBMISSION</p><div class="section-title"><h2>เอกสารและวิดีโอเฉลย/บรรยาย</h2><p>ลิงก์เอกสารประกอบและวิดีโอบรรยายเสริมความเข้าใจ</p></div><div class="lecture-grid">${postExamResources}</div></section>` : ''}
      <div class="result-list">${detailCards}</div>
    </section>`;

  document.querySelector("#retake-button")?.addEventListener("click", () => {
    if (window.confirm("ต้องการเริ่มทำข้อสอบใหม่อีกครั้งใช่หรือไม่?")) {
      sessionStorage.removeItem("rc-result");
      sessionStorage.removeItem("rc-draft");
      sessionStorage.removeItem("rc-attempt");
      state.result = null;
      state.attempt = null;
      startExam();
    }
  });
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => go(button.dataset.go)));
}

function renderLeaderboard() {
  const rows = getLeaderboardData();
  app.innerHTML = `
    <section class="page-head">
      <div class="container">
        <p class="eyebrow">RANKING / HISTORY</p>
        <h1>Score Board</h1>
        <p>เกณฑ์ผ่าน ${PASS_PERCENT}% · เรียงคะแนนจากมากไปน้อย และใช้เวลาน้อยกว่าเป็นลำดับถัดไป</p>
      </div>
    </section>
    <section class="section">
      <div class="container" id="leaderboard-content">
        ${!rows.length ? '<div class="empty-state"><h2>ยังไม่มีประวัติการทำข้อสอบ</h2><p>เมื่อทำข้อสอบและส่งคำตอบ รายชื่อและคะแนนจะปรากฏที่นี่</p><button class="button button-primary" id="leaderboard-start">เริ่มทำข้อสอบ</button></div>' : `
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span>บันทึกทั้งหมด ${rows.length} รายการ</span>
            <button class="button button-small" id="clear-leaderboard" style="background:#dc2626; color:#fff; border:none;">ล้างประวัติทั้งหมด</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>อันดับ</th><th>ชื่อ–นามสกุล</th><th>คะแนน</th><th>เปอร์เซ็นต์</th><th>สถานะ</th><th>เวลา</th><th>วันที่ส่ง</th></tr>
              </thead>
              <tbody>
                ${rows.map((row, index) => {
                  const passed = passedExam(row.score, row.max_score);
                  return `<tr>
                    <td class="rank">${index + 1}</td>
                    <td><strong>${escapeHtml(row.full_name)}</strong></td>
                    <td><span class="score-pill">${row.score}/${row.max_score}</span></td>
                    <td><strong>${formatPercentage(row.score, row.max_score)}</strong></td>
                    <td><span class="status-pill ${passed ? "pass" : "fail"}">${passed ? "ผ่าน" : "ไม่ผ่าน"}</span></td>
                    <td>${formatDuration(row.duration_seconds)}</td>
                    <td>${new Date(row.submitted_at).toLocaleString("th-TH")}</td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </section>`;

  document.querySelector("#leaderboard-start")?.addEventListener("click", startExam);
  document.querySelector("#clear-leaderboard")?.addEventListener("click", () => {
    if (window.confirm("คุณต้องการล้างประวัติ Score Board ทั้งหมดในเครื่องนี้ใช่หรือไม่?")) {
      localStorage.removeItem("rc-leaderboard");
      renderLeaderboard();
      showToast("ล้างประวัติเรียบร้อยแล้ว");
    }
  });
}

function renderResources() {
  const resources = config.resources || [];
  app.innerHTML = `<section class="page-head"><div class="container"><p class="eyebrow">LECTURE / REFERENCES</p><h1>เอกสารประกอบ</h1><p>ลิงก์สำหรับทบทวนก่อนเริ่มสอบ</p></div></section><section class="section"><div class="container"><div class="resource-grid">${resources.map((resource) => `<article class="resource-card ${resource.url ? "" : "disabled"}"><h3>${escapeHtml(resource.label)}</h3><p>${escapeHtml(resource.note || "")}</p>${resource.url ? `<a class="button" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">เปิดเอกสาร</a>` : '<button class="button" disabled>ยังไม่ได้ใส่ลิงก์</button>'}</article>`).join("")}</div></div></section>`;
}

function openAuth() { authDialog.showModal(); }

function handleAuth(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(authForm).entries());
  const fullName = (data.full_name || "").trim();
  if (!fullName) return;

  state.session = { full_name: fullName };
  localStorage.setItem("rc-session", JSON.stringify(state.session));

  authDialog.close();
  authForm.reset();
  updateHeader();
  showToast(`ยินดีต้อนรับคุณ ${fullName}`);
  if (state.route === "home" || !state.route) {
    startExam();
  } else {
    render();
  }
}

function logout() {
  localStorage.removeItem("rc-session");
  sessionStorage.removeItem("rc-attempt");
  sessionStorage.removeItem("rc-draft");
  sessionStorage.removeItem("rc-result");
  state.session = state.attempt = state.result = null;
  updateHeader();
  go("home");
  showToast("เปลี่ยนผู้เข้าสอบแล้ว");
}

function render() {
  updateHeader();
  if (state.route === "exam") renderExam();
  else if (state.route === "results") renderResults();
  else if (state.route === "leaderboard") renderLeaderboard();
  else if (state.route === "resources") renderResources();
  else renderHome();
  app.focus({ preventScroll: true });
}

authButton.addEventListener("click", () => state.session?.full_name ? logout() : openAuth());
authForm.addEventListener("submit", handleAuth);
document.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => go(button.dataset.route)));
window.addEventListener("hashchange", () => { state.route = location.hash.slice(1) || "home"; render(); });

state.route = location.hash.slice(1) || (state.result ? "results" : "home");
render();
