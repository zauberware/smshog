# Changelog

All notable changes to SMSHog are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-25

### Added

- Image for `linux/arm64` in addition to `linux/amd64`.
- Message attributes sent by the AWS SDKs are captured. `AWS.SNS.SMS.SenderID` and `AWS.SNS.SMS.SMSType` override the defaults set through `SetSMSAttributes` for a single message.
- `SMSHOG_MAX_MESSAGES` to keep only the newest N messages (default: unlimited).
- Version and build in the footer of the web UI.
- Container health check; `GET /health` is answered by the backend.
- Examples for Node.js, TypeScript and Ruby in `examples/`.
- Backend tests, a CI workflow and a release workflow. Pushing a `vX.Y.Z` tag publishes the image as `X.Y.Z`, `X.Y` and `latest` and creates a GitHub release from the matching section of this file.
- This changelog.

### Changed

- `Publish` answers with `InvalidParameter` (400) when `PhoneNumber` or `Message` is not a string.
- Stored message attributes have the shape `{ name: { DataType, StringValue } }`.
- The message list and the detail panel have the same height and scroll independently.
- The image is built from the lockfile on pinned base images (`node:26-alpine`, `nginx:1.30-alpine`).
- Updated express, axios and vite; `react-query` replaced by `@tanstack/react-query`.

### Fixed

- `SetSMSAttributes` accepted keys such as `toString` or `constructor`.
- An unreadable store file was overwritten with an empty list on startup. It is now kept as `<file>.corrupt-<timestamp>`.
- The store file could be left truncated when the process stopped mid-write.
- The web UI kept showing a message that had been deleted elsewhere and did not report failed deletes.
- Missing favicon.
- README: the `docker run` example mapped the wrong container port, the SDK example used `https://`, and the env template was named `.env.example`.

### Security

- Dependency updates resolve all advisories reported by `yarn audit`.
- The README states that SMSHog has no authentication and must not be exposed to the internet.

## [1.0.0] - 2025-04-30

### Added

- Mock of the AWS SNS SMS API with the `Publish` and `SetSMSAttributes` actions.
- Web UI to view and delete captured messages.
- REST API under `/api/v1`.
- Optional persistence of messages to a JSON file (`SMSHOG_PERSIST`, `SMSHOG_PERSIST_PATH`).
- Docker image `zauberware/smshog` and Docker Compose setups for production and development.

[Unreleased]: https://github.com/zauberware/smshog/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/zauberware/smshog/compare/842e832...v1.1.0
[1.0.0]: https://github.com/zauberware/smshog/tree/842e832
