import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { vectorizeImage } from "./vectorizer";

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

type SourceImage = {
  dataUrl: string;
  name: string;
  type: string;
  svgText?: string;
};

type SelectionBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type SvgResult = {
  markup: string;
  filename: string;
  variant: number;
};

const acceptedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]);

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
  const [cameraAvailable, setCameraAvailable] = useState(() => Boolean(navigator.mediaDevices?.getUserMedia));
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<SourceImage | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [result, setResult] = useState<SvgResult | null>(null);
  const [variant, setVariant] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!acceptedTypes.has(file.type)) {
      setError("Unsupported file. Please choose a PNG, JPG, JPEG, WEBP or SVG.");
      return;
    }

    const dataUrl = await readAsDataUrl(file);
    const svgText = file.type === "image/svg+xml" ? await file.text() : undefined;
    setSourceImage({ dataUrl, name: file.name, type: file.type, svgText });
    setSelectedCrop(null);
    setSelectionBox(null);
    setResult(null);
    setScreen("freeze");
  }

  function handleCapture(dataUrl: string) {
    setError(null);
    setSourceImage({ dataUrl, name: "camera-capture.png", type: "image/png" });
    setSelectedCrop(null);
    setSelectionBox(null);
    setResult(null);
    setScreen("freeze");
  }

  async function handleTransform(box: SelectionBox, stage: DOMRect) {
    if (!sourceImage) {
      setError("Choose or capture an image first.");
      setScreen("upload");
      return;
    }

    if (box.width < 16 || box.height < 16) {
      setError("Select a larger area before transforming.");
      return;
    }

    try {
      setError(null);
      const crop = sourceImage.svgText
        ? sourceImage
        : await cropImageToSelection(sourceImage, box, stage.width, stage.height);
      setSelectedCrop(crop);
      setScreen("extracting");
      const generated = await vectorizeImage({ dataUrl: crop.dataUrl, svgText: crop.svgText, variant });
      setResult({
        markup: generated.svg,
        filename: `${fileBaseName(sourceImage.name) || "wonder-spark"}.svg`,
        variant,
      });
      setScreen("reveal");
    } catch (conversionError) {
      setError(errorMessage(conversionError, "Conversion failed. Try selecting a clearer object."));
      setScreen("freeze");
    }
  }

  async function regenerate() {
    if (!selectedCrop || !result) {
      setError("There is no generated SVG to regenerate yet.");
      return;
    }

    const nextVariant = result.variant + 1;
    try {
      setError(null);
      setVariant(nextVariant);
      setScreen("extracting");
      const generated = await vectorizeImage({
        dataUrl: selectedCrop.dataUrl,
        svgText: selectedCrop.svgText,
        variant: nextVariant,
      });
      setResult({ ...result, markup: generated.svg, variant: nextVariant });
      setScreen("reveal");
    } catch (conversionError) {
      setError(errorMessage(conversionError, "Regeneration failed. Try starting over with a clearer image."));
      setScreen("reveal");
    }
  }

  function resetApp() {
    setSourceImage(null);
    setSelectedCrop(null);
    setSelectionBox(null);
    setResult(null);
    setVariant(0);
    setError(null);
    setScreen("home");
  }

  function failCamera(message: string) {
    setCameraAvailable(false);
    setError(message);
    setScreen("upload");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-ivory">
      {screen === "home" && (
        <HomeScreen
          cameraAvailable={cameraAvailable}
          error={error}
          onCamera={() => setScreen("camera")}
          onUpload={() => setScreen("upload")}
        />
      )}
      {screen === "camera" && (
        <CameraScreen
          onCancel={() => setScreen("home")}
          onCapture={handleCapture}
          onUnavailable={failCamera}
        />
      )}
      {screen === "freeze" && sourceImage && (
        <FreezeScreen
          error={error}
          image={sourceImage}
          selectionBox={selectionBox}
          onSelectionChange={setSelectionBox}
          onCancel={() => setScreen("home")}
          onEmptySelection={() => setError("Tap or draw around an object before transforming.")}
          onTransform={handleTransform}
        />
      )}
      {screen === "extracting" && <ExtractionScreen image={selectedCrop ?? sourceImage} />}
      {screen === "reveal" && result && (
        <RevealScreen
          error={error}
          result={result}
          onCopy={() => copySvg(result.markup, setError)}
          onDownload={() => downloadSvg(result.markup, result.filename)}
          onRegenerate={regenerate}
          onTryAnother={resetApp}
        />
      )}
      {screen === "upload" && (
        <UploadScreen
          error={error}
          image={sourceImage}
          onCancel={resetApp}
          onFile={handleFile}
        />
      )}
    </main>
  );
}

function HomeScreen({
  cameraAvailable,
  error,
  onCamera,
  onUpload,
}: {
  cameraAvailable: boolean;
  error: string | null;
  onCamera: () => void;
  onUpload: () => void;
}) {
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
        {error && <StatusPill>{error}</StatusPill>}
        <div className="action-row">
          {cameraAvailable && <GlassButton icon="camera" label="Camera" onClick={onCamera} strong />}
          <GlassButton icon="upload" label="Upload" onClick={onUpload} strong={!cameraAvailable} />
        </div>
      </section>
    </WonderStage>
  );
}

