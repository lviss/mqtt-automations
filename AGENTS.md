# mqtt-automations

Small personal Node.js service that subscribes to MQTT topics (bed sensor,
Plex playback, motion sensor, garage door status) and publishes light/fixture
commands in response. Config (MQTT broker address + light fixture topics)
lives in `config.js`, which is real production wiring, not a placeholder.

## Nix packaging

`flake.nix` exposes `packages.default`, built with `buildNpmPackage` against
`nodejs_22`. Build/run locally with:

```
nix build .#default
./result/bin/mqtt-automations
```

Other flakes (e.g. `laneos`) can consume this repo as a flake input and
reference `mqtt-automations.packages.<system>.default` directly rather than
re-deriving the npm build.

If `package.json`'s dependencies change, regenerate the lockfile with
`npm install --package-lock-only` and update `npmDepsHash` in `flake.nix` to
match (`nix build` reports the expected hash on mismatch).

## Maintaining this file

Keep this file scoped to durable, project-wide knowledge that isn't already
obvious from reading the code. Update it when packaging, build, or
deployment conventions change; prefer pointing at the authoritative file
(e.g. `flake.nix`) over duplicating its details here.
