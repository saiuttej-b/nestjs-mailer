# Contributing

1. [Fork the repository](https://help.github.com/articles/fork-a-repo/).
2. Install pnpm (`npm install -g pnpm@10.15.0`) and dependencies (`pnpm install`).
3. Create a feature branch (`git checkout -b my-new-feature`).
4. Format, lint, and test before opening a pull request:

```bash
pnpm exec prettier --write "src/**/*.ts"
pnpm run lint
pnpm run test:cov
```

`pnpm run lint` is a check. Use `pnpm run lint:fix` to apply ESLint fixes, then run `pnpm run lint` again. Coverage stays at 100% statements, branches, functions, and lines.

5. Push the branch and [open a pull request](https://help.github.com/articles/creating-a-pull-request/).

User-facing API changes need a `CHANGELOG.md` entry and a README update when setup or behavior changes.
