import { useEffect, useRef } from 'react';
import { STROKE_BOX } from '../data/strokes.js';

/**
 * Square drawing pad. Strokes are stored normalised to [0, 1] so the scorer and the
 * overlay don't depend on the on-screen size. `reference` (SVG paths) is drawn on top
 * when provided — used to show the correct kana after checking.
 */
export default function DrawCanvas({ strokes, onChange, reference = null, disabled = false, strokeStates = null }) {
  const canvasRef = useRef(null);
  const liveRef = useRef(null); // stroke currently being drawn
  const sizeRef = useRef(300);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // guides
    ctx.save();
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--line').trim() || '#ddd';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();
    ctx.restore();

    // reference overlay
    if (reference) {
      ctx.save();
      const k = size / STROKE_BOX;
      ctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = 'rgba(200, 49, 43, 0.55)';
      for (const d of reference) ctx.stroke(new Path2D(d));
      ctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // user strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(5, size / 40);
    const inkColor = getComputedStyle(canvas).getPropertyValue('--ink').trim() || '#111';
    const drawStroke = (pts, color) => {
      if (pts.length === 0) return;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * size, pts[0][1] * size);
      if (pts.length === 1) ctx.lineTo(pts[0][0] * size + 0.1, pts[0][1] * size);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * size, pts[i][1] * size);
      ctx.stroke();
    };
    strokes.forEach((s, i) => {
      const st = strokeStates?.[i];
      const color = !st ? inkColor : st.score >= 0.6 && !st.reversed ? 'rgba(46,125,79,0.9)' : 'rgba(179,38,30,0.9)';
      drawStroke(s, color);
    });
    if (liveRef.current) drawStroke(liveRef.current, inkColor);
  };

  // Resize to CSS size × devicePixelRatio
  useEffect(() => {
    const canvas = canvasRef.current;
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.round(rect.width);
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = size;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(redraw); // redraw after every render (strokes / reference / states changed)

  const toPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height];
  };

  const down = (e) => {
    if (disabled || e.button > 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    liveRef.current = [toPoint(e)];
    redraw();
  };
  const move = (e) => {
    if (!liveRef.current) return;
    liveRef.current.push(toPoint(e));
    redraw();
  };
  const up = () => {
    if (!liveRef.current) return;
    const stroke = liveRef.current;
    liveRef.current = null;
    onChange([...strokes, stroke]);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`draw-canvas ${disabled ? 'disabled' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      aria-label="Drawing pad"
    />
  );
}
