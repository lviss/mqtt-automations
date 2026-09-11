{
  description = "MQTT-driven home automations (lights, plex integration, alerts)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.buildNpmPackage {
            pname = "mqtt-automations";
            version = "1.0.0";

            src = ./.;

            nodejs = pkgs.nodejs_22;

            npmDepsHash = "sha256-qpSCddK9qruDjEjnbt04NGe72BEQ5PTKCrE4LpFtHKI=";

            dontNpmBuild = true;

            installPhase = ''
              runHook preInstall

              mkdir -p $out/lib/mqtt-automations
              cp -r node_modules index.js config.js package.json $out/lib/mqtt-automations/

              mkdir -p $out/bin
              makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/mqtt-automations \
                --add-flags $out/lib/mqtt-automations/index.js

              runHook postInstall
            '';

            nativeBuildInputs = [ pkgs.makeWrapper ];
          };
        });
    };
}
