declare module "imagetracerjs" {
  type ImageTracerOptions = Record<string, string | number | boolean>;

  const ImageTracer: {
    imagedataToSVG(imageData: ImageData, options?: ImageTracerOptions): string;
  };

  export default ImageTracer;
}
