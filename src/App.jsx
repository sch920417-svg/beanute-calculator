import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Calendar, Users, Calculator, ArrowRight, ChevronDown, X, 
  Settings, LayoutDashboard, ImagePlus, Trash2, Save, UploadCloud,
  Type, MessageSquare, ToggleLeft, ToggleRight, BarChart3, TrendingUp,
  Link as LinkIcon, ExternalLink, MapPin, CheckCircle, Loader2, Star, HelpCircle, ChevronUp, Plus, ChevronLeft, ChevronRight, Lock, Menu, Folder, FileText, AlignLeft, AlignCenter, AlignRight, Quote, Link2, MonitorPlay, Maximize, Columns, List, ListOrdered, Bold, Underline
} from "lucide-react";

// --- Firebase Imports ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, onSnapshot, addDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';

// --- Firebase Initialization ---
let app, auth, db;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {
        apiKey: "AIzaSyDgfsV0pdtFAbG3hXFYwhCjxb8g6IQhbuk",
        authDomain: "calculator-30cc8.firebaseapp.com",
        projectId: "calculator-30cc8",
        storageBucket: "calculator-30cc8.firebasestorage.app",
        messagingSenderId: "992976775409",
        appId: "1:992976775409:web:4b3541b364705e49b5e150"
      };
  
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch(e) {
  console.error("Firebase init error:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'family-photo-app';
const getPath = (colName) => `artifacts/${appId}/public/data/${colName}`; 

// --- Constants ---
const PRODUCT_TYPES = { FAMILY: "family", MATERNITY: "maternity", COUPLE: "couple" };
const DATE_TYPES = { WEEKDAY: "weekday", WEEKEND: "weekend" };

const FRAME_SIZES = [
  { id: '5R', label: '5R', cm: '약 13x18 cm' },
  { id: '8R', label: '8R', cm: '약 20x30 cm' },
  { id: '12R', label: '12R', cm: '약 30x43 cm' },
  { id: '16R', label: '16R', cm: '약 40x50 cm' },
  { id: '20R', label: '20R', cm: '약 50x61 cm' },
  { id: '24R', label: '24R', cm: '약 61x86 cm' },
  { id: '30R', label: '30R', cm: '약 76x102 cm' },
];

const TAG_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500", 
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500", 
  "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-pink-500", "bg-slate-800"
];

const DEFAULT_CONFIG = {
  prices: {
    family: { weekday: 300000, weekend: 330000, basePeople: 4, extraPersonCost: 22000 },
    maternity: { weekday: 250000, weekend: 270000, fixedPeople: 2 },
    couple: { weekday: 200000, weekend: 220000, fixedPeople: 2 },
  },
  framePrices: {
    wood: { '5R': 20000, '8R': 40000, '12R': 80000, '16R': 100000, '20R': 150000, '24R': 180000, '30R': 250000 },
    frameless: { '5R': 30000, '8R': 50000, '12R': 100000, '16R': 130000, '20R': 180000, '24R': 230000, '30R': 300000 },
  },
  sliderImages: [],
  reviewImages: [],
  faqs: [
    { question: "예약금은 얼마인가요?", answer: "예약금은 5만원이며, 촬영 당일 총 결제 금액에서 제외됩니다." },
    { question: "의상 대여가 가능한가요?", answer: "네, 스튜디오에 다양한 사이즈의 드레스와 정장, 구두가 준비되어 있습니다.\n무료로 대여 가능합니다." },
    { question: "원본 사진은 전부 제공되나요?", answer: "네! 촬영된 원본 사진은 색감 보정 후 모두 고화질로 제공해드리고 있습니다." }
  ],
  blogTitle: "Vignette Journal",
  blogSubtitle: "비뉴뜨만의 따뜻한 촬영 기록과 정보를 만나보세요.",
  blogFolders: [],
  popupImage: null,
  priceTableImage: null,
  introText: "안녕하세요 ☺️ 투명하고 정직한 스튜디오입니다.\n원하시는 촬영 상품과 조건을 선택하시면 실제 견적을 즉시 확인하실 수 있습니다.",
  popupEnabled: true,
  popupText: "견적 계산기를 통해 안내된 금액 외에\n추가로 발생하는 비용은 절대 없습니다😊\n\n-정직한 스튜디오 비뉴뜨 올림-",
  consultationText: "카카오톡 채팅 상담하기 →",
  consultationLink: "http://pf.kakao.com/_udVXG",
  bottomNoticeText: "해당 견적 이외에 추가비용은 절대 발생하지 않습니다.",
};

// --- Sub Components ---
function SelectCustom({ value, onChange, options, label, disabled, className }) {
  return (
    <div className={`relative w-full ${className || ""}`}>
      {label && <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider text-xs">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            onChange(options.some(o => typeof o.value === "number") ? Number(val) : val);
          }}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 text-[15px] sm:text-base shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-500/50 text-slate-800"
        >
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><ChevronDown className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

function RadioCard({ selected, onClick, title, description, disabled }) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex w-full flex-col items-start rounded-2xl border p-4 sm:p-5 text-left transition-all duration-200 ${
        selected ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20 shadow-md shadow-blue-500/10" : "border-slate-200 bg-white hover:border-blue-500/40 hover:bg-slate-50 shadow-sm"
      } ${disabled ? "cursor-not-allowed opacity-50 grayscale" : ""}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className={`text-[15px] sm:text-base font-bold ${selected ? "text-blue-700" : "text-slate-800"}`}>{title}</span>
        {selected && <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-blue-600 shadow-sm" />}
      </div>
      {description && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-medium text-slate-500">{description}</p>}
    </motion.button>
  );
}

const BouncyTag = ({ text, colorClass = "bg-red-500" }) => (
  <motion.span 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ scale: 1.15, y: -2 }}
    transition={{ type: "spring", stiffness: 500, damping: 15 }}
    className={`${colorClass} text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm cursor-default whitespace-nowrap`}
  >
    {text}
  </motion.span>
);

const ModeToggle = ({ isBlogMode, onToggle }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onToggle}
    className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold shadow-sm border transition-all flex items-center gap-1.5
      ${isBlogMode 
        ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' 
        : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'}`}
  >
    {isBlogMode ? (
      <>
        <Calculator className="w-3.5 h-3.5" />
        <span>견적기 전환</span>
      </>
    ) : (
      <>
        <FileText className="w-3.5 h-3.5" />
        <span>블로그 전환</span>
      </>
    )}
  </motion.button>
);

