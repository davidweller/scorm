import OpenAI from "openai";

function parseJsonFromResponse(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, trimmed];
  const jsonStr = (match[1] ?? trimmed).trim();
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

export async function generateMultipleChoiceWithAI(
  apiKey: string,
  params: { topic: string; moduleTitle?: string }
): Promise<Record<string, unknown>> {
  const openai = new OpenAI({ apiKey });
  const prompt = `Create one multiple choice question (4 options, one correct) for a course about "${params.topic}"${params.moduleTitle ? `, module "${params.moduleTitle}"` : ""}.

Respond with ONLY this JSON (no markdown):
{"question": "Question text?", "answers": [{"text": "Option A", "correct": true}, {"text": "Option B", "correct": false}, ...]}
Exactly one answer must have "correct": true.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const raw = parseJsonFromResponse(content);
  const answers = Array.isArray(raw.answers) ? raw.answers : [];
  return {
    question: typeof raw.question === "string" ? raw.question : "Select the best answer.",
    answers: answers.map((a: { text?: string; correct?: boolean }) => ({
      text: typeof a.text === "string" ? a.text : String(a),
      correct: Boolean(a.correct),
    })),
  };
}

export async function generateFlashcardsWithAI(
  apiKey: string,
  params: { topic: string; moduleTitle?: string; count?: number }
): Promise<Record<string, unknown>> {
  const openai = new OpenAI({ apiKey });
  const count = params.count ?? 3;
  const prompt = `Create ${count} flashcards (term/concept on front, definition or explanation on back) for a course about "${params.topic}"${params.moduleTitle ? `, module "${params.moduleTitle}"` : ""}.

Respond with ONLY this JSON (no markdown):
{"cards": [{"front": "Term or question", "back": "Definition or answer"}, ...]}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const raw = parseJsonFromResponse(content);
  const cards = Array.isArray(raw.cards) ? raw.cards : [];
  return {
    cards: cards.map((c: { front?: string; back?: string }) => ({
      front: typeof c.front === "string" ? c.front : "",
      back: typeof c.back === "string" ? c.back : "",
    })),
  };
}
