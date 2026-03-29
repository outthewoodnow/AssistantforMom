export type SuggestedAction = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  coaching: string;
  examplePrompt: string;
  questions: string[];
};

export type UserProfile = {
  name: string;
  goals: string;
  comfortLevel: string;
  device: string;
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "Christina",
  goals:
    "Use AI confidently for healthcare-related work tasks, clear communication, and safer decisions around online information.",
  comfortLevel: "beginner",
  device: "laptop",
};

export const SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    id: "organize-data",
    title: "Let me help organize information",
    shortLabel: "Organize data",
    description:
      "Turn notes, scheduling details, follow-ups, or messy information into clear categories, summaries, or tables.",
    coaching:
      "A helpful prompt names the kind of information, where it came from, and what organized result would be easiest for you to use.",
    examplePrompt:
      "Organize these follow-up notes into a simple checklist by priority, due date, and who needs a response.",
    questions: [
      "What kind of information are we organizing?",
      "Can you paste it here or describe where it came from?",
      "Would you like a summary, categories, a checklist, or a table?",
    ],
  },
  {
    id: "write-email",
    title: "Let me write or reply to an email",
    shortLabel: "Write emails",
    description:
      "Draft a message that sounds calm, clear, and appropriate for coworkers, clients, patients, or outside offices.",
    coaching:
      "The best email prompts usually include who the message is for, what you want the reader to do, and the tone you want to sound like.",
    examplePrompt:
      "Write a professional email to a provider's office asking for a status update on the requested records. Keep it polite and concise.",
    questions: [
      "Who is the email going to?",
      "What do you want the email to achieve?",
      "Should it sound friendly, professional, or firm?",
    ],
  },
  {
    id: "check-claim",
    title: "Let me help check if something online is true",
    shortLabel: "Check a claim",
    description:
      "Review a post, message, article, or health-related claim and separate facts, uncertainty, and opinion.",
    coaching:
      "A careful fact-checking prompt shares the exact claim, where you saw it, and whether you want a quick answer or a step-by-step verification.",
    examplePrompt:
      "I saw a post claiming this new supplement is proven to reverse memory loss. Can you help me verify whether that is true?",
    questions: [
      "What exact claim would you like to check?",
      "Where did you see it?",
      "Would you like a quick answer or a step-by-step explanation?",
    ],
  },
  {
    id: "learn-ai",
    title: "Teach me how to use AI for this task",
    shortLabel: "Learn AI",
    description:
      "Practice prompting in plain language and learn what details help the assistant do a better job for real healthcare-office tasks.",
    coaching:
      "You never need to sound technical. A good prompt simply explains the task, the goal, and anything important about tone, format, or context.",
    examplePrompt:
      "Help me use AI to compare these two policy documents. Explain each step in simple language before you do it.",
    questions: [
      "What are you trying to get done today?",
      "Would you like me to do it for you, teach you, or both?",
      "How simple would you like the explanation to be?",
    ],
  },
];

export function getActionById(id?: string | null) {
  return SUGGESTED_ACTIONS.find((action) => action.id === id) ?? null;
}

export function buildStarterReply(action: SuggestedAction, profile: UserProfile) {
  return [
    `We can do that, ${profile.name || "there"}.`,
    action.coaching,
    "A simple way to ask is:",
    `"${action.examplePrompt}"`,
    "To get started, here are three helpful questions:",
    ...action.questions.map((question, index) => `${index + 1}. ${question}`),
  ].join("\n\n");
}
