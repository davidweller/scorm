/**
 * Script to generate the course import template DOCX file.
 * Run with: npx tsx scripts/generate-course-template.ts
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import * as fs from "fs";
import * as path from "path";

async function generateTemplate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Course Title Here",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "[Replace with your course title]",
                italics: true,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),

          // Introduction (pre-Module content)
          new Paragraph({
            text: "Introduction",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Everything in this Introduction section will be imported as the course introduction page (before Module 1).",
                italics: true,
                color: "666666",
              }),
            ],
          }),
          new Paragraph({
            text: "Use this section for course overview, how to use the course, prerequisites, time expectations, and any opening remarks for learners.",
          }),
          new Paragraph({ text: "" }),

          // Course Overview
          new Paragraph({
            text: "Course Overview",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: "Write a 2-4 sentence description of what this course covers and what learners will gain from completing it.",
          }),
          new Paragraph({ text: "" }),

          // Target Audience
          new Paragraph({
            text: "Target Audience",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: "Describe who this course is designed for (e.g., corporate professionals, undergraduate students, healthcare workers).",
          }),
          new Paragraph({ text: "" }),

          // Learning Outcomes
          new Paragraph({
            text: "Learning Outcomes",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: "By the end of this course, learners will be able to:",
          }),
          new Paragraph({
            text: "• [Learning outcome 1 - use action verbs like 'identify', 'explain', 'apply', 'analyze']",
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: "• [Learning outcome 2]",
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: "• [Learning outcome 3]",
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: "• [Add more as needed]",
            bullet: { level: 0 },
          }),
          new Paragraph({ text: "" }),

          // Assessment Plan
          new Paragraph({
            text: "Assessment Plan",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: "Describe how learners will be assessed (e.g., knowledge checks throughout each module, end-of-module quizzes, final assessment).",
          }),
          new Paragraph({ text: "" }),

          // Divider
          new Paragraph({
            border: {
              bottom: { color: "999999", space: 1, size: 6, style: BorderStyle.SINGLE },
            },
            text: "",
          }),
          new Paragraph({ text: "" }),

          // Module 1
          new Paragraph({
            text: "Module 1: Introduction to [Topic]",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: "" }),

          // Lesson 1.1
          new Paragraph({
            text: "Lesson 1.1: Getting Started",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Welcome and Introduction",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: "Write your lesson introduction here. This paragraph introduces the topic and sets expectations for what learners will discover in this lesson.",
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Key Concepts",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: "Explain the main concepts of this section. Break complex topics into digestible paragraphs. Use clear, concise language appropriate for your target audience.",
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Key Insight: ", bold: true }),
              new TextRun({
                text: "Highlight important takeaways like this. These will be converted into callout boxes.",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Quiz example
          new Paragraph({
            children: [
              new TextRun({ text: "Quiz: ", bold: true }),
              new TextRun({ text: "What is the primary purpose of [concept]?" }),
            ],
          }),
          new Paragraph({ text: "A) First option" }),
          new Paragraph({ text: "B) Second option" }),
          new Paragraph({ text: "C) Third option (correct)" }),
          new Paragraph({ text: "D) Fourth option" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Correct answer: C. ", bold: true }),
              new TextRun({ text: "Explanation of why this is correct." }),
            ],
          }),
          new Paragraph({ text: "" }),

          // True/False example
          new Paragraph({
            children: [
              new TextRun({ text: "True or False: ", bold: true }),
              new TextRun({ text: "[Statement to evaluate]" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Answer: True. ", bold: true }),
              new TextRun({ text: "Explanation of why this is true/false." }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Reflection example
          new Paragraph({
            children: [
              new TextRun({ text: "Reflection: ", bold: true }),
              new TextRun({
                text: "Think about how this concept applies to your own work. What challenges might you face when implementing this?",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Drag and Drop example
          new Paragraph({
            children: [
              new TextRun({ text: "Drag and Drop: ", bold: true }),
              new TextRun({ text: "Put the following steps in the correct order:" }),
            ],
          }),
          new Paragraph({ text: "1. [First step in the sequence]" }),
          new Paragraph({ text: "2. [Second step in the sequence]" }),
          new Paragraph({ text: "3. [Third step in the sequence]" }),
          new Paragraph({ text: "4. [Fourth step in the sequence]" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Explanation: ", bold: true }),
              new TextRun({ text: "Explain why this order is correct." }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Flashcards example
          new Paragraph({
            children: [
              new TextRun({ text: "Flashcards: ", bold: true }),
              new TextRun({ text: "Key Terms Review" }),
            ],
          }),
          new Paragraph({
            text: "Front: What is [Term 1]?",
          }),
          new Paragraph({
            text: "Back: [Definition or explanation of Term 1]",
          }),
          new Paragraph({
            text: "Front: What is [Term 2]?",
          }),
          new Paragraph({
            text: "Back: [Definition or explanation of Term 2]",
          }),
          new Paragraph({
            text: "Front: What is [Term 3]?",
          }),
          new Paragraph({
            text: "Back: [Definition or explanation of Term 3]",
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: "Summarize the key points covered in this lesson. Reinforce the learning outcomes and prepare learners for the next lesson.",
          }),
          new Paragraph({ text: "" }),

          // Lesson 1.2
          new Paragraph({
            text: "Lesson 1.2: Core Principles",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: "[Continue with lesson content following the same structure...]",
          }),
          new Paragraph({ text: "" }),

          // Module 2
          new Paragraph({
            text: "Module 2: [Next Major Topic]",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "[Continue building out your course structure...]",
          }),
          new Paragraph({ text: "" }),

          // Tips section
          new Paragraph({
            border: {
              bottom: { color: "999999", space: 1, size: 6, style: BorderStyle.SINGLE },
            },
            text: "",
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Template Usage Tips",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Structure Recognition:", bold: true }),
            ],
          }),
          new Paragraph({
            text: "• Heading 1 = Module titles",
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: "• Heading 2 = Lesson titles",
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: "• Heading 3 = Page/section titles within lessons",
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: "• Regular paragraphs = Content text",
            bullet: { level: 0 },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Interaction Markers:", bold: true }),
            ],
          }),
          new Paragraph({
            text: '• "Quiz:" followed by question and options = Multiple choice',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• "True or False:" = True/false question',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• "Reflection:" = Open-ended reflection prompt',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• "Drag and Drop:" with numbered items = Sequence/ordering exercise',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• "Match the following:" = Matching exercise',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• "Flashcards:" followed by Front:/Back: pairs = Dialog/flip cards',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• "Key Insight:" or "Key Point:" = Callout boxes',
            bullet: { level: 0 },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Delete this tips section before importing your course.",
                italics: true,
                color: "666666",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), "public/templates/course-template.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Template generated at: ${outputPath}`);
}

generateTemplate().catch(console.error);
