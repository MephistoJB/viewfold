# Security policy

## Supported versions

Security fixes are provided for the latest released minor version.

## Reporting a vulnerability

Please use GitHub’s **Report a vulnerability** private security advisory for this repository. Do not open a public issue for a vulnerability before a fix is available.

Include the affected version, Home Assistant version, impact, reproduction steps, and any proposed mitigation. Reports will be acknowledged as soon as practical. Public disclosure will be coordinated after a fix is ready.

## Security model

Viewfold serves one bundled JavaScript file from the local Home Assistant instance. It creates no entities or services, opens no listener, stores no credentials, executes no remote scripts, makes no outbound request, and collects no telemetry. The browser module reads Home Assistant’s in-memory dashboard inputs only to classify entities and transform native generated configuration.