function CameraScreen({
  onCancel,
  onCapture,
  onUnavailable,
}: {
  onCancel: () => void;
  onCapture: (dataUrl: string) => void;
  onUnavailable: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onUnavailable("Camera access is not available in this browser. Upload is ready instead.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });

        if (!active) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        onUnavailable("Camera permission was blocked or no camera was found. Upload is ready instead.");
      }
    }

    startCamera();
    return () => {
      active = false;
      if (streamRef.current) stopStream(streamRef.current);
    };
  }, [onUnavailable]);

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      onUnavailable("The camera preview is not ready. Upload an image instead.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      onUnavailable("Could not capture a frame. Upload an image instead.");
      return;
    }
    context.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/png"));
  }

  return (
    <WonderStage className="camera-stage">
      <div className="camera-backdrop">
        <video ref={videoRef} className="camera-video" muted playsInline autoPlay />
        <div className="feed-darken" />
        <div className="feed-vignette" />
      </div>
      <TopControls
        left={<GlassButton icon="x" label="Cancel" onClick={onCancel} compact />}
        right={<GlassButton icon="zap" label="Flash" compact warm />}
      />
      <FocusFrame />
      <InstructionPill className="camera-pill">Find an interesting object.</InstructionPill>
      <button className="capture-button" type="button" onClick={captureFrame} aria-label="Tap to capture" />
      <p className="capture-hint">Tap to capture</p>
    </WonderStage>
  );
}

function FreezeScreen({
  image,
  error,
  selectionBox,
  onSelectionChange,
  onCancel,
  onEmptySelection,
  onTransform,
}: {
  image: SourceImage;
  error: string | null;
  selectionBox: SelectionBox | null;
  onSelectionChange: (box: SelectionBox | null) => void;
  onCancel: () => void;
  onEmptySelection: () => void;
  onTransform: (box: SelectionBox, stage: DOMRect) => void;
}) {
  const stageRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drawing, setDrawing] = useState(false);

  function point(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
      rect,
    };
  }

  function beginSelection(event: PointerEvent<HTMLElement>) {
    const { x, y } = point(event);
    dragStartRef.current = { x, y };
    setDrawing(true);
    onSelectionChange({ left: x - 90, top: y - 90, width: 180, height: 180 });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateSelection(event: PointerEvent<HTMLElement>) {
    if (!drawing || !dragStartRef.current) return;
    const { x, y } = point(event);
    const start = dragStartRef.current;
    const left = Math.min(start.x, x);
    const top = Math.min(start.y, y);
    const width = Math.abs(x - start.x);
    const height = Math.abs(y - start.y);

    if (width < 10 && height < 10) {
      onSelectionChange({ left: x - 150, top: y - 180, width: 300, height: 360 });
    } else {
      onSelectionChange({ left, top, width, height });
    }
  }

  function endSelection(event: PointerEvent<HTMLElement>) {
    setDrawing(false);
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function transformSelection() {
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage || !selectionBox) {
      onEmptySelection();
      return;
    }
    onTransform(clampBox(selectionBox, stage.width, stage.height), stage);
  }

  const box = selectionBox ? clampBox(selectionBox, stageRef.current?.clientWidth ?? 1440, stageRef.current?.clientHeight ?? 900) : null;

  return (
    <WonderStage className="freeze-stage">
      <section
        ref={stageRef}
        className="selection-surface"
        onPointerDown={beginSelection}
        onPointerMove={updateSelection}
        onPointerUp={endSelection}
        onPointerCancel={endSelection}
      >
        <div className="frozen-background dynamic" style={{ backgroundImage: `linear-gradient(rgba(11, 10, 18, 0.46), rgba(11, 10, 18, 0.46)), url("${image.dataUrl}")` }} />
        <InstructionPill className="freeze-pill">Tap the object you want to transform.</InstructionPill>
        {box && (
          <div
            className="selection-card dynamic"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height, transform: "none" }}
          >
            <img src={image.dataUrl} alt="" />
            <span className="handle tl" />
            <span className="handle tr" />
            <span className="handle bl" />
            <span className="handle br" />
          </div>
        )}
        {error && <StatusPill className="freeze-error">{error}</StatusPill>}
        <div className="freeze-actions">
          <GlassButton icon="pen" label="Draw around it" compact />
          <button className="primary-light-button" type="button" onClick={transformSelection}>
            <Icon name="check" />
            <span>Press Enter ✨</span>
          </button>
        </div>
        <p className="freeze-hint">Everything else fades softly away.</p>
        <button className="sr-only" type="button" onClick={onCancel}>
          Back to start
        </button>
      </section>
    </WonderStage>
  );
}

