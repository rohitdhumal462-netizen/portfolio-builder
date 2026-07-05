import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ZoomIn, ZoomOut, RotateCw, Check, X, Move, Maximize, RefreshCw, 
  FlipHorizontal, FlipVertical, SlidersHorizontal, Crop, Paintbrush, 
  Sun, Contrast, Sparkles, Image as ImageIcon
} from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onClose: () => void;
  isCircular?: boolean;
  aspectRatio?: number; // width / height
  title?: string;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onCrop,
  onClose,
  isCircular = false,
  aspectRatio = 1,
  title = "Canva Photo Editor"
}: ImageCropperModalProps) {
  // Tabs: crop, adjust
  const [activeTab, setActiveTab] = useState<"crop" | "adjust">("crop");
  
  // Crop & Transform States
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 90, 180, 270...
  const [fineRotation, setFineRotation] = useState<number>(0); // -45 to 45
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [currentAspectRatio, setCurrentAspectRatio] = useState<number>(aspectRatio);
  
  // Adjust & Filters States
  const [brightness, setBrightness] = useState<number>(100);  // 50 to 150
  const [contrast, setContrast] = useState<number>(100);    // 50 to 150
  const [saturation, setSaturation] = useState<number>(100);  // 0 to 200
  const [blur, setBlur] = useState<number>(0);            // 0 to 10
  const [presetFilter, setPresetFilter] = useState<string>("none"); // none, vintage, dramatic, mono, warm, cool

  // Interaction Drag States
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isImageMoving, setIsImageMoving] = useState<boolean>(false);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Synchronize aspect ratio props when starting
  useEffect(() => {
    if (isOpen) {
      setCurrentAspectRatio(aspectRatio);
      setActiveTab("crop");
      setZoom(1);
      setRotation(0);
      setFineRotation(0);
      setPan({ x: 0, y: 0 });
      setFlipH(false);
      setFlipV(false);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setBlur(0);
      setPresetFilter("none");
    }
  }, [isOpen, imageSrc, aspectRatio]);

  if (!isOpen || !imageSrc) return null;

  // Viewport setup (Canva centered stage)
  const MASK_WIDTH = 280;
  const MASK_HEIGHT = MASK_WIDTH / currentAspectRatio;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({
      w: img.naturalWidth,
      h: img.naturalHeight
    });
  };

  // Drag handlers
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setIsImageMoving(true);
    setDragStart({
      x: clientX - pan.x,
      y: clientY - pan.y
    });
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
    setTimeout(() => setIsImageMoving(false), 80);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    moveDrag(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    stopDrag();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    stopDrag();
  };

  const handleRotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetAll = () => {
    setZoom(1);
    setRotation(0);
    setFineRotation(0);
    setPan({ x: 0, y: 0 });
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setPresetFilter("none");
  };

  // Compose CSS filter styles string representation
  const getFilterStyle = () => {
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
    
    if (presetFilter === "vintage") {
      filterString += " sepia(0.4) saturate(1.2)";
    } else if (presetFilter === "dramatic") {
      filterString += " contrast(1.3) saturate(0.8) brightness(0.95)";
    } else if (presetFilter === "mono") {
      filterString += " grayscale(1) contrast(1.25) brightness(1.05)";
    } else if (presetFilter === "warm") {
      filterString += " sepia(0.15) hue-rotate(10deg) saturate(1.15)";
    } else if (presetFilter === "cool") {
      filterString += " hue-rotate(-12deg) saturate(1.08) brightness(1.02)";
    }
    return filterString;
  };

  // Trigger high-quality Canvas Crop rendering with advanced adjustments
  const handleCropExecute = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    const renderScale = 3;
    const canvas = document.createElement("canvas");
    canvas.width = MASK_WIDTH * renderScale;
    canvas.height = MASK_HEIGHT * renderScale;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill standard solid backing
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Coordinate math: Calculate initial fit scale of source image in target crop area
    const viewportRatio = MASK_WIDTH / MASK_HEIGHT;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    
    let baseScale = 1;
    if (imgRatio > viewportRatio) {
      baseScale = MASK_HEIGHT / img.naturalHeight;
    } else {
      baseScale = MASK_WIDTH / img.naturalWidth;
    }

    // 1. Center camera on canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // 2. Add pan translation
    ctx.translate(pan.x * renderScale, pan.y * renderScale);
    
    // 3. Add combined fine & 90° rotations
    const totalAngle = rotation + fineRotation;
    ctx.rotate((totalAngle * Math.PI) / 180);
    
    // 4. Flip reflection scales
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    
    // 5. Draw scaling factors
    const finalScaleAmount = baseScale * zoom * renderScale;
    ctx.scale(finalScaleAmount, finalScaleAmount);

    // Apply Canva Filters & Adjustments instantly to HTML5 Canvas context
    let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur * renderScale}px)`;
    if (presetFilter === "vintage") {
      filterStr += " sepia(40%) saturate(120%)";
    } else if (presetFilter === "dramatic") {
      filterStr += " contrast(130%) saturate(80%) brightness(95%)";
    } else if (presetFilter === "mono") {
      filterStr += " grayscale(100%) contrast(125%) brightness(105%)";
    } else if (presetFilter === "warm") {
      filterStr += " sepia(15%) hue-rotate(10deg) saturate(115%)";
    } else if (presetFilter === "cool") {
      filterStr += " hue-rotate(-12deg) saturate(108%) brightness(102%)";
    }
    
    // Inject filter to rendering engine
    ctx.filter = filterStr;

    // Draw centering base
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    const outputDataURL = canvas.toDataURL("image/jpeg", 0.95);
    onCrop(outputDataURL);
    onClose();
  };

  // Filter Presets Definition
  const filterPresets = [
    { id: "none", name: "Original", classes: "bg-slate-250 border-slate-300" },
    { id: "vintage", name: "Vintage", style: { filter: "sepia(0.4) saturate(1.2)" } },
    { id: "dramatic", name: "Dramatic", style: { filter: "contrast(1.3) saturate(0.8) brightness(0.95)" } },
    { id: "mono", name: "Mono Classic", style: { filter: "grayscale(1) contrast(1.25)" } },
    { id: "warm", name: "Sunset Warm", style: { filter: "sepia(0.15) hue-rotate(10deg) saturate(1.15)" } },
    { id: "cool", name: "Nordic Cool", style: { filter: "hue-rotate(-12deg) saturate(1.08)" } }
  ];

  return (
    <AnimatePresence>
      <div 
        id="image_cropper_backdrop_overlay"
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="image_cropper_card"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col my-auto"
        >
          {/* Header (Canva Inspired) */}
          <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                <Crop className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-sans font-extrabold text-slate-900 text-[14px] leading-tight flex items-center gap-1.5">
                  {title}
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Canva Mode</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Power filters, tilt adjustment & auto grid align</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation selectors */}
          <div className="flex border-b border-slate-100 bg-white">
            <button
              id="cropper_tab_crop"
              type="button"
              onClick={() => setActiveTab("crop")}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === "crop" 
                  ? "border-slate-950 text-slate-950 bg-slate-50/20" 
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/30"
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Crop & Transform</span>
            </button>
            <button
              id="cropper_tab_adjust"
              type="button"
              onClick={() => setActiveTab("adjust")}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === "adjust" 
                  ? "border-slate-950 text-slate-950 bg-slate-50/20" 
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/30"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust & Filters</span>
            </button>
          </div>

          {/* Interactive Canva workspace Arena */}
          <div className="p-6 bg-slate-900 flex flex-col items-center justify-center min-h-[350px] relative select-none">
            
            {/* Viewport Boundary Box */}
            <div
              id="image_crop_workspace_viewport"
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ width: "320px", height: "320px" }}
              className={`relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-move transition-all duration-300 ${
                isImageMoving ? "ring-2 ring-indigo-500" : ""
              }`}
            >
              {/* Loaded Image underneath transforming smoothly with adjustments / filters */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Canva adjustment asset"
                onLoad={handleImageLoad}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${(rotation + fineRotation) % 360}deg) scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  filter: getFilterStyle(),
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  transformOrigin: "center center",
                  pointerEvents: "none"
                }}
                className="transition-all duration-75 ease-out select-none"
              />

              {/* Decorative Canva Overlay masking everything outside crop bounds */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* SVG Cutout Mask */}
                <svg className="w-full h-full absolute inset-0">
                  <defs>
                    <mask id="canva-crop-mask-id">
                      {/* Base opaque fills entire bounds */}
                      <rect x="0" y="0" width="100%" height="100%" fill="white" />
                      {/* Transparent cutout reveals the image */}
                      {isCircular ? (
                        <circle cx="160" cy="160" r={MASK_WIDTH / 2} fill="black" />
                      ) : (
                        <rect
                          x={160 - MASK_WIDTH / 2}
                          y={160 - MASK_HEIGHT / 2}
                          width={MASK_WIDTH}
                          height={MASK_HEIGHT}
                          rx="8"
                          fill="black"
                        />
                      )}
                    </mask>
                  </defs>
                  
                  {/* Surrounding backdrop coverage */}
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="#030712"
                    fillOpacity="0.8"
                    mask="url(#canva-crop-mask-id)"
                  />
                </svg>

                {/* Grid Overlay inside crop mask (Rule of Thirds Guidelines) */}
                <div
                  style={{
                    width: `${MASK_WIDTH}px`,
                    height: `${MASK_HEIGHT}px`,
                    borderRadius: isCircular ? "50%" : "8px",
                  }}
                  className={`border-2 border-white/60 pointer-events-none absolute overflow-hidden transition-opacity duration-300 ${
                    isImageMoving || isDragging ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {/* Grid Lines Overlay */}
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-transparent" />
                  </div>
                </div>

                {/* Highlight Frame Stroke */}
                <div
                  style={{
                    width: `${MASK_WIDTH}px`,
                    height: `${MASK_HEIGHT}px`,
                    borderRadius: isCircular ? "50%" : "8px"
                  }}
                  className="border border-white pointer-events-none shadow-md"
                />
              </div>

              {/* Central drag cue label */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[8px] tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 opacity-90 border border-slate-700/50">
                <Move className="w-2.5 h-2.5 text-indigo-400" />
                <span>Drag inside to align view</span>
              </div>
            </div>
          </div>

          {/* Canva Editing Controls Area */}
          <div className="p-5 border-t border-slate-150 flex flex-col gap-5 bg-white">
            
            {activeTab === "crop" ? (
              /* CROP & TRANSFORM CONTROLS PANEL */
              <div className="space-y-4 animate-fade-in">
                
                {/* 1. Zoom Slider block */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3 text-slate-400" /> Image Scale</span>
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md font-bold">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.4, z - 0.25))}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition shrink-0"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id="cropper_canva_zoom"
                      type="range"
                      min="0.4"
                      max="4.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-indigo-650 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(4.5, z + 0.25))}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition shrink-0"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Fine Tilt Orientation Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 text-slate-400" /> Fine Alignment Tilt</span>
                    <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md font-bold">{fineRotation > 0 ? `+${fineRotation}` : fineRotation}°</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-400">-45°</span>
                    <input
                      id="cropper_fine_tilt"
                      type="range"
                      min="-45"
                      max="45"
                      step="1"
                      value={fineRotation}
                      onChange={(e) => setFineRotation(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                    />
                    <span className="text-[9px] font-bold text-slate-400">+45°</span>
                  </div>
                </div>

                {/* Aspect Ratio choice buttons for general non-circular crops */}
                {!isCircular && (
                  <div className="space-y-1.5">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aspect Dimension Presets</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: "16:9 Wide", value: 16 / 9 },
                        { label: "4:3 Classic", value: 4 / 3 },
                        { label: "1:1 Square", value: 1 },
                        { label: "3:2 Standard", value: 1.5 }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setCurrentAspectRatio(preset.value);
                            // Auto reset state safely to center image in new viewport
                            setPan({ x: 0, y: 0 });
                          }}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            Math.abs(currentAspectRatio - preset.value) < 0.01
                              ? "bg-indigo-600 border-indigo-650 text-white shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Orientation & Reflect Flips Button triggers */}
                <div className="flex items-center justify-between gap-2.5 pt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transforms & reflections</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                        flipH 
                          ? "bg-slate-900 border-slate-950 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Flip Horizontally"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>Flip H</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                        flipV 
                          ? "bg-slate-900 border-slate-950 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Flip Vertically"
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                      <span>Flip V</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRotate90}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer transition"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Rotate 90°</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* ADJUST & FILTERS CONTROLS PANEL */
              <div className="space-y-4 animate-fade-in max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                
                {/* 1. Fast filters presets list */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Instant Filter Presets</span>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
                    {filterPresets.map((filt) => (
                      <button
                        key={filt.id}
                        type="button"
                        onClick={() => setPresetFilter(filt.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold border shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                          presetFilter === filt.id
                            ? "bg-indigo-650 text-white border-indigo-700 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>{filt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Custom Adjustments Sliders list */}
                <div className="space-y-3.5 pt-1.5 border-t border-slate-100">
                  
                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /> Brightness</span>
                      <span className="font-mono text-slate-600 font-extrabold">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Contrast className="w-3.5 h-3.5 text-indigo-500" /> Contrast</span>
                      <span className="font-mono text-slate-600 font-extrabold">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-rose-500" /> Color Saturation</span>
                      <span className="font-mono text-slate-600 font-extrabold">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Paintbrush className="w-3.5 h-3.5 text-blue-500" /> Soft Focus (Blur)</span>
                      <span className="font-mono text-slate-600 font-extrabold">{blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="0.5"
                      value={blur}
                      onChange={(e) => setBlur(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                </div>

              </div>
            )}

            {/* Bottom Action Footer for Modal with Reset and Save buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                title="Clears all adjustments back to raw original settings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset All Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="cropper_save_crop_btn"
                  type="button"
                  onClick={handleCropExecute}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Crop & Adjust</span>
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
