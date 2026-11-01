/*
 * VEYROX TWEAKS — central site configuration
 * -------------------------------------------------------------
 * Everything that changes between releases or points to an
 * external service lives here. Edit this file only.
 *
 * Release values were read from the actual VeyroxTweaks.exe
 * (Windows file version info, file size, SHA-256 via Get-FileHash).
 * When you ship a new build, update `release` and upload the new
 * EXE as a GitHub Release asset (new tag), then point filePath to it.
 */
window.VEYROX_CONFIG = {
  release: {
    version: "1.2.0",                 // ProductVersion of the EXE
    fileVersion: "1.2.0.0",           // FileVersion of the EXE
    fileName: "VeyroxTweaks.exe",
    // GitHub Release asset (upload VeyroxTweaks.exe to release tag v1.2.0)
    filePath: "https://github.com/stralsundinbox32-dotcom/get.veyroxtweaks/releases/download/v1.2.0/VeyroxTweaks.exe",
    sizeBytes: 66533150,
    sha256: "C8FB20BFD4E5BE4C47C39A902F67B0A9E7651E4FC05CBF5A153C3027BCC9041E",
    platform: "Windows 10 & 11, 64-bit", // from the EXE manifest (supportedOS) + x64 PE header
    runtime: ".NET 8, bundled",           // self-contained single-file build
    codeSigned: false                     // Authenticode status of this build: NotSigned
  },

  /*
   * Community & social links.
   * Leave a value empty ("") until you have the real URL —
   * empty links render as a clearly marked "coming soon" state
   * instead of a dead link.
   */
  links: {
    discord: "",   // e.g. "https://discord.gg/your-invite-code"
    tiktok: "",    // e.g. "https://www.tiktok.com/@your-handle"
    youtube: "",   // e.g. "https://www.youtube.com/@your-channel"
    x: "",         // e.g. "https://x.com/your-handle"
    github: "",    // e.g. "https://github.com/your-name/veyrox-tweaks"
    email: ""      // e.g. "support@your-domain.com"
  },

  brand: {
    name: "Veyrox Tweaks",
    author: "stralsund",
    copyright: "© 2026 Veyrox"
  }
};
