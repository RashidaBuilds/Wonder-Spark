import ImageTracer from "imagetracerjs";

export type VectorizeInput = {
  dataUrl: string;
  svgText?: string;
  variant: number;
};

export type VectorizeResult = {
  svg: string;
  width: number;
  height: number;
};

const optionVariants = [
  { numberofcolors: 5, ltres: 1, qtres: 1, pathomit: 7, rightangleenhance: true },
  { numberofcolors: 3, ltres: 0.6, qtres: 0.7, pathomit: 4, rightangleenhance: false },
  { numberofcolors: 8, ltres: 1.4, qtres: 1.2, pathomit: 10, rightangleenhance: true },
];

export async function vectorizeImage(input: VectorizeInput): Promise<VectorizeResult> {
  if (input.svgText?.trim()) {
    return {
      svg: normalizeSvgMarkup(input.svgText),
      width: 512,
      height: 512,
    };
  }

  const image = await loadImage(input.dataUrl);

  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));

  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Could not prepare the image for conversion.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const variant = optionVariants[input.variant % optionVariants.length];

  let svg = "";

  try {
    svg = ImageTracer.imagedataToSVG(imageData, {
      ...variant,
      scale: 1,
      strokewidth: 0,
      linefilter: true,
      blurradius: 0,
      desc: false,
      viewbox: true,
      roundcoords: 1,
    });
  } catch (error) {
    console.warn("ImageTracer failed, using fallback SVG.", error);
  }

  // If ImageTracer fails, generate a valid SVG containing the uploaded image.
  // This keeps the full prototype flow working.
  if (!svg || !svg.includes("<svg")) {
    svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}"
     viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="12"
        flood-color="#00000022"/>
    </filter>
  </defs>

  <rect
    width="100%"
    height="100%"
    rx="24"
    fill="#F8F7FC"/>

  <image
    href="${input.dataUrl}"
    x="16"
    y="16"
    width="${width - 32}"
    height="${height - 32}"
    preserveAspectRatio="xMidYMid meet"
    filter="url(#shadow)"/>

</svg>`;
  }

  return {
    svg,
    width,
    height,
  };
}

function normalizeSvgMarkup(svg: string) {
  const trimmed = svg.trim();

  if (!trimmed.includes("<svg")) {
    throw new Error("The selected SVG file does not contain SVG markup.");
  }

  return trimmed;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));

    image.src = src;
  });
}