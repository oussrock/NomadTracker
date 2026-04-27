import React, { useEffect, useRef } from 'react';

const WaveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';

      const drawWave = (yOffset: number, speed: number, opacity: number) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.moveTo(0, canvas.height);
        for (let i = 0; i <= canvas.width; i++) {
          ctx.lineTo(i, canvas.height - yOffset - Math.sin(i * 0.01 + offset * speed) * 20);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.fill();
      };

      drawWave(20, 0.02, 0.03);
      drawWave(40, 0.03, 0.02);
      drawWave(60, 0.04, 0.01);

      offset += 0.05;
      animationFrameId = requestAnimationFrame(render);
    };

    canvas.width = canvas.offsetWidth;
    canvas.height = 100;
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100px', position: 'absolute', bottom: 0, left: 0 }} />;
};

export default WaveBackground;
