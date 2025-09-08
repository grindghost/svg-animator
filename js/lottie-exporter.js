// lottie-exporter.js
// Converts your localStorage animations + animation templates into valid Lottie JSON

// --- Color Helper ---
function cssColorToRgba(cssColor) {
  if (!cssColor || cssColor === "none") return [0, 0, 0, 1];

  // Use canvas to resolve CSS styles (named colors, hex, rgb, etc.)
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = cssColor;
  const rgba = ctx.fillStyle;

  // Match rgb/rgba format
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return [
      parseInt(match[1], 10) / 255, // R
      parseInt(match[2], 10) / 255, // G
      parseInt(match[3], 10) / 255, // B
      match[4] !== undefined ? parseFloat(match[4]) : 1 // A
    ];
  }

  // Hex fallback
  if (rgba.startsWith("#")) {
    const bigint = parseInt(rgba.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r / 255, g / 255, b / 255, 1];
  }

  return [0, 0, 0, 1];
}

// --- Transform Parser ---
function parseTransform(transformValue) {
  const result = { s: [100, 100, 100], p: [0, 0, 0], r: 0 };
  if (!transformValue || transformValue === "none") return result;

  const scaleMatch = transformValue.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const vals = scaleMatch[1].split(",").map(v => parseFloat(v.trim()));
    const sx = vals[0] || 1, sy = vals[1] || vals[0] || 1;
    result.s = [sx * 100, sy * 100, 100];
  }

  const translateMatch = transformValue.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const vals = translateMatch[1].split(",").map(v => parseFloat(v));
    result.p = [vals[0] || 0, vals[1] || 0, 0];
  }

  const rotateMatch = transformValue.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    result.r = parseFloat(rotateMatch[1]);
  }

  return result;
}

// --- Keyframes Converter ---
function cssKeyframesToLottie(cssKeyframes, fps = 30) {
  const keys = Object.keys(cssKeyframes).sort((a, b) => parseFloat(a) - parseFloat(b));

  const kf = { o: { a: 1, k: [] }, r: { a: 1, k: [] }, p: { a: 1, k: [] }, s: { a: 1, k: [] } };

  keys.forEach(percent => {
    const css = cssKeyframes[percent];
    const t = (parseFloat(percent) / 100) * fps;

    const tr = parseTransform(css.transform);
    const opacity = css.opacity !== undefined ? parseFloat(css.opacity) * 100 : 100;

    kf.p.k.push({ t, s: tr.p });
    kf.s.k.push({ t, s: tr.s });
    kf.r.k.push({ t, s: [tr.r] });
    kf.o.k.push({ t, s: [opacity] });
  });

  return kf;
}

// --- Shape Builder ---
function buildShapeFromSvg(el) {
  const tag = el.tagName.toLowerCase();
  let shape;

  if (tag === "ellipse") {
    const cx = parseFloat(el.getAttribute("cx")) || 0;
    const cy = parseFloat(el.getAttribute("cy")) || 0;
    const rx = parseFloat(el.getAttribute("rx")) || 0;
    const ry = parseFloat(el.getAttribute("ry")) || 0;

    shape = {
      type: "ellipse",
      cx, cy, rx, ry,
      fill: window.getComputedStyle(el).fill || el.getAttribute("fill") || "#000"
    };
  }
  // TODO: add rect, circle, path, polygon...

  return shape;
}

