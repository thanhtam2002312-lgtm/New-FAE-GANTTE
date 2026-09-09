import React, { useState, useEffect, useRef } from "react";
import { 
  Image as ImageIcon, 
  Check, 
  X, 
  Upload, 
  Sliders, 
  Sparkles, 
  Palette,
  Trash2,
  RefreshCw,
  Star,
  Plus,
  Link as LinkIcon,
  Info,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface StoredWallpaper {
  id: string;
  name: string;
  url: string;
  isDefault?: boolean;
  createdAt: number;
}

export type WallpaperOption = StoredWallpaper;

export interface AccentThemeOption {
  id: string;
  name: string;
  enName: string;
  color: string;
  hoverText: string;
  subtleBg: string;
  border: string;
  glow: string;
  desc: string;
}

export const ACCENT_THEMES: AccentThemeOption[] = [
  {
    id: "white",
    name: "白曜微光",
    enName: "Pure White",
    color: "#FFFFFF",
    hoverText: "#FFFFFF",
    subtleBg: "rgba(255, 255, 255, 0.18)",
    border: "rgba(255, 255, 255, 0.45)",
    glow: "0 0 14px rgba(255, 255, 255, 0.45)",
    desc: "极致纯净，雪夜通透微光"
  },
  {
    id: "gold",
    name: "香槟琥珀",
    enName: "Champagne Amber",
    color: "#F59E0B",
    hoverText: "#FDE68A",
    subtleBg: "rgba(245, 158, 11, 0.16)",
    border: "rgba(245, 158, 11, 0.45)",
    glow: "0 0 16px rgba(245, 158, 11, 0.45)",
    desc: "冷暖相映，名表与温润金光"
  },
  {
    id: "mint",
    name: "极光薄荷",
    enName: "Aurora Mint",
    color: "#10B981",
    hoverText: "#6EE7B7",
    subtleBg: "rgba(168, 85, 247, 0.16)",
    border: "rgba(16, 185, 129, 0.45)",
    glow: "0 0 16px rgba(16, 185, 129, 0.45)",
    desc: "欧若拉青绿，柔和清爽护眼"
  },
  {
    id: "violet",
    name: "暮光紫鸢",
    enName: "Twilight Iris",
    color: "#A855F7",
    hoverText: "#E9D5FF",
    subtleBg: "rgba(168, 85, 247, 0.16)",
    border: "rgba(168, 85, 247, 0.45)",
    glow: "0 0 16px rgba(168, 85, 247, 0.45)",
    desc: "星空晚霞交融，艺术现代感"
  },
  {
    id: "cyan",
    name: "冰川天青",
    enName: "Glacier Sky",
    color: "#38BDF8",
    hoverText: "#BAE6FD",
    subtleBg: "rgba(56, 189, 248, 0.16)",
    border: "rgba(56, 189, 248, 0.45)",
    glow: "0 0 16px rgba(56, 189, 248, 0.45)",
    desc: "高山冰川晶莹澄澈，清爽明朗"
  },
  {
    id: "rose",
    name: "落霞珊瑚",
    enName: "Sunset Rose",
    color: "#FB7185",
    hoverText: "#FECDD3",
    subtleBg: "rgba(251, 113, 133, 0.16)",
    border: "rgba(251, 113, 133, 0.45)",
    glow: "0 0 16px rgba(251, 113, 133, 0.45)",
    desc: "夕阳余晖温柔玫瑰，暖意典雅"
  }
];

// Fallback high-definition dark atmospheric mountain landscape
export const DEFAULT_FALLBACK_URL = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop";

/**
 * Client-side image compression: prevents localStorage quota overflow by resizing
 * images to max 1920x1080 and applying moderate JPEG compression.
 */
export function compressImageFile(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getInitialWallpapers(): StoredWallpaper[] {
  try {
    const saved = localStorage.getItem("macos_saved_wallpapers");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 6);
      }
    }
  } catch (e) {
    console.warn("Failed to parse saved wallpapers:", e);
  }

  // If user previously uploaded a custom wallpaper in localStorage, use it as default
  const existingCustom = localStorage.getItem("macos_custom_wallpaper");
  const primaryUrl = existingCustom && existingCustom.trim().length > 0
    ? existingCustom
    : DEFAULT_FALLBACK_URL;

  return [
    {
      id: "wp-default-1",
      name: "我的壁纸 1 (默认)",
      url: primaryUrl,
      isDefault: true,
      createdAt: Date.now()
    }
  ];
}

