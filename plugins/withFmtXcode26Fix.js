const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Temporary compatibility patch for Apple Clang 21 / Xcode 26.4+.
 * Remove after upgrading React Native to a release that includes a compatible fmt.
 */
module.exports = function withFmtXcode26Fix(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const podfilePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        "Podfile",
      );

      if (!fs.existsSync(podfilePath)) {
        return modConfig;
      }

      const marker = "Fixar: compatibilidade temporaria do fmt com Xcode 26";
      const podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes(marker)) {
        return modConfig;
      }

      const anchor = "    # This is necessary for Xcode 14";
      if (!podfile.includes(anchor)) {
        throw new Error("Nao foi possivel localizar o post_install do Podfile.");
      }

      const workaround = `    # ${marker}\n    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')\n    if File.exist?(fmt_base)\n      content = File.read(fmt_base)\n      patched = content.gsub(/^#  define FMT_USE_CONSTEVAL 1$/, '#  define FMT_USE_CONSTEVAL 0')\n      if patched != content\n        File.chmod(0644, fmt_base)\n        File.write(fmt_base, patched)\n      end\n    end\n\n`;

      fs.writeFileSync(
        podfilePath,
        podfile.replace(anchor, workaround + anchor),
      );

      return modConfig;
    },
  ]);
};
