const env = require("../config/env");

async function callAi(path, body) {
  const response = await fetch(`${env.aiServiceUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`AI service failed: ${text}`);
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

function localEvaluation(submission) {
  const techCount = submission.techStack?.length || 1;
  const descriptionLength = submission.description?.length || 0;
  const documentationScore = Math.min(100, Math.round(descriptionLength / 8));
  const complexityScore = Math.min(100, 45 + techCount * 8);
  const innovationScore = Math.min(100, 55 + new Set(submission.techStack || []).size * 5);
  const overallScore = Math.round(
    innovationScore * 0.4 + documentationScore * 0.25 + complexityScore * 0.35
  );

  return {
    innovationScore,
    documentationScore,
    complexityScore,
    overallScore,
    summary: "Initial local evaluation based on description detail and technology breadth.",
    suggestions: [
      "Add measurable user impact and validation details.",
      "Document architecture decisions and setup steps.",
      "Include demo evidence for the judging panel."
    ],
    evaluatedAt: new Date()
  };
}

module.exports = { callAi, localEvaluation };
