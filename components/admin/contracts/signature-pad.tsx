"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiEraser } from "react-icons/pi";

interface Props {
  label: string;
  initialValue?: string | null;
  onChange: (dataUrl: string | null) => void;
}

interface Point {
  x: number;
  y: number;
}

const LINE_WIDTH = 2;
const STROKE_COLOR = "#111";

/**
 * Canvas de signature custom.
 *
 * UX adaptative selon le support de saisie (détecté via `pointerType`) :
 *  • touch / pen : appui-relâche naturel (tablette, Apple Pencil, Surface Pen)
 *  • mouse     : click-to-toggle → un clic démarre la signature, les
 *                 mouvements dessinent sans maintenir, un 2e clic termine.
 *                 Beaucoup plus fluide au trackpad que le hold-to-draw.
 */
export function SignaturePad({ label, initialValue, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const hasDrawnRef = useRef(false);

  const [hasInk, setHasInk] = useState<boolean>(!!initialValue);
  const [resigning, setResigning] = useState(false);
  const [toggleMode, setToggleMode] = useState(false); // affiche le badge "mode trackpad"

  const showExisting = !!initialValue && !resigning;

  // Initialise le canvas à la taille du conteneur + DPR pour éviter le flou.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = container.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth = LINE_WIDTH;
    }
  }, []);

  useEffect(() => {
    if (showExisting) return;
    setupCanvas();
    const handler = () => setupCanvas();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [setupCanvas, showExisting]);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  // Si le parent réinitialise `initialValue` à null (ex. "Supprimer" dans
  // la card parent), on vide le canvas et tous les états internes.
  useEffect(() => {
    if (initialValue === null) {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawingRef.current = false;
      lastPointRef.current = null;
      hasDrawnRef.current = false;
      setHasInk(false);
      setResigning(false);
      setToggleMode(false);
    }
  }, [initialValue]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startStroke = (p: Point) => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    lastPointRef.current = p;
  };

  const extendStroke = (p: Point) => {
    const ctx = getCtx();
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    // Bezier quadratique lissée : on fait passer la courbe par le milieu
    // entre l'ancien et le nouveau point.
    const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
    ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
    ctx.stroke();
    lastPointRef.current = p;
    hasDrawnRef.current = true;
  };

  const endStroke = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
    const ctx = getCtx();
    if (ctx) ctx.closePath();
    // Pousse l'état vers le parent.
    if (hasDrawnRef.current) {
      setHasInk(true);
      const dataUrl = canvasRef.current?.toDataURL("image/png") ?? null;
      onChange(dataUrl);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const p = pointFromEvent(e);

    if (e.pointerType === "mouse") {
      // Trackpad / souris → click-to-toggle
      setToggleMode(true);
      if (drawingRef.current) {
        // 2e clic : on termine le trait.
        endStroke();
      } else {
        // 1er clic : on démarre le trait.
        drawingRef.current = true;
        startStroke(p);
      }
      return;
    }

    // Touch / pen → hold-to-draw naturel
    drawingRef.current = true;
    startStroke(p);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    extendStroke(pointFromEvent(e));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse") return; // géré par click-to-toggle
    endStroke();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
    hasDrawnRef.current = false;
    setHasInk(false);
    setToggleMode(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {showExisting ? (
          <button
            type="button"
            onClick={() => setResigning(true)}
            className="text-xs text-black underline hover:no-underline"
          >
            Refaire la signature
          </button>
        ) : hasInk ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-red-500 hover:underline"
          >
            <PiEraser className="size-3.5" />
            Effacer
          </button>
        ) : null}
      </div>

      {showExisting ? (
        <div className="flex items-center justify-center w-full h-[400px] rounded-md border border-gray-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={initialValue ?? ""}
            alt={`Signature ${label}`}
            className="max-h-full max-w-full object-contain p-2"
          />
        </div>
      ) : (
        <div
          ref={containerRef}
          className="rounded-md border border-dashed border-gray-400 bg-white touch-none overflow-hidden w-full h-[400px]"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={(e) => {
              // En mode tactile/pen on ferme si on quitte le canvas ;
              // en mode souris on laisse le toggle actif tant qu'on ne clique pas.
              if (e.pointerType !== "mouse" && drawingRef.current) endStroke();
            }}
            className="w-full h-full cursor-crosshair"
          />
        </div>
      )}

      {!showExisting && !hasInk && !toggleMode && (
        <p className="text-[11px] text-muted-foreground">
          Signez au doigt (tablette), au stylet ou au trackpad.
        </p>
      )}
      {!showExisting && toggleMode && (
        <p className="text-[11px] text-muted-foreground">
          Mode trackpad/souris : cliquez une fois pour démarrer, bougez pour
          dessiner, cliquez à nouveau pour terminer.
        </p>
      )}
      {resigning && initialValue && !hasInk && (
        <button
          type="button"
          onClick={() => setResigning(false)}
          className="text-xs text-muted-foreground hover:underline"
        >
          Annuler et garder la signature précédente
        </button>
      )}
    </div>
  );
}
