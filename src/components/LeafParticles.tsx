import { useEffect, useRef } from "react";

// Lumina orbs — floating drops of light that drift like dust in a sunbeam
const LeafParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulse: number;
      pulseSpeed: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 18; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1.5,
        speedX: (Math.random() - 0.5) * 0.18,
        speedY: -(Math.random() * 0.25 + 0.08),
        opacity: Math.random() * 0.35 + 0.15,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Read CSS var live so particle color matches theme
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--particle-color").trim() || "232, 210, 160";

      for (const p of particles) {
        const pulseFactor = 0.7 + Math.sin(p.pulse) * 0.3;
        const r = p.size * pulseFactor;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        grad.addColorStop(0, `rgba(${rgb}, ${p.opacity * pulseFactor})`);
        grad.addColorStop(0.4, `rgba(${rgb}, ${p.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(${rgb}, ${p.opacity * pulseFactor * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        if (p.y < -20) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
};

export default LeafParticles;
