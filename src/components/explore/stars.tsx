'use client';

import { useEffect, useRef } from 'react';

// 背景の星。1 枚の canvas に描き、10 個に 1 個だけゆっくり瞬く。
// タブが隠れたら止め、「視差効果を減らす」設定では静止画を 1 枚描くだけ。

type Star = { x: number; y: number; r: number; phase: number; speed: number; twinkle: boolean };

const PAPER = '#f5f1e6';

export default function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = PAPER;
      for (const s of stars) {
        ctx.globalAlpha = s.twinkle && !reduce ? 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(s.phase + (t / 1000) * s.speed)) : 0.55;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!reduce && !raf && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 768 ? 120 : 250;
      stars = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.8 ? 0.7 : 1.2,
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 0.9, // 3〜5 秒で一巡
        twinkle: i % 10 === 0,
      }));
      draw(performance.now());
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="stars" aria-hidden="true" />;
}
