import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Allow require() imports for dynamic proxy dependencies (undici)
      '@typescript-eslint/no-require-imports': [
        'error',
        {
          allow: ['undici'],
        },
      ],
    },
  },
  {
    // Specific files where we allow any types and require imports
    files: [
      'app/api/supabase-proxy/**/*.ts',
      'components/google-places-autocomplete.tsx',
      'lib/database-service.ts',
      'lib/email-service.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

export default eslintConfig;
