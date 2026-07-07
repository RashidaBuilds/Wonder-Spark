import { useEffect, useMemo, useState } from "react";

type Screen = "home" | "camera" | "freeze" | "extracting" | "reveal" | "upload";
type IconName =
  | "camera"
  | "upload"
  | "x"
  | "zap"
  | "check"
  | "pen"
  | "download"
  | "copy"
  | "refresh"
  | "arrow-right"
  | "image"
  | "folder"
  | "pencil"
  | "brush";

const cameraImage =
  "https://cdn.wonder.so/images/019f33ce-5a7f-77af-aa96-9ca61aaf8952/d50cc7e44c29eda88b5774e37b22ed1faf728d74ca18718e7ef025e319355892.jpg";

const particlePositions = [
  [210, 180, 4, "#c9b8f299"],
  [320, 300, 3, "#ffffffcc"],
  [180, 460, 5, "#a9c7e88c"],
  [260, 620, 3, "#ead8b0a6"],
  [380, 520, 4, "#ffffffa6"],
  [430, 210, 3, "#c9b8f28c"],
  [520, 360, 6, "#ffffffb3"],
  [560, 560, 3, "#a9c7e899"],
  [610, 270, 4, "#ead8b099"],
  [660, 640, 3, "#ffffffa6"],
  [700, 190, 5, "#c9b8f28c"],
  [760, 650, 4, "#a9c7e88c"],
  [820, 300, 3, "#ffffffbf"],
  [880, 560, 5, "#ead8b08c"],
  [905, 240, 4, "#c9b8f28c"],
  [960, 420, 6, "#ffffffb3"],
  [1020, 600, 3, "#a9c7e88c"],
  [1080, 320, 4, "#ead8b08c"],
  [1140, 500, 3, "#ffffffa6"],
  [1180, 220, 5, "#c9b8f280"],
  [1220, 640, 4, "#a9c7e880"],
  [1260, 400, 3, "#ffffffbf"],
  [150, 340, 3, "#ead8b08c"],
  [1300, 300, 4, "#c9b8f273"],
  [480, 680, 3, "#ffffff8c"],
  [1000, 170, 3, "#a9c7e88c"],
  [600, 470, 4, "#ffffff99"],
  [840, 470, 4, "#c9b8f299"],
  [720, 250, 3, "#ead8b0b3"],
  [720, 610, 3, "#ffffffa6"],
  [560, 430, 5, "#ffffff8c"],
  [880, 400, 3, "#a9c7e899"],
  [350, 400, 3, "#ffffff80"],
  [1120, 400, 4, "#c9b8f280"],
] as const;

function App() {
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    if (screen !== "extracting") return;
    const timer = window.setTimeout(() => setScreen("reveal"), 2200);
    return () => window.clearTimeout(timer);
  }, [screen]);

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-ivory">
      {screen === "home" && <HomeScreen onCamera={() => setScreen("camera")} onUpload={() => setScreen("upload")} />}
      {screen === "camera" && <CameraScreen onCancel={() => setScreen("home")} onCapture={() => setScreen("freeze")} />}
      {screen === "freeze" && (
        <FreezeScreen onCancel={() => setScreen("camera")} onTransform={() => setScreen("extracting")} />
      )}
      {screen === "extracting" && <ExtractionScreen />}
      {screen === "reveal" && <RevealScreen onTryAnother={() => setScreen("home")} onRegenerate={() => setScreen("extracting")} />}
      {screen === "upload" && <UploadScreen onCancel={() => setScreen("home")} onChoose={() => setScreen("extracting")} />}
    </main>
  );
}

function HomeScreen({ onCamera, onUpload }: { onCamera: () => void; onUpload: () => void }) {
  return (
    <WonderStage className="home-gradient">
      <AmbientGlows />
      <ParticleField />
      <header className="brand-header">
        <Brand />
      </header>
      <section className="home-hero">
        <LivingOrb />
        <h1 className="hero-title">Find inspiration.</h1>
        <p className="hero-subtitle">Turn everyday moments into beautiful SVGs.</p>
        <div className="action-row">
          <GlassButton icon="camera" label="Camera" onClick={onCamera} strong />
          <GlassButton icon="upload" label="Upload" onClick={onUpload} />
        </div>
      </section>
    </WonderStage>
  );
}

