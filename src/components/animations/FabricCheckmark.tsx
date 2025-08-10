import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Path } from "fabric";

export const FabricCheckmark = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 120,
      height: 80,
      backgroundColor: "transparent",
    });

    // Animated checkmark path
    const path = new Path("M20 40 L50 65 L100 20", {
      stroke: "#2D6A4F",
      strokeWidth: 6,
      fill: "",
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });

    path.set({ strokeDashArray: [200, 200], strokeDashOffset: 200 });
    canvas.add(path);

    let progress = 0;
    const animate = () => {
      progress += 8;
      const offset = Math.max(200 - progress, 0);
      path.set({ strokeDashOffset: offset });
      canvas.requestRenderAll();
      if (offset > 0) requestAnimationFrame(animate);
    };
    animate();

    return () => { void canvas.dispose(); }
  }, []);

  return <canvas ref={canvasRef} className="block" aria-hidden />;
};