interface MacDesktopLayerProps {
  isPickerOpen: boolean;
  onClosePicker: () => void;
}

export const MacDesktopLayer: React.FC<MacDesktopLayerProps> = ({
  isPickerOpen,
  onClosePicker
}) => {
  const [wallpapers, setWallpapers] = useState<StoredWallpaper[]>(() => {
    return getInitialWallpapers();
  });

  const [activeWallpaperId, setActiveWallpaperId] = useState<string>(() => {
    const savedActive = localStorage.getItem("macos_active_wallpaper_id");
    const initialList = getInitialWallpapers();
    if (savedActive && initialList.some(w => w.id === savedActive)) {
      return savedActive;
    }
    const defaultWp = initialList.find(w => w.isDefault);
    return defaultWp ? defaultWp.id : initialList[0]?.id || "wp-default-1";
  });

  const [currentAccentId, setCurrentAccentId] = useState<string>(() => {
    return localStorage.getItem("macos_accent_color") || "white";
  });

  const [glassOpacity, setGlassOpacity] = useState<number>(() => {
    const saved = localStorage.getItem("macos_glass_opacity");
    return saved ? Number(saved) : 2.5; // 2.5% opacity = 97.5% ultra clear
  });

  const [glassBlur, setGlassBlur] = useState<number>(() => {
    const saved = localStorage.getItem("macos_glass_blur");
    return saved !== null ? Number(saved) : 8; // 8px crystal clarity
  });

  const [textShield, setTextShield] = useState<boolean>(() => {
    const saved = localStorage.getItem("macos_text_shield");
    return saved !== null ? saved === "true" : true; // default true for high legibility
  });

  const [tempUrl, setTempUrl] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const activeAccent = ACCENT_THEMES.find(a => a.id === currentAccentId) || ACCENT_THEMES[0];

  const activeWallpaper = wallpapers.find(w => w.id === activeWallpaperId) 
    || wallpapers.find(w => w.isDefault) 
    || wallpapers[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 2400);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("macos_saved_wallpapers", JSON.stringify(wallpapers));
      if (activeWallpaperId) {
        localStorage.setItem("macos_active_wallpaper_id", activeWallpaperId);
      }
      if (activeWallpaper?.url) {
        localStorage.setItem("macos_custom_wallpaper", activeWallpaper.url);
        localStorage.setItem("macos_wallpaper_id", "custom");
      }
    } catch (e) {
      console.warn("Storage quota or error saving wallpapers", e);
    }
  }, [wallpapers, activeWallpaperId, activeWallpaper]);

  useEffect(() => {
    localStorage.setItem("macos_accent_color", activeAccent.id);

    document.documentElement.style.setProperty("--accent-color", activeAccent.color);
    document.documentElement.style.setProperty("--accent-hover-color", activeAccent.hoverText);
    document.documentElement.style.setProperty("--accent-subtle-bg", activeAccent.subtleBg);
    document.documentElement.style.setProperty("--accent-border", activeAccent.border);
    document.documentElement.style.setProperty("--accent-glow", activeAccent.glow);
  }, [activeAccent]);

  useEffect(() => {
    localStorage.setItem("macos_glass_opacity", String(glassOpacity));
    localStorage.setItem("macos_glass_blur", String(glassBlur));
    localStorage.setItem("macos_text_shield", String(textShield));

    // Apply dynamic glass opacity & blur CSS variables
    const alpha = (glassOpacity / 100).toFixed(3);
    const darkAlpha = Math.min(0.32, Math.max(0.015, (glassOpacity / 100) * 1.3 + 0.006)).toFixed(3);
    
    document.documentElement.style.setProperty("--glass-transparency", alpha);
    document.documentElement.style.setProperty("--glass-transparency-dark", darkAlpha);
    document.documentElement.style.setProperty("--glass-blur", `${glassBlur}px`);

    if (textShield) {
      document.documentElement.classList.add("enable-text-shield");
      document.documentElement.style.setProperty(
        "--text-shield-shadow",
        "0 1px 2px rgba(255, 255, 255, 0.85), 0 0 5px rgba(255, 255, 255, 0.45)"
      );
    } else {
      document.documentElement.classList.remove("enable-text-shield");
      document.documentElement.style.setProperty("--text-shield-shadow", "none");
    }
  }, [glassOpacity, glassBlur, textShield]);

  // Actions
  const handleSelectWallpaper = (id: string) => {
    setActiveWallpaperId(id);
  };

  const handleSetDefault = (id: string) => {
    setWallpapers(prev => prev.map(w => ({
      ...w,
      isDefault: w.id === id
    })));
    showToast("已将该壁纸设为开机默认壁纸");
  };

  const handleUploadNew = async (file: File) => {
    if (wallpapers.length >= 6) {
      alert("最多只能存储 6 个壁纸。如需添加新壁纸，请先删除或替换现有壁纸。");
      return;
    }
    try {
      setIsProcessing(true);
      const compressedUrl = await compressImageFile(file);
      const newId = `wp-${Date.now()}`;
      const newWp: StoredWallpaper = {
        id: newId,
        name: `壁纸 ${wallpapers.length + 1}`,
        url: compressedUrl,
        isDefault: wallpapers.length === 0,
        createdAt: Date.now(),
      };
      setWallpapers(prev => [...prev, newWp]);
      setActiveWallpaperId(newId);
      showToast("新壁纸上传成功并已应用！");
    } catch (err) {
      alert("壁纸处理失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerReplace = (id: string) => {
    setReplacingId(id);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    try {
      setIsProcessing(true);
      const compressedUrl = await compressImageFile(file);
      setWallpapers(prev => prev.map(w => {
        if (w.id === replacingId) {
          return {
            ...w,
            url: compressedUrl,
            createdAt: Date.now()
          };
        }
        return w;
      }));
      setActiveWallpaperId(replacingId);
      showToast("壁纸替换成功！");
    } catch (err) {
      alert("替换壁纸失败，请重试");
    } finally {
      setIsProcessing(false);
      setReplacingId(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = "";
      }
    }
  };

  const handleDeleteWallpaper = (id: string) => {
    if (wallpapers.length <= 1) {
      alert("壁纸库中至少需保留 1 张壁纸。如需更换请点击「替换」按钮。");
      return;
    }
    const isCurrentlyActive = activeWallpaperId === id;
    const filtered = wallpapers.filter(w => w.id !== id);

    const wasDefault = wallpapers.find(w => w.id === id)?.isDefault;
    let updatedList = filtered;
    if (wasDefault && filtered.length > 0) {
      updatedList = filtered.map((w, idx) => ({
        ...w,
        isDefault: idx === 0
      }));
    }

    setWallpapers(updatedList);

    if (isCurrentlyActive) {
      const nextActive = updatedList.find(w => w.isDefault) || updatedList[0];
      if (nextActive) {
        setActiveWallpaperId(nextActive.id);
      }
    }
    showToast("已删除该壁纸");
  };

  const handleAddByUrl = () => {
    const trimmed = tempUrl.trim();
    if (!trimmed) return;
    if (wallpapers.length >= 6) {
      alert("最多只能存储 6 个壁纸。如需添加新壁纸，请先删除或替换现有壁纸。");
      return;
    }
    const newId = `wp-${Date.now()}`;
    const newWp: StoredWallpaper = {
      id: newId,
      name: `壁纸 ${wallpapers.length + 1}`,
      url: trimmed,
      isDefault: wallpapers.length === 0,
      createdAt: Date.now()
    };
    setWallpapers(prev => [...prev, newWp]);
    setActiveWallpaperId(newId);
    setTempUrl("");
    showToast("网络壁纸已添加并启用！");
  };

  return (
    <>
      {/* 1. Global Ambient Desktop Wallpaper Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-700 ease-out select-none overflow-hidden"
        style={{
          backgroundImage: activeWallpaper?.url ? `url(${activeWallpaper.url})` : undefined,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundColor: "#11141A"
        }}
      >
        {/* Crisp Caustic Ambient Lighting */}
        <div className="absolute inset-0 bg-black/[0.04] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[650px] h-[450px] rounded-full bg-white/[0.07] blur-[110px] transform -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] rounded-full bg-white/[0.04] blur-[120px] transform translate-y-1/3 pointer-events-none" />
      </div>

      {/* 2. Wallpaper & Glass Customizer Modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/25 backdrop-blur-[3px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="macos-glass-modal rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.04] backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="p-2 rounded-xl transition-all"
                    style={{
                      backgroundColor: activeAccent.subtleBg,
                      color: activeAccent.color,
                      boxShadow: activeAccent.glow
                    }}
                  >
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">桌面背景与外观微光设置</h3>
                    <p className="text-xs text-white/70 mt-0.5">自选高亮主题色、毛玻璃通透度与自然壁纸</p>
                  </div>
                </div>
                <button
                  onClick={onClosePicker}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* 1. Accent Theme Color Selector */}
                <div className="p-4 rounded-2xl macos-glass-pill space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 transition-colors" style={{ color: activeAccent.color }} />
                      高亮主题微光 (Accent Theme)
                    </span>
                    <span 
                      className="text-xs font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all shadow-xs"
                      style={{ 
                        color: activeAccent.color, 
                        backgroundColor: activeAccent.subtleBg,
                        borderColor: activeAccent.border 
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeAccent.color }} />
                      {activeAccent.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    自定义鼠标悬停在标题、图标、时钟与功能按钮上的微光反射色彩，取代传统高饱和蓝：
                  </p>

                  {/* 6 Accent Color Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {ACCENT_THEMES.map((theme) => {
                      const isSelected = currentAccentId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setCurrentAccentId(theme.id)}
                          className={`p-2.5 rounded-xl text-left transition-all relative border flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? "bg-white/15 shadow-sm scale-[1.02]"
                              : "bg-white/[0.05] hover:bg-white/10 hover:scale-[1.01] border-white/10"
                          }`}
                          style={{
                            borderColor: isSelected ? theme.border : undefined,
                            boxShadow: isSelected ? theme.glow : undefined
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0 border border-white/40"
                                style={{ backgroundColor: theme.color }}
                              />
                              <span className="text-xs font-bold text-white leading-none">
                                {theme.name}
                              </span>
                            </div>
                            {isSelected && (
                              <span 
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: theme.color }}
                              >
                                <Check className={`w-2.5 h-2.5 stroke-[3] ${theme.id === "white" ? "text-neutral-900" : "text-white"}`} />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/65 mt-1.5 line-clamp-1 leading-normal">
                            {theme.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Glass Opacity Slider */}
                <div className="p-4 rounded-2xl macos-glass-pill space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 transition-colors" style={{ color: activeAccent.color }} />
                      玻璃通透度 (Transparency Level)
                    </span>
                    <span 
                      className="text-sm font-mono font-bold px-2.5 py-0.5 rounded-lg transition-colors"
                      style={{ 
                        color: activeAccent.color, 
                        backgroundColor: activeAccent.subtleBg 
                      }}
                    >
                      {(100 - glassOpacity).toFixed(1)}% 通透
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "98.5% 极透", value: 1.5 },
                      { label: "97.5% 水晶", value: 2.5 },
                      { label: "95% 晶莹", value: 5 },
                      { label: "90% 经典", value: 10 },
                    ].map((preset) => {
                      const isActive = glassOpacity === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setGlassOpacity(preset.value)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "text-white shadow-sm"
                              : "bg-white/10 text-white/80 hover:text-white"
                          }`}
                          style={{
                            backgroundColor: isActive ? activeAccent.color : undefined,
                            color: isActive && activeAccent.id === "white" ? "#1A1A1A" : undefined,
                            boxShadow: isActive ? activeAccent.glow : undefined
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <input 
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={glassOpacity}
                    onChange={(e) => setGlassOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: activeAccent.color }}
                  />
                  <div className="flex justify-between text-[10px] text-white/70">
                    <span>99% 极致清透 (1%)</span>
                    <span>97.5% 推荐水晶 (2.5%)</span>
                    <span>85% 微磨砂 (15%)</span>
                  </div>
                </div>

                {/* Glass Blur Slider */}
                <div className="p-4 rounded-2xl macos-glass-pill space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 transition-colors" style={{ color: activeAccent.color }} />
                      毛玻璃模糊度 (Blur Intensity)
                    </span>
                    <span 
                      className="text-sm font-mono font-bold px-2.5 py-0.5 rounded-lg transition-colors"
                      style={{ 
                        color: activeAccent.color, 
                        backgroundColor: activeAccent.subtleBg 
                      }}
                    >
                      {glassBlur}px
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "0px 水晶无雾", value: 0 },
                      { label: "6px 微透", value: 6 },
                      { label: "8px 清澈", value: 8 },
                      { label: "16px 柔雾", value: 16 },
                    ].map((preset) => {
                      const isActive = glassBlur === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setGlassBlur(preset.value)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "text-white shadow-sm"
                              : "bg-white/10 text-white/80 hover:text-white"
                          }`}
                          style={{
                            backgroundColor: isActive ? activeAccent.color : undefined,
                            color: isActive && activeAccent.id === "white" ? "#1A1A1A" : undefined,
                            boxShadow: isActive ? activeAccent.glow : undefined
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <input 
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={glassBlur}
                    onChange={(e) => setGlassBlur(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: activeAccent.color }}
                  />
                  <div className="flex justify-between text-[10px] text-white/70">
                    <span>0px 纯净透明</span>
                    <span>8px 推荐清澈</span>
                    <span>20px 经典深雾</span>
                  </div>
                </div>

                {/* Text Legibility Shield Toggle */}
                <div className="p-4 rounded-2xl macos-glass-pill flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-xs" />
                      高透文字清晰保护 (Text Legibility Shield)
                    </span>
                    <p className="text-[11px] text-white/70">
                      在高透明壁纸下自动为文字增强微光轮廓与高对比度，确保文字始终清晰可见
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTextShield(!textShield)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      textShield ? "bg-[#34C759]" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        textShield ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 6 Custom Storable Wallpapers Grid */}
                <div className="p-4 rounded-2xl macos-glass-pill space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 transition-colors" style={{ color: activeAccent.color }} />
                        我的壁纸库 (最多存储 6 张)
                      </span>
                      <p className="text-[11px] text-white/70 mt-0.5">
                        点击卡片即刻切换桌面，支持设为默认、单独替换与删除
                      </p>
                    </div>
                    <span 
                      className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all"
                      style={{
                        backgroundColor: activeAccent.subtleBg,
                        color: activeAccent.color,
                        borderColor: activeAccent.border
                      }}
                    >
                      {wallpapers.length} / 6 已存储
                    </span>
                  </div>

                  {/* Wallpaper Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wallpapers.map((wp, index) => {
                      const isSelected = activeWallpaperId === wp.id;
                      return (
                        <div
                          key={wp.id}
                          onClick={() => handleSelectWallpaper(wp.id)}
                          className={`group relative rounded-2xl h-36 overflow-hidden cursor-pointer transition-all border-2 flex flex-col justify-between p-2.5 select-none ${
                            isSelected
                              ? "scale-[1.02] shadow-lg"
                              : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                          }`}
                          style={{
                            borderColor: isSelected ? activeAccent.color : undefined,
                            boxShadow: isSelected ? activeAccent.glow : undefined
                          }}
                        >
                          {/* Wallpaper Image */}
                          <img 
                            src={wp.url} 
                            alt={wp.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_URL;
                            }}
                          />

                          {/* Vignette Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 pointer-events-none" />

                          {/* Top row: Status badges */}
                          <div className="relative z-10 flex items-center justify-between w-full">
                            {/* Active badge */}
                            {isSelected ? (
                              <span 
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-md"
                                style={{ 
                                  backgroundColor: activeAccent.color, 
                                  color: activeAccent.id === "white" ? "#1A1A1A" : "#FFFFFF" 
                                }}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                使用中
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-white/70 bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                #{index + 1}
                              </span>
                            )}

                            {/* Default badge / Set as Default button */}
                            {wp.isDefault ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/95 text-white flex items-center gap-1 shadow-md backdrop-blur-xs">
                                <Star className="w-3 h-3 fill-white" />
                                默认
                              </span>
                            ) : (
                              <button
                                type="button"
                                title="设为开机默认壁纸"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefault(wp.id);
                                }}
                                className="opacity-80 hover:opacity-100 px-1.5 py-0.5 rounded-md bg-black/50 hover:bg-amber-500/80 text-white/80 hover:text-white text-[10px] font-medium flex items-center gap-0.5 transition-all cursor-pointer backdrop-blur-xs"
                              >
                                <Star className="w-2.5 h-2.5" />
                                设默认
                              </button>
                            )}
                          </div>

                          {/* Bottom row: Info and Action Toolbar */}
                          <div className="relative z-10 flex items-center justify-between w-full pt-2">
                            <span className="text-xs font-bold text-white drop-shadow-md truncate max-w-[85px]">
                              {wp.name}
                            </span>

                            <div className="flex items-center gap-1">
                              {/* Replace button */}
                              <button
                                type="button"
                                title="替换此壁纸"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerReplace(wp.id);
                                }}
                                className="px-1.5 py-1 rounded-lg bg-white/20 hover:bg-white/35 text-white text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer backdrop-blur-xs"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                替换
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                title={wallpapers.length <= 1 ? "至少保留 1 张壁纸" : "删除此壁纸"}
                                disabled={wallpapers.length <= 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWallpaper(wp.id);
                                }}
                                className="p-1 rounded-lg bg-black/50 hover:bg-rose-500/80 disabled:opacity-30 disabled:pointer-events-none text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Upload button card if less than 6 */}
                    {wallpapers.length < 6 && (
                      <label 
                        className="group relative rounded-2xl h-36 border-2 border-dashed border-white/25 hover:border-white/50 bg-white/[0.04] hover:bg-white/[0.08] flex flex-col items-center justify-center gap-2 p-3 cursor-pointer transition-all text-center"
                      >
                        <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white transition-all group-hover:scale-110">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">上传新壁纸</span>
                          <span className="text-[10px] text-white/60 block mt-0.5">
                            还可添加 {6 - wallpapers.length} 张
                          </span>
                        </div>
                        <input 
                          ref={addInputRef}
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadNew(f);
                            if (addInputRef.current) addInputRef.current.value = "";
                          }}
                          className="hidden" 
                        />
                      </label>
                    )}

                    {/* Empty visual slots placeholders to clearly reflect the 6-slot capacity */}
                    {Array.from({ length: Math.max(0, 5 - wallpapers.length) }).map((_, idx) => (
                      <div 
                        key={`empty-slot-${idx}`}
                        className="rounded-2xl h-36 border border-white/5 bg-white/[0.015] flex flex-col items-center justify-center text-white/25 select-none p-3 text-center"
                      >
                        <ImageIcon className="w-6 h-6 stroke-[1.2] mb-1.5 opacity-30" />
                        <span className="text-[11px] font-medium">空闲壁纸槽位</span>
                        <span className="text-[9px] text-white/20 mt-0.5">#{wallpapers.length + 1 + idx + 1}</span>
                      </div>
                    ))}
                  </div>

                  {/* URL Input or Limit hint */}
                  {wallpapers.length < 6 ? (
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row gap-2 items-center">
                      <div className="flex-1 flex gap-2 w-full items-center">
                        <LinkIcon className="w-3.5 h-3.5 text-white/50 shrink-0 ml-1" />
                        <input
                          type="text"
                          placeholder="或输入网络图片 URL 地址添加至壁纸库..."
                          value={tempUrl}
                          onChange={(e) => setTempUrl(e.target.value)}
                          className="apple-input text-xs py-1.5 flex-1"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!tempUrl.trim()}
                        onClick={handleAddByUrl}
                        className="apple-button-primary text-xs py-1.5 px-3 whitespace-nowrap cursor-pointer disabled:opacity-40 w-full sm:w-auto"
                      >
                        添加此 URL
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 px-3 py-2 rounded-xl">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>已存满 6 个壁纸（已达最大存储上限）。如需更换，您可以点击卡片上的「替换」或「删除」按钮。</span>
                    </div>
                  )}

                  {/* Hidden input for replacing a specific wallpaper */}
                  <input 
                    ref={replaceInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleReplaceFile} 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-white">正在压缩与存储壁纸...</span>
                </div>
              )}

              {/* Toast Feedback */}
              {toastMsg && (
                <div className="fixed bottom-6 right-6 z-[140] px-4 py-2 bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                  <span>{toastMsg}</span>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-white/10 flex justify-end bg-white/[0.04] backdrop-blur-md">
                <button
                  onClick={onClosePicker}
                  className="apple-button-primary text-xs py-2 px-6 cursor-pointer"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
