"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const markerSize = 76;

type JourneyStep = {
  phase: string;
  copy: string;
};

export function Journey({ steps }: { steps: JourneyStep[] }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [layout, setLayout] = useState({
    markerTop: 0,
    lineTop: 0,
    lineHeight: 0,
    fillHeight: 0,
    visibleCount: 0
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      const prefersReducedMotion = motionQuery.matches;
      window.requestAnimationFrame(() => {
        setReducedMotion(prefersReducedMotion);
        if (prefersReducedMotion) {
          setLayout((current) => ({ ...current, visibleCount: steps.length, fillHeight: current.lineHeight }));
        }
      });
    };
    applyMotionPreference();

    if (motionQuery.matches) {
      return;
    }

    let frame = 0;
    const update = () => {
      const section = sectionRef.current;
      const rail = railRef.current;
      if (!section || !rail) return;
      const railRect = rail.getBoundingClientRect();
      const centers = stepRefs.current
        .map((step) => {
          if (!step) return null;
          const stepRect = step.getBoundingClientRect();
          return stepRect.top - railRect.top + stepRect.height / 2;
        })
        .filter((center): center is number => center !== null);

      if (centers.length === 0) return;

      const firstCenter = centers[0];
      const lastCenter = centers[centers.length - 1] ?? firstCenter;
      const travel = Math.max(1, lastCenter - firstCenter);
      const firstCenterInViewport = railRect.top + firstCenter;
      const start = window.innerHeight * 0.64;
      const end = window.innerHeight * 0.36;
      const scrollProgress = Math.min(1, Math.max(0, (start - firstCenterInViewport) / (travel + start - end)));
      const markerCenter = firstCenter + scrollProgress * travel;
      const visibleCount = centers.filter((center) => markerCenter >= center - 8).length;

      setLayout({
        markerTop: markerCenter - markerSize / 2,
        lineTop: firstCenter,
        lineHeight: travel,
        fillHeight: markerCenter - firstCenter,
        visibleCount
      });
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [steps.length]);

  return (
    <section id="journey" className="bg-ves-field" ref={sectionRef}>
      <div className="section-shell max-w-[1000px]">
        <div className="mb-12">
          <p className="eyebrow">Field Process</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">From municipal problem to installed automation.</h2>
        </div>
        <div className="relative pb-24" ref={railRef}>
          <div
            className="absolute left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-ves-leaf/20"
            style={{ top: layout.lineTop, height: layout.lineHeight }}
            aria-hidden="true"
          >
            <div className="w-full rounded-full bg-ves-leaf transition-[height] duration-150" style={{ height: layout.fillHeight }} />
          </div>
          <div
            className="absolute left-1/2 z-20 grid h-[76px] w-[76px] -translate-x-1/2 place-items-center transition-[top,filter] duration-150 drop-shadow-[0_16px_20px_rgba(8,11,10,0.34)]"
            style={{ top: layout.markerTop }}
            aria-hidden="true"
          >
            <JourneyIcon />
          </div>

          <div className="grid gap-8">
            {steps.map(({ phase, copy }, index) => {
              const isVisible = reducedMotion || layout.visibleCount > index;
              const isLeft = index % 2 === 0;
              return (
                <article
                  className={`relative grid gap-4 transition duration-500 md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] md:items-center md:gap-0 ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  }`}
                  key={`${index}-${phase}`}
                >
                  <div className={`order-2 md:order-none md:row-start-1 ${isLeft ? "md:col-start-1 md:pr-8" : "md:col-start-3 md:pl-8"}`}>
                    <div className="rounded border border-ves-leaf/20 bg-ves-cream p-7 shadow-soft">
                      <h3 className="text-xl font-extrabold leading-[1.15] text-ves-text">{phase}</h3>
                      <p className="mt-3 text-base leading-7 text-ves-text/68">{copy}</p>
                    </div>
                  </div>
                  <div
                    ref={(node) => {
                      stepRefs.current[index] = node;
                    }}
                    className={`relative z-10 order-1 mx-auto grid h-12 w-24 place-items-center rounded-full text-sm font-extrabold shadow-soft transition duration-300 md:order-none md:col-start-2 md:row-start-1 ${
                      isVisible ? "bg-ves-leaf text-white" : "bg-ves-cream text-ves-leaf"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyIcon() {
  return (
    <Image src="/brand/ves-logo-symbol-transparent.png" alt="" width={76} height={76} unoptimized className="h-full w-full object-contain" />
  );
}