function ExtractionScreen({ image }: { image: SourceImage | null }) {
  return (
    <WonderStage className="extraction-stage">
      <ExtractionAtmosphere />
      <div className="extraction-center">
        <div className="orbit-ring outer" />
        <div className="orbit-ring inner" />
        <ParticleField compact />
        {image && (
          <div className="extracting-card">
            <img src={image.dataUrl} alt="" />
          </div>
        )}
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
  result,
  error,
  onTryAnother,
  onRegenerate,
  onDownload,
  onCopy,
}: {
  result: SvgResult;
  error: string | null;
  onTryAnother: () => void;
  onRegenerate: () => void;
  onDownload: () => void;
  onCopy: () => void;
}) {
  return (
    <WonderStage className="reveal-stage">
      <ExtractionAtmosphere subtle />
      <section className="reveal-content">
        <div className="eyebrow">
          <span />
          YOUR SPARK IS READY
        </div>
        <h1>Your Inspiration Reimagined.</h1>
        {error && <StatusPill>{error}</StatusPill>}
        <div className="svg-card">
          <div className="generated-svg" dangerouslySetInnerHTML={{ __html: result.markup }} />
          <div className="filename">
            <span />
            {result.filename}
          </div>
        </div>
        <div className="reveal-actions">
          <button className="primary-light-button" type="button" onClick={onDownload}>
            <Icon name="download" />
            <span>Download SVG</span>
          </button>
          <GlassButton icon="copy" label="Copy SVG" compact onClick={onCopy} />
          <GlassButton icon="refresh" label="Regenerate" compact onClick={onRegenerate} />
          <GlassButton icon="arrow-right" label="Try another" compact reverse onClick={onTryAnother} />
        </div>
      </section>
    </WonderStage>
  );
}

function UploadScreen({
  image,
  error,
  onCancel,
  onFile,
}: {
  image: SourceImage | null;
  error: string | null;
  onCancel: () => void;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  function acceptFileList(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <WonderStage className="upload-stage">
      <div className="upload-backdrop" />
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
        onChange={(event) => acceptFileList(event.currentTarget.files)}
      />
      <TopControls
        left={<GlassButton icon="x" label="Cancel" onClick={onCancel} compact />}
        right={<GlassButton icon="image" label="Gallery" compact warm onClick={openPicker} />}
      />
      <section className="upload-center">
        <button
          className="drop-zone"
          type="button"
          onClick={openPicker}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            acceptFileList(event.dataTransfer.files);
          }}
        >
          <CornerFrame />
          {image ? (
            <img className="upload-preview" src={image.dataUrl} alt="" />
          ) : (
            <>
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
            </>
          )}
        </button>
        {error ? <StatusPill>{error}</StatusPill> : <InstructionPill>Upload to convert into a clean vector.</InstructionPill>}
      </section>
      <div className="upload-bottom">
        <button className="choose-file-button" type="button" onClick={openPicker}>
          <Icon name="folder" />
          <span>Choose file</span>
        </button>
        <p>or drag &amp; drop anywhere</p>
      </div>
    </WonderStage>
  );
}

function WonderStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`wonder-stage ${className}`}>{children}</section>;
}

function TopControls({ left, right }: { left: ReactNode; right: ReactNode }) {
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

function InstructionPill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`instruction-pill ${className}`}>
      <span />
      {children}
    </div>
  );
}

function StatusPill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`status-pill ${className}`}>{children}</div>;
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

async function cropImageToSelection(source: SourceImage, box: SelectionBox, stageWidth: number, stageHeight: number): Promise<SourceImage> {
  const image = await loadImage(source.dataUrl);
  const scale = Math.max(stageWidth / image.naturalWidth, stageHeight / image.naturalHeight);
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const offsetX = (stageWidth - drawnWidth) / 2;
  const offsetY = (stageHeight - drawnHeight) / 2;

  const cropX = Math.max(0, Math.round((box.left - offsetX) / scale));
  const cropY = Math.max(0, Math.round((box.top - offsetY) / scale));
  const cropW = Math.min(image.naturalWidth - cropX, Math.max(1, Math.round(box.width / scale)));
  const cropH = Math.min(image.naturalHeight - cropY, Math.max(1, Math.round(box.height / scale)));

  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not crop the selected object.");

  context.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    name: source.name,
    type: "image/png",
  };
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = src;
  });
}

function clampBox(box: SelectionBox, width: number, height: number): SelectionBox {
  const boxWidth = Math.max(0, Math.min(box.width, width));
  const boxHeight = Math.max(0, Math.min(box.height, height));
  return {
    left: Math.max(0, Math.min(box.left, width - boxWidth)),
    top: Math.max(0, Math.min(box.top, height - boxHeight)),
    width: boxWidth,
    height: boxHeight,
  };
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

function fileBaseName(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").trim();
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function downloadSvg(markup: string, filename: string) {
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copySvg(markup: string, setError: (message: string | null) => void) {
  try {
    await navigator.clipboard.writeText(markup);
    setError("SVG markup copied to clipboard.");
  } catch {
    setError("Clipboard access failed. Download the SVG instead.");
  }
}

export default App;
