# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-09-19

### Fixed

- Correct the automated release workflow output path so tagged releases publish the validated HACS archive.

## [0.1.1] - 2026-09-19

### Fixed

- Package release archives with the integration files at the archive root, as required for HACS integration downloads.

## [0.1.0] - 2026-09-19

### Added

- Native Home Dashboard adapter for separate Climate and Covers grouping.
- Covers summary and `/home/covers` subview.
- Immutable filtering over Home Assistant’s original Climate generator output.
- English, German, and French localization with native-string preference.
- Config flow with optional browser debug logging.
- Compatibility validation, one-time warnings, and native fail-safe output.
- Unit test, lint, formatting, type-check, build, and HACS validation workflows.

[Unreleased]: https://github.com/MephistoJB/viewfold/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/MephistoJB/viewfold/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/MephistoJB/viewfold/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/MephistoJB/viewfold/releases/tag/v0.1.0
