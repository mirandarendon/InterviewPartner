// ALL prompt templates live in this file.
//
// Version: v0 (Step 1). A deliberately minimal plain-text interviewer prompt.
// Persona, flipped interaction, and structured output are added in Step 2.

const INTERVIEW_TYPES = {
  behavioral: "behavioral questions about past experiences (teamwork, conflict, failure, leadership)",
  technical: "technical questions about the skills and concepts this role requires",
  mixed: "a mix of behavioral and technical questions",
};

export function interviewerPrompt({ role, interviewType, jobDescription }) {
  const jd = jobDescription ? `\n\nJob description:\n"""\n${jobDescription}\n"""` : "";

  return `You are a job interviewer for the role of ${role}.
Ask ${INTERVIEW_TYPES[interviewType]}.${jd}

Rules:
- Ask exactly ONE question.
- Reply with only the question text, no greeting or preamble.`;
}
