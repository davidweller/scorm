const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const docxPath = path.join(process.cwd(), "W1 AI Foundations & Responsible Use.docx");
const outPath = path.join(process.cwd(), "docs", "example-course-w1-ai-foundations.md");

async function main() {
  try {
    const result = await mammoth.extractRawText({ path: docxPath });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, result.value, "utf-8");
    console.log("Extracted to", outPath);
    if (result.messages.length) {
      result.messages.forEach((m) => console.warn(m.type, m.message));
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
