from __future__ import annotations

import math
from collections import Counter
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


app = FastAPI(title="HackHub AI Service", version="1.0.0")


class UserProfile(BaseModel):
    id: str | None = None
    name: str | None = None
    skills: list[str] = Field(default_factory=list)


class TeamMatchRequest(BaseModel):
    requester: UserProfile
    candidates: list[UserProfile] = Field(default_factory=list)
    teamSettings: dict[str, Any] = Field(default_factory=dict)


class EvaluationRequest(BaseModel):
    projectTitle: str
    description: str
    githubUrl: str
    techStack: list[str] = Field(default_factory=list)


class SubmissionPayload(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    projectTitle: str
    description: str
    techStack: list[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class SimilarityRequest(BaseModel):
    submissions: list[SubmissionPayload] = Field(default_factory=list)


def normalize_skills(skills: list[str]) -> set[str]:
    return {skill.strip().lower() for skill in skills if skill.strip()}


def cosine_for_sets(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    intersection = len(a & b)
    return intersection / math.sqrt(len(a) * len(b))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "hackhub-ai"}


@app.post("/team-match")
def team_match(payload: TeamMatchRequest) -> dict[str, Any]:
    requester_skills = normalize_skills(payload.requester.skills)
    max_size = int(payload.teamSettings.get("maxSize", 4))
    group_size = max(1, max_size - 1)

    scored = []
    for candidate in payload.candidates:
        candidate_skills = normalize_skills(candidate.skills)
        overlap = cosine_for_sets(requester_skills, candidate_skills)
        complementary = len(candidate_skills - requester_skills) / max(len(candidate_skills), 1)
        score = round(min(100, 45 + overlap * 35 + complementary * 20))
        scored.append(
            {
                "user": candidate.model_dump(),
                "score": score,
                "rationale": f"{round(overlap * 100)}% skill similarity with complementary coverage.",
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    recommendations = []
    for start in range(0, len(scored), group_size):
        chunk = scored[start : start + group_size]
        if not chunk:
            continue
        recommendations.append(
            {
                "users": [item["user"] for item in chunk],
                "aiMatchScore": round(sum(item["score"] for item in chunk) / len(chunk)),
                "rationale": "; ".join(item["rationale"] for item in chunk),
            }
        )

    return {"recommendations": recommendations[:10]}


@app.post("/evaluate")
def evaluate(payload: EvaluationRequest) -> dict[str, Any]:
    words = [word for word in payload.description.lower().split() if len(word) > 3]
    unique_ratio = len(set(words)) / max(len(words), 1)
    tech_depth = min(len(set(payload.techStack)), 10)
    has_demo_language = any(token in payload.description.lower() for token in ["user", "impact", "scale", "secure"])

    innovation_score = round(min(100, 55 + unique_ratio * 25 + tech_depth * 2))
    documentation_score = round(min(100, 35 + min(len(payload.description), 1000) / 12))
    complexity_score = round(min(100, 45 + tech_depth * 5 + (10 if has_demo_language else 0)))
    overall_score = round(innovation_score * 0.4 + documentation_score * 0.25 + complexity_score * 0.35)

    return {
        "innovationScore": innovation_score,
        "documentationScore": documentation_score,
        "complexityScore": complexity_score,
        "overallScore": overall_score,
        "summary": f"{payload.projectTitle} shows a {overall_score}/100 overall readiness score based on submitted metadata.",
        "suggestions": [
            "Strengthen the README with setup, architecture, and deployment details.",
            "Quantify user impact and explain why the approach is novel.",
            "Attach screenshots or a demo video to reduce judging ambiguity.",
        ],
    }


@app.post("/similarity")
def similarity(payload: SimilarityRequest) -> dict[str, Any]:
    if len(payload.submissions) < 2:
        return {"flags": []}

    documents = [
        f"{submission.projectTitle} {submission.description} {' '.join(submission.techStack)}"
        for submission in payload.submissions
    ]
    matrix = TfidfVectorizer(stop_words="english").fit_transform(documents)
    similarities = cosine_similarity(matrix)
    flags = []

    for i in range(len(payload.submissions)):
        for j in range(i + 1, len(payload.submissions)):
            score = float(similarities[i][j])
            if score >= 0.7:
                flags.append(
                    {
                        "sourceSubmissionId": payload.submissions[i].id,
                        "targetSubmissionId": payload.submissions[j].id,
                        "sourceTitle": payload.submissions[i].projectTitle,
                        "targetTitle": payload.submissions[j].projectTitle,
                        "similarity": round(score, 3),
                    }
                )

    return {"flags": flags}


@app.post("/analytics")
def analytics(payload: dict[str, Any]) -> dict[str, Any]:
    participants = payload.get("participants", [])
    submissions = payload.get("submissions", [])
    skill_counts = Counter(
        skill.lower()
        for participant in participants
        for skill in participant.get("skills", [])
        if isinstance(skill, str)
    )
    scores = [submission.get("finalScore") for submission in submissions if submission.get("finalScore") is not None]
    average_score = round(sum(scores) / len(scores), 2) if scores else 0

    return {
        "funnel": {
            "registrations": len(participants),
            "submissions": len(submissions),
        },
        "skillDistribution": skill_counts.most_common(25),
        "averageScore": average_score,
    }