function CameraScreen({ onCancel, onCapture }: { onCancel: () => void; onCapture: () => void }) {
  return (
    <WonderStage className="camera-stage">
      <CameraBackdrop />
      <TopControls
        left={<GlassButton icon="x" label="Cancel" onClick={onCancel} compact />}
        right={<GlassButton icon="zap" label="Flash" compact warm />}
      />
      <FocusFrame />
      <InstructionPill className="camera-pill">Find an interesting object.</InstructionPill>
      <button className="capture-button" type="button" onClick={onCapture} aria-label="Tap to capture" />
      <p className="capture-hint">Tap to capture</p>
    </WonderStage>
  );
}

function FreezeScreen({ onCancel, onTransform }: { onCancel: () => void; onTransform: () => void }) {
  return (
    <WonderStage className="freeze-stage">
      <div className="frozen-background" />
      <InstructionPill className="freeze-pill">Tap the object you want to transform.</InstructionPill>
      <div className="selection-card">
        <img src={cameraImage} alt="" />
        <span className="handle tl" />
        <span className="handle tr" />
        <span className="handle bl" />
        <span className="handle br" />
      </div>
      <div className="freeze-actions">
        <GlassButton icon="pen" label="Draw around it" compact />
        <button className="primary-light-button" type="button" onClick={onTransform}>
          <Icon name="check" />
          <span>Transform this</span>
        </button>
      </div>
      <p className="freeze-hint">Everything else fades softly away.</p>
      <button className="sr-only" type="button" onClick={onCancel}>
        Back to camera
      </button>
    </WonderStage>
  );
}

function ExtractionScreen() {
  return (
    <WonderStage className="extraction-stage">
      <ExtractionAtmosphere />
      <div className="extraction-center">
        <div className="orbit-ring outer" />
        <div className="orbit-ring inner" />
        <ParticleField compact />
        <div className="extracting-card">
          <img src={cameraImage} alt="" />
        </div>
        <div className="extracting-core" />
      </div>
      <div className="extraction-caption">
        <h2>Gathering the spark...</h2>
        <p>Every detail is becoming light.</p>
      </div>
    </WonderStage>
  );
}

function RevealScreen({
  onTryAnother,
  onRegenerate,
}: {
  onTryAnother: () => void;
  onRegenerate: () => void;
}) {
  return (
    <WonderStage className="reveal-stage">
      <ExtractionAtmosphere subtle />
      <section className="reveal-content">
        <div className="eyebrow">
          <span />
          YOUR SPARK IS READY
        </div>
        <h1>Monstera, reimagined.</h1>
        <div className="svg-card">
          <PlantSvg />
          <div className="filename">
            <span />
            monstera-spark.svg
          </div>
        </div>
        <div className="reveal-actions">
          <button className="primary-light-button" type="button">
            <Icon name="download" />
            <span>Download SVG</span>
          </button>
          <GlassButton icon="copy" label="Copy SVG" compact />
          <GlassButton icon="refresh" label="Regenerate" compact onClick={onRegenerate} />
          <GlassButton icon="arrow-right" label="Try another" compact reverse onClick={onTryAnother} />
        </div>
      </section>
    </WonderStage>
  );
}

