import { api, unwrap } from "./api";

export const authApi = {
  register: (payload) => unwrap(api.post("/auth/register", payload)),
  login: (payload) => unwrap(api.post("/auth/login", payload)),
  logout: () => unwrap(api.post("/auth/logout")),
  me: () => unwrap(api.get("/auth/me"))
};

export const hackathonApi = {
  list: async (params) => (await api.get("/hackathons", { params })).data,
  get: (id) => unwrap(api.get(`/hackathons/${id}`)),
  create: (payload) => unwrap(api.post("/hackathons", payload)),
  register: (id) => unwrap(api.post(`/hackathons/${id}/register`)),
  publish: (id) => unwrap(api.post(`/hackathons/${id}/publish`)),
  announce: (id, payload) => unwrap(api.post(`/hackathons/${id}/announce`, payload))
};

export const teamApi = {
  create: (payload) => unwrap(api.post("/teams", payload)),
  get: (id) => unwrap(api.get(`/teams/${id}`)),
  invite: (id, payload) => unwrap(api.post(`/teams/${id}/invite`, payload)),
  requestJoin: (id, payload) => unwrap(api.post(`/teams/${id}/request`, payload))
};

export const submissionApi = {
  create: (payload) => unwrap(api.post("/submissions", payload)),
  get: (id) => unwrap(api.get(`/submissions/${id}`)),
  update: (id, payload) => unwrap(api.put(`/submissions/${id}`, payload)),
  submit: (id) => unwrap(api.patch(`/submissions/${id}/submit`))
};

export const judgeApi = {
  assignments: () => unwrap(api.get("/judge/assignments")),
  submissions: (hackathonId) => unwrap(api.get(`/judge/${hackathonId}/submissions`)),
  leaderboard: (hackathonId) => unwrap(api.get(`/judge/${hackathonId}/leaderboard`)),
  score: (payload) => unwrap(api.post("/judge/score", payload)),
  publishResults: (hackathonId) => unwrap(api.post(`/judge/${hackathonId}/publish-results`))
};

export const aiApi = {
  teamMatch: (payload) => unwrap(api.post("/ai/team-match", payload)),
  evaluate: (submissionId) => unwrap(api.post(`/ai/evaluate/${submissionId}`)),
  similarity: (hackathonId) => unwrap(api.post(`/ai/similarity/${hackathonId}`))
};

export const notificationApi = {
  list: async () => (await api.get("/notifications")).data,
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`))
};
