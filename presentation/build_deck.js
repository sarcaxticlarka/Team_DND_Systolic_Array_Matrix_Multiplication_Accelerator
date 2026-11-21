// Build the 10-slide (under 5 minutes) Team DnD presentation.
//   NODE_PATH=<node_modules> PPTX_SKILL=<pptx skill dir> node presentation/build_deck.js
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const ROOT = path.resolve(__dirname, "..");
const SCRIPT = require("./speaker_script.js");
const OUT = path.join(ROOT, "presentation", "DnD_Systolic_Array_Presentation.pptx");

const THEME = {
  name: "DnD Silicon", headFontFace: "Arial", bodyFontFace: "Calibri",
  colors: { dk1: "0F2A3D", lt1: "FFFFFF", dk2: "3D5566", lt2: "EAF4F3", accent1: "1B998B", accent2: "F4A259",
    accent3: "E4572E", accent4: "5C80BC", accent5: "9BC53D", accent6: "8A9BA8", hlink: "1B998B", folHlink: "5C80BC" },
};
const HEX = THEME.colors;

async function icon(Comp, hex, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pres.title = "Systolic Array Matrix Multiplication Accelerator";
  pres.author = "Team DnD";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // every slide gets its speaker script as notes, in order
  const _addSlide = pres.addSlide.bind(pres);
  let _si = 0;
  pres.addSlide = (o) => {
    const sl = _addSlide(o), sc = SCRIPT[_si++];
    if (sc) sl.addNotes(`Speaker: ${sc.speaker}   (about ${sc.time} min)\n\n${sc.script.join("\n\n")}\n\nOn the slide: ${sc.point}`);
    return sl;
  };

  pres.defineSlideMaster({
    title: "DARK", background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 1.9, w: 7.4, h: 1.7,
        fontSize: 40, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.7, y: 3.85, w: 7.4, h: 2.6,
        fontSize: 17, color: C.background2, valign: "top", align: "left", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CONTENT", background: { color: C.background1 }, margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.95,
        fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: "Team DnD  ·  Systolic Array Accelerator", options: {
        x: 0.6, y: 6.95, w: 6, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
    ],
    slideNumber: { x: 12.2, y: 6.95, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
  });

  const I = {};
  const want = { heart: fa.FaHeartbeat, industry: fa.FaIndustry, recycle: fa.FaRecycle, check: fa.FaCheckCircle };
  for (const [k, comp] of Object.entries(want)) I[k] = await icon(comp, k === "check" ? HEX.accent1 : HEX.lt1);

  let n = 0;
  const tile = (s, x, y, sz, fill, img, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: sz, h: sz, rectRadius: Math.min(0.12, sz * 0.15),
      fill: { color: fill }, line: { color: fill }, objectName: (name || "tile") + "-" + (++n) });
    if (img) s.addImage({ data: img, x: x + sz * 0.25, y: y + sz * 0.25, w: sz * 0.5, h: sz * 0.5,
      altText: name || "icon", objectName: (name || "icon") + "-img-" + n });
  };
  const text = (s, t, o) => s.addText(t, Object.assign({ isTextBox: true, margin: 0, color: C.text1, fontSize: 16, valign: "top" }, o));
  const arrow = (s, x, y, w, h, color, dash) => s.addShape(pres.shapes.LINE, { x, y, w, h,
    line: { color: color || C.text2, width: 1.75, endArrowType: "triangle", dashType: dash || "solid" } });
  const line = (s, x, y, w, h, color, dash) => s.addShape(pres.shapes.LINE, { x, y, w, h,
    line: { color: color || C.text2, width: 1.75, dashType: dash || "solid" } });
  const card = (s, x, y, w, h, fill, name) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1,
    fill: { color: fill || C.background2 }, line: { color: fill || C.background2 }, objectName: name || "card-" + (++n) });
  const box = (s, x, y, w, h, t, fill, fc, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill }, objectName: name });
    text(s, t, { x, y, w, h, fontSize: 14, bold: true, align: "center", valign: "middle", color: fc || C.text1 });
  };

  // 1. Title ===============================================================
  pres.addSection({ title: "Presentation" });
  let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Presentation" });
  text(s, "PROJECT 12  ·  MODERN COMPUTER ARCHITECTURE", { x: 0.7, y: 1.3, w: 7.4, h: 0.4, fontSize: 14, bold: true, color: C.accent2, charSpacing: 2 });
  s.addText("Systolic Array Matrix Multiplication Accelerator", { placeholder: "title" });
  s.addText([
    { text: "Team DnD", options: { bold: true, fontSize: 20, color: C.background1, breakLine: true } },
    { text: "Syed Darain Qamar  ·  Md Sajjan  ·  Sibtain Ahmed Qureshi", options: { breakLine: true } },
    { text: "Abuzar Haideri  ·  Antik Mondal" },
  ], { placeholder: "body" });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const lit = i + j === 3, near = Math.abs(i + j - 3) === 1;
    tile(s, 8.75 + j * 1.0, 1.6 + i * 1.0, 0.8, lit ? C.accent2 : near ? C.accent1 : C.text2, null, "pe");
  }
  text(s, "4 × 4 grid of processing elements", { x: 8.75, y: 5.65, w: 3.8, h: 0.35, fontSize: 12, color: C.background2, italic: true });

  // 2. Problem =============================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("Matrix multiplication powers AI, but one-by-one is slow", { placeholder: "title" });
  const mini = (x, y, label, fill) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + j * 0.42, y: y + i * 0.42, w: 0.34, h: 0.34, rectRadius: 0.05,
        fill: { color: fill }, line: { color: fill }, objectName: "cell-" + (++n) });
    text(s, label, { x, y: y + 1.75, w: 1.6, h: 0.4, fontSize: 18, bold: true, align: "center" });
  };
  mini(0.8, 1.9, "A", C.accent1);
  text(s, "×", { x: 2.55, y: 2.25, w: 0.6, h: 0.7, fontSize: 36, bold: true, align: "center" });
  mini(3.2, 1.9, "B", C.accent4);
  text(s, "=", { x: 4.95, y: 2.25, w: 0.6, h: 0.7, fontSize: 36, bold: true, align: "center" });
  mini(5.6, 1.9, "C", C.accent2);
  text(s, [
    { text: "Each box of C = one row of A × one column of B, added up.", options: { breakLine: true } },
    { text: "Neural networks, image filters and chatbots do this billions of times." },
  ], { x: 0.8, y: 4.5, w: 6.6, h: 1.4, fontSize: 17, paraSpaceAfter: 10, color: C.text2 });
  card(s, 8.2, 1.6, 4.5, 2.25, C.background2, "stat-card-ops");
  text(s, "64", { x: 8.5, y: 1.8, w: 4, h: 1.0, fontSize: 60, bold: true, color: C.accent1 });
  text(s, "multiply-adds for one 4 × 4 product", { x: 8.5, y: 2.85, w: 4, h: 0.8, fontSize: 16, color: C.text2 });
  card(s, 8.2, 4.1, 4.5, 2.25, C.background2, "stat-card-cycles");
  text(s, "81", { x: 8.5, y: 4.3, w: 4, h: 1.0, fontSize: 60, bold: true, color: C.accent3 });
  text(s, "clock cycles with one calculator, one by one", { x: 8.5, y: 5.35, w: 4, h: 0.8, fontSize: 16, color: C.text2 });

  // 3. Idea ================================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("The idea: a grid of tiny workers that pass numbers along", { placeholder: "title" });
  const ideas = [
    [I.heart, C.accent3, "Like a heartbeat", "\"Systolic\" comes from the heart. Every clock tick, data is pumped one step forward through the grid."],
    [I.industry, C.accent1, "Like an assembly line", "Each worker (processing element) multiplies, adds, then hands the numbers to its neighbor."],
    [I.recycle, C.accent4, "Read once, use often", "Each number is read from memory once but used by 4 workers. Less memory traffic, more work."],
  ];
  ideas.forEach(([img, col, h, b], k) => {
    const x = 0.6 + k * 4.15;
    card(s, x, 1.65, 3.85, 4.75, C.background2, "idea-card-" + k);
    tile(s, x + 0.35, 1.95, 1.1, col, img, "idea-icon");
    text(s, h, { x: x + 0.35, y: 3.3, w: 3.2, h: 0.5, fontSize: 21, bold: true });
    text(s, b, { x: x + 0.35, y: 3.9, w: 3.2, h: 2.2, fontSize: 16, color: C.text2 });
  });

  // 4. Architecture ========================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("How the pieces connect", { placeholder: "title" });
  box(s, 0.6, 1.75, 1.8, 3.05, "Host\n(load A, B\nstart,\nread C)", C.text1, C.background1, "host");
  box(s, 3.0, 1.75, 1.9, 0.8, "Input buffer B", C.background2, null, "buf-b");
  box(s, 3.0, 4.0, 1.9, 0.8, "Input buffer A", C.background2, null, "buf-a");
  box(s, 5.4, 1.75, 1.9, 0.8, "Delay (skew) B", "FCE3CC", null, "skew-b");
  box(s, 5.4, 4.0, 1.9, 0.8, "Delay (skew) A", "FCE3CC", null, "skew-a");
  arrow(s, 2.4, 2.15, 0.6, 0); arrow(s, 2.4, 4.4, 0.6, 0);
  arrow(s, 4.9, 2.15, 0.5, 0); arrow(s, 4.9, 4.4, 0.5, 0);
  {
    const g0x = 7.9, g0y = 2.75, ts = 0.55, st = 0.7;
    line(s, 7.3, 2.15, 2.975, 0, C.accent4);
    for (let j = 0; j < 4; j++) arrow(s, g0x + j * st + ts / 2, 2.15, 0, 0.6, C.accent4);
    line(s, 7.3, 4.4, 0.3, 0, C.accent1); line(s, 7.6, g0y + ts / 2, 0, 3 * st, C.accent1);
    for (let i = 0; i < 4; i++) arrow(s, 7.6, g0y + i * st + ts / 2, 0.3, 0, C.accent1);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) tile(s, g0x + j * st, g0y + i * st, ts, C.accent2, null, "pe");
  }
  text(s, "4 × 4 PE grid", { x: 7.9, y: 5.5, w: 2.65, h: 0.35, fontSize: 14, bold: true, align: "center" });
  box(s, 11.0, 3.35, 1.75, 1.3, "Output\nregisters\n(16 answers)", "E4DDF4", null, "out");
  arrow(s, 10.55, 4.0, 0.45, 0);
  box(s, 3.0, 5.6, 4.3, 0.8, "Controller (state machine)", "DDEFD6", null, "ctrl");
  arrow(s, 3.95, 5.6, 0, -0.8, C.text2, "dash");
  line(s, 7.3, 6.0, 4.575, 0, C.text2, "dash");
  arrow(s, 11.875, 6.0, 0, -1.35, C.text2, "dash");
  text(s, "A rows enter from the left  →", { x: 7.9, y: 6.1, w: 3.0, h: 0.3, fontSize: 12, color: C.accent1, bold: true });
  text(s, "B columns enter from the top ↓", { x: 7.9, y: 1.35, w: 3.2, h: 0.3, fontSize: 12, color: C.accent4, bold: true });

  // 5. Processing element ==================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("One processing element does just three things", { placeholder: "title" });
  const steps = [["1", "Receive", "Takes a number of A from the left and a number of B from above."],
    ["2", "Multiply-add", "total = total + (a × b). The total stays inside this worker."],
    ["3", "Pass on", "Next clock tick: sends a to the right and b to the worker below."]];
  steps.forEach(([num, h, b], k) => {
    const y = 1.7 + k * 1.6;
    tile(s, 0.6, y, 0.9, C.accent1, null, "step");
    text(s, num, { x: 0.6, y, w: 0.9, h: 0.9, fontSize: 28, bold: true, align: "center", valign: "middle", color: C.background1 });
    text(s, h, { x: 1.75, y: y + 0.02, w: 4.6, h: 0.45, fontSize: 20, bold: true });
    text(s, b, { x: 1.75, y: y + 0.5, w: 4.6, h: 0.9, fontSize: 15, color: C.text2 });
  });
  card(s, 7.6, 2.3, 3.4, 2.6, C.background2, "pe-body");
  text(s, "Processing Element", { x: 7.6, y: 2.4, w: 3.4, h: 0.35, fontSize: 13, bold: true, align: "center", color: C.text2 });
  s.addShape(pres.shapes.OVAL, { x: 8.0, y: 3.05, w: 0.8, h: 0.8, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: "mul" });
  text(s, "×", { x: 8.0, y: 3.05, w: 0.8, h: 0.8, fontSize: 26, bold: true, align: "center", valign: "middle" });
  s.addShape(pres.shapes.OVAL, { x: 9.0, y: 3.05, w: 0.8, h: 0.8, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: "add" });
  text(s, "+", { x: 9.0, y: 3.05, w: 0.8, h: 0.8, fontSize: 26, bold: true, align: "center", valign: "middle" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.95, y: 3.1, w: 0.85, h: 0.7, rectRadius: 0.06, fill: { color: C.text1 }, line: { color: C.text1 }, objectName: "acc" });
  text(s, "total", { x: 9.95, y: 3.1, w: 0.85, h: 0.7, fontSize: 13, bold: true, align: "center", valign: "middle", color: C.background1 });
  arrow(s, 8.8, 3.45, 0.2, 0); arrow(s, 9.8, 3.45, 0.15, 0);
  arrow(s, 6.4, 3.45, 1.6, 0, C.accent1);
  text(s, "a (from left)", { x: 6.3, y: 3.0, w: 1.4, h: 0.3, fontSize: 13, bold: true, color: C.accent1 });
  arrow(s, 8.4, 1.55, 0, 1.5, C.accent4);
  text(s, "b (from above)", { x: 8.55, y: 1.6, w: 1.6, h: 0.3, fontSize: 13, bold: true, color: C.accent4 });
  arrow(s, 11.0, 4.4, 1.3, 0, C.accent1);
  text(s, "a → right", { x: 11.1, y: 4.0, w: 1.4, h: 0.3, fontSize: 13, bold: true, color: C.accent1 });
  arrow(s, 9.3, 4.9, 0, 1.1, C.accent4);
  text(s, "b → down", { x: 9.45, y: 5.5, w: 1.4, h: 0.3, fontSize: 13, bold: true, color: C.accent4 });

  // 6. Skew ================================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("The trick: delay each row so the right numbers meet", { placeholder: "title" });
  text(s, [
    { text: "Row 0 of A starts at once, row 1 waits 1 tick, row 2 waits 2 ticks.", options: { bullet: true, breakLine: true } },
    { text: "Columns of B are delayed the same way from the top.", options: { bullet: true, breakLine: true } },
    { text: "So a(i,k) and b(k,j) always reach worker (i,j) in the same tick.", options: { bullet: true } },
  ], { x: 0.6, y: 1.7, w: 5.6, h: 2.4, fontSize: 17, paraSpaceAfter: 10, color: C.text2 });
  card(s, 0.6, 4.35, 5.6, 1.9, C.text1, "formula-card");
  text(s, "Meeting time = k + i + j", { x: 0.9, y: 4.6, w: 5.0, h: 0.7, fontSize: 28, bold: true, color: C.accent2 });
  text(s, "the same for A and B, so they always line up", { x: 0.9, y: 5.35, w: 5.0, h: 0.6, fontSize: 15, color: C.background2 });
  {
    const gx = 9.4, gy = 4.0, t3 = 0.42, p3 = 0.5;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) tile(s, gx + j * p3, gy + i * p3, t3, C.accent2, null, "pe3");
    const feed = (x, y, lbl, col, wait, nm) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: t3, h: t3, rectRadius: 0.05, fill: { color: wait ? C.background1 : col },
        line: { color: wait ? C.accent6 : col, dashType: wait ? "dash" : "solid" }, objectName: nm + "-" + (++n) });
      if (!wait) text(s, lbl, { x, y, w: t3, h: t3, fontSize: 10, bold: true, align: "center", valign: "middle", color: C.background1 });
    };
    for (let i = 0; i < 3; i++) for (let sl = 0; sl < 3 + i; sl++) feed(gx - (sl + 1) * p3, gy + i * p3, `a${i}${sl - i}`, C.accent1, sl < i, "a-feed");
    for (let j = 0; j < 3; j++) for (let sl = 0; sl < 3 + j; sl++) feed(gx + j * p3, gy - (sl + 1) * p3, `b${sl - j}${j}`, C.accent4, sl < j, "b-feed");
  }
  text(s, "dashed = wait one tick", { x: 6.9, y: 5.65, w: 2.4, h: 0.3, fontSize: 12, italic: true, color: C.text2 });
  text(s, "(shown for 3 × 3)", { x: 9.4, y: 5.65, w: 1.5, h: 0.3, fontSize: 12, italic: true, color: C.text2 });

  // 7. Controller ==========================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("The controller runs six steps — 13 clock cycles in total", { placeholder: "title" });
  const fsm = [["IDLE", "wait for start", "–", C.accent6], ["CLEAR", "reset all totals", "1", C.accent1],
    ["FEED", "send 4 slices of A and B", "4", C.accent1], ["DRAIN", "let the wave reach the last PE", "7", C.accent1],
    ["CAPTURE", "copy 16 answers out", "1", C.accent1], ["DONE", "signal 'finished'", "–", C.accent6]];
  fsm.forEach(([nm, d, cy, col], k) => {
    const x = 0.84 + k * 2.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.9, w: 1.65, h: 1.0, rectRadius: 0.12, fill: { color: col }, line: { color: col }, objectName: "state-" + nm });
    text(s, nm, { x, y: 1.9, w: 1.65, h: 1.0, fontSize: 17, bold: true, align: "center", valign: "middle", color: C.background1 });
    text(s, d, { x, y: 3.05, w: 1.65, h: 0.85, fontSize: 13, align: "center", color: C.text2 });
    text(s, cy === "–" ? "" : cy + (cy === "1" ? " cycle" : " cycles"), { x, y: 3.9, w: 1.65, h: 0.4, fontSize: 15, bold: true, align: "center", color: C.accent3 });
    if (k < 5) arrow(s, x + 1.67, 2.4, 0.31, 0);
  });
  card(s, 0.84, 4.75, 11.65, 1.6, C.background2, "latency-card");
  text(s, "1 + 4 + 7 + 1 = 13 cycles", { x: 1.2, y: 4.95, w: 6.0, h: 0.75, fontSize: 32, bold: true });
  text(s, "For an N × N array:  1 + N + (2N − 1) + 1 = 3N + 1", { x: 1.2, y: 5.7, w: 7.0, h: 0.45, fontSize: 16, color: C.text2 });
  text(s, "7 drain cycles is the minimum: with 6, the last PE is read too early and the test fails.",
    { x: 8.6, y: 4.95, w: 3.7, h: 1.25, fontSize: 14, italic: true, color: C.text2 });

  // 8. Verification ========================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("Tested step by step: 2,800 answers, 0 mistakes", { placeholder: "title" });
  card(s, 0.6, 1.6, 2.6, 1.9, C.text1, "stat-2800");
  text(s, "2,800", { x: 0.8, y: 1.75, w: 2.3, h: 0.9, fontSize: 40, bold: true, color: C.accent2 });
  text(s, "answers checked", { x: 0.8, y: 2.7, w: 2.3, h: 0.5, fontSize: 15, color: C.background2 });
  card(s, 3.4, 1.6, 2.4, 1.9, C.text1, "stat-0");
  text(s, "0", { x: 3.6, y: 1.75, w: 2.0, h: 0.9, fontSize: 40, bold: true, color: C.accent1 });
  text(s, "mistakes", { x: 3.6, y: 2.7, w: 2.0, h: 0.5, fontSize: 15, color: C.background2 });
  ["MAC unit: 74 checks", "One processing element: 14 checks", "Full 3×3 and 4×4 arrays: 224 products", "Every answer re-checked in Python"]
    .forEach((tx, k) => {
      const y = 3.85 + k * 0.68;
      s.addImage({ data: I.check, x: 0.6, y: y + 0.03, w: 0.4, h: 0.4, altText: "passed", objectName: "check-" + k });
      text(s, tx, { x: 1.2, y, w: 4.6, h: 0.5, fontSize: 16, valign: "middle" });
    });
  // waveform image (aspect from file: 7.16 x ~4.0 in)
  s.addImage({ path: path.join(ROOT, "docs/figures/waveform_worked_example.png"), x: 6.2, y: 1.6, w: 6.5, h: 3.44,
    altText: "Simulation waveform of the 4x4 example showing staggered inputs and growing totals", objectName: "waveform" });
  text(s, "Simulation waveform: staircase inputs, first total grows 16 → 40 → 64 → 80", { x: 6.2, y: 5.19, w: 6.5, h: 0.35, fontSize: 12, italic: true, color: C.text2 });

  // 9. Results =============================================================
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
  s.addText("Results: 6× fewer cycles, 7.9× faster on FPGA", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [
    { name: "One multiplier", labels: ["2×2", "3×3", "4×4", "5×5", "6×6", "8×8"], values: [13, 37, 81, 151, 253, 577] },
    { name: "Systolic array", labels: ["2×2", "3×3", "4×4", "5×5", "6×6", "8×8"], values: [7, 10, 13, 16, 19, 25] },
  ], { x: 0.6, y: 1.45, w: 6.9, h: 5.2, barDir: "col", barGrouping: "clustered",
    chartColors: [HEX.accent3, HEX.accent1], showValue: true, dataLabelPosition: "outEnd",
    dataLabelFontSize: 11, dataLabelColor: HEX.dk2, dataLabelFontFace: "+mn-lt",
    valAxisLogScaleBase: 10, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 13, catAxisLabelFontFace: "+mn-lt",
    showLegend: true, legendPos: "t", legendFontSize: 13, legendColor: HEX.dk2, legendFontFace: "+mn-lt",
    showTitle: true, title: "Clock cycles per matrix product (lower is better)", titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: "+mn-lt" });
  [["6.2×", "fewer cycles at 4 × 4\n(13 vs 81)", C.accent1], ["7.9×", "faster in real time\n(110 ns vs 874 ns)", C.accent3],
   ["127 MHz", "clock speed with\npipelined MAC", C.accent4], ["16 + 233", "multipliers + logic\ncells (Artix-7)", C.accent2]]
    .forEach(([v, l, col], k) => {
      const x = 7.9 + (k % 2) * 2.45, y = 1.6 + Math.floor(k / 2) * 2.55;
      card(s, x, y, 2.3, 2.3, C.background2, "result-" + k);
      text(s, v, { x: x + 0.2, y: y + 0.25, w: 1.95, h: 0.8, fontSize: k > 1 ? 28 : 40, bold: true, color: col, valign: "middle" });
      text(s, l, { x: x + 0.2, y: y + 1.2, w: 1.95, h: 0.9, fontSize: 14, color: C.text2 });
    });

  // 10. Closing ============================================================
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Presentation" });
  s.addText("Thank you — questions?", { placeholder: "title" });
  s.addText([
    { text: "16 workers, data pumped like a heartbeat", options: { bullet: true, breakLine: true } },
    { text: "Exactly 13 cycles for a 4 × 4 product", options: { bullet: true, breakLine: true } },
    { text: "2,800 answers checked, 0 mistakes", options: { bullet: true, breakLine: true } },
    { text: "7.9× faster than one multiplier on FPGA", options: { bullet: true } },
  ], { placeholder: "body", paraSpaceAfter: 8 });
  text(s, "TEAM DnD", { x: 8.6, y: 1.9, w: 4.2, h: 0.4, fontSize: 14, bold: true, color: C.accent2, charSpacing: 2 });
  [["Syed Darain Qamar", "architecture & integration"], ["Md Sajjan", "MAC unit & processing element"],
   ["Sibtain Ahmed Qureshi", "controller & buffers"], ["Abuzar Haideri", "testing & verification"], ["Antik Mondal", "FPGA, baseline & results"]]
    .forEach(([nm, role], k) => {
      const y = 2.45 + k * 0.78;
      text(s, nm, { x: 8.6, y, w: 4.2, h: 0.35, fontSize: 17, bold: true, color: C.background1 });
      text(s, role, { x: 8.6, y: y + 0.36, w: 4.2, h: 0.3, fontSize: 13, color: C.background2 });
    });

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
