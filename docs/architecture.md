# Architecture

## Status

Accepted for Viewfold 0.2.0 on 2026-09-19.

## Context

The official Home Dashboard is generated at runtime by Home Assistant frontend strategies. In the frontend `dev` branch at commit `66cc3f62c540d704acd256ded7b92752e3e17a67`, `climate-view-strategy` includes covers with device classes `awning`, `blind`, `curtain`, `shade`, `shutter`, `window`, and `none`. The Home overview uses the same climate filter to decide whether to render a Climate summary.

The first release was also checked against Home Assistant 2026.9.3, which pins frontend 20260826.7. The relevant generator shapes are compatible across both snapshots, although the development branch adds unrelated summary behavior that Viewfold preserves.

### Loading experiment and source finding

An ordinary HACS dashboard resource is not sufficient for `/home`:

- `src/entrypoints/core.ts` preloads Lovelace resources only for `/` and `/lovelace/...`.
- `src/panels/lovelace/ha-panel-lovelace.ts` loads those resources while setting up a Lovelace panel.
- `src/panels/home/ha-panel-home.ts` directly imports the native Home strategies and generates its own Lovelace configuration; it does not load dashboard resources.

Therefore Viewfold is distributed as a minimal HACS custom integration. Its backend only serves the built local module through `async_register_static_paths()` and adds the module to the frontend’s global extra-module list with `add_extra_js_url()`. HACS itself uses the same global-JavaScript registration facility for its icon set. There are no entities, services, coordinators, storage records, HTTP views, or outbound requests.

## Decision

Viewfold decorates three already registered custom-element classes:

1. `home-dashboard-strategy.generate()` is called first. Viewfold inserts one subview whose strategy remains `climate`, plus a private mode marker.
2. `home-overview-view-strategy.generate()` is called first. Viewfold adds a native `shortcut` card for Covers in the native summary containers and removes the Climate summary only when no native climate entity remains.
3. `climate-view-strategy.generate()` is called first. Normal Climate output drops every cover entity. Covers-mode output keeps every cover supplied by Climate.
4. `security-view-strategy.generate()` is called in Covers mode and filtered to cover entities. Its native groups are merged with Climate output and duplicate entities are removed. The Security strategy itself is never patched.

The Covers view intentionally invokes the captured original Climate and Security generators. Together they cover Home Assistant’s complete cover device-class surface while preserving native area/floor hierarchy, tile generation, names, features, themes, responsiveness, and future enhancements.

The Covers summary uses the native `shortcut` card rather than `home-summary`. The latter accepts a closed upstream summary enum and reads private icon, color, filter, state, and localization maps; extending it would require replacing or patching the card implementation. A shortcut is already a native Home Dashboard card, needs no fake entity, and keeps the interception surface smaller.

## ADR: decorate native output instead of forking Home Dashboard

### Chosen

Use the installed frontend as the implementation and apply small immutable transformations to generated configuration.

### Rejected

- Copying Home Dashboard strategies: duplicates fast-moving upstream hierarchy, filtering, navigation, and card logic.
- A standalone dashboard: breaks the requested native Home navigation and separates the feature from `/home`.
- DOM or Shadow DOM rewriting: depends on rendering details, is timing-sensitive, and cannot reliably preserve accessibility or navigation state.
- Replacing registered custom elements: the Custom Elements registry does not permit safe replacement and the approach conflicts with other frontend code.
- A plain Lovelace resource: not reliably loaded on `/home`, as established above.

### Consequences

Viewfold inherits native UI improvements without synchronizing a fork. It also depends on four internal element names, their static `generate()` entry points, and small structural invariants in their returned configurations. Those dependencies are isolated in `src/native` and `src/transform`.

## Compatibility controls

- `customElements.whenDefined()` provides an explicit registration lifecycle; there is no polling, MutationObserver, arbitrary delay, or DOM traversal.
- `Symbol.for()` markers capture each original generator exactly once and make loading idempotent.
- Wrappers always await the native generator before applying any change.
- Transformations use object/array copies and preserve unknown fields.
- Climate filtering requires a sections view whose generated cards are headings or entity cards. Unknown structures trigger fallback rather than a guess.
- Empty area groups and floor sections are pruned after filtering.
- A failure returns the exact native result and logs one warning for that transformation type.
- Debug logging is opt-in and never logs entity state values.

The interception is reversible in concept: restoring the symbol-captured generators would recover the original methods. Viewfold does not currently expose runtime unloading of an already evaluated module because browser modules cannot be unevaluated safely; disabling the integration and reloading the page restores an unmodified frontend session.

## Classification policy

Version 0.2 uses a domain-based classifier:

- Covers contains every enabled, visible primary entity in the `cover` domain, regardless of device class.
- Climate retains actual climate domains, area temperature/humidity sensors, and window binary sensors, but no cover entities.
- Door, garage, gate, and window covers remain in native Security as well; Viewfold adds them to Covers without patching or subtracting from Security.

Registry visibility and entity category are honored. Climate output supplies visual, window, and generic covers; Security output supplies door, garage, gate, and window covers. Viewfold merges those native results by floor and area heading and deduplicates entity IDs.

## Security and privacy

The production bundle has no runtime dependencies, network client, dynamic import, `eval`, telemetry, or remote script loading. The backend registers one static file under `/viewfold/viewfold.js`. All classification is local and linear in the number of Home Assistant states during native strategy regeneration.