function UploadScreen({ onCancel, onChoose }: { onCancel: () => void; onChoose: () => void }) {
  return (
    <WonderStage className="upload-stage">
      <div className="upload-backdrop" />
      <TopControls
        left={<GlassButton icon="x" label="Cancel" onClick={onCancel} compact />}
        right={<GlassButton icon="image" label="Gallery" compact warm />}
      />
      <section className="upload-center">
        <button className="drop-zone" type="button" onClick={onChoose}>
          <CornerFrame />
          <div className="upload-halo">
            <Icon name="upload" />
          </div>
          <h1>Drop your file here</h1>
          <p>Sketch, doodle or photo - PNG, JPG</p>
          <div className="source-chips">
            <Chip icon="pencil" label="Sketch" />
            <Chip icon="brush" label="Doodle" />
            <Chip icon="image" label="Photo" />
          </div>
        </button>
        <InstructionPill>Upload to convert into a clean vector.</InstructionPill>
      </section>
      <div className="upload-bottom">
        <button className="choose-file-button" type="button" onClick={onChoose}>
          <Icon name="folder" />
          <span>Choose file</span>
        </button>
        <p>or drag &amp; drop anywhere</p>
      </div>
    </WonderStage>
  );
}

function WonderStage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`wonder-stage ${className}`}>{children}</section>;
}

function TopControls({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="top-controls">
      {left}
      {right}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand-lockup">
      <span className="brand-orb" />
      <span>Wonder Spark</span>
    </div>
  );
}

function AmbientGlows() {
  return (
    <div className="ambient-layer" aria-hidden="true">
      <span className="glow lavender" />
      <span className="glow champagne" />
      <span className="glow powder" />
      <span className="grain" />
    </div>
  );
}

function ParticleField({ compact = false }: { compact?: boolean }) {
  const particles = useMemo(() => particlePositions, []);
  return (
    <div className={compact ? "particle-field compact" : "particle-field"} aria-hidden="true">
      {particles.map(([x, y, size, color], index) => (
        <span
          key={`${x}-${y}`}
          style={{
            left: compact ? `${(x - 150) * 0.45 + 205}px` : `${x}px`,
            top: compact ? `${(y - 150) * 0.45 + 130}px` : `${y}px`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            animationDelay: `${(index % 7) * 0.37}s`,
          }}
        />
      ))}
    </div>
  );
}

function LivingOrb() {
  return (
    <div className="living-orb">
      <span className="orb-cast" />
      <span className="orb-glass" />
      <span className="orb-ring" />
      <span className="firefly-halo" />
      <span className="firefly-core" />
      <span className="firefly-point" />
      <span className="orb-sheen" />
      <span className="mote a" />
      <span className="mote b" />
      <span className="mote c" />
      <span className="mote d" />
      <span className="mote e" />
    </div>
  );
}

function CameraBackdrop() {
  return (
    <div className="camera-backdrop">
      <div className="feed-darken" />
      <div className="feed-vignette" />
    </div>
  );
}

function FocusFrame() {
  return (
    <div className="focus-frame" aria-hidden="true">
      <span className="focus-corner tl" />
      <span className="focus-corner tr" />
      <span className="focus-corner bl" />
      <span className="focus-corner br" />
    </div>
  );
}

function InstructionPill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`instruction-pill ${className}`}>
      <span />
      {children}
    </div>
  );
}

function ExtractionAtmosphere({ subtle = false }: { subtle?: boolean }) {
  return (
    <div className={subtle ? "result-atmosphere subtle" : "result-atmosphere"} aria-hidden="true">
      <span className="result-glow lavender" />
      <span className="result-glow blue" />
      <span className="grain" />
    </div>
  );
}

function CornerFrame() {
  return (
    <>
      <span className="drop-corner tl" />
      <span className="drop-corner tr" />
      <span className="drop-corner bl" />
      <span className="drop-corner br" />
    </>
  );
}

function Chip({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span className="source-chip">
      <Icon name={icon} />
      {label}
    </span>
  );
}

function GlassButton({
  icon,
  label,
  onClick,
  strong = false,
  compact = false,
  warm = false,
  reverse = false,
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  strong?: boolean;
  compact?: boolean;
  warm?: boolean;
  reverse?: boolean;
}) {
  return (
    <button
      className={`glass-button ${strong ? "strong" : ""} ${compact ? "compact" : ""} ${warm ? "warm" : ""} ${
        reverse ? "reverse" : ""
      }`}
      type="button"
      onClick={onClick}
    >
      {!reverse && <Icon name={icon} />}
      <span>{label}</span>
      {reverse && <Icon name={icon} />}
    </button>
  );
}

