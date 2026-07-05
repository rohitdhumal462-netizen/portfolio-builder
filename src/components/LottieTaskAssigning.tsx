import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import taskAssigningData from "../../assets/task_assigning.json";

export default function LottieTaskAssigning() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: taskAssigningData,
    });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      style={{ overflow: "hidden" }}
    />
  );
}