function TagEditor({ tags, onChange }) {
  const normalizedTags = tags.map(t => typeof t === 'string' ? { id: Math.random().toString(36).substr(2, 9), text: t, color: TAG_COLORS[0] } : t);
  
  const [newTagText, setNewTagText] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const handleAdd = () => {
    if (!newTagText.trim()) return;
    onChange([...normalizedTags, { id: Math.random().toString(36).substr(2, 9), text: newTagText.trim(), color: selectedColor }]);
    setNewTagText("");
  };

  const handleRemove = (id) => {
    onChange(normalizedTags.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl w-full">
      <div className="flex flex-wrap gap-1.5 mb-1">
        {normalizedTags.map(t => (
          <span key={t.id} className={`${t.color} text-white text-[11.5px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm`}>
            {t.text}
            <button onClick={() => handleRemove(t.id)} className="hover:bg-white/30 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {normalizedTags.length === 0 && <span className="text-[11px] text-slate-400 font-medium py-1">추가된 태그가 없습니다.</span>}
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
        <input 
          value={newTagText} 
          onChange={e => setNewTagText(e.target.value)} 
          placeholder="태그명 입력" 
          className="text-xs p-1.5 bg-transparent outline-none flex-1 font-bold min-w-[80px]" 
        />
        <div className="flex items-center gap-1 flex-wrap sm:border-l border-slate-100 sm:pl-3">
          {TAG_COLORS.slice(0, 9).map(c => (
            <button 
              key={c} 
              onClick={() => setSelectedColor(c)} 
              className={`w-4 h-4 rounded-full ${c} border-2 ${selectedColor === c ? 'border-slate-800 scale-125 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`} 
            />
          ))}
        </div>
        <button onClick={handleAdd} className="bg-slate-800 text-white text-[11px] px-3 py-1.5 rounded-md font-bold hover:bg-slate-700 transition-colors whitespace-nowrap w-full sm:w-auto">
          추가
        </button>
      </div>
    </div>
  );
}

// --- Chunked Media Resolving Hook ---
// 전역 캐시를 통해 여러 곳에서 동일한 미디어를 호출할 때 반복 로딩을 방지합니다.
const globalMediaCache = new Map();

function useMediaUrl(src) {
  const [objectUrl, setObjectUrl] = useState(() => globalMediaCache.get(src) || null);
  
  useEffect(() => {
    let isMounted = true;

    if (!src) {
      setObjectUrl(null);
      return;
    }
    
    // 캐시에 이미 로드된 데이터가 있다면 즉시 반환
    if (globalMediaCache.has(src)) {
      setObjectUrl(globalMediaCache.get(src));
      return;
    }
    
    // 청크 데이터가 아닌 단순 URL/Base64인 경우
    if (!src.startsWith('chunked:')) {
      setObjectUrl(src);
      return;
    }
    
    const [, id, count] = src.split(':');
    
    const fetchChunks = async () => {
      try {
        const numCount = Number(count);
        let base64Str = '';
        
        // 🔥 청크 단위 병렬 로딩 (10개씩 배치 처리하여 Firebase 429 오류 완벽 방지)
        for (let i = 0; i < numCount; i += 10) {
          const promises = [];
          const end = Math.min(i + 10, numCount);
          for(let j=i; j<end; j++) {
            promises.push(getDoc(doc(db, getPath('image_chunks'), `${id}_${j}`)));
          }
          const snaps = await Promise.all(promises);
          if (!isMounted) return;
          base64Str += snaps.map(s => s.exists() ? s.data().data : '').join('');
        }
        
        const fetchRes = await fetch(base64Str);
        const blob = await fetchRes.blob();
        if (!isMounted) return;
        
        const url = URL.createObjectURL(blob);
        globalMediaCache.set(src, url); // 로컬 캐시에 저장
        setObjectUrl(url);
      } catch(e) {
        console.error("Chunk fetch error", e);
      }
    };
    fetchChunks();
    
    return () => { 
      isMounted = false; 
    };
  }, [src]);

  return objectUrl;
}

// --- Smart Components that Handle Chunked Data Automatically ---
function SmartImage({ src, alt, className, style, ...props }) {
  const resolvedUrl = useMediaUrl(src);
  if (!resolvedUrl) return <div className={`flex items-center justify-center bg-slate-100/50 text-slate-400 ${className}`} style={style}><Loader2 className="w-6 h-6 animate-spin"/></div>;
  return <img src={resolvedUrl} alt={alt} className={className} style={style} {...props} />;
}

function SmartVideo({ src, className, style, ...props }) {
  const resolvedUrl = useMediaUrl(src);
  if (!resolvedUrl) return <div className={`flex items-center justify-center bg-slate-100/50 text-slate-400 ${className}`} style={style}><Loader2 className="w-6 h-6 animate-spin"/></div>;
  return <video src={resolvedUrl} autoPlay muted loop playsInline className={className} style={style} {...props} />;
}

const SmartMotionImage = motion(React.forwardRef(({ src, ...props }, ref) => {
  const resolvedUrl = useMediaUrl(src);
  if (!resolvedUrl) return <div ref={ref} className={`flex items-center justify-center bg-slate-100/50 ${props.className}`}><Loader2 className="w-6 h-6 animate-spin text-slate-400"/></div>;
  return <img ref={ref} src={resolvedUrl} {...props} />;
}));


// --- 블록 파서 & 렌더러 (클라이언트 뷰어 용) ---
const renderRichText = (text) => {
  if (!text) return null;
  // **굵게** 와 __밑줄__ 파싱
  const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <u key={i} className="underline decoration-slate-400 underline-offset-4">{part.slice(2, -2)}</u>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

const BlockViewer = ({ block }) => {
  const [sliderIndex, setSliderIndex] = useState(0);
  const alignClass = block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left';

  switch (block.type) {
    case 'h1':
      return <h1 className={`text-2xl sm:text-3xl font-bold text-slate-900 mt-8 mb-4 tracking-tight leading-snug break-keep ${alignClass}`}>{renderRichText(block.content)}</h1>;
    case 'h2':
      return <h2 className={`text-xl sm:text-2xl font-bold text-slate-800 mt-6 mb-3 tracking-tight break-keep ${alignClass}`}>{renderRichText(block.content)}</h2>;
    case 'text':
      return <p className={`text-[15px] sm:text-[16px] leading-relaxed text-slate-700 mb-4 whitespace-pre-wrap break-keep ${alignClass}`}>{renderRichText(block.content)}</p>;
    case 'ul':
      return (
        <ul className={`list-disc list-inside space-y-1 my-4 px-2 text-[15px] sm:text-[16px] text-slate-700 ${alignClass}`}>
          {block.content.split('\n').filter(l => l.trim()).map((l, i) => <li key={i}>{renderRichText(l)}</li>)}
        </ul>
      );
    case 'ol':
      return (
        <ol className={`list-decimal list-inside space-y-1 my-4 px-2 text-[15px] sm:text-[16px] text-slate-700 ${alignClass}`}>
          {block.content.split('\n').filter(l => l.trim()).map((l, i) => <li key={i}>{renderRichText(l)}</li>)}
        </ol>
      );
    case 'quote':
      return (
        <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 p-4 sm:p-5 my-6 rounded-r-xl">
          <p className="text-[15px] sm:text-[16px] font-medium text-slate-700 italic whitespace-pre-wrap">{renderRichText(block.content)}</p>
        </blockquote>
      );
    case 'callout':
      return (
        <div className="flex gap-3 bg-slate-100/80 p-4 rounded-xl my-5 border border-slate-200">
          <span className="text-xl flex-shrink-0 pt-0.5">{block.icon || '💡'}</span>
          <p className={`text-[14px] sm:text-[15px] text-slate-700 leading-relaxed font-medium pt-0.5 whitespace-pre-wrap ${alignClass}`}>{renderRichText(block.content)}</p>
        </div>
      );
    case 'image':
      if (!block.url) return null;
      return (
        <figure className="my-6">
          <SmartImage src={block.url} alt={block.caption || 'Image'} className="w-full h-auto rounded-2xl shadow-sm object-cover" />
          {block.caption && <figcaption className="text-center text-xs sm:text-sm text-gray-500 mt-2 font-medium">{block.caption}</figcaption>}
        </figure>
      );
    case 'slider':
      if (!block.urls || block.urls.length === 0) return null;
      const aspectClass = block.ratio === '1:1' ? 'aspect-square' : 'aspect-[4/5]';
      return (
        <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden shadow-sm my-6 bg-slate-100 group`}>
          <AnimatePresence initial={false}>
            <SmartMotionImage 
              key={sliderIndex}
              src={block.urls[sliderIndex]} 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          {block.urls.length > 1 && (
            <>
              <button onClick={() => setSliderIndex((prev) => (prev > 0 ? prev - 1 : block.urls.length - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5"/></button>
              <button onClick={() => setSliderIndex((prev) => (prev < block.urls.length - 1 ? prev + 1 : 0))} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5"/></button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {block.urls.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === sliderIndex ? 'w-4 bg-white shadow-md' : 'w-1.5 bg-white/50'}`} />)}
              </div>
            </>
          )}
        </div>
      );
    case 'video':
      if (!block.url) return null;
      return (
        <div className="my-6 rounded-2xl overflow-hidden shadow-sm bg-black relative w-full flex justify-center min-h-[200px]">
          <SmartVideo src={block.url} className="w-full object-cover max-h-[80vh]" />
        </div>
      );
    case 'beforeAfter':
      if (!block.beforeUrl || !block.afterUrl) return null;
      return <BeforeAfterViewer before={block.beforeUrl} after={block.afterUrl} />;
    case 'link':
      return (
        <div className={`my-6 ${alignClass}`}>
          <a href={block.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 w-full p-3 sm:p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md hover:bg-blue-50/50 rounded-2xl transition-all group text-left">
            {block.thumbnail && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
                <SmartImage src={block.thumbnail} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 flex flex-col justify-center">
              <span className="font-bold text-[15px] sm:text-[16px] text-slate-800 group-hover:text-blue-700 line-clamp-1">{block.text || block.url}</span>
              <span className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 mt-0.5">{block.url}</span>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-blue-500 flex-shrink-0 mr-2" />
          </a>
        </div>
      );
    default:
      return null;
  }
};

const BeforeAfterViewer = ({ before, after }) => {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl shadow-sm my-6 select-none group touch-none bg-slate-100">
      <SmartImage src={after} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="After" />
      <SmartImage src={before} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} alt="Before" />
      
      {/* 슬라이더 라인 */}
      <div className="absolute top-0 bottom-0 w-[3px] bg-white flex items-center justify-center pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10" style={{ left: `calc(${pos}% - 1.5px)` }}>
        <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-200 text-slate-500">
          <ChevronLeft className="w-5 h-5 -mr-1" /><ChevronRight className="w-5 h-5" />
        </div>
      </div>
      
      {/* 실제 조작용 투명 Range Input */}
      <input 
        type="range" min="0" max="100" value={pos} onChange={e => setPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 p-0 z-20 touch-pan-x"
      />
      
      <div className="absolute top-4 left-4 bg-black/50 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none z-10">Before</div>
      <div className="absolute top-4 right-4 bg-blue-600/80 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none z-10">After</div>
    </div>
  );
};


// --- Views ---

// 1. Calculator View (User Facing)
function CalculatorView({ config, onEstimateComplete, visits, isBlogMode, setBlogMode, isClientMode = false }) {
  const safeConfig = { 
    ...DEFAULT_CONFIG, 
    ...config, 
    faqs: config.faqs || DEFAULT_CONFIG.faqs, 
    reviewImages: config.reviewImages || [],
    blogFolders: config.blogFolders || DEFAULT_CONFIG.blogFolders,
    blogTitle: config.blogTitle || DEFAULT_CONFIG.blogTitle,
    blogSubtitle: config.blogSubtitle || DEFAULT_CONFIG.blogSubtitle,
  };
  
  const [productType, setProductType] = useState(PRODUCT_TYPES.FAMILY);
  const [dateType, setDateType] = useState(DATE_TYPES.WEEKDAY);
  const [peopleCount, setPeopleCount] = useState(0); 
  const [petCount, setPetCount] = useState(-1);
  const [totalCost, setTotalCost] = useState(0);
  
  const [isPopupOpen, setIsPopupOpen] = useState(safeConfig.popupEnabled);
  const [activeSlide, setActiveSlide] = useState(0);
  const [hasTracked, setHasTracked] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [sidebarExpandedFolders, setSidebarExpandedFolders] = useState(new Set()); 

  const [activeReviewSlide, setActiveReviewSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const [openFaq, setOpenFaq] = useState(null);

  const [expandedFolders, setExpandedFolders] = useState(new Set(safeConfig.blogFolders.length > 0 ? [safeConfig.blogFolders[0].id] : []));
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const logVisit = async () => {
      if (!isClientMode) return;
      if (!auth || !auth.currentUser) return;
      try {
        let region = "알 수 없음";
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          region = data.region || data.city || "대한민국";
        } catch (e) {}
        await addDoc(collection(db, getPath('visits')), { timestamp: Date.now(), region });
      } catch (e) { console.error("Visit log error", e); }
    };
    logVisit();
  }, [isClientMode]);

  useEffect(() => {
    if (!safeConfig.sliderImages || safeConfig.sliderImages.length === 0) return;
    const timer = setInterval(() => setActiveSlide((prev) => (prev + 1) % safeConfig.sliderImages.length), 3500);
    return () => clearInterval(timer);
  }, [safeConfig.sliderImages]);

  useEffect(() => setIsPopupOpen(safeConfig.popupEnabled), [safeConfig.popupEnabled]);

  useEffect(() => {
    if (isBlogMode) return;
    const observer = new IntersectionObserver((entries) => {
      let visibleSection = null;
      entries.forEach(entry => { if (entry.isIntersecting) visibleSection = entry.target.id; });
      if (visibleSection) setActiveSection(visibleSection);
    }, { rootMargin: '-100px 0px -60% 0px', threshold: 0 });

    const ids = ['section-options', 'section-estimate', 'section-price-table', 'section-reviews', 'section-faq', 'section-frame-prices', 'section-kakao'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [safeConfig, isBlogMode]);

  const handleProductChange = (type) => {
    setProductType(type);
    setPeopleCount(0); 
  };

  const getPeopleOptions = () => {
    if (productType === PRODUCT_TYPES.MATERNITY || productType === PRODUCT_TYPES.COUPLE) return [{ value: 0, label: "인원 확인" }, { value: 2, label: "2인 (고정)" }];
    const options = Array.from({ length: 18 }, (_, i) => ({ value: i + 3, label: `${i + 3}인` }));
    return [{ value: 0, label: "인원 선택" }, ...options];
  };

  const getPetOptions = () => [
    { value: -1, label: "반려동물 선택" }, { value: 0, label: "없음" }, { value: 1, label: "1마리" }, { value: 2, label: "2마리" }
  ];

  useEffect(() => {
    if (peopleCount === 0 || petCount === -1) { setTotalCost(0); return; }
    let cost = safeConfig.prices[productType][dateType];
    if (productType === PRODUCT_TYPES.FAMILY && peopleCount > safeConfig.prices.family.basePeople) {
      cost += (peopleCount - safeConfig.prices.family.basePeople) * safeConfig.prices.family.extraPersonCost;
    }
    if (petCount === 2) cost += 22000;
    setTotalCost(cost);
  }, [productType, dateType, peopleCount, petCount, safeConfig.prices]);

  useEffect(() => {
    if (totalCost > 0 && !hasTracked) {
      onEstimateComplete({ productType, dateType, peopleCount, petCount, totalCost, timestamp: Date.now() });
      setHasTracked(true);
    } else if (totalCost === 0) {
      setHasTracked(false);
    }
  }, [totalCost, productType, dateType, peopleCount, petCount]);

  const formatCurrency = (amount) => new Intl.NumberFormat("ko-KR").format(amount);
  const isWoodDefault = (size) => (productType === PRODUCT_TYPES.FAMILY && size === '16R') || ((productType === PRODUCT_TYPES.MATERNITY || productType === PRODUCT_TYPES.COUPLE) && size === '12R');

  const todayVisitors = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    return visits.filter(v => v.timestamp >= startOfToday.getTime()).length;
  }, [visits]);

  const basePeopleAmount = safeConfig.prices.family.basePeople;
  const extraPeopleCount = productType === PRODUCT_TYPES.FAMILY && peopleCount > basePeopleAmount ? peopleCount - basePeopleAmount : 0;
  const extraPeopleTotalCost = extraPeopleCount * safeConfig.prices.family.extraPersonCost;

  const scrollToSection = (id) => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const toggleFolder = (id) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSidebarFolder = (id) => {
    setSidebarExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const SIDEBAR_MENUS = [
    { id: 'section-options', label: '옵션 선택', icon: Camera, visible: true },
    { id: 'section-estimate', label: '실시간 견적서', icon: Calculator, visible: true },
    { id: 'section-price-table', label: '촬영 상품 가격표', icon: ImagePlus, visible: !!safeConfig.priceTableImage },
    { id: 'section-reviews', label: '고객 리뷰', icon: Star, visible: safeConfig.reviewImages && safeConfig.reviewImages.length > 0 },
    { id: 'section-faq', label: '자주 묻는 질문', icon: HelpCircle, visible: safeConfig.faqs && safeConfig.faqs.length > 0 },
    { id: 'section-frame-prices', label: '액자 가격표', icon: ImagePlus, visible: true },
    { id: 'section-kakao', label: '카카오톡 채팅 상담', icon: MessageSquare, visible: true },
  ].filter(menu => menu.visible);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans pb-24 relative overflow-x-hidden pt-[56px] sm:pt-[60px] ${isBlogMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 right-0 h-[56px] sm:h-[60px] z-[90] flex items-center justify-between px-3 sm:px-5 border-b backdrop-blur-[16px] transition-colors duration-500 ${isBlogMode ? 'bg-slate-950/80 border-slate-800 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]'}`}>
        <div className="flex-shrink-0 w-10 sm:w-12">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className={`p-2 rounded-full transition-colors w-[40px] h-[40px] flex items-center justify-center ${isBlogMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'}`}
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <h1 className={`text-[15px] sm:text-[18px] font-bold absolute left-1/2 -translate-x-1/2 tracking-tight whitespace-nowrap max-w-[40%] overflow-hidden truncate text-center ${isBlogMode ? 'text-white' : 'text-slate-900'}`}>
          비뉴뜨 견적계산기
        </h1>

        <div className="flex-shrink-0">
          <ModeToggle isBlogMode={isBlogMode} onToggle={() => setBlogMode(!isBlogMode)} />
        </div>
      </header>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && <motion.div key="sidebar-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[999] touch-none" />}
        {isSidebarOpen && (
          <motion.div key="sidebar-panel" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.4 }} className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] z-[1000] shadow-2xl flex flex-col overflow-y-auto ${isBlogMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${isBlogMode ? 'border-slate-800 bg-slate-900/95' : 'border-slate-100 bg-white/95'}`}>
              <h2 className={`text-xl font-bold tracking-tight ${isBlogMode ? 'text-white' : 'text-slate-900'}`}>{isBlogMode ? '블로그 카테고리' : '메뉴'}</h2>
              <button onClick={() => setIsSidebarOpen(false)} className={`p-2 -mr-2 rounded-full ${isBlogMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-3 flex-1 flex flex-col gap-1.5 overflow-y-auto">
              {isBlogMode ? (
                /* --- Blog Sidebar Tree --- */
                safeConfig.blogFolders.map(folder => (
                  <div key={folder.id} className="flex flex-col mb-1">
                    <button 
                      onClick={() => toggleSidebarFolder(folder.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left text-[15px] font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Folder className={`w-5 h-5 flex-shrink-0 ${sidebarExpandedFolders.has(folder.id) ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span className="truncate">{folder.title}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 text-slate-500 transition-transform ${sidebarExpandedFolders.has(folder.id) ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {sidebarExpandedFolders.has(folder.id) && (
                        <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="overflow-hidden flex flex-col pl-4 mt-1 space-y-0.5">
                          {folder.posts.map(post => (
                            <button 
                              key={post.id} 
                              onClick={() => { setSelectedPost(post); setIsSidebarOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] sm:text-[14px] text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors text-left font-medium"
                            >
                              <FileText className="w-4 h-4 opacity-40 flex-shrink-0" />
                              <span className="truncate">{post.title}</span>
                            </button>
                          ))}
                          {folder.posts.length === 0 && <div className="px-5 py-2 text-[12px] text-slate-600 font-medium">게시글이 없습니다.</div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                /* --- Calculator Sidebar Menus --- */
                SIDEBAR_MENUS.map(menu => {
                  const isActive = activeSection === menu.id;
                  const IconComponent = menu.icon; 
                  return (
                    <motion.button
                      key={menu.id}
                      whileTap={{ scale: 0.98, backgroundColor: "rgba(0,0,0,0.05)" }}
                      onClick={() => scrollToSection(menu.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-left text-[15px] font-semibold transition-colors rounded-2xl relative overflow-hidden ${
                        isActive ? "text-[#1967D2] bg-[#E8F0FE]" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 truncate">
                        <IconComponent className={`w-[22px] h-[22px] flex-shrink-0 ${isActive ? 'text-[#1967D2]' : 'text-slate-500'}`} />
                        <span className="truncate">{menu.label}</span>
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-8 md:py-12 relative">
        <AnimatePresence mode="wait">
          {!isBlogMode ? (
            /* --- CALCULATOR MODE --- */
            <motion.div key="calc-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 sm:space-y-16">
              
              {/* Main Slider */}
              <div className="rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 bg-white border-[3px] sm:border-4 border-white max-w-sm sm:max-w-md mx-auto relative aspect-square">
                {safeConfig.sliderImages.length > 0 ? (
                  <>
                    <AnimatePresence initial={false}>
                      <SmartMotionImage 
                        key={activeSlide} 
                        src={safeConfig.sliderImages[activeSlide]} 
                        alt="Slider" 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        transition={{ duration: 0.8 }} 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                    </AnimatePresence>
                    <div className="absolute bottom-5 sm:bottom-6 left-0 right-0 flex justify-center gap-2 sm:gap-2.5 z-10">
                      {safeConfig.sliderImages.map((_, i) => <div key={`dot-${i}`} className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${i === activeSlide ? 'w-5 sm:w-6 bg-white shadow-md' : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white/90'}`} />)}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 font-medium"><ImagePlus className="w-8 h-8 sm:w-10 sm:h-10 mb-2 opacity-50" /><p className="text-xs sm:text-sm text-center px-4">관리자에서 1:1 이미지를 업로드해주세요</p></div>
                )}
              </div>

              <div className="text-center space-y-3 sm:space-y-4 px-2">
                <h1 className="text-[28px] sm:text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">가족사진 견적 계산기</h1>
                <p className="text-[15px] sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium whitespace-pre-line leading-relaxed px-2">{safeConfig.introText}</p>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
                <div id="section-options" className="lg:col-span-7 space-y-6 sm:space-y-8 scroll-mt-24">
                  <section className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6"><div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg sm:rounded-xl text-blue-600"><Camera className="w-4 h-4 sm:w-5 sm:h-5" /></div><h2 className="text-[17px] sm:text-xl font-bold text-slate-800">촬영 상품 선택</h2></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <RadioCard title="가족사진" description="3인 이상" selected={productType === PRODUCT_TYPES.FAMILY} onClick={() => handleProductChange(PRODUCT_TYPES.FAMILY)} />
                      <RadioCard title="만삭사진" description="2인 고정" selected={productType === PRODUCT_TYPES.MATERNITY} onClick={() => handleProductChange(PRODUCT_TYPES.MATERNITY)} />
                      <RadioCard title="부부/커플" description="2인 고정" selected={productType === PRODUCT_TYPES.COUPLE} onClick={() => handleProductChange(PRODUCT_TYPES.COUPLE)} />
                    </div>
                  </section>
                  
                  <section className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6"><div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg sm:rounded-xl text-blue-600"><Calendar className="w-4 h-4 sm:w-5 sm:h-5" /></div><h2 className="text-[17px] sm:text-xl font-bold text-slate-800">희망 일정</h2></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <RadioCard title="주중 / 평일" description="월요일 - 금요일" selected={dateType === DATE_TYPES.WEEKDAY} onClick={() => setDateType(DATE_TYPES.WEEKDAY)} />
                      <RadioCard title="주말 / 공휴일" description="토, 일, 공휴일" selected={dateType === DATE_TYPES.WEEKEND} onClick={() => setDateType(DATE_TYPES.WEEKEND)} />
                    </div>
                  </section>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <section className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100 relative overflow-visible">
                      {peopleCount === 0 && <span className="absolute -top-2.5 right-5 sm:-top-3 sm:right-6 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-full animate-bounce shadow-md shadow-red-500/30">필수</span>}
                      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6"><div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg sm:rounded-xl text-blue-600"><Users className="w-4 h-4 sm:w-5 sm:h-5" /></div><h2 className="text-[17px] sm:text-xl font-bold text-slate-800">총 인원</h2></div>
                      <SelectCustom value={peopleCount} onChange={setPeopleCount} options={getPeopleOptions()} className={peopleCount === 0 ? "ring-2 ring-red-400/50 rounded-xl" : ""} />
                    </section>
                    <section className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100 relative overflow-visible">
                      {petCount === -1 && <span className="absolute -top-2.5 right-5 sm:-top-3 sm:right-6 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-full animate-bounce shadow-md shadow-red-500/30">필수</span>}
                      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6"><div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg sm:rounded-xl text-blue-600"><Camera className="w-4 h-4 sm:w-5 sm:h-5" /></div><h2 className="text-[17px] sm:text-xl font-bold text-slate-800">반려동물</h2></div>
                      <SelectCustom value={petCount} onChange={setPetCount} options={getPetOptions()} className={petCount === -1 ? "ring-2 ring-red-400/50 rounded-xl" : ""} />
                    </section>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6 sm:space-y-8">
                  <div className="sticky top-[84px]">
                    <div id="section-estimate" className="bg-slate-900 text-white rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden scroll-mt-24">
                      <div className="absolute top-0 right-0 w-64 h-64 sm:w-72 sm:h-72 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 text-slate-300">
                          <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                          <span className="text-[13px] sm:text-sm font-bold uppercase tracking-widest">견적서</span>
                        </div>
                        <div className="space-y-4 sm:space-y-5 border-b border-white/10 pb-5 sm:pb-6 mb-5 sm:mb-6 text-[13px] sm:text-[15px]">
                          <div className="flex justify-between items-center text-slate-300"><span>상품</span><span className="font-semibold text-white bg-white/10 px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg">{productType === PRODUCT_TYPES.FAMILY ? "가족사진" : productType === PRODUCT_TYPES.MATERNITY ? "만삭사진" : "부부/커플"}</span></div>
                          <div className="flex justify-between items-center text-slate-300"><span>일정</span><span className="font-semibold text-white">{dateType === DATE_TYPES.WEEKDAY ? "주중/평일" : "주말/공휴일"}</span></div>
                          <div className="flex justify-between items-center text-slate-300"><span>인원</span><span className="font-semibold text-white">{peopleCount === 0 ? <span className="text-yellow-400 animate-pulse">선택 대기중</span> : `${peopleCount}명`}</span></div>
                          <div className="flex justify-between items-center text-slate-300"><span>반려동물</span><span className="font-semibold text-white">{petCount === -1 ? <span className="text-yellow-400 animate-pulse">선택 대기중</span> : petCount === 0 ? "없음" : `${petCount}마리`}</span></div>
                          {totalCost > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2 space-y-3 sm:space-y-4">
                              <div className="flex justify-between items-center text-slate-300"><span>액자</span><span className="font-semibold text-white text-right">{productType === PRODUCT_TYPES.FAMILY ? "16R 아크릴 우드 (약 40x50cm)" : "12R 아크릴 우드 (약 30x43cm)"}</span></div>
                              <div className="flex justify-between items-center"><span className="font-semibold text-yellow-400 underline underline-offset-[3px] decoration-yellow-400/50">고화질 원본</span><span className="font-bold text-yellow-400">무료</span></div>
                            </motion.div>
                          )}
                        </div>

                        {totalCost > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 space-y-3">
                            {(extraPeopleCount > 0 || petCount > 0) ? (
                              <>
                                {petCount > 0 && (
                                  <div className="bg-slate-800/80 rounded-xl p-4 sm:p-5 flex justify-between items-center text-[13px] sm:text-[14px] shadow-inner border border-white/5">
                                    <span className="text-yellow-400 font-medium">반려동물 추가 ({petCount}마리)</span>
                                    <span className="text-yellow-400 font-bold">+ {formatCurrency(petCount === 2 ? 22000 : 0)} 원</span>
                                  </div>
                                )}
                                {extraPeopleCount > 0 && (
                                  <div className="bg-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 text-[13px] sm:text-[14px] shadow-inner border border-white/5">
                                    <div className="flex justify-between items-center text-slate-300">
                                      <span>기본 인원 ({basePeopleAmount}인)</span>
                                      <span>포함</span>
                                    </div>
                                    <div className="flex justify-between items-center text-yellow-400">
                                      <span className="font-medium">추가 인원 ({extraPeopleCount}명)</span>
                                      <span className="font-bold">+ {formatCurrency(extraPeopleTotalCost)} 원</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="bg-slate-800/80 rounded-xl p-4 sm:p-5 flex justify-center items-center text-[13px] sm:text-[14px] text-slate-400 shadow-inner border border-white/5">
                                추가금이 없습니다.
                              </div>
                            )}
                          </motion.div>
                        )}

                        <div className="space-y-1 sm:space-y-2 mb-6 sm:mb-8">
                          <div className="text-slate-400 text-xs sm:text-sm font-medium">견적 금액</div>
                          <AnimatePresence mode="wait">
                            {totalCost === 0 ? (
                              <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[15px] sm:text-lg font-bold text-yellow-400 py-2 sm:py-3">인원 및 반려동물을 모두 선택해주세요.</motion.div>
                            ) : (
                              <motion.div key="price" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-serif font-bold text-white tracking-tight pt-1">{formatCurrency(totalCost)} <span className="text-lg sm:text-2xl text-slate-400 font-sans font-medium">원</span></motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <motion.a whileTap={{ scale: 0.97 }} href={safeConfig.consultationLink} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 sm:py-4 bg-white text-slate-900 rounded-xl sm:rounded-2xl font-bold text-[14px] min-[375px]:text-[15px] sm:text-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 group shadow-xl whitespace-nowrap">
                          <span>{safeConfig.consultationText}</span><ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform" />
                        </motion.a>
                        <div className="mt-3 sm:mt-4 w-full text-center bg-white/5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl px-1 sm:px-2 overflow-hidden"><p className="text-[10.5px] min-[375px]:text-[11.5px] sm:text-[13px] text-slate-300 font-medium whitespace-nowrap tracking-tight sm:tracking-normal">{safeConfig.bottomNoticeText}</p></div>
                      </div>
                    </div>

                    {safeConfig.priceTableImage && (
                      <div id="section-price-table" className="mt-5 sm:mt-6 bg-white rounded-3xl sm:rounded-[2rem] p-3 sm:p-4 shadow-sm border border-slate-100 overflow-hidden scroll-mt-24">
                        <h3 className="font-bold text-slate-800 mb-2 sm:mb-3 px-2 flex items-center gap-1.5 sm:gap-2 text-[15px] sm:text-base"><Calculator className="w-4 h-4 text-blue-500"/> 촬영 상품 가격표</h3>
                        <SmartImage src={safeConfig.priceTableImage} alt="Price Table" className="w-full h-auto object-contain rounded-xl sm:rounded-2xl border border-slate-50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-8">
                {/* --- Review Slider Section --- */}
                {safeConfig.reviewImages && safeConfig.reviewImages.length > 0 && (
                  <section id="section-reviews" className="bg-white rounded-3xl sm:rounded-[2rem] py-6 sm:py-10 shadow-sm border border-slate-100 overflow-hidden scroll-mt-24">
                    <div className="flex items-center justify-center gap-2 mb-8 sm:mb-10 px-5">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">리뷰</h2>
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
                    </div>
                    
                    <div className="relative h-[460px] sm:h-[600px] w-full flex items-center justify-center touch-pan-y">
                      {safeConfig.reviewImages.map((img, i) => {
                        const offset = i - activeReviewSlide;
                        if (Math.abs(offset) > 2) return null;

                        return (
                          <motion.div
                            key={`review-slide-${i}`}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, info) => {
                              if (info.offset.x < -50 && activeReviewSlide < safeConfig.reviewImages.length - 1) setActiveReviewSlide(prev => prev + 1);
                              if (info.offset.x > 50 && activeReviewSlide > 0) setActiveReviewSlide(prev => prev - 1);
                            }}
                            initial={false}
                            animate={{
                              x: `calc(${offset * 105}%)`,
                              scale: offset === 0 ? 1.1 : 0.9,
                              opacity: offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.5 : 0,
                              filter: offset === 0 ? "blur(0px)" : "blur(2px)",
                              zIndex: offset === 0 ? 10 : 5
                            }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            onClick={() => {
                              if (offset === 0) setLightboxIndex(i);
                              else setActiveReviewSlide(i);
                            }}
                            className={`absolute w-[280px] sm:w-[380px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl cursor-pointer ${offset === 0 ? 'ring-2 ring-white/50' : ''}`}
                          >
                            <SmartImage src={img} alt={`Review ${i}`} className="w-full h-full object-cover pointer-events-none bg-slate-50" draggable={false} />
                          </motion.div>
                        )
                      })}
                    </div>
                    <div className="flex justify-center gap-2 mt-8">
                      {safeConfig.reviewImages.map((_, i) => (
                        <div key={`dot-${i}`} className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${i === activeReviewSlide ? 'w-5 sm:w-6 bg-slate-800' : 'w-1.5 sm:w-2 bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-center text-xs sm:text-sm text-slate-400 mt-4 px-4 font-medium">사진을 넘겨보거나 중앙 사진을 클릭하여 확대해보세요.</p>
                  </section>
                )}

                {/* --- FAQ Section --- */}
                {safeConfig.faqs && safeConfig.faqs.length > 0 && (
                  <section id="section-faq" className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100 scroll-mt-24">
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                      <div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg sm:rounded-xl text-blue-600"><HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                      <h2 className="text-[17px] sm:text-xl font-bold text-slate-800">자주 묻는 질문</h2>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {safeConfig.faqs.map((faq, i) => (
                        <div key={`faq-item-${i}`} className={`rounded-xl sm:rounded-2xl border transition-colors ${openFaq === i ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                          <button 
                            onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                            className="w-full px-4 py-4 sm:px-6 sm:py-5 text-left flex justify-between items-center gap-4"
                          >
                            <span className={`text-[14px] sm:text-[15px] font-bold leading-snug ${openFaq === i ? 'text-blue-700' : 'text-slate-800'}`}>
                              <span className="text-blue-500 mr-2 font-black">Q.</span>{faq.question}
                            </span>
                            <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} className="flex-shrink-0 text-slate-400">
                              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {openFaq === i && (
                              <motion.div key={`faq-content-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                <div className="px-4 pb-4 sm:px-6 sm:pb-5 text-[13px] sm:text-[14px] text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-100/50 pt-3 sm:pt-4">
                                  <span className="text-slate-400 font-bold mr-2">A.</span>{faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* --- Frame Price Section --- */}
                <section id="section-frame-prices" className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100 scroll-mt-24">
                  <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6"><div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg sm:rounded-xl text-blue-600"><ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" /></div><h2 className="text-[17px] sm:text-xl font-bold text-slate-800">액자 가격표 참고</h2></div>
                  <div className="mb-5 sm:mb-6 text-center text-[10.5px] min-[375px]:text-[11.5px] sm:text-[14px] text-white font-bold bg-slate-900 py-2.5 sm:py-3 rounded-lg sm:rounded-xl px-1 shadow-inner whitespace-nowrap tracking-tight sm:tracking-normal overflow-hidden">모든 촬영상품엔 아크릴 우드 프레임이 포함되어있습니다.</div>
                  <div className="space-y-8 sm:space-y-10">
                    <div className="w-full">
                      <h3 className="text-[15px] sm:text-lg font-bold mb-3 sm:mb-4 text-slate-800 px-1">아크릴 우드 프레임 액자</h3>
                      <table className="w-full text-[11.5px] min-[375px]:text-[12px] sm:text-sm md:text-[15px] text-left border-collapse">
                        <thead><tr className="border-b-2 border-slate-200"><th className="py-2.5 sm:py-3 px-1 sm:px-2 font-bold text-slate-500 whitespace-nowrap">R 규격</th><th className="py-2.5 sm:py-3 px-1 sm:px-2 font-bold text-slate-500 whitespace-nowrap">약 cm 사이즈</th><th className="py-2.5 sm:py-3 px-1 sm:px-2 font-bold text-slate-500 text-right whitespace-nowrap">가격</th></tr></thead>
                        <tbody className="text-slate-700">
                          {FRAME_SIZES.map((item, idx) => {
                            const isDefault = isWoodDefault(item.id);
                            return (
                              <tr key={`wood-${item.id}`} className={idx !== FRAME_SIZES.length - 1 ? "border-b border-slate-100" : ""}>
                                <td className={`py-3 sm:py-3.5 px-1 sm:px-2 font-semibold whitespace-nowrap ${isDefault ? 'text-red-500' : ''}`}>{item.label} {isDefault && <span className="text-[10px] sm:text-xs ml-0.5">(기본 제공)</span>}</td>
                                <td className={`py-3 sm:py-3.5 px-1 sm:px-2 whitespace-nowrap ${isDefault ? 'text-red-500 font-semibold' : ''}`}>{item.cm}</td>
                                <td className={`py-3 sm:py-3.5 px-1 sm:px-2 text-right whitespace-nowrap ${isDefault ? 'text-red-500 font-bold' : ''}`}>{formatCurrency(safeConfig.framePrices.wood[item.id])}원</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="pt-5 sm:pt-6 border-t-2 border-slate-100 w-full">
                      <h3 className="text-[15px] sm:text-lg font-bold mb-3 sm:mb-4 text-slate-800 px-1">아크릴 프레임 리스 액자</h3>
                      <table className="w-full text-[11.5px] min-[375px]:text-[12px] sm:text-sm md:text-[15px] text-left border-collapse">
                        <thead><tr className="border-b-2 border-slate-200"><th className="py-2.5 sm:py-3 px-1 sm:px-2 font-bold text-slate-500 whitespace-nowrap">R 규격</th><th className="py-2.5 sm:py-3 px-1 sm:px-2 font-bold text-slate-500 whitespace-nowrap">약 cm 사이즈</th><th className="py-2.5 sm:py-3 px-1 sm:px-2 font-bold text-slate-500 text-right whitespace-nowrap">가격</th></tr></thead>
                        <tbody className="text-slate-700">
                          {FRAME_SIZES.map((item, idx) => (
                            <tr key={`frameless-${item.id}`} className={idx !== FRAME_SIZES.length - 1 ? "border-b border-slate-100" : ""}>
                              <td className="py-3 sm:py-3.5 px-1 sm:px-2 font-semibold whitespace-nowrap">{item.label}</td><td className="py-3 sm:py-3.5 px-1 sm:px-2 whitespace-nowrap">{item.cm}</td><td className="py-3 sm:py-3.5 px-1 sm:px-2 text-right whitespace-nowrap">{formatCurrency(safeConfig.framePrices.frameless[item.id])}원</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <div id="section-kakao" className="pt-2 sm:pt-4 flex justify-center pb-8 scroll-mt-24">
                  <motion.a whileTap={{ scale: 0.97 }} href={safeConfig.consultationLink} target="_blank" rel="noopener noreferrer" className="w-full max-w-lg py-4 sm:py-5 bg-[#FEE500] text-slate-900 rounded-2xl font-bold text-[15px] sm:text-[17px] hover:bg-[#FADA0A] transition-colors flex items-center justify-center gap-2 sm:gap-2.5 shadow-xl shadow-yellow-500/20">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>{safeConfig.consultationText}</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.a>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 mb-8 text-center">
                <div className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white rounded-full text-[13px] sm:text-sm text-slate-500 shadow-sm border border-slate-200">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />오늘 방문자 수 <strong className="text-slate-800 ml-0.5 sm:ml-1">{todayVisitors}</strong>명
                </div>
              </div>
            </motion.div>
          ) : (
            /* --- BLOG MODE --- */
            <motion.div key="blog-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 sm:space-y-12">
              <div className="text-center space-y-3 pt-6 pb-4">
                <h1 className="text-[28px] sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">{safeConfig.blogTitle}</h1>
                <p className="text-[14px] sm:text-base text-slate-400 font-medium whitespace-pre-line">{safeConfig.blogSubtitle}</p>
              </div>

              <div className="space-y-6 sm:space-y-8 pb-10">
                {safeConfig.blogFolders.map(folder => (
                  <div key={folder.id} className="space-y-3 sm:space-y-4">
                    <button 
                      onClick={() => toggleFolder(folder.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 bg-slate-800/80 rounded-2xl border border-slate-700 hover:border-slate-500 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${expandedFolders.has(folder.id) ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span className="text-[16px] sm:text-lg font-bold text-white tracking-tight">{folder.title}</span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold ml-1">{folder.posts.length}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedFolders.has(folder.id) ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {expandedFolders.has(folder.id) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden space-y-3 sm:space-y-4 px-1 sm:px-2"
                        >
                          {folder.posts.map(post => (
                            <motion.div 
                              key={post.id} 
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedPost(post)}
                              className="bg-slate-800/40 p-3 sm:p-4 rounded-2xl border border-slate-700/50 flex gap-4 cursor-pointer hover:bg-slate-700 hover:border-slate-600 transition-colors group shadow-sm"
                            >
                              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-inner">
                                {post.thumbnail ? <SmartImage src={post.thumbnail} className="w-full h-full object-cover" alt={post.title} /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><ImagePlus className="w-6 h-6" /></div>}
                              </div>
                              <div className="flex-1 flex flex-col justify-center sm:justify-between py-1">
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {post.tags.map((t, idx) => {
                                      const isObj = typeof t === 'object';
                                      const text = isObj ? t.text : t;
                                      const color = isObj ? t.color : (idx % 2 === 0 ? "bg-red-500" : "bg-blue-600");
                                      return <BouncyTag key={isObj ? t.id : idx} text={text} colorClass={color} />;
                                    })}
                                  </div>
                                  <h4 className="font-bold text-[14px] sm:text-[16px] text-white line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors">{post.title}</h4>
                                </div>
                                <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-2 block">{post.date}</span>
                              </div>
                            </motion.div>
                          ))}
                          {folder.posts.length === 0 && <div className="p-4 text-center text-sm text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">등록된 게시물이 없습니다.</div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Lightbox (Review Expansion) --- */}
      <AnimatePresence>
        {lightboxIndex !== null && safeConfig.reviewImages[lightboxIndex] && !isBlogMode && (
          <motion.div 
            key="lightbox-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm touch-none"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-white hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full z-[2010]" onClick={() => setLightboxIndex(null)}>
              <X className="w-7 h-7 sm:w-8 sm:h-8" />
            </button>

            {lightboxIndex > 0 && (
              <button
                className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full z-[2010] backdrop-blur-sm"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }}
              >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            )}

            <SmartMotionImage 
              key={`lightbox-img-${lightboxIndex}`}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              src={safeConfig.reviewImages[lightboxIndex]} alt="review-lightbox" 
              className="w-full h-full object-contain max-w-4xl max-h-[85vh] sm:max-h-[90vh] relative z-[2005]" 
              onClick={(e) => e.stopPropagation()} 
            />

            {lightboxIndex < safeConfig.reviewImages.length - 1 && (
              <button
                className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full z-[2010] backdrop-blur-sm"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }}
              >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Blog Viewer Modal (In-app Reading) 90% Size --- */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            key="blog-viewer-modal"
            initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          >
            <div 
              className="w-full max-w-4xl h-[90vh] bg-white rounded-[2rem] flex flex-col overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 뷰어 헤더 */}
              <div className="flex-shrink-0 h-[60px] border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 bg-white/95 backdrop-blur">
                <span className="font-bold text-slate-800 text-[15px] sm:text-lg truncate max-w-[50%]">{selectedPost.title}</span>
                <div className="flex items-center gap-2">
                  {selectedPost.link && (
                    <button onClick={() => window.open(selectedPost.link, '_blank')} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      <ExternalLink className="w-4 h-4" /> 외부 링크
                    </button>
                  )}
                  <button onClick={() => setSelectedPost(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* 본문 영역 */}
              <div className="flex-1 overflow-y-auto bg-white px-5 sm:px-8 py-8 pb-32">
                <article className="max-w-2xl mx-auto">
                  <div className="mb-8 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.tags?.map((t, idx) => {
                        const isObj = typeof t === 'object';
                        const text = isObj ? t.text : t;
                        const color = isObj ? t.color : (idx % 2 === 0 ? "bg-red-500" : "bg-blue-600");
                        return <span key={isObj ? t.id : idx} className={`${color} text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm`}>{text}</span>;
                      })}
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug tracking-tight break-keep">{selectedPost.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium border-b border-slate-100 pb-6">
                      <Calendar className="w-4 h-4" /> {selectedPost.date}
                    </div>
                  </div>

                  {/* 썸네일 */}
                  {selectedPost.thumbnail && (
                    <SmartImage src={selectedPost.thumbnail} alt="Cover" className="w-full aspect-[4/3] sm:aspect-[21/9] object-cover rounded-2xl shadow-sm mb-10" />
                  )}

                  {/* 블록 렌더링 */}
                  <div className="space-y-2">
                    {selectedPost.blocks && selectedPost.blocks.length > 0 ? (
                      selectedPost.blocks.map(block => <BlockViewer key={block.id} block={block} />)
                    ) : (
                      <div className="text-center py-20 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>작성된 본문 내용이 없습니다.</p>
                        {selectedPost.link && <p className="text-sm mt-2">상단의 외부 링크 버튼을 통해 원문을 확인해주세요.</p>}
                      </div>
                    )}
                  </div>
                </article>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// 2. Admin Settings View
function AdminSettingsView({ config, onSaveConfig, images }) {
  const safeConfig = { 
    ...DEFAULT_CONFIG, 
    ...config, 
    faqs: config.faqs || DEFAULT_CONFIG.faqs, 
    reviewImages: config.reviewImages || [],
    blogFolders: config.blogFolders || DEFAULT_CONFIG.blogFolders,
    blogTitle: config.blogTitle || DEFAULT_CONFIG.blogTitle,
    blogSubtitle: config.blogSubtitle || DEFAULT_CONFIG.blogSubtitle,
  };
  const [localConfig, setLocalConfig] = useState(safeConfig);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 현재 에디터를 열어둔 게시글의 ID
  const [editingPostId, setEditingPostId] = useState(null);

  useEffect(() => { setLocalConfig({ ...DEFAULT_CONFIG, ...config, faqs: config.faqs || DEFAULT_CONFIG.faqs, reviewImages: config.reviewImages || [], blogFolders: config.blogFolders || DEFAULT_CONFIG.blogFolders, blogTitle: config.blogTitle || DEFAULT_CONFIG.blogTitle, blogSubtitle: config.blogSubtitle || DEFAULT_CONFIG.blogSubtitle }); }, [config]);

  const getImageUrl = (src) => {
    if (!src) return null;
    if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('blob:') || src.startsWith('chunked:')) return src;
    const imgData = images[src];
    if (!imgData) return null;
    if (imgData.isChunked) return `chunked:${src}:${imgData.chunkCount}`;
    return imgData;
  };

  const handlePriceChange = (product, date, value) => {
    setLocalConfig(prev => ({...prev, prices: {...prev.prices, [product]: { ...prev.prices[product], [date]: Number(value) }}}));
  };
  const handleFramePriceChange = (type, size, value) => {
    setLocalConfig(prev => ({...prev, framePrices: {...prev.framePrices, [type]: { ...prev.framePrices[type], [size]: Number(value) }}}));
  };

  const deleteImageFromDB = async (imageId) => {
    if (imageId && !imageId.startsWith('data:') && !imageId.startsWith('http') && !imageId.startsWith('chunked:')) {
      try { 
        const imgData = images[imageId];
        if (imgData && imgData.isChunked) {
          for(let i=0; i<imgData.chunkCount; i++) {
             deleteDoc(doc(db, getPath('image_chunks'), `${imageId}_${i}`)).catch(()=>{});
          }
        }
        await deleteDoc(doc(db, getPath('images'), imageId)); 
      } catch(e) {}
    }
  };

  // 범용 미디어 업로드 함수 (Base64 변환 후 Firestore 저장 -> 이미지/비디오 처리)
  const uploadMediaToDB = (file, isVideo = false) => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          let base64 = event.target.result;

          if (!isVideo) {
            // 이미지 압축 (고화질 유지)
            const img = new Image();
            img.src = base64;
            await new Promise(r => { img.onload = r; });
            
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1600; 
            const scaleSize = MAX_WIDTH / img.width;
            if (scaleSize < 1) {
              canvas.width = img.width * scaleSize;
              canvas.height = img.height * scaleSize;
            } else {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            base64 = canvas.toDataURL('image/jpeg', 0.95); 
          }

          // 🔥 문제 해결 핵심: Firestore 쓰기 한도 초과(resource-exhausted) 방지
          // 청크 크기를 800KB로 키워 문서 수를 줄이고, 한꺼번에 전송하는 대신 약간의 시간차를 두고 순차적으로 안전하게 저장합니다.
          const CHUNK_SIZE = 800000; 
          
          if (isVideo && base64.length * 0.75 > 40 * 1024 * 1024) {
            setIsUploading(false);
            alert("영상의 용량이 너무 큽니다 (최대 40MB 허용).\n긴 영상은 Youtube, Vimeo 등의 외부 URL 링크를 권장합니다.");
            reject(new Error("File too large"));
            return;
          }

          if (base64.length > CHUNK_SIZE) {
            // 데이터를 분할
            const chunks = [];
            for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
              chunks.push(base64.substring(i, i + CHUNK_SIZE));
            }
            
            const docRef = doc(collection(db, getPath('images')));
            const mediaId = docRef.id;

            // 1. 메타데이터 먼저 저장
            await setDoc(docRef, { 
              isChunked: true, 
              chunkCount: chunks.length,
              createdAt: Date.now() 
            });
            
            // 2. 서버 과부하 방지를 위해 순차적 업로드 적용 (약간의 딜레이 추가)
            for (let i = 0; i < chunks.length; i++) {
              const chunkRef = doc(db, getPath('image_chunks'), `${mediaId}_${i}`);
              await setDoc(chunkRef, { data: chunks[i] });
              
              // 브라우저 멈춤 및 DB 요청 폭주 방지
              await new Promise(r => setTimeout(r, 60));
            }

            setIsUploading(false);
            resolve(mediaId);
          } else {
            // 작은 파일은 분할 없이 바로 저장
            const docRef = await addDoc(collection(db, getPath('images')), { base64, createdAt: Date.now() });
            setIsUploading(false);
            resolve(docRef.id);
          }
        } catch(err) {
          console.error(err);
          setIsUploading(false);
          alert("업로드에 실패했습니다. (네트워크 오류 또는 용량 초과)");
          reject(err);
        }
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        reject(new Error("File reading failed"));
      };

      reader.readAsDataURL(file);
    });
  };

  // 기존 설정 이미지용 업로드 핸들러
  const handleImageUpload = async (e, type, folderId = null, postId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    let oldImageId = null;
    if (type === 'popup') oldImageId = localConfig.popupImage;
    if (type === 'priceTable') oldImageId = localConfig.priceTableImage;
    if (type === 'blog') {
      const folder = localConfig.blogFolders.find(f => f.id === folderId);
      if (folder) {
        const post = folder.posts.find(p => p.id === postId);
        if (post) oldImageId = post.thumbnail;
      }
    }

    try {
      const imageId = await uploadMediaToDB(file, false);
      if (oldImageId) deleteImageFromDB(oldImageId);

      if (type === 'slider') setLocalConfig(prev => ({ ...prev, sliderImages: [...prev.sliderImages, imageId] }));
      else if (type === 'review') setLocalConfig(prev => ({ ...prev, reviewImages: [...prev.reviewImages, imageId] }));
      else if (type === 'popup') setLocalConfig(prev => ({ ...prev, popupImage: imageId }));
      else if (type === 'priceTable') setLocalConfig(prev => ({ ...prev, priceTableImage: imageId }));
      else if (type === 'blog') {
        setLocalConfig(prev => ({
          ...prev,
          blogFolders: prev.blogFolders.map(f => f.id === folderId ? { 
            ...f, 
            posts: f.posts.map(p => p.id === postId ? { ...p, thumbnail: imageId } : p) 
          } : f)
        }));
      }
    } catch(e) {}
  };

  const removeSliderImage = (index) => {
    const imageId = localConfig.sliderImages[index];
    const newImages = [...localConfig.sliderImages];
    newImages.splice(index, 1);
    setLocalConfig({ ...localConfig, sliderImages: newImages });
    deleteImageFromDB(imageId);
  };

  const removeReviewImage = (index) => {
    const imageId = localConfig.reviewImages[index];
    const newImages = [...localConfig.reviewImages];
    newImages.splice(index, 1);
    setLocalConfig({ ...localConfig, reviewImages: newImages });
    deleteImageFromDB(imageId);
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...localConfig.faqs];
    newFaqs[index][field] = value;
    setLocalConfig({ ...localConfig, faqs: newFaqs });
  };
  const addFaq = () => setLocalConfig({ ...localConfig, faqs: [...localConfig.faqs, { question: "", answer: "" }] });
  const removeFaq = (index) => {
    const newFaqs = [...localConfig.faqs];
    newFaqs.splice(index, 1);
    setLocalConfig({ ...localConfig, faqs: newFaqs });
  };

  // --- Blog Management Methods ---
  const addBlogFolder = () => {
    const newFolder = { id: `folder_${Date.now()}`, title: "새로운 카테고리", posts: [] };
    setLocalConfig(prev => ({ ...prev, blogFolders: [...prev.blogFolders, newFolder] }));
  };
  const removeBlogFolder = (id) => {
    const folder = localConfig.blogFolders.find(f => f.id === id);
    if (folder) folder.posts.forEach(post => { if (post.thumbnail) deleteImageFromDB(post.thumbnail); });
    setLocalConfig(prev => ({ ...prev, blogFolders: prev.blogFolders.filter(f => f.id !== id) }));
  }
  
  const addBlogPost = (folderId) => {
    const newPost = { id: `post_${Date.now()}`, title: "새로운 블로그 글", date: new Date().toLocaleDateString().replace(/\s/g, ''), tags: [], thumbnail: "", link: "", blocks: [] };
    setLocalConfig(prev => ({ ...prev, blogFolders: prev.blogFolders.map(f => f.id === folderId ? { ...f, posts: [...f.posts, newPost] } : f) }));
  };
  const updateBlogPost = (folderId, postId, fields) => {
    setLocalConfig(prev => ({ ...prev, blogFolders: prev.blogFolders.map(f => f.id === folderId ? { ...f, posts: f.posts.map(p => p.id === postId ? { ...p, ...fields } : p) } : f) }));
  };
  const removeBlogPost = (folderId, postId) => {
    const folder = localConfig.blogFolders.find(f => f.id === folderId);
    if (folder) {
      const post = folder.posts.find(p => p.id === postId);
      if (post && post.thumbnail) deleteImageFromDB(post.thumbnail);
    }
    setLocalConfig(prev => ({ ...prev, blogFolders: prev.blogFolders.map(f => f.id === folderId ? { ...f, posts: f.posts.filter(p => p.id !== postId) } : f) }));
  };

  // --- Blog Block Editor Methods ---
  const addBlock = (folderId, postId, type) => {
    const newBlock = { id: `block_${Date.now()}`, type, content: '', url: '', urls: [], beforeUrl: '', afterUrl: '', caption: '', ratio: '4:5', align: 'left', icon: '💡', text: '', thumbnail: '' };
    setLocalConfig(prev => ({
      ...prev, blogFolders: prev.blogFolders.map(f => f.id === folderId ? {
        ...f, posts: f.posts.map(p => p.id === postId ? { ...p, blocks: [...(p.blocks || []), newBlock] } : p)
      } : f)
    }));
  };

  const updateBlock = (folderId, postId, blockId, fields) => {
    setLocalConfig(prev => ({
      ...prev, blogFolders: prev.blogFolders.map(f => f.id === folderId ? {
        ...f, posts: f.posts.map(p => p.id === postId ? {
          ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, ...fields } : b)
        } : p)
      } : f)
    }));
  };
  
  const appendFormat = (folderId, postId, block, format) => {
    const newText = block.content + (format === 'bold' ? ' **굵게** ' : ' __밑줄__ ');
    updateBlock(folderId, postId, block.id, { content: newText });
  };

  const removeBlock = (folderId, postId, blockId) => {
    setLocalConfig(prev => ({
      ...prev, blogFolders: prev.blogFolders.map(f => f.id === folderId ? {
        ...f, posts: f.posts.map(p => p.id === postId ? {
          ...p, blocks: p.blocks.filter(b => b.id !== blockId)
        } : p)
      } : f)
    }));
  };

  const moveBlock = (folderId, postId, blockIndex, direction) => {
    setLocalConfig(prev => ({
      ...prev, blogFolders: prev.blogFolders.map(f => f.id === folderId ? {
        ...f, posts: f.posts.map(p => {
          if (p.id !== postId) return p;
          const newBlocks = [...p.blocks];
          if (direction === 'up' && blockIndex > 0) {
            [newBlocks[blockIndex - 1], newBlocks[blockIndex]] = [newBlocks[blockIndex], newBlocks[blockIndex - 1]];
          } else if (direction === 'down' && blockIndex < newBlocks.length - 1) {
            [newBlocks[blockIndex + 1], newBlocks[blockIndex]] = [newBlocks[blockIndex], newBlocks[blockIndex + 1]];
          }
          return { ...p, blocks: newBlocks };
        })
      } : f)
    }));
  };

  const handleBlockImageUpload = async (e, folderId, postId, blockId, field = 'url', isVideo = false) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imageId = await uploadMediaToDB(file, isVideo);
      if (field === 'urls') {
        const folder = localConfig.blogFolders.find(f => f.id === folderId);
        const post = folder?.posts.find(p => p.id === postId);
        const block = post?.blocks.find(b => b.id === blockId);
        const updatedUrls = [...(block.urls || []), imageId];
        updateBlock(folderId, postId, blockId, { urls: updatedUrls });
      } else {
        updateBlock(folderId, postId, blockId, { [field]: imageId });
      }
    } catch(err) {}
  };


  const saveSettings = async () => {
    setIsSaving(true);
    await onSaveConfig(localConfig);
    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 sm:space-y-12 relative pb-32">
      <AnimatePresence>
        {isUploading && (
          <motion.div key="upload-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white p-6 sm:p-8 rounded-2xl flex flex-col items-center shadow-2xl border border-slate-200">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className="font-bold text-slate-800">미디어 업로드 중...</p>
              <p className="text-xs text-slate-500 mt-1">파일 크기에 따라 다소 시간이 소요될 수 있습니다.</p>
            </div>
          </motion.div>
        )}
        {showToast && (
          <motion.div key="toast-success" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] flex items-center gap-2 sm:gap-3 bg-slate-900 text-white px-5 sm:px-6 py-3 sm:py-4 rounded-full shadow-2xl font-medium text-sm sm:text-base whitespace-nowrap">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />설정이 성공적으로 저장되었습니다.
          </motion.div>
        )}
      </AnimatePresence>

      <div><h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">환경설정</h2><p className="text-slate-500 text-sm sm:text-base">앱의 텍스트, 버튼, 가격, 사진, 블로그를 관리합니다.</p></div>

      {/* --- Blog Management Section --- */}
      <section className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2"><Folder className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> 블로그 모드 및 인앱 에디터</div>
          <button onClick={addBlogFolder} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-200 transition-colors">
            <Plus className="w-4 h-4" /> 카테고리(폴더) 추가
          </button>
        </h3>

        {/* 블로그 메인 헤더 타이틀 설정 */}
        <div className="mb-8 p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h4 className="font-bold text-slate-700 text-sm">블로그 메인 화면 문구 설정</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">메인 타이틀</label>
              <input value={localConfig.blogTitle} onChange={e => setLocalConfig({...localConfig, blogTitle: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold" placeholder="Vignette Journal" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">서브 타이틀</label>
              <input value={localConfig.blogSubtitle} onChange={e => setLocalConfig({...localConfig, blogSubtitle: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="비뉴뜨만의 따뜻한 촬영 기록과 정보를 만나보세요." />
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {localConfig.blogFolders.map((folder, fIndex) => (
            <div key={folder.id} className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-slate-400 font-bold text-sm bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{fIndex + 1}</span>
                  <input 
                    value={folder.title} 
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, blogFolders: prev.blogFolders.map(f => f.id === folder.id ? { ...f, title: e.target.value } : f) }))}
                    className="flex-1 bg-white px-3 py-2 text-[15px] sm:text-lg font-bold outline-none border border-slate-200 rounded-lg focus:border-blue-500 transition-colors shadow-sm"
                    placeholder="폴더 이름 입력"
                  />
                </div>
                <button onClick={() => removeBlogFolder(folder.id)} className="self-end sm:self-auto p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors flex gap-1 items-center text-xs font-bold"><Trash2 className="w-4 h-4" /> 폴더 삭제</button>
              </div>

              <div className="space-y-4">
                {folder.posts.map((post) => (
                  <div key={post.id} className={`bg-white p-4 sm:p-5 rounded-xl shadow-sm border flex flex-col gap-4 relative transition-colors ${editingPostId === post.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'}`}>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-slate-800">{post.title || "제목 없는 글"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingPostId(editingPostId === post.id ? null : post.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editingPostId === post.id ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {editingPostId === post.id ? '에디터 닫기' : '블로그 작성 / 편집'}
                        </button>
                        <button onClick={() => removeBlogPost(folder.id, post.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Editor Expanded Area */}
                    <AnimatePresence>
                      {editingPostId === post.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 pt-4 mt-2">
                          <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            {/* Thumbnail Upload */}
                            <div className="w-full sm:w-32 h-32 sm:h-32 bg-slate-50 rounded-lg flex-shrink-0 relative overflow-hidden border border-slate-200 group">
                              {post.thumbnail && getImageUrl(post.thumbnail) ? (
                                <>
                                  <SmartImage src={getImageUrl(post.thumbnail)} className="w-full h-full object-cover" alt="thumbnail" />
                                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold">
                                    변경<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'blog', folder.id, post.id)} />
                                  </label>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                  <ImagePlus className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">썸네일</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'blog', folder.id, post.id)} />
                                </label>
                              )}
                            </div>
                            
                            {/* Meta Inputs */}
                            <div className="flex-1 flex flex-col gap-2.5">
                              <div className="flex gap-2">
                                <span className="text-xs font-bold text-slate-400 w-8 pt-2">제목</span>
                                <input value={post.title} onChange={(e) => updateBlogPost(folder.id, post.id, { title: e.target.value })} className="flex-1 font-bold outline-none text-[14px] sm:text-[15px] border-b border-slate-200 focus:border-blue-500 pb-1 bg-transparent" placeholder="목록에 보일 글 제목" />
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2.5">
                                <div className="flex gap-2 flex-1">
                                  <span className="text-xs font-bold text-slate-400 w-8 pt-2 whitespace-nowrap">외부링크</span>
                                  <input value={post.link || ''} onChange={(e) => updateBlogPost(folder.id, post.id, { link: e.target.value })} className="flex-1 text-xs bg-slate-50 p-2 rounded outline-none border border-slate-200 focus:border-blue-500" placeholder="(선택) 외부 블로그 원문 링크" />
                                </div>
                                <div className="flex gap-2 sm:w-1/3">
                                   <span className="text-xs font-bold text-slate-400 w-8 pt-2 sm:w-auto">날짜</span>
                                   <input value={post.date} onChange={(e) => updateBlogPost(folder.id, post.id, { date: e.target.value })} className="flex-1 text-xs bg-slate-50 p-2 rounded outline-none border border-slate-200 focus:border-blue-500" placeholder="2026.01.23." />
                                </div>
                              </div>
                              <div className="flex gap-2 items-start mt-1">
                                 <span className="text-xs font-bold text-slate-400 w-8 pt-2.5">태그</span>
                                 <TagEditor tags={post.tags} onChange={(newTags) => updateBlogPost(folder.id, post.id, { tags: newTags })} />
                              </div>
                            </div>
                          </div>

                          {/* --- In-App Block Editor --- */}
                          <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200">
                            <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-blue-500"/> 본문 블록 에디터</h5>
                            
                            {/* Blocks List */}
                            <div className="space-y-4 mb-6">
                              {(post.blocks || []).map((block, bIndex) => (
                                <div key={block.id} className="relative group bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:border-blue-300 transition-colors">
                                  {/* Block Controls */}
                                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => moveBlock(folder.id, post.id, bIndex, 'up')} className="p-1 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 text-slate-500"><ChevronUp className="w-3 h-3" /></button>
                                    <button onClick={() => moveBlock(folder.id, post.id, bIndex, 'down')} className="p-1 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 text-slate-500"><ChevronDown className="w-3 h-3" /></button>
                                  </div>
                                  <button onClick={() => removeBlock(folder.id, post.id, block.id)} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors z-10"><X className="w-4 h-4" /></button>
                                  
                                  {/* Block Inputs based on type */}
                                  <div className="pr-8 pl-4">
                                    <span className="text-[10px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider absolute top-2 left-2">{block.type}</span>
                                    
                                    {(block.type === 'h1' || block.type === 'h2') && (
                                      <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex gap-1 bg-slate-100 w-fit p-1 rounded-md">
                                          <button onClick={() => updateBlock(folder.id, post.id, block.id, { align: 'left' })} className={`p-1 rounded ${block.align === 'left' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignLeft className="w-4 h-4" /></button>
                                          <button onClick={() => updateBlock(folder.id, post.id, block.id, { align: 'center' })} className={`p-1 rounded ${block.align === 'center' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignCenter className="w-4 h-4" /></button>
                                          <button onClick={() => updateBlock(folder.id, post.id, block.id, { align: 'right' })} className={`p-1 rounded ${block.align === 'right' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignRight className="w-4 h-4" /></button>
                                        </div>
                                        <input value={block.content} onChange={e => updateBlock(folder.id, post.id, block.id, { content: e.target.value })} className={`w-full ${block.type === 'h1' ? 'text-xl' : 'text-lg'} font-bold border-b border-transparent focus:border-blue-500 outline-none placeholder-slate-300 text-${block.align}`} placeholder={`제목 ${block.type === 'h1' ? '1' : '2'} 입력...`} />
                                      </div>
                                    )}
                                    {(block.type === 'text' || block.type === 'ul' || block.type === 'ol') && (
                                      <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex gap-2 items-center bg-slate-100 w-fit p-1 rounded-md">
                                          <div className="flex gap-1 border-r border-slate-300 pr-1">
                                            <button onClick={() => updateBlock(folder.id, post.id, block.id, { align: 'left' })} className={`p-1 rounded ${block.align === 'left' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignLeft className="w-4 h-4" /></button>
                                            <button onClick={() => updateBlock(folder.id, post.id, block.id, { align: 'center' })} className={`p-1 rounded ${block.align === 'center' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignCenter className="w-4 h-4" /></button>
                                            <button onClick={() => updateBlock(folder.id, post.id, block.id, { align: 'right' })} className={`p-1 rounded ${block.align === 'right' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><AlignRight className="w-4 h-4" /></button>
                                          </div>
                                          <div className="flex gap-1 pl-1">
                                            <button onClick={() => appendFormat(folder.id, post.id, block, 'bold')} className="p-1 rounded hover:bg-white text-slate-500" title="굵게 추가"><Bold className="w-4 h-4" /></button>
                                            <button onClick={() => appendFormat(folder.id, post.id, block, 'underline')} className="p-1 rounded hover:bg-white text-slate-500" title="밑줄 추가"><Underline className="w-4 h-4" /></button>
                                          </div>
                                        </div>
                                        <textarea value={block.content} onChange={e => updateBlock(folder.id, post.id, block.id, { content: e.target.value })} className={`w-full text-sm resize-y min-h-[60px] outline-none border-b border-transparent focus:border-blue-500 placeholder-slate-300 text-${block.align}`} placeholder={block.type === 'text' ? "본문 텍스트 입력..." : "목록 내용 입력... (엔터로 구분)"} />
                                      </div>
                                    )}
                                    {block.type === 'quote' && (
                                      <textarea value={block.content} onChange={e => updateBlock(folder.id, post.id, block.id, { content: e.target.value })} className="w-full text-sm font-medium italic border-l-4 border-slate-300 pl-3 py-1 outline-none resize-y min-h-[40px] mt-4 focus:border-blue-500 bg-slate-50" placeholder="인용구 입력..." />
                                    )}
                                    {block.type === 'callout' && (
                                      <div className="mt-4 flex gap-2 items-start">
                                        <input value={block.icon} onChange={e => updateBlock(folder.id, post.id, block.id, { icon: e.target.value })} className="w-10 text-center text-lg outline-none bg-slate-100 rounded-lg p-1" placeholder="💡" />
                                        <textarea value={block.content} onChange={e => updateBlock(folder.id, post.id, block.id, { content: e.target.value })} className="flex-1 text-sm outline-none bg-slate-100 rounded-lg p-2 resize-y min-h-[40px]" placeholder="안내 문구 입력..." />
                                      </div>
                                    )}
                                    {block.type === 'image' && (
                                      <div className="mt-5 flex flex-col gap-3">
                                        {block.url ? (
                                          <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-slate-200">
                                            <SmartImage src={getImageUrl(block.url)} className="w-full h-auto" />
                                            <button onClick={() => updateBlock(folder.id, post.id, block.id, { url: '' })} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded"><Trash2 className="w-4 h-4" /></button>
                                          </div>
                                        ) : (
                                          <label className="w-full max-w-sm h-32 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center rounded-lg cursor-pointer hover:bg-blue-50 text-slate-500 hover:text-blue-500">
                                            <ImagePlus className="w-6 h-6 mb-1" /><span className="text-xs font-bold">고화질 사진 업로드</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={e => handleBlockImageUpload(e, folder.id, post.id, block.id, 'url')} />
                                          </label>
                                        )}
                                        <input value={block.caption || ''} onChange={e => updateBlock(folder.id, post.id, block.id, { caption: e.target.value })} className="text-xs w-full p-2 border border-slate-200 rounded outline-none text-center" placeholder="(선택) 이미지 캡션 입력" />
                                      </div>
                                    )}
                                    {block.type === 'slider' && (
                                      <div className="mt-5 flex flex-col gap-3">
                                        <div className="flex gap-4 items-center">
                                          <span className="text-xs font-bold text-slate-500">비율 설정:</span>
                                          <label className="text-xs flex items-center gap-1 cursor-pointer"><input type="radio" checked={block.ratio === '4:5'} onChange={() => updateBlock(folder.id, post.id, block.id, { ratio: '4:5' })} /> 세로형 (4:5)</label>
                                          <label className="text-xs flex items-center gap-1 cursor-pointer"><input type="radio" checked={block.ratio === '1:1'} onChange={() => updateBlock(folder.id, post.id, block.id, { ratio: '1:1' })} /> 정방형 (1:1)</label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {(block.urls || []).map((u, i) => (
                                            <div key={i} className={`relative w-20 ${block.ratio === '1:1' ? 'aspect-square' : 'aspect-[4/5]'} rounded overflow-hidden border border-slate-200`}>
                                              <SmartImage src={getImageUrl(u)} className="w-full h-full object-cover" />
                                              <button onClick={() => updateBlock(folder.id, post.id, block.id, { urls: block.urls.filter((_, idx) => idx !== i) })} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
                                            </div>
                                          ))}
                                          <label className={`w-20 ${block.ratio === '1:1' ? 'aspect-square' : 'aspect-[4/5]'} border-2 border-dashed border-slate-300 flex flex-col items-center justify-center rounded cursor-pointer hover:bg-blue-50 text-slate-400 hover:text-blue-500`}>
                                            <Plus className="w-5 h-5" />
                                            <input type="file" accept="image/*" className="hidden" onChange={e => handleBlockImageUpload(e, folder.id, post.id, block.id, 'urls')} />
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                    {block.type === 'video' && (
                                      <div className="mt-5 flex flex-col gap-3">
                                        <div className="flex gap-2">
                                          <input value={block.url || ''} onChange={e => updateBlock(folder.id, post.id, block.id, { url: e.target.value })} className="flex-1 text-xs p-2 border border-slate-200 rounded outline-none" placeholder="Youtube, Vimeo 또는 MP4 URL 직접 입력 (권장)" />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                          <span>또는 직접 영상 업로드 (최대 40MB):</span>
                                          <label className="bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded cursor-pointer font-bold transition-colors">
                                            업로드 <input type="file" accept="video/*" className="hidden" onChange={e => handleBlockImageUpload(e, folder.id, post.id, block.id, 'url', true)} />
                                          </label>
                                        </div>
                                        {block.url && (
                                          <div className="mt-2 text-xs text-blue-500 font-bold">✓ 영상이 연동되었습니다. (자동재생, 음소거, 꽉찬 화면 적용됨)</div>
                                        )}
                                      </div>
                                    )}
                                    {block.type === 'beforeAfter' && (
                                      <div className="mt-5 grid grid-cols-2 gap-4 max-w-sm">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[10px] font-bold text-slate-500">Before 사진</span>
                                          {block.beforeUrl ? (
                                            <div className="relative aspect-[4/5] rounded border border-slate-200 overflow-hidden"><SmartImage src={getImageUrl(block.beforeUrl)} className="w-full h-full object-cover" /><button onClick={() => updateBlock(folder.id, post.id, block.id, { beforeUrl: '' })} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white"><X className="w-5 h-5"/></button></div>
                                          ) : (
                                            <label className="aspect-[4/5] border-2 border-dashed flex items-center justify-center cursor-pointer rounded hover:bg-slate-50"><Plus className="w-5 h-5 text-slate-400"/><input type="file" accept="image/*" className="hidden" onChange={e => handleBlockImageUpload(e, folder.id, post.id, block.id, 'beforeUrl')}/></label>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[10px] font-bold text-slate-500">After 사진</span>
                                          {block.afterUrl ? (
                                            <div className="relative aspect-[4/5] rounded border border-slate-200 overflow-hidden"><SmartImage src={getImageUrl(block.afterUrl)} className="w-full h-full object-cover" /><button onClick={() => updateBlock(folder.id, post.id, block.id, { afterUrl: '' })} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white"><X className="w-5 h-5"/></button></div>
                                          ) : (
                                            <label className="aspect-[4/5] border-2 border-dashed flex items-center justify-center cursor-pointer rounded hover:bg-slate-50"><Plus className="w-5 h-5 text-slate-400"/><input type="file" accept="image/*" className="hidden" onChange={e => handleBlockImageUpload(e, folder.id, post.id, block.id, 'afterUrl')}/></label>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {block.type === 'link' && (
                                      <div className="mt-4 flex flex-col gap-3">
                                        <div className="flex gap-4">
                                          <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                            {block.thumbnail ? (
                                              <div className="relative w-full h-full group">
                                                <SmartImage src={getImageUrl(block.thumbnail)} className="w-full h-full object-cover" />
                                                <button onClick={() => updateBlock(folder.id, post.id, block.id, { thumbnail: '' })} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><X className="w-4 h-4"/></button>
                                              </div>
                                            ) : (
                                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 text-slate-400 hover:text-blue-500">
                                                <ImagePlus className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">1:1 썸네일</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleBlockImageUpload(e, folder.id, post.id, block.id, 'thumbnail')} />
                                              </label>
                                            )}
                                          </div>
                                          <div className="flex-1 flex flex-col gap-2 justify-center">
                                            <input value={block.text || ''} onChange={e => updateBlock(folder.id, post.id, block.id, { text: e.target.value })} className="text-sm p-2 border border-slate-200 rounded outline-none" placeholder="표시될 링크 텍스트 (예: 예약 바로가기)" />
                                            <input value={block.url || ''} onChange={e => updateBlock(folder.id, post.id, block.id, { url: e.target.value })} className="text-xs p-2 bg-slate-100 rounded outline-none" placeholder="https://..." />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              ))}
                              {(!post.blocks || post.blocks.length === 0) && <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-xl">블록을 추가하여 내용을 작성해보세요.</div>}
                            </div>

                            {/* Add Block Menu */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border-t border-slate-200 pt-4">
                              <button onClick={() => addBlock(folder.id, post.id, 'h1')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><Type className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">제목 1</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'h2')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><Type className="w-4 h-4 mb-1 opacity-70" /><span className="text-[10px] font-bold">제목 2</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'text')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><AlignLeft className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">텍스트</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'ul')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><List className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">글머리기호</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'ol')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><ListOrdered className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">번호매기기</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'quote')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><Quote className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">인용구</span></button>
                              
                              <button onClick={() => addBlock(folder.id, post.id, 'image')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><ImagePlus className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">사진</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'slider')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><Columns className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">슬라이드</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'video')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><MonitorPlay className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">영상</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'beforeAfter')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><Maximize className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">Bef/Aft</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'callout')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><span className="text-sm mb-1 h-4 flex items-center justify-center">💡</span><span className="text-[10px] font-bold">콜아웃</span></button>
                              <button onClick={() => addBlock(folder.id, post.id, 'link')} className="py-2 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-600"><Link2 className="w-4 h-4 mb-1" /><span className="text-[10px] font-bold">링크</span></button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                <button onClick={() => addBlogPost(folder.id)} className="w-full py-3 sm:py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-slate-500 font-bold hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> 블로그 글 추가
                </button>
              </div>
            </div>
          ))}
          {localConfig.blogFolders.length === 0 && <p className="text-center text-slate-400 py-4 text-sm font-medium">폴더를 추가하여 블로그 리스트를 구성해보세요.</p>}
        </div>
      </section>

      {/* 1. Image Settings */}
      <section className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 sm:mb-8"><ImagePlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> 이미지 관리</h3>
        <div className="space-y-8 sm:space-y-10">
          <div>
            <label className="flex items-center gap-2 text-[15px] sm:text-base font-bold text-slate-800 mb-3 sm:mb-4"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] sm:text-xs">1:1 비율</span> 상단 메인 슬라이드 사진</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {localConfig.sliderImages.map((img, idx) => (
                <div key={`admin-slide-${idx}`} className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                  <SmartImage src={getImageUrl(img)} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeSliderImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" /></button>
                </div>
              ))}
              <label className="aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-blue-600">
                <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" /><span className="text-[13px] sm:text-sm font-bold">1:1 사진 추가</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'slider')} />
              </label>
            </div>
          </div>
          
          <hr className="border-slate-100" />
          
          <div>
            <label className="flex items-center gap-2 text-[15px] sm:text-base font-bold text-slate-800 mb-3 sm:mb-4"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[11px] sm:text-xs">3:4 세로 비율</span> 리뷰 슬라이더 사진</label>
            <p className="text-[12px] sm:text-sm text-slate-500 mb-4">화면 하단 리뷰 슬라이더에 표시될 세로형 사진들을 업로드하세요.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {localConfig.reviewImages.map((img, idx) => (
                <div key={`admin-review-${idx}`} className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                  <SmartImage src={getImageUrl(img)} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeReviewImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" /></button>
                </div>
              ))}
              <label className="aspect-[3/4] rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-blue-600">
                <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" /><span className="text-[13px] sm:text-sm font-bold">3:4 사진 추가</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'review')} />
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100">
              <label className="block text-[14px] sm:text-sm font-bold text-slate-800 mb-3 sm:mb-4">안내 팝업용 사진 (동그랗게 표시됨)</label>
              {localConfig.popupImage ? (
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-slate-200 group bg-white shadow-sm mb-3 sm:mb-4">
                  <SmartImage src={getImageUrl(localConfig.popupImage)} alt="Popup" className="w-full h-full object-cover" />
                  <button onClick={() => { deleteImageFromDB(localConfig.popupImage); setLocalConfig({...localConfig, popupImage: null}); }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></button>
                </div>
              ) : (
                <label className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-blue-600 mb-3 sm:mb-4 bg-white"><UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 mb-1" /><span className="text-[11px] sm:text-xs font-bold">업로드</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'popup')} /></label>
              )}
              <p className="text-[11px] sm:text-xs text-slate-500">팝업 상단에 동그랗게 들어가는 사진입니다.</p>
            </div>
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100">
              <label className="block text-[14px] sm:text-sm font-bold text-slate-800 mb-3 sm:mb-4">하단 상품 가격표 이미지 <span className="text-blue-500 font-normal">(원본비율 적용)</span></label>
              {localConfig.priceTableImage ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 group bg-white shadow-sm mb-3 sm:mb-4 max-w-xs">
                  <SmartImage src={getImageUrl(localConfig.priceTableImage)} alt="Price Table" className="w-full h-auto object-contain" />
                  <button onClick={() => { deleteImageFromDB(localConfig.priceTableImage); setLocalConfig({...localConfig, priceTableImage: null}); }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" /></button>
                </div>
              ) : (
                <label className="w-24 h-24 sm:h-32 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-blue-600 mb-3 sm:mb-4 bg-white"><UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 mb-1" /><span className="text-[13px] sm:text-sm font-bold">가격표 업로드</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'priceTable')} /></label>
              )}
              <p className="text-[11px] sm:text-xs text-slate-500">결과 화면 우측 하단에 들어가는 상세 표입니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Text & Popup Settings */}
      <section className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 sm:mb-8"><Type className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> 문구 및 팝업 설정</h3>
        <div className="space-y-6 sm:space-y-8">
          <div>
            <label className="block text-[15px] sm:text-base font-bold text-slate-800 mb-2 sm:mb-3">메인 상단 소개글</label>
            <textarea value={localConfig.introText} onChange={(e) => setLocalConfig({...localConfig, introText: e.target.value})} className="w-full p-3.5 sm:p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[90px] sm:min-h-[100px] text-sm sm:text-base leading-relaxed bg-slate-50" />
          </div>
          <div className="pt-6 sm:pt-8 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
              <label className="text-[15px] sm:text-base font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> 접속 시 안내 팝업 설정</label>
              <button onClick={() => setLocalConfig({...localConfig, popupEnabled: !localConfig.popupEnabled})} className={`self-start sm:self-auto flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors shadow-sm ${localConfig.popupEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {localConfig.popupEnabled ? <ToggleRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ToggleLeft className="w-4 h-4 sm:w-5 sm:h-5" />} {localConfig.popupEnabled ? '팝업 활성화됨' : '팝업 꺼짐'}
              </button>
            </div>
            <textarea value={localConfig.popupText} onChange={(e) => setLocalConfig({...localConfig, popupText: e.target.value})} disabled={!localConfig.popupEnabled} className={`w-full p-3.5 sm:p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[100px] sm:min-h-[120px] text-sm sm:text-base leading-relaxed ${!localConfig.popupEnabled ? 'bg-slate-100 opacity-60' : 'bg-slate-50'}`} />
          </div>
        </div>
      </section>

      {/* FAQ Settings */}
      <section className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2"><HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> 자주 묻는 질문 (FAQ)</div>
          <button onClick={addFaq} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 font-bold rounded-lg text-sm hover:bg-blue-100 transition-colors">
            <Plus className="w-4 h-4" /> 항목 추가
          </button>
        </h3>
        <div className="space-y-4">
          {localConfig.faqs.map((faq, idx) => (
            <div key={`admin-faq-${idx}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 relative group">
              <button onClick={() => removeFaq(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
              <div className="space-y-3 pr-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">질문 (Question)</label>
                  <input value={faq.question} onChange={(e) => handleFaqChange(idx, 'question', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="질문을 입력하세요" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">답변 (Answer)</label>
                  <textarea value={faq.answer} onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y min-h-[80px]" placeholder="답변을 입력하세요" />
                </div>
              </div>
            </div>
          ))}
          {localConfig.faqs.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">등록된 질문이 없습니다.</p>}
        </div>
      </section>

      {/* 3. Button & Links Settings */}
      <section className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 sm:mb-8"><LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> 하단 상담 버튼 설정</h3>
        <div className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">상담 버튼 문구</label>
            <input value={localConfig.consultationText} onChange={(e) => setLocalConfig({...localConfig, consultationText: e.target.value})} className="w-full p-3 sm:p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base bg-slate-50" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">상담 연결 링크 (URL)</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input value={localConfig.consultationLink} onChange={(e) => setLocalConfig({...localConfig, consultationLink: e.target.value})} className="flex-1 p-3 sm:p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base bg-slate-50" placeholder="https://..." />
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(localConfig.consultationLink, '_blank')} className="flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap text-sm sm:text-base"><ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />링크 접속 테스트</motion.button>
            </div>
          </div>
          <div className="pt-5 sm:pt-6 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-800 mb-2">버튼 아래 추가 안내문구</label>
            <input value={localConfig.bottomNoticeText} onChange={(e) => setLocalConfig({...localConfig, bottomNoticeText: e.target.value})} className="w-full p-3 sm:p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base bg-slate-50" />
          </div>
        </div>
      </section>

      {/* 4. Product Price Settings */}
      <section className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 sm:mb-8"><Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> 상품 단가 설정 (원)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200"><h4 className="font-bold text-slate-800 mb-3 sm:mb-4 text-base sm:text-lg">가족사진 <span className="text-xs text-slate-500 font-medium">(기본 4인)</span></h4><div className="space-y-3 sm:space-y-4"><div><label className="text-xs font-bold text-slate-500">평일</label><input type="number" value={localConfig.prices.family.weekday} onChange={(e) => handlePriceChange('family', 'weekday', e.target.value)} className="w-full p-2.5 sm:p-3 mt-1 sm:mt-1.5 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm sm:text-base" /></div><div><label className="text-xs font-bold text-slate-500">주말/공휴일</label><input type="number" value={localConfig.prices.family.weekend} onChange={(e) => handlePriceChange('family', 'weekend', e.target.value)} className="w-full p-2.5 sm:p-3 mt-1 sm:mt-1.5 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm sm:text-base" /></div></div></div>
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200"><h4 className="font-bold text-slate-800 mb-3 sm:mb-4 text-base sm:text-lg">만삭사진 <span className="text-xs text-slate-500 font-medium">(고정 2인)</span></h4><div className="space-y-3 sm:space-y-4"><div><label className="text-xs font-bold text-slate-500">평일</label><input type="number" value={localConfig.prices.maternity.weekday} onChange={(e) => handlePriceChange('maternity', 'weekday', e.target.value)} className="w-full p-2.5 sm:p-3 mt-1 sm:mt-1.5 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm sm:text-base" /></div><div><label className="text-xs font-bold text-slate-500">주말/공휴일</label><input type="number" value={localConfig.prices.maternity.weekend} onChange={(e) => handlePriceChange('maternity', 'weekend', e.target.value)} className="w-full p-2.5 sm:p-3 mt-1 sm:mt-1.5 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm sm:text-base" /></div></div></div>
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200"><h4 className="font-bold text-slate-800 mb-3 sm:mb-4 text-base sm:text-lg">부부/커플 <span className="text-xs text-slate-500 font-medium">(고정 2인)</span></h4><div className="space-y-3 sm:space-y-4"><div><label className="text-xs font-bold text-slate-500">평일</label><input type="number" value={localConfig.prices.couple.weekday} onChange={(e) => handlePriceChange('couple', 'weekday', e.target.value)} className="w-full p-2.5 sm:p-3 mt-1 sm:mt-1.5 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm sm:text-base" /></div><div><label className="text-xs font-bold text-slate-500">주말/공휴일</label><input type="number" value={localConfig.prices.couple.weekend} onChange={(e) => handlePriceChange('couple', 'weekend', e.target.value)} className="w-full p-2.5 sm:p-3 mt-1 sm:mt-1.5 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm sm:text-base" /></div></div></div>
        </div>
      </section>

      {/* 5. Frame Price Settings */}
      <section className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 sm:mb-8"><Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> 액자 사이즈별 단가 (원)</h3>
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 sm:mb-6 text-base sm:text-lg border-b border-slate-200 pb-2.5 sm:pb-3">아크릴 우드 프레임</h4>
            <div className="space-y-3 sm:space-y-4">
              {FRAME_SIZES.map((size) => (
                <div key={`wood-${size.id}`} className="flex items-center justify-between gap-3 sm:gap-4"><div className="w-16 sm:w-20"><span className="text-[13px] sm:text-sm font-bold text-slate-700">{size.label}</span></div><input type="number" value={localConfig.framePrices.wood[size.id]} onChange={(e) => handleFramePriceChange('wood', size.id, e.target.value)} className="flex-1 p-2 sm:p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium text-sm sm:text-base" /></div>
              ))}
            </div>
          </div>
          <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 sm:mb-6 text-base sm:text-lg border-b border-slate-200 pb-2.5 sm:pb-3">아크릴 프레임 리스</h4>
            <div className="space-y-3 sm:space-y-4">
              {FRAME_SIZES.map((size) => (
                <div key={`frameless-${size.id}`} className="flex items-center justify-between gap-3 sm:gap-4"><div className="w-16 sm:w-20"><span className="text-[13px] sm:text-sm font-bold text-slate-700">{size.label}</span></div><input type="number" value={localConfig.framePrices.frameless[size.id]} onChange={(e) => handleFramePriceChange('frameless', size.id, e.target.value)} className="flex-1 p-2 sm:p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium text-sm sm:text-base" /></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Save Bar */}
      <div className="fixed sm:sticky bottom-4 sm:bottom-4 left-4 right-4 sm:left-0 sm:right-0 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4 z-[2500]">
        <button onClick={() => setLocalConfig(safeConfig)} className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm sm:text-base">설정 초기화</button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={saveSettings} disabled={isSaving || isUploading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 text-base sm:text-lg disabled:opacity-50">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
          데이터베이스에 저장
        </motion.button>
      </div>
    </div>
  );
}

// 3. Statistics View (Admin) 
function StatisticsView({ visits, estimates }) {
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filteredData = useMemo(() => {
    const now = Date.now();
    const getStartOfDay = (offsetDays = 0) => {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      d.setHours(0,0,0,0);
      return d.getTime();
    };

    let startTime = 0;
    let endTime = now;

    if (dateFilter === 'today') startTime = getStartOfDay(0);
    else if (dateFilter === 'yesterday') { startTime = getStartOfDay(1); endTime = getStartOfDay(0) - 1; }
    else if (dateFilter === '7days') startTime = getStartOfDay(7);
    else if (dateFilter === '14days') startTime = getStartOfDay(14);
    else if (dateFilter === '1month') startTime = getStartOfDay(30);
    else if (dateFilter === 'custom') {
      if (customStart) startTime = new Date(customStart).setHours(0,0,0,0);
      if (customEnd) endTime = new Date(customEnd).setHours(23,59,59,999);
    }

    const fVisits = visits.filter(v => v.timestamp >= startTime && v.timestamp <= endTime);
    const fEstimates = estimates.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);

    const visitors = fVisits.length;
    const calculations = fEstimates.length;
    const conversionRate = visitors > 0 ? ((calculations / visitors) * 100).toFixed(1) : 0;
    const revenue = fEstimates.reduce((sum, e) => sum + e.totalCost, 0);

    const productCounts = { family: 0, maternity: 0, couple: 0 };
    fEstimates.forEach(e => { if (productCounts[e.productType] !== undefined) productCounts[e.productType]++; });
    const topProductKey = Object.keys(productCounts).reduce((a, b) => productCounts[a] > productCounts[b] ? a : b);
    const popular = calculations > 0 ? (topProductKey === 'family' ? '가족사진' : topProductKey === 'maternity' ? '만삭사진' : '부부/커플') : '-';

    const chartData = [
      { label: '가족', value: productCounts.family },
      { label: '만삭', value: productCounts.maternity },
      { label: '부부', value: productCounts.couple },
    ];

    const regionCounts = {};
    fVisits.forEach(v => {
      const r = v.region || '기타';
      regionCounts[r] = (regionCounts[r] || 0) + 1;
    });
    const regions = Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    return { visitors, calculations, conversionRate, popular, revenue, chartData, regions };
  }, [visits, estimates, dateFilter, customStart, customEnd]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">통계 인사이트 (DB 연동)</h2>
          <p className="text-slate-500 text-[13px] sm:text-base">클라우드에 저장된 실제 접속 및 견적 데이터를 분석합니다.</p>
        </div>
        
        <div className="flex flex-col xl:flex-row xl:items-center bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm gap-1">
          <div className="flex flex-wrap items-center gap-1 w-full xl:w-auto">
            {[
              { id: 'today', label: '오늘' },
              { id: 'yesterday', label: '어제' },
              { id: '7days', label: '최근 7일' },
              { id: '14days', label: '최근 14일' },
              { id: '1month', label: '최근 1개월' },
              { id: 'custom', label: '기간 선택' },
              { id: 'all', label: '전체' }
            ].map(f => (
              <button key={f.id} onClick={() => setDateFilter(f.id)} className={`px-2.5 sm:px-3.5 py-2 text-[12px] sm:text-[13px] font-bold rounded-lg transition-colors flex-1 sm:flex-none whitespace-nowrap ${dateFilter === f.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                {f.label}
              </button>
            ))}
          </div>
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 mt-2 xl:mt-0 xl:ml-2 px-2 pb-1.5 xl:pb-0">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full xl:w-auto px-2 py-1.5 text-[12px] sm:text-[13px] font-medium border border-slate-200 rounded-lg outline-none text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 transition-colors" />
              <span className="text-slate-400 font-bold">~</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full xl:w-auto px-2 py-1.5 text-[12px] sm:text-[13px] font-medium border border-slate-200 rounded-lg outline-none text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 transition-colors" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
          <span className="text-[11px] sm:text-sm font-bold text-slate-500 mb-1.5 sm:mb-2">총 페이지 방문자 (실제)</span>
          <span className="text-xl sm:text-3xl font-bold text-slate-900">{new Intl.NumberFormat().format(filteredData.visitors)}명</span>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 rounded-full blur-xl translate-x-1/2 -translate-y-1/2" />
          <span className="text-[11px] sm:text-sm font-bold text-blue-600 mb-1.5 sm:mb-2">견적계산완료</span>
          <span className="text-xl sm:text-3xl font-bold text-slate-900">{new Intl.NumberFormat().format(filteredData.calculations)}건</span>
          <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-bold text-slate-500">방문자 전환율: <strong className="text-blue-600">{filteredData.conversionRate}%</strong></div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
          <span className="text-[11px] sm:text-sm font-bold text-slate-500 mb-1.5 sm:mb-2">최다 조회 상품</span>
          <span className="text-xl sm:text-3xl font-bold text-slate-900">{filteredData.calculations > 0 ? filteredData.popular : '-'}</span>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
          <span className="text-[11px] sm:text-sm font-bold text-slate-500 mb-1.5 sm:mb-2">예상 견적 총액 (DB기준)</span>
          <span className="text-lg sm:text-2xl font-bold text-slate-900">{new Intl.NumberFormat().format(filteredData.revenue)}원</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-5 sm:mb-8 flex items-center gap-2"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> 상품별 관심도</h3>
          <div className="space-y-4 sm:space-y-6">
            {filteredData.chartData.map((item, idx) => {
              const max = Math.max(...filteredData.chartData.map(d => d.value), 1);
              const percentage = (item.value / max) * 100;
              return (
                <div key={`stat-chart-${idx}`} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 sm:w-12 text-xs sm:text-sm font-bold text-slate-600">{item.label}</div>
                  <div className="flex-1 h-4 sm:h-5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, type: "spring" }} className="h-full bg-blue-500 rounded-full" />
                  </div>
                  <div className="w-12 sm:w-14 text-xs sm:text-sm font-bold text-slate-800 text-right">{new Intl.NumberFormat().format(item.value)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-5 sm:mb-8 flex items-center gap-2"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> 접속 지역 통계 (Top 7)</h3>
          <div className="space-y-3 sm:space-y-4">
            {filteredData.regions.length > 0 ? filteredData.regions.map((item, idx) => {
              const max = filteredData.regions[0].value;
              const percentage = (item.value / max) * 100;
              return (
                <div key={`region-${idx}`} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 sm:w-14 text-xs sm:text-sm font-bold text-slate-600 truncate">{item.name}</div>
                  <div className="flex-1 h-2.5 sm:h-3 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, delay: 0.2, type: "spring" }} className="h-full bg-slate-800 rounded-full" />
                  </div>
                  <div className="w-8 sm:w-10 text-[10px] sm:text-xs font-bold text-slate-500 text-right">{new Intl.NumberFormat().format(item.value)}</div>
                </div>
              );
            }) : <div className="text-sm text-slate-400 text-center py-4">아직 수집된 지역 데이터가 없습니다.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Admin Login View
function AdminLoginView({ onLogin }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id === "beanute" && password === "chsh040617") {
      onLogin();
    } else {
      setError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><Lock className="w-8 h-8 sm:w-10 sm:h-10" /></div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800 mb-2 tracking-tight">관리자 로그인</h2>
        <p className="text-center text-slate-500 text-sm mb-8">안전한 데이터 관리를 위해 로그인해주세요.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">아이디</label>
            <input 
              type="text" 
              value={id} 
              onChange={(e) => { setId(e.target.value); setError(""); }} 
              className="w-full p-3.5 sm:p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[15px] bg-slate-50 focus:bg-white" 
              placeholder="아이디를 입력하세요" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">비밀번호</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); setError(""); }} 
              className="w-full p-3.5 sm:p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[15px] bg-slate-50 focus:bg-white" 
              placeholder="비밀번호를 입력하세요" 
            />
          </div>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[13px] font-bold text-center">{error}</motion.p>}
          <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 text-base mt-2">
            접속하기
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// 5. 완벽한 에러 감지기 (ErrorBoundary)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-red-50 p-4 font-sans">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <X className="w-6 h-6" /> 화면에 오류가 발생했습니다!
            </h1>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              코드를 불러오는 중 문제가 발생했습니다. 파이어베이스 설정이나 네트워크 연결을 확인해주세요.
            </p>
            <div className="bg-slate-100 p-4 rounded-xl overflow-x-auto text-xs text-red-500 font-mono mb-6 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">
              새로고침 시도하기
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App Component (Root) ---
function MainApp() {
  const [activeTab, setActiveTab] = useState("preview"); 
  const isClientMode = window.location.search.includes('client=true');

  const [user, setUser] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Blog Mode Global State
  const [isBlogMode, setBlogMode] = useState(false);
  
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [visits, setVisits] = useState([]);
  const [estimates, setEstimates] = useState([]);
  
  // 이미지 무한 업로드를 위한 분리된 상태 (Firestore 'images' 컬렉션 동기화)
  const [images, setImages] = useState({});

  useEffect(() => {
    if (!auth) {
      setIsDbReady(true);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch(e) { 
        setIsDbReady(true);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsDbReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isDbReady || !db || !user) return;

    let unsubConfig = () => {};
    let unsubVisits = () => {};
    let unsubEstimates = () => {};
    let unsubImages = () => {};

    try {
      unsubConfig = onSnapshot(doc(db, getPath('config'), 'main'), (docSnap) => {
        if (docSnap.exists()) setConfig(docSnap.data());
        else setDoc(doc(db, getPath('config'), 'main'), DEFAULT_CONFIG);
      }, err => console.error("Config fetch error:", err));

      unsubVisits = onSnapshot(collection(db, getPath('visits')), (snap) => {
        const v = [];
        snap.forEach(d => v.push(d.data()));
        setVisits(v);
      }, err => console.error("Visits fetch error:", err));

      unsubEstimates = onSnapshot(collection(db, getPath('estimates')), (snap) => {
        const e = [];
        snap.forEach(d => e.push(d.data()));
        setEstimates(e);
      }, err => console.error("Estimates fetch error:", err));

      // 분리된 이미지 데이터 동기화
      unsubImages = onSnapshot(collection(db, getPath('images')), (snap) => {
        const newImages = {};
        snap.forEach(doc => {
          const data = doc.data();
          if (data.isChunked) {
             newImages[doc.id] = { isChunked: true, chunkCount: data.chunkCount };
          } else {
             newImages[doc.id] = data.base64;
          }
        });
        setImages(newImages);
      }, err => console.error("Images fetch error:", err));

    } catch(e) {
      console.error("Firestore onSnapshot setup error:", e);
    }

    return () => { 
      unsubConfig(); 
      unsubVisits(); 
      unsubEstimates(); 
      unsubImages();
    };
  }, [isDbReady, user]);

  const saveConfigToDB = async (newConfig) => {
    if (!db) return;
    try { await setDoc(doc(db, getPath('config'), 'main'), newConfig); } 
    catch (e) { console.error("Save config error:", e); }
  };

  const trackEstimateToDB = async (data) => {
    // 🚨 관리자 화면의 미리보기에서 발생한 견적 계산 통계 집계 제외
    if (!isClientMode) return;
    if (!db || !user) return;
    try { await addDoc(collection(db, getPath('estimates')), data); } 
    catch (e) { console.error("Track estimate error:", e); }
  };

  // config 내부의 이미지 id를 실제 이미지 데이터(base64)로 변환
  const getImageUrl = useCallback((src) => {
    if (!src) return null;
    if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('blob:') || src.startsWith('chunked:')) return src;
    
    const imgData = images[src];
    if (!imgData) return null;
    
    if (imgData.isChunked) {
      return `chunked:${src}:${imgData.chunkCount}`;
    }
    
    return imgData; 
  }, [images]);

  // 화면 렌더링용 (config 문서에서 아이디만 가져와서 실제 데이터 주입 + 중첩된 블록 이미지도 변환 처리)
  const processedConfig = useMemo(() => {
    const safeConfig = { 
      ...DEFAULT_CONFIG, 
      ...config,
      faqs: config.faqs || DEFAULT_CONFIG.faqs, 
      reviewImages: config.reviewImages || [],
      blogFolders: config.blogFolders || DEFAULT_CONFIG.blogFolders,
      blogTitle: config.blogTitle || DEFAULT_CONFIG.blogTitle,
      blogSubtitle: config.blogSubtitle || DEFAULT_CONFIG.blogSubtitle
    };
    return {
      ...safeConfig,
      sliderImages: (safeConfig.sliderImages || []).map(getImageUrl).filter(Boolean),
      reviewImages: (safeConfig.reviewImages || []).map(getImageUrl).filter(Boolean),
      popupImage: getImageUrl(safeConfig.popupImage),
      priceTableImage: getImageUrl(safeConfig.priceTableImage),
      blogFolders: (safeConfig.blogFolders || []).map(folder => ({
        ...folder,
        posts: folder.posts.map(post => ({
          ...post,
          thumbnail: getImageUrl(post.thumbnail),
          blocks: (post.blocks || []).map(b => {
             if (b.type === 'image') return { ...b, url: getImageUrl(b.url) };
             if (b.type === 'slider') return { ...b, urls: (b.urls || []).map(getImageUrl) };
             if (b.type === 'beforeAfter') return { ...b, beforeUrl: getImageUrl(b.beforeUrl), afterUrl: getImageUrl(b.afterUrl) };
             if (b.type === 'video' && b.url && !b.url.startsWith('http')) return { ...b, url: getImageUrl(b.url) };
             if (b.type === 'link') return { ...b, thumbnail: getImageUrl(b.thumbnail) };
             return b;
          })
        }))
      }))
    };
  }, [config, getImageUrl]);

  if (!isDbReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="font-medium">데이터베이스 연동 중...</p>
      </div>
    );
  }

  // 고객용 뷰 (클라이언트 모드)
  if (isClientMode) return <CalculatorView config={processedConfig} onEstimateComplete={trackEstimateToDB} visits={visits} isBlogMode={isBlogMode} setBlogMode={setBlogMode} isClientMode={isClientMode} />;

  // 관리자 모드 접속 시, 로그인 확인
  if (!isAdminAuthenticated) {
    return <AdminLoginView onLogin={() => setIsAdminAuthenticated(true)} />;
  }

  // 관리자 대시보드
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-100 selection:bg-blue-200">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 flex-shrink-0 md:h-full">
        <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex items-center justify-between md:flex-col md:items-start md:justify-start">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">비뉴뜨</h1>
            <p className="text-[10px] sm:text-xs text-blue-400 mt-0.5 sm:mt-1 uppercase tracking-wider font-bold">Admin Dashboard</p>
          </div>
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('client', 'true');
              window.open(url.toString(), '_blank');
            }}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> 고객용
          </button>
        </div>
        
        <nav className="flex md:flex-col gap-1.5 sm:gap-2 px-3 sm:px-4 pb-3 sm:pb-4 md:pb-0 overflow-x-auto md:overflow-visible no-scrollbar mt-1 md:mt-4">
          <button onClick={() => setActiveTab("preview")} className={`flex-shrink-0 md:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-all font-bold text-[13px] sm:text-base ${activeTab === "preview" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"}`}>
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" /><span>미리보기</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`flex-shrink-0 md:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-all font-bold text-[13px] sm:text-base ${activeTab === "settings" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"}`}>
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" /><span>환경설정 (DB연동)</span>
          </button>
          <button onClick={() => setActiveTab("statistics")} className={`flex-shrink-0 md:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-all font-bold text-[13px] sm:text-base ${activeTab === "statistics" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"}`}>
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" /><span>통계 (Real Data)</span>
          </button>
        </nav>

        <div className="hidden md:block p-4 mt-auto border-t border-slate-800">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('client', 'true');
              window.open(url.toString(), '_blank');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> 고객용 링크 새창열기
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-slate-100">
        <AnimatePresence mode="wait">
          {activeTab === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <CalculatorView config={processedConfig} onEstimateComplete={trackEstimateToDB} visits={visits} isBlogMode={isBlogMode} setBlogMode={setBlogMode} isClientMode={isClientMode} />
            </motion.div>
          )}
          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminSettingsView config={config} onSaveConfig={saveConfigToDB} images={images} />
            </motion.div>
          )}
          {activeTab === "statistics" && (
            <motion.div key="statistics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <StatisticsView visits={visits} estimates={estimates} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}