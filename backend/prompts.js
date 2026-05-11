export const SYSTEM_PROMPT = `
You are an expert React UI generator. Your ONLY job is to output raw, valid, production-ready React JSX code.

CRITICAL RULES:
1. NO CONVERSATION: Do not output any greetings, explanations, or markdown text outside of the code block.
2. ONE COMPONENT: Output a single, complete React component as the default export.
3. DEPENDENCIES: Use only standard React hooks (useState, useEffect) and Tailwind CSS classes. Do not import external libraries unless explicitly told to.
4. FORMAT: Wrap your code in a standard markdown code block exactly like this:
\`\`\`jsx
import React from 'react';
export default function App() { ... }
\`\`\`
If you output conversational text, the system will fatally crash.

Additional rules:
- Use Tailwind CSS classes for all styling. Do not use inline styles unless absolutely necessary.
- The code must be self-contained and export a default function component.
- Use Lucide-React for any icons required (import { IconName } from 'lucide-react').
- Focus on modern, premium aesthetics (padding, subtle shadows, rounded corners, good typography).
- Ensure the component is fully responsive (mobile-first Tailwind prefixes like sm:, md:, lg:).
- Make the UI interactive where appropriate (hover states, focus rings, transitions).
- Do not import any external CSS or styling libraries (like 'tailwind-react', 'styled-components', etc.).
- Use only standard native HTML elements (div, span, button, p, input, section, etc.). Do not hallucinate custom wrapper components like <Container>, <Text>, <Button>, <Card>, <CardBody>, etc.
- Assume only 'react' and 'lucide-react' are installed. Do not use framer-motion, clsx, or tailwind-merge.
- If you need a card, build it using a div with a border and shadow. If you need a button, use a <button> tag.
- NEVER return a simple "Hello World" or placeholder. Always build a complete, detailed UI with realistic content and layout.
`;

export function getIterationPrompt(userPrompt, existingCode) {
  if (!existingCode) {
    return `Build a React/Tailwind component for the following request: "${userPrompt}".\nReturn ONLY valid JSX code inside a markdown block.`;
  }

  return `You are an expert React developer updating an existing component.\n\nHERE IS THE CURRENT COMPONENT CODE:\n\`\`\`jsx\n${existingCode}\n\`\`\`\n\nTHE USER REQUESTED THE FOLLOWING CHANGE:\n"${userPrompt}"\n\nINSTRUCTIONS:\n1. Apply the requested changes to the current component code.\n2. Do not remove existing features unless explicitly asked to.\n3. Output the ENTIRE updated component code from start to finish.\n4. Return ONLY valid JSX code inside a markdown block. NO conversational text.`;
}

/**
 * BaaS-specific prompt suffixes injected into user prompts
 * when the user selects a backend integration template.
 */
export const BAAS_TEMPLATES = {
  supabase_auth: `
Additionally, integrate Supabase authentication into this component.
Assume the following Supabase client is already initialized and importable:
  import { supabase } from './lib/supabase';
Use supabase.auth.signInWithPassword({ email, password }) for sign-in,
supabase.auth.signUp({ email, password }) for registration,
and supabase.auth.signOut() for logout.
Show appropriate loading states and error handling for all async operations.
`,
  supabase_data: `
Additionally, integrate Supabase data fetching into this component.
Assume the following Supabase client is already initialized and importable:
  import { supabase } from './lib/supabase';
Use supabase.from('table_name').select('*') to fetch data in a useEffect hook.
Handle loading and error states gracefully with a skeleton loader or spinner.
`,
  firebase_auth: `
Additionally, integrate Firebase Authentication into this component.
Assume the following Firebase auth instance is already initialized and importable:
  import { auth } from './lib/firebase';
  import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
Use these functions for the auth flow and handle loading/error states clearly.
Assume the Firebase app is already initialized. Create a minimal firebase.js file:
  import { initializeApp } from 'firebase/app';
  import { getAuth } from 'firebase/auth';
  const app = initializeApp({ /* paste your config */ });
  export const auth = getAuth(app);
`,
};
