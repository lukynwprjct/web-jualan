"use client";

import { useEffect, useRef } from "react";
import initBlackHole from "@/public/blackhole.js";

export default function HeroBlackhole() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const hostElement = containerRef.current;
    
    // Set explicit dimensions for blackhole
    hostElement.style.position = "absolute";
    hostElement.style.top = "0";
    hostElement.style.left = "0";
    hostElement.style.width = "100%";
    hostElement.style.height = "100%";

    const blackhole = initBlackHole(hostElement, {
      distance: 24,
      elevation: -5.5,
      orbitSpeed: 0,
      spinSpeed: 0.06,
      grain: 0.48,
      doppler: 0.35,
      hotColor: "#FFF3DE",
      metalColor: "#BDBDBD",
    });

    return () => {
      blackhole?.cleanup();
    };
  }, []);

  return <div ref={containerRef} className="hero-blackhole" />;
}