// --- Wrap Layer ---
function wrapLayer(elementId, lottieKeyframes, duration, shape) {
  // Build animated props
  const buildAnimated = (prop, key) => {
    const kfs = lottieKeyframes.map(kf => ({
      t: kf.t,
      s: Array.isArray(kf.s[key]) ? kf.s[key] : [kf.s[key]]
    }));
    return { a: 1, k: kfs };
  };

  const ks = {
    o: lottieKeyframes.length ? buildAnimated("o", "o") : { a: 0, k: 100 },
    r: lottieKeyframes.length ? buildAnimated("r", "r") : { a: 0, k: 0 },
    p: lottieKeyframes.length ? buildAnimated("p", "p") : { a: 0, k: [960, 540, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: lottieKeyframes.length ? buildAnimated("s", "s") : { a: 0, k: [100, 100, 100] }
  };

  const shapeItem = shape
    ? {
        ty: "gr",
        it: [
          shape.type === "ellipse"
            ? {
                ty: "el",
                p: { a: 0, k: [shape.cx, shape.cy] },
                s: { a: 0, k: [shape.rx * 2, shape.ry * 2] },
                nm: "Ellipse Path"
              }
            : null,
          {
            ty: "fl",
            c: { a: 0, k: shape.fill || [0, 0, 0, 1] },
            o: { a: 0, k: 100 },
            r: 1,
            nm: "Fill"
          }
        ].filter(Boolean),
        nm: "Shape Group"
      }
    : null;

  return {
    ddd: 0,
    ind: Math.floor(Math.random() * 1000),
    ty: 4,
    nm: elementId,
    ks,
    ao: 0,
    shapes: shapeItem ? [shapeItem] : [],
    ip: 0,
    op: duration,
    st: 0,
    bm: 0
  };
}


// --- Exporter ---
export function exportToLottie(localStorageAnimations, animationsData) {
  const fps = 30;
  const layers = [];
  let maxDuration = 0;

  Object.entries(localStorageAnimations.animations).forEach(([elementId, anims]) => {
    const svgElement = document.getElementById(elementId); // get the real SVG element
    const shape = extractShapeFromSvg(svgElement);        // NEW helper

    Object.entries(anims).forEach(([animName, config]) => {
      const template = animationsData[animName];
      if (!template) return;

      const cssKeyframes = template.keyframes
        ? template.keyframes
        : template.generateKeyframes(config.params || {});

      const lottieKeyframes = cssKeyframesToLottie(cssKeyframes, fps);
      const duration = fps * parseFloat(config.speed || template.defaultSpeed || 1);

      // Pass `shape` into wrapLayer
      layers.push(wrapLayer(elementId, lottieKeyframes, duration, shape));
      maxDuration = Math.max(maxDuration, duration);
    });
  });

  return {
    v: "5.7.4",
    fr: fps,
    ip: 0,
    op: maxDuration,
    w: 1920,
    h: 1080,
    nm: "SVG Animation Export",
    ddd: 0,
    assets: [],
    layers
  };
}

function extractShapeFromSvg(el) {
  if (!el) return null;

  // If it's a wrapper group, descend to the first child shape
  if (el.tagName === "g") {
    const childShape = el.querySelector("ellipse, rect, path");
    if (childShape) return extractShapeFromSvg(childShape);
    return null;
  }

  if (el.tagName === "ellipse") {
    return {
      type: "ellipse",
      cx: parseFloat(el.getAttribute("cx")) || 0,
      cy: parseFloat(el.getAttribute("cy")) || 0,
      rx: parseFloat(el.getAttribute("rx")) || 0,
      ry: parseFloat(el.getAttribute("ry")) || 0,
      fill: resolveFill(el)
    };
  }

  if (el.tagName === "rect") {
    return {
      type: "rect",
      x: parseFloat(el.getAttribute("x")) || 0,
      y: parseFloat(el.getAttribute("y")) || 0,
      width: parseFloat(el.getAttribute("width")) || 0,
      height: parseFloat(el.getAttribute("height")) || 0,
      fill: resolveFill(el)
    };
  }

  if (el.tagName === "path") {
    return {
      type: "path",
      d: el.getAttribute("d"),
      fill: resolveFill(el)
    };
  }

  return null;
}


function resolveFill(el) {
  let fill = el.getAttribute("fill");
  if (!fill || fill === "none") {
    const style = getComputedStyle(el);
    fill = style.fill;
  }
  if (!fill || fill === "none") {
    return [0, 0, 0, 1]; // default black
  }
  return cssColorToRgba(fill);
}

