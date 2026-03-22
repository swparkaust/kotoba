"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface CharacterTracerProps {
  character: string;
  onComplete: () => void;
}

interface Point {
  x: number;
  y: number;
}

export function CharacterTracer({ character, onComplete }: CharacterTracerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [showGuide, setShowGuide] = useState(true);

  const drawGuideCharacter = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.font = "200px serif";
    ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(character, 150, 160);
    ctx.restore();
  }, [character]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "#e7e5e4";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(150, 300);
    ctx.moveTo(0, 150);
    ctx.lineTo(300, 150);
    ctx.stroke();
    ctx.setLineDash([]);

    if (showGuide) {
      drawGuideCharacter(ctx);
    }

    // Draw completed strokes
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }

    // Draw current stroke
    if (currentStroke.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, showGuide, drawGuideCharacter]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  return (
    <div data-testid="character-tracer" className="text-center space-y-4">
      <div className="text-6xl text-stone-300 mb-2">{character}</div>
      <canvas
        ref={canvasRef}
        data-testid="trace-canvas"
        className="mx-auto border border-stone-200 rounded-xl bg-white touch-none cursor-crosshair"
        width={300}
        height={300}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      <p data-testid="trace-hint" className="text-sm text-stone-400">
        {showGuide ? "Trace over the guide character" : "Write the character from memory"}
      </p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="rounded-lg bg-stone-200 px-4 py-2 text-stone-600 hover:bg-stone-300 disabled:opacity-30"
        >
          Undo
        </button>
        <button
          onClick={handleClear}
          disabled={strokes.length === 0}
          className="rounded-lg bg-stone-200 px-4 py-2 text-stone-600 hover:bg-stone-300 disabled:opacity-30"
        >
          Clear
        </button>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="rounded-lg bg-stone-200 px-4 py-2 text-stone-600 hover:bg-stone-300"
        >
          {showGuide ? "Hide Guide" : "Show Guide"}
        </button>
      </div>
      <button
        onClick={onComplete}
        disabled={strokes.length === 0}
        className="rounded-lg bg-orange-500 px-6 py-2 text-white hover:bg-orange-400 disabled:opacity-50"
      >
        Done
      </button>
    </div>
  );
}
