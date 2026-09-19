# Upstream context

Viewfold is a community alternative, not an upstream correction or roadmap item.

## Home Assistant frontend issue 29471

[`home-assistant/frontend#29471`](https://github.com/home-assistant/frontend/issues/29471), “Cover. entities should not be merged with Climat. entities on Thermostat pile,” was opened on 2026-02-07. It asked that covers be removed from Climate/Thermostat grouping and suggested a separate Cover group. Other users confirmed the same experience with shutters and blinds.

The issue was closed and locked on 2026-07-04 as intended behavior. The maintainer explanation was that passive climate control can involve opening and closing windows and blinds. Viewfold acknowledges that rationale and offers a different grouping preference without asserting that the upstream behavior is wrong.

## Covers in the Areas strategy

[`home-assistant/frontend#25073`](https://github.com/home-assistant/frontend/pull/25073), merged on 2025-04-15, created a separate Covers section in the Areas strategy. Its rationale noted that covers can be ambiguous between climate and security use cases. That earlier design is relevant precedent for presenting covers separately in an area-oriented UI.

## Functional Home Dashboard summaries

[`home-assistant/frontend#26594`](https://github.com/home-assistant/frontend/pull/26594), “Summaries overview dashboard,” merged on 2025-08-19, established the functional Home Dashboard summaries and category views. Its resulting classification placed visual cover device classes in Climate. The canonical merged commit is [`10dcc080689f11b4368c925c5051b0e36d6d0c8e`](https://github.com/home-assistant/frontend/commit/10dcc080689f11b4368c925c5051b0e36d6d0c8e).

## Functional-view discussion

[Home Assistant organization Discussion #530](https://github.com/orgs/home-assistant/discussions/530), “Automatic dashboard : allow views by function,” proposed views for lights, covers, climate, media players, security, and other functional categories. The discussion later noted that the Home Dashboard implemented much of that functional-view idea.

## Relationship to upstream

Viewfold does not copy these implementations, use the Home Assistant logo, or imply endorsement. It calls the frontend installed in the user’s Home Assistant instance and adapts generated configuration locally. No issue, pull request, review, comment, or discussion post has been made to a Home Assistant or Open Home Foundation project by this project’s release process.
