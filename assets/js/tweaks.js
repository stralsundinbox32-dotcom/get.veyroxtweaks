/*
 * Tweak catalog of Veyrox Tweaks 1.2.0
 * -------------------------------------------------------------
 * Extracted from VeyroxTweaks.exe (namespace VeyroxTweaks.Tweaks.Catalog):
 *  - name / desc:      the app's own English UI text (tw.<id>.n / tw.<id>.d)
 *  - category:         TweakCategory  (Games, FPS, InputDelay, Network, Windows)
 *  - impact:           TweakImpact    (high, medium, low) — the app's own rating
 *  - restart:          BrauchtNeustart ("restart recommended" badge)
 *  - recommended:      Empfohlen      (part of Turbo Boost)
 *  - changes:          registry keys / Windows APIs the tweak touches
 *  - admin:            true when the setting is system-wide (HKLM / power plan).
 *                      Note: the EXE manifest requests administrator rights at launch for all tweaks.
 */
window.VEYROX_CATEGORIES = [
  { id: "games",   label: "Games" },
  { id: "fps",     label: "FPS" },
  { id: "input",   label: "Input delay" },
  { id: "network", label: "Network" },
  { id: "windows", label: "Windows" }
];

window.VEYROX_TWEAKS = [
  {
    id: "powerplan", icon: "power", category: "fps", impact: "high", restart: false, recommended: true, admin: true,
    name: "High performance power plan",
    desc: "Activates the Windows \"High performance\" plan: the CPU doesn't keep clocking down – fewer micro stutters. On laptops best with the charger plugged in.",
    changes: ["Active Windows power plan → High performance", "If Windows hides that plan, Veyrox creates its own copy and removes it again on reset"],
    scope: "Power plan (system-wide)"
  },
  {
    id: "gamemode", icon: "gamepad", category: "fps", impact: "medium", restart: false, recommended: true, admin: false,
    name: "Windows Game Mode on",
    desc: "Windows prioritizes the running game and postpones things like update installs. Usually on by default – this turns it on for sure.",
    changes: ["HKCU\\Software\\Microsoft\\GameBar · AutoGameModeEnabled, AllowAutoGameMode"],
    scope: "Your user account"
  },
  {
    id: "gamedvr", icon: "record", category: "fps", impact: "medium", restart: false, recommended: true, admin: false,
    name: "Game Bar recording off",
    desc: "Turns off Xbox Game Bar background recording (Game DVR). Saves GPU power and prevents stutters while capturing.",
    changes: ["HKCU\\System\\GameConfigStore · GameDVR_Enabled", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR · AppCaptureEnabled"],
    scope: "Your user account"
  },
  {
    id: "hags", icon: "gpu", category: "fps", impact: "medium", restart: true, recommended: false, admin: true,
    name: "Hardware GPU scheduling",
    desc: "The graphics card schedules its own memory – slightly less latency. Needs a recent GPU (GTX 1000 / RX 5000 or newer) and a restart.",
    changes: ["HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers · HwSchMode"],
    scope: "System-wide"
  },
  {
    id: "gpupreference", icon: "monitor", category: "games", impact: "high", restart: false, recommended: true, admin: false,
    name: "Games on the strong GPU",
    desc: "Forces the high-performance GPU for all detected games – important on laptops with two graphics cards. Like \"Graphics settings → High performance\".",
    changes: ["HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences · GpuPreference=2 for each detected game"],
    scope: "Your user account, detected games"
  },
  {
    id: "cpupriority", icon: "cpu", category: "games", impact: "medium", restart: false, recommended: true, admin: true,
    name: "High CPU priority for games",
    desc: "Windows starts detected games with high CPU priority automatically – fewer stutters from background apps. Only the Windows start option, no game files.",
    changes: ["HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\<game>.exe\\PerfOptions · CpuPriorityClass"],
    scope: "System-wide, detected games"
  },
  {
    id: "fso", icon: "window", category: "games", impact: "low", restart: false, recommended: false, admin: false,
    name: "Fullscreen optimizations off",
    desc: "True exclusive fullscreen for detected games. Noticeable on some PCs, no difference on others.",
    changes: ["HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers · DISABLEDXMAXIMIZEDWINDOWEDMODE for each detected game"],
    scope: "Your user account, detected games"
  },
  {
    id: "mouseaccel", icon: "mouse", category: "input", impact: "high", restart: false, recommended: true, admin: false,
    name: "Mouse acceleration off",
    desc: "Turns off \"Enhance pointer precision\": same hand movement = same distance. Important for consistent aim.",
    changes: ["HKCU\\Control Panel\\Mouse · MouseSpeed, MouseThreshold1, MouseThreshold2", "Applied live through Windows system parameters"],
    scope: "Your user account"
  },
  {
    id: "visualeffects", icon: "sparkle", category: "windows", impact: "low", restart: false, recommended: false, admin: false,
    name: "Visual effects for performance",
    desc: "Turns off window animations, shadows and fades. Font smoothing stays on, Windows just looks a little plainer.",
    changes: ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects · VisualFXSetting", "HKCU\\…\\Explorer\\Advanced · TaskbarAnimations", "Menu, tooltip and list animations, cursor and drop shadows"],
    scope: "Your user account"
  },
  {
    id: "transparency", icon: "layers", category: "windows", impact: "low", restart: false, recommended: false, admin: false,
    name: "Transparency effects off",
    desc: "Taskbar and Start menu without the frosted glass effect. Takes a little load off the GPU.",
    changes: ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize · EnableTransparency"],
    scope: "Your user account"
  },
  {
    id: "backgroundapps", icon: "grid", category: "windows", impact: "medium", restart: false, recommended: true, admin: false,
    name: "Restrict background apps",
    desc: "Store apps may no longer run in the background. Less CPU load and RAM usage while gaming.",
    changes: ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications · GlobalUserDisabled", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search · BackgroundAppGlobalToggle"],
    scope: "Your user account"
  },
  {
    id: "nagle", icon: "globe", category: "network", impact: "low", restart: true, recommended: false, admin: true,
    name: "Nagle's algorithm off",
    desc: "TCP packets are sent immediately instead of batched. Helps TCP games; most shooters use UDP – so honestly: low impact.",
    changes: ["HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\<active adapter> · TcpAckFrequency, TCPNoDelay"],
    scope: "System-wide, active network adapter"
  },
  {
    id: "networkthrottling", icon: "wifi", category: "network", impact: "medium", restart: true, recommended: true, admin: true,
    name: "Network throttling off",
    desc: "Windows no longer slows down network packets while music or videos play. Can reduce ping spikes while streaming.",
    changes: ["HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile · NetworkThrottlingIndex"],
    scope: "System-wide"
  },
  {
    id: "systemresponsiveness", icon: "gauge", category: "fps", impact: "medium", restart: true, recommended: true, admin: true,
    name: "Optimize SystemResponsiveness",
    desc: "Reserves less CPU time for background multimedia (20 % → 10 %, the minimum according to Microsoft). More CPU time for the game.",
    changes: ["HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile · SystemResponsiveness"],
    scope: "System-wide"
  },
  {
    id: "gamestask", icon: "bolt", category: "fps", impact: "medium", restart: true, recommended: true, admin: true,
    name: "Games task high priority",
    desc: "The multimedia scheduler (MMCSS) treats games with higher CPU and GPU priority than other multimedia tasks.",
    changes: ["HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games · GPU Priority, Scheduling Category, SFIO Priority"],
    scope: "System-wide"
  },
  {
    id: "refreshrate", icon: "monitor", category: "fps", impact: "high", restart: false, recommended: true, admin: false,
    name: "Monitor at full Hz",
    desc: "Many monitors run at only 60 Hz after being connected. Sets every monitor to its highest refresh rate (e.g. 144 or 240 Hz). The screen flickers briefly.",
    changes: ["Windows display settings · refresh rate of every connected monitor", "Previous rate per monitor is saved and restored on reset"],
    scope: "Display settings"
  },
  {
    id: "startupdelay", icon: "clock", category: "windows", impact: "low", restart: false, recommended: false, admin: false,
    name: "Startup delay off",
    desc: "Startup programs launch right after sign-in instead of delayed. Windows is ready faster.",
    changes: ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize · StartupDelayInMSec"],
    scope: "Your user account"
  },
  {
    id: "priorityseparation", icon: "sliders", category: "input", impact: "low", restart: false, recommended: false, admin: true,
    name: "Prefer foreground apps",
    desc: "Win32PrioritySeparation = 0x26: short, variable time slices with a 3× boost for the active window. Honestly: close to the default on many PCs.",
    changes: ["HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl · Win32PrioritySeparation"],
    scope: "System-wide"
  },
  {
    id: "usbsuspend", icon: "usb", category: "input", impact: "medium", restart: false, recommended: true, admin: true,
    name: "USB power saving off",
    desc: "Windows no longer puts mouse, keyboard and headset into power saving – no short dropouts when USB devices wake up.",
    changes: ["Active power plan · USB settings → USB selective suspend"],
    scope: "Power plan (system-wide)"
  },
  {
    id: "stickykeys", icon: "keyboard", category: "input", impact: "low", restart: false, recommended: true, admin: false,
    name: "Sticky Keys shortcut off",
    desc: "No more \"Turn on Sticky Keys?\" window when you press Shift 5× or hold it. The features themselves stay available.",
    changes: ["Windows accessibility settings · Sticky Keys and Filter Keys shortcuts"],
    scope: "Your user account"
  }
];
