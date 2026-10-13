import React, { useEffect, useRef } from 'react';

export const GalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create sparse, subtle stars
    const starCount = Math.min(80, Math.floor((width * height) / 18000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.1 + 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      twinkleSpeed: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep outer-space base
      ctx.fillStyle = '#07070D';
      ctx.fillRect(0, 0, width, height);

      // Subtle edge nebula glow - top right (violet)
      const gradTR = ctx.createRadialGradient(
        width * 0.85,
        height * 0.15,
        50,
        width * 0.85,
        height * 0.15,
        width * 0.45
      );
      gradTR.addColorStop(0, 'rgba(139, 120, 198, 0.12)');
      gradTR.addColorStop(0.6, 'rgba(101, 104, 168, 0.04)');
      gradTR.addColorStop(1, 'rgba(7, 7, 13, 0)');
      ctx.fillStyle = gradTR;
      ctx.fillRect(0, 0, width, height);

      // Subtle edge nebula glow - bottom left (indigo)
      const gradBL = ctx.createRadialGradient(
        width * 0.15,
        height * 0.85,
        50,
        width * 0.15,
        height * 0.85,
        width * 0.5
      );
      gradBL.addColorStop(0, 'rgba(101, 104, 168, 0.10)');
      gradBL.addColorStop(0.6, 'rgba(74, 68, 120, 0.03)');
      gradBL.addColorStop(1, 'rgba(7, 7, 13, 0)');
      ctx.fillStyle = gradBL;
      ctx.fillRect(0, 0, width, height);

      // Draw gentle stars
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 0.85 || star.alpha < 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242, 240, 248, ${Math.max(0.1, star.alpha)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};
