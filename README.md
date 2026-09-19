# Viewfold

Viewfold gives Home Assistant’s native Home Dashboard a separate **Covers** category for awnings, blinds, curtains, shades, and shutters. Climate keeps its native climate devices, window covers, and window binary sensors. Security remains responsible for doors, garage doors, and gates.

Viewfold is deliberately a thin adapter. It calls the dashboard strategies shipped with the installed Home Assistant frontend, then applies small immutable filters to their generated configuration. It does not fork or reproduce the Home Dashboard.

> Viewfold is an independent community project. It is not affiliated with, endorsed by, or maintained by Home Assistant or the Open Home Foundation.

## Features

- Adds a native-looking Covers summary and `/home/covers` subview.
- Reuses Home Assistant’s native tile cards, area and floor grouping, entity names, controls, themes, and responsive sections.
- Moves only `cover` entities whose effective device class is `awning`, `blind`, `curtain`, `shade`, or `shutter`.
- Leaves `window`, generic covers, window binary sensors, and security-related covers under native Home Assistant rules.
- Discovers newly added compatible covers from Home Assistant state and registry data; no entity list is required.
- Provides English, German, and French fallback translations while preferring Home Assistant’s own Covers translation.
- Performs no telemetry, analytics, remote loading, or outbound runtime requests.
- Falls back to the unmodified native output if a future frontend shape cannot be transformed safely.

## Requirements

- Home Assistant 2026.9 or newer.
- HACS 2.x for the recommended installation path.
- The native Home Dashboard must be available.

The minimum version reflects the frontend structure validated for the first release. Viewfold uses feature and structure detection rather than version branches at runtime.

## Installation with HACS

Viewfold is installable immediately as a HACS custom repository; it is not currently part of HACS’s default catalog.

1. In HACS, open the three-dot menu and choose **Custom repositories**.
2. Add `https://github.com/MephistoJB/viewfold` with category **Integration**.
3. Install **Viewfold** and restart Home Assistant.
4. Go to **Settings → Devices & services → Add integration**, search for **Viewfold**, and add it.
5. Reload the browser once after initial setup or an update.

No Lovelace resource needs to be added. The integration registers its bundled module globally because ordinary dashboard resources are not reliably loaded on `/home`.

## Manual installation

1. Download `viewfold.zip` from the latest release.
2. Extract `custom_components/viewfold` into the Home Assistant configuration directory’s `custom_components` folder.
3. Restart Home Assistant and add the Viewfold integration under **Settings → Devices & services**.

## Configuration

The default behavior needs no configuration. In the integration options, **Enable debug logging** adds adapter diagnostics to the browser console. Debug mode is off by default and does not log entity states.

## How it works

At runtime Viewfold waits for and decorates these registered native strategy classes:

- `home-dashboard-strategy`
- `home-overview-view-strategy`
- `climate-view-strategy`

The original `generate()` functions remain the authoritative source. Viewfold stores them exactly once, calls them first, and filters the returned configuration without mutating it. The Covers view itself calls the captured original Climate generator and retains only visual shading covers. See [Architecture](docs/architecture.md) for the design record and compatibility boundaries.

## Internationalization

Viewfold first asks `hass.localize()` for Home Assistant’s native Covers label. Its project fallback catalog currently includes:

- English: Covers
- German: Rollläden & Beschattung
- French: Volets et protections solaires

Unknown and partially translated locales fall back to English. To add a language, update the small catalog in `src/i18n/index.ts`, add an integration translation under `custom_components/viewfold/translations`, and include tests.

## Compatibility and fail-safe behavior

Home Assistant’s strategy classes are internal frontend interfaces and can change. Viewfold minimizes that risk by validating the native result before touching it. If required elements or expected structural invariants are absent, it returns Home Assistant’s generated configuration unchanged and emits one concise browser-console warning per failure type.

This design is not “update-proof.” Its purpose is to inherit native improvements while keeping the adapter’s compatibility surface small. The project is validated against Home Assistant 2026.9.3 / frontend 20260826.7 and the frontend `dev` branch snapshot documented in the architecture record.

Known limitation: if Home Assistant itself produces a non-sections Home overview (for example, an empty-state panel), Viewfold does not replace that layout merely to add a summary. The Covers subview remains part of the generated Home dashboard, and native behavior is preserved.

## Troubleshooting

- **Nothing changed:** confirm that Viewfold is both installed and added as an integration, then restart Home Assistant and hard-refresh the browser.
- **One compatibility warning appears:** Home Assistant’s frontend structure may have changed. Native output remains active; include the Home Assistant frontend version and warning text in a Viewfold issue.
- **A cover stays in Climate:** inspect its effective `device_class`. Only the five visual shading classes listed above move by default.
- **A garage door or gate is not in Covers:** this is intentional; security-related covers remain governed by Home Assistant’s Security classification.

## Development

```bash
npm ci
npm run check
```

Source lives under `src/`; the deterministic build is written to `custom_components/viewfold/frontend/viewfold.js`. Tests use representative native generated configurations and do not require a running Home Assistant instance. Contribution guidance is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Upstream context

Home Assistant intentionally treats some covers as climate controls because passive climate strategies can involve windows and blinds. Viewfold does not characterize that decision as an error; it offers a different organizational model for users who prefer heating/climate controls and visual shading controls to be separated.

See [Upstream context](docs/upstream-context.md) for the relevant issue, pull requests, and discussion.

## Privacy and security

Viewfold runs entirely inside the Home Assistant frontend, loads only its locally bundled module, stores no credentials, exposes no network service, and sends no entity or user data anywhere. Please report vulnerabilities according to [SECURITY.md](SECURITY.md).

## License

Apache License 2.0. Viewfold invokes Home Assistant’s installed frontend at runtime and contains no copied Home Assistant frontend implementation.
