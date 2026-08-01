/**
 * Decides whether an image should be counter-inverted in dark mode.
 *
 * The problem this solves: dark mode inverts the whole page, then inverts media
 * back so photographs are not negatives. That is right for photographs and wrong
 * for logos and icons, which are typically dark ink on a transparent background.
 * Counter-inverting one of those restores the dark ink and paints it onto a page
 * that is now also dark, so it disappears. ByteByteGo's wordmark is a textbook
 * case: one <img> holding a green mark and black lettering, where the mark
 * survived inversion and the lettering did not.
 *
 * Leaving icon-like images alone lets the page filter invert them, which turns
 * dark ink light — exactly what you want.
 *
 * This is a heuristic. It is deliberately biased towards "photo", because
 * getting a photograph wrong looks alarming (a negative) whereas getting a logo
 * wrong is what already happens today. The eventual proper fix is a per-site
 * override list, the mechanism Dark Reader uses.
 */

const ICON_MAX_EDGE = 48;
const TRANSPARENCY_RATIO = 0.15;
const SAMPLE_EDGE = 16;
const SAMPLE_PIXELS = SAMPLE_EDGE * SAMPLE_EDGE;

/** Alpha below this counts as transparent; JPEG noise never gets this low. */
const OPAQUE_ALPHA = 250;

/**
 * Transparency alone is not enough to call something an icon: a circular avatar
 * is mostly transparent too, and inverting one of those produces an alarming
 * negative. Icons are additionally near-monochrome — ink at one end of the
 * luminance range — whereas photographs sit in the midtones.
 */
const EXTREME_LUMINANCE_RATIO = 0.6;
const DARK_INK = 0.25;
const LIGHT_INK = 0.75;

export type ImageKind = "icon" | "photo";

/**
 * Results are cached by URL, not by element. The same logo usually appears many
 * times on a page, and reading pixels back is the expensive part.
 */
const cache = new Map<string, ImageKind>();

let sampler: CanvasRenderingContext2D | null | undefined;

function getSampler(): CanvasRenderingContext2D | null {
  if (sampler === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_EDGE;
    canvas.height = SAMPLE_EDGE;
    sampler = canvas.getContext("2d", { willReadFrequently: true });
  }

  return sampler;
}

function isVectorSource(src: string): boolean {
  return /\.svg(\?|#|$)/i.test(src) || src.startsWith("data:image/svg");
}

function analyse(image: HTMLImageElement, src: string): ImageKind {
  const { naturalWidth: width, naturalHeight: height } = image;

  if (!width || !height) {
    return "photo";
  }

  // Favicons, avatars, inline badges. Too small to be a photograph worth
  // protecting, and overwhelmingly icons.
  if (width <= ICON_MAX_EDGE && height <= ICON_MAX_EDGE) {
    return "icon";
  }

  const context = getSampler();

  if (!context) {
    return "photo";
  }

  try {
    context.clearRect(0, 0, SAMPLE_EDGE, SAMPLE_EDGE);
    context.drawImage(image, 0, 0, SAMPLE_EDGE, SAMPLE_EDGE);

    const { data } = context.getImageData(0, 0, SAMPLE_EDGE, SAMPLE_EDGE);
    let transparent = 0;
    let opaque = 0;
    let extreme = 0;

    for (let offset = 0; offset < data.length; offset += 4) {
      if ((data[offset + 3] ?? 255) < OPAQUE_ALPHA) {
        transparent += 1;
        continue;
      }

      opaque += 1;

      // Rec. 709 luma, normalised to 0..1.
      const luminance =
        (0.2126 * (data[offset] ?? 0) +
          0.7152 * (data[offset + 1] ?? 0) +
          0.0722 * (data[offset + 2] ?? 0)) /
        255;

      if (luminance < DARK_INK || luminance > LIGHT_INK) {
        extreme += 1;
      }
    }

    if (transparent / SAMPLE_PIXELS <= TRANSPARENCY_RATIO) {
      return "photo";
    }

    // Transparent but full of midtones — a cut-out photograph, not artwork.
    return opaque > 0 && extreme / opaque > EXTREME_LUMINANCE_RATIO
      ? "icon"
      : "photo";
  } catch {
    /**
     * A cross-origin image without CORS headers taints the canvas and
     * getImageData throws. Vector sources are almost always logos, so they are
     * worth guessing at; everything else falls back to the safer default.
     */
    return isVectorSource(src) ? "icon" : "photo";
  }
}

export function classifyImage(image: HTMLImageElement): ImageKind | null {
  const src = image.currentSrc || image.src;

  if (!src || !image.complete) {
    return null;
  }

  const cached = cache.get(src);

  if (cached) {
    return cached;
  }

  const kind = analyse(image, src);
  cache.set(src, kind);

  return kind;
}
