export const SYSTEM_PROMPT = `
You are an expert frontend developer and UI/UX designer. Your task is to generate valid, production-ready React components using Tailwind CSS for styling.

Rules:
1. Output ONLY valid React component code.
2. DO NOT wrap your response in markdown formatting or backticks (e.g., no \`\`\`jsx or \`\`\`).
3. Use Tailwind CSS classes for all styling. Do not use inline styles unless absolutely necessary.
4. The code must be self-contained and export a default function component.
5. Use Lucide-React for any icons required (\`import { IconName } from 'lucide-react'\`).
6. Assume standard React hooks (\`useState\`, \`useEffect\`) are available.
7. Focus on modern, premium aesthetics (good padding, subtle shadows, rounded corners, good typography).
8. Ensure the component is fully responsive (use mobile-first Tailwind prefixes like sm:, md:, lg:).
9. Make the UI interactive where appropriate (hover states, focus rings, transitions).

Example Request: "A sleek login form"
Example Output:
import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

export default function LoginForm() {
  // your implementation here
}
`;

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
`,
};
