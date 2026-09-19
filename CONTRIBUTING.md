# Contributing

Contributions are welcome when they keep Viewfold a narrow adapter over the installed Home Assistant frontend.

## Before opening a change

- Search existing issues and describe the user-visible behavior and Home Assistant version.
- For compatibility work, link the exact upstream frontend source or commit that changed.
- Do not copy broad Home Assistant strategy implementations into this repository.
- Keep classification changes centralized and include representative tests.
- Add or update translations for every user-facing string.

## Development workflow

Use Node.js 22 or newer.

```bash
npm ci
npm run check
```

`npm run check` performs formatting verification, linting, strict type checking, unit tests with coverage, and a production build. Do not commit `node_modules`, coverage output, local logs, or release archives.

## Pull requests

Keep pull requests focused and explain compatibility implications. Include tests for success and fail-safe behavior. UI changes should include a screenshot from a test Home Assistant instance when it materially clarifies the result.

By contributing, you agree that your contribution is licensed under Apache License 2.0 and that you have the right to submit it.
