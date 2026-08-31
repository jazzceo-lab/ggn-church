const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i;

export function isImageAttachment(name) {
  return !!name && IMAGE_EXTENSIONS.test(name);
}
