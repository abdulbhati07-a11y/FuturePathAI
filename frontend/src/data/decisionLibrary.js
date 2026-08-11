// Categorized starter decisions shown on the dashboard onboarding.
// Each group renders under its label; tapping a prompt opens a new
// simulation with that text as the opening message. Keep prompts phrased
// as first-person questions so the AI can title and continue them cleanly.
export const DECISION_CATEGORIES = [
  {
    key: 'CAREER',
    label: 'Career',
    prompts: [
      'Should I accept a job offer in another city?',
      'Should I switch to a completely new career field?',
    ],
  },
  {
    key: 'FINANCIAL',
    label: 'Finance',
    prompts: [
      'Should I invest in real estate or equities?',
      'Should I pay off my debt or invest my savings?',
    ],
  },
  {
    key: 'BUSINESS',
    label: 'Business',
    prompts: [
      'Is now the right time to start my own business?',
      'Should I raise funding or bootstrap my startup?',
    ],
  },
  {
    key: 'EDUCATION',
    label: 'Education',
    prompts: [
      'Should I go back to school for a Master’s degree?',
      'Should I leave my degree to work on a startup?',
    ],
  },
  {
    key: 'HEALTH',
    label: 'Health',
    prompts: [
      'Should I make a major lifestyle change this year?',
      'Should I take a sabbatical to focus on my health?',
    ],
  },
  {
    key: 'PERSONAL',
    label: 'Personal',
    prompts: [
      'Should I relocate to be closer to family?',
      'Should I buy a home or keep renting?',
    ],
  },
];

// Flat list for places that render prompts without category grouping.
export const STARTER_PROMPTS = DECISION_CATEGORIES.flatMap((c) => c.prompts);