function Icon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === "camera" && (
        <>
          <path {...common} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle {...common} cx="12" cy="13" r="4" />
        </>
      )}
      {name === "upload" && (
        <>
          <polyline {...common} points="16 16 12 12 8 16" />
          <line {...common} x1="12" y1="12" x2="12" y2="21" />
          <path {...common} d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </>
      )}
      {name === "x" && (
        <>
          <line {...common} x1="18" y1="6" x2="6" y2="18" />
          <line {...common} x1="6" y1="6" x2="18" y2="18" />
        </>
      )}
      {name === "zap" && <polygon {...common} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />}
      {name === "check" && <polyline {...common} points="20 6 9 17 4 12" />}
      {name === "pen" && (
        <>
          <path {...common} d="M12 20h9" />
          <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </>
      )}
      {name === "download" && (
        <>
          <path {...common} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline {...common} points="7 10 12 15 17 10" />
          <line {...common} x1="12" y1="15" x2="12" y2="3" />
        </>
      )}
      {name === "copy" && (
        <>
          <rect {...common} x="9" y="9" width="13" height="13" rx="2" />
          <path {...common} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </>
      )}
      {name === "refresh" && (
        <>
          <polyline {...common} points="23 4 23 10 17 10" />
          <polyline {...common} points="1 20 1 14 7 14" />
          <path {...common} d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </>
      )}
      {name === "arrow-right" && (
        <>
          <line {...common} x1="5" y1="12" x2="19" y2="12" />
          <polyline {...common} points="12 5 19 12 12 19" />
        </>
      )}
      {name === "image" && (
        <>
          <rect {...common} x="3" y="3" width="18" height="18" rx="2" />
          <circle {...common} cx="8.5" cy="8.5" r="1.5" />
          <polyline {...common} points="21 15 16 10 5 21" />
        </>
      )}
      {name === "folder" && <path {...common} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />}
      {name === "pencil" && (
        <>
          <path {...common} d="M12 20h9" />
          <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </>
      )}
      {name === "brush" && (
        <>
          <path {...common} d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
          <line {...common} x1="16" y1="8" x2="2" y2="22" />
          <line {...common} x1="17.5" y1="15" x2="9" y2="15" />
        </>
      )}
    </svg>
  );
}

function PlantSvg() {
  return (
    <svg className="plant-svg" viewBox="0 0 220 220" aria-label="Monstera spark SVG preview">
      <defs>
        <linearGradient id="leafA" x1="38" x2="179" y1="74" y2="142" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ead8b0" />
          <stop offset="0.52" stopColor="#c9b8f2" />
          <stop offset="1" stopColor="#a9c7e8" />
        </linearGradient>
      </defs>
      <path d="M110 90 C88 60 58 55 40 68 C58 96 88 104 110 90Z" fill="none" stroke="#c9b8f2" strokeWidth="7" strokeLinecap="round" />
      <path d="M112 90 C134 58 167 55 184 68 C165 96 135 104 112 90Z" fill="none" stroke="#c9b8f2" strokeWidth="7" strokeLinecap="round" />
      <path d="M108 105 C82 100 54 112 38 136 C68 143 94 133 108 105Z" fill="none" stroke="#ead8b0" strokeWidth="7" strokeLinecap="round" />
      <path d="M114 105 C140 100 168 112 184 136 C154 143 128 133 114 105Z" fill="none" stroke="#a9c7e8" strokeWidth="7" strokeLinecap="round" />
      <path d="M110 88 C110 58 118 40 126 32" fill="none" stroke="#f4f2fa" strokeWidth="7" strokeLinecap="round" />
      <path d="M110 92 L110 164" fill="none" stroke="#f4f2fa" strokeWidth="7" strokeLinecap="round" />
      <path d="M72 164 H148 L140 204 Q138 212 128 212 H92 Q82 212 80 204 Z" fill="none" stroke="#f4f2fa" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="110" cy="91" r="9" fill="url(#leafA)" />
    </svg>
  );
}

export default App;
