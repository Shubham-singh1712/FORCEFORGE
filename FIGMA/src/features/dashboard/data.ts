export const weeklyFocusHours = [
  { day: "Mon", hours: 4.2, score: 82 },
  { day: "Tue", hours: 3.8, score: 78 },
  { day: "Wed", hours: 5.1, score: 91 },
  { day: "Thu", hours: 3.5, score: 76 },
  { day: "Fri", hours: 4.7, score: 88 },
  { day: "Sat", hours: 2.9, score: 70 },
  { day: "Sun", hours: 3.2, score: 74 },
];

export const appUsage = [
  { id: "notion", name: "Notion", minutes: 96, category: "productive", color: "#10D980" },
  { id: "vscode", name: "VS Code", minutes: 132, category: "productive", color: "#3B82F6" },
  { id: "instagram", name: "Instagram", minutes: 72, category: "distracting", color: "#EC4899" },
  { id: "youtube", name: "YouTube", minutes: 48, category: "distracting", color: "#EF4444" },
  { id: "slack", name: "Slack", minutes: 38, category: "neutral", color: "#8B5CF6" },
];

export const focusHeatmap = [
  [0, 1, 2, 1, 3, 2, 1],
  [2, 3, 2, 4, 3, 2, 1],
  [1, 2, 3, 2, 4, 3, 2],
  [3, 4, 3, 3, 2, 4, 3],
];

export const weeklyReport = {
  focusHours: 23.8,
  improvement: 15,
  distractionRatio: 32,
  riskScore: 32,
  mostUsedApps: [
    { name: "Instagram", time: "4.2h", change: -12 },
    { name: "YouTube", time: "3.1h", change: -8 },
    { name: "Slack", time: "2.4h", change: 4 },
  ],
  summary:
    "Your most productive days were Monday and Thursday, with focus scores above 90. Blocking the evening distraction window reduced non-work screen time by 23%.",
};
