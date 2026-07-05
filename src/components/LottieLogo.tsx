import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import logoAnimationData from "../../assets/231579f2-1169-11ee-afce-8b9b22c2111f.json";

export default function LottieLogo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: logoAnimationData,
    });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full scale-110" 
      style={{ overflow: "hidden" }}
    />
  );
}
