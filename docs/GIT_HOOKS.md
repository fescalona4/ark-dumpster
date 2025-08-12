# Husky Git Hooks for Code Quality

## Pre-commit Hook

Automatically runs on every commit to ensure code quality:

- **Prettier**: Formats all staged files
- **ESLint**: Fixes auto-fixable issues and checks for errors
- **TypeScript**: Type checking
- **Tests**: Runs relevant tests for changed files

## Setup

```bash
npm install --save-dev husky lint-staged prettier
npx husky init
```

## Configuration

This ensures that only properly formatted and linted code enters the repository.

## Benefits

- ✅ Consistent code formatting across the team
- ✅ Early error detection
- ✅ No more "format on save" debates
- ✅ Professional commit quality
