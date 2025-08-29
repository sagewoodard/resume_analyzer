export const resumes: Resume[] = [
  {
    id: "1",
    companyName: "Google",
    jobTitle: "Frontend Developer",
    imagePath: "/images/resume_01.png",
    resumePath: "/resumes/resume-1.pdf",
    feedback: {
      overallScore: 85,
      ATS: { score: 90, tips: [] },
      toneAndStyle: { score: 90, tips: [] },
      content: { score: 90, tips: [] },
      structure: { score: 90, tips: [] },
      skills: { score: 90, tips: [] },
    },
  },
  {
    id: "2",
    companyName: "Microsoft",
    jobTitle: "Cloud Engineer",
    imagePath: "/images/resume_02.png",
    resumePath: "/resumes/resume-2.pdf",
    feedback: {
      overallScore: 55,
      ATS: { score: 90, tips: [] },
      toneAndStyle: { score: 90, tips: [] },
      content: { score: 90, tips: [] },
      structure: { score: 90, tips: [] },
      skills: { score: 90, tips: [] },
    },
  },
  {
    id: "3",
    companyName: "Apple",
    jobTitle: "iOS Developer",
    imagePath: "/images/resume_03.png",
    resumePath: "/resumes/resume-3.pdf",
    feedback: {
      overallScore: 75,
      ATS: { score: 90, tips: [] },
      toneAndStyle: { score: 90, tips: [] },
      content: { score: 90, tips: [] },
      structure: { score: 90, tips: [] },
      skills: { score: 90, tips: [] },
    },
  },
  {
    id: "4",
    companyName: "Google",
    jobTitle: "Frontend Developer",
    imagePath: "/images/resume_01.png",
    resumePath: "/resumes/resume-1.pdf",
    feedback: {
      overallScore: 85,
      ATS: { score: 90, tips: [] },
      toneAndStyle: { score: 90, tips: [] },
      content: { score: 90, tips: [] },
      structure: { score: 90, tips: [] },
      skills: { score: 90, tips: [] },
    },
  },
  {
    id: "5",
    companyName: "Microsoft",
    jobTitle: "Cloud Engineer",
    imagePath: "/images/resume_02.png",
    resumePath: "/resumes/resume-2.pdf",
    feedback: {
      overallScore: 55,
      ATS: { score: 90, tips: [] },
      toneAndStyle: { score: 90, tips: [] },
      content: { score: 90, tips: [] },
      structure: { score: 90, tips: [] },
      skills: { score: 90, tips: [] },
    },
  },
  {
    id: "6",
    companyName: "Apple",
    jobTitle: "iOS Developer",
    imagePath: "/images/resume_03.png",
    resumePath: "/resumes/resume-3.pdf",
    feedback: {
      overallScore: 75,
      ATS: { score: 90, tips: [] },
      toneAndStyle: { score: 90, tips: [] },
      content: { score: 90, tips: [] },
      structure: { score: 90, tips: [] },
      skills: { score: 90, tips: [] },
    },
  },
];

/**
 * IMPORTANT: This is NOT a TS interface anymore.
 * It's a JSON SHAPE the model must follow. No comments, no markdown.
 * We keep it as a string so we can embed it in the prompt.
 */
export const AIResponseFormat = `
{
  "overallScore": 0,
  "ATS": {
    "score": 0,
    "tips": ["string", "string", "string"]
  },
  "toneAndStyle": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" },
      { "type": "improve", "tip": "string", "explanation": "string" }
    ]
  },
  "content": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" },
      { "type": "improve", "tip": "string", "explanation": "string" }
    ]
  },
  "structure": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" },
      { "type": "improve", "tip": "string", "explanation": "string" }
    ]
  },
  "skills": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" },
      { "type": "improve", "tip": "string", "explanation": "string" }
    ]
  }
}
`.trim();

/**
 * Strong, JSON-only instructions that match your UI.
 */
export const prepareInstructions = ({
  jobTitle,
  jobDescription,
}: {
  jobTitle: string;
  jobDescription: string;
}) => `
You are an expert ATS and resume analysis engine.

Analyze the attached resume for the role "${jobTitle}" using this job description:
"${jobDescription}"

Return ONLY a valid JSON object, with no markdown, no code fences, no comments, and no trailing commas.
All numeric scores MUST be integers from 0 to 100.
Tips MUST be concrete and tailored to the role and description.
Provide 3–4 tips per section (toneAndStyle, content, structure, skills).
For "ATS.tips", return plain strings (3–4 items).
Do not include any additional keys.

The JSON object MUST have this exact shape (keys and nesting):
${AIResponseFormat}
`.trim();