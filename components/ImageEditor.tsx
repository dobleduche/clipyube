
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { editImageWithPrompt, upscaleImage, removeImageBackground, applyStyleTransfer, searchImages } from '../services/geminiService';
import { generateVideoWithRunway } from '../services/runwayService';
import { fileToBase64, dataUrlToFile } from '../utils/fileUtils';
import Loader from './Loader';
import { UploadIcon, MagicWandIcon, TrashIcon, DownloadIcon, CropIcon, PlusIcon, MinusIcon, UndoIcon, RedoIcon, FilterIcon, UpscaleIcon, AdjustmentsIcon, BackgroundEraserIcon, ColorSplashIcon, StyleTransferIcon, SaveIcon, LoadIcon, DevicePreviewIcon, VideoIcon, WatermarkIcon, XIcon, BrushIcon, ResetZoomIcon, ArrowLeftIcon, ArrowRightIcon, SearchIcon, HistoryIcon, CloneIcon } from './Icons';
import ExampleCarousel from './ExampleCarousel';
import ToolOptionsPanel from './ToolOptionsPanel';
import { useAppContext } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import ShareComponent from './ShareComponent';
import { motion, AnimatePresence } from 'framer-motion';
import ClipTimeline from './ClipTimeline';
import { useDebouncedCallback } from 'use-debounce';

const EDITOR_STATE_KEY = 'clipyube-editor-state';
const CUSTOM_FILTERS_KEY = 'clipyube-custom-filters';
const VIDEO_PRESETS_KEY = 'clipyube-video-presets';
const SAVED_PROJECT_KEY = 'clipyube-saved-project';

type Tool = 'filters' | 'adjustments' | 'upscale' | 'colorsplash' | 'devicepreview' | 'video' | 'watermark' | 'ai-edit' | 'effects' | 'brush' | 'image-search' | 'history';

const getFriendlyErrorMessage = (error: unknown, operation: string): string => {
    if (!(error instanceof Error)) {
        return `An unknown error occurred during ${operation}.`;
    }

    const message = error.message; // Keep case for API key names
    const lowerMessage = message.toLowerCase();

    // Specific check for Runway API Key. The service throws an error with this exact variable name.
    if (message.includes('RUNWAY_API_KEY')) {
        return `Runway API Key Error: The 'RUNWAY_API_KEY' is missing or invalid. Please configure it in your environment to enable video generation.`;
    }

    // Specific check for Gemini API Key from our backend proxy or Gemini itself.
    if (message.includes('API_KEY') || lowerMessage.includes('api key not valid') || lowerMessage.includes('api_key_invalid') || lowerMessage.includes('requested entity was not found')) {
        return `Gemini API Key Error: Your key seems to be invalid or missing. Please ensure the 'API_KEY' is configured correctly on the server for image editing features.`;
    }

    if (lowerMessage.includes('safety policies') || lowerMessage.includes('prompt was blocked') || lowerMessage.includes('candidate was blocked')) {
        return `Content Policy Violation: Your request for '${operation}' was blocked. Please try rephrasing your prompt to be more specific and avoid potentially sensitive topics.`;
    }

    if (lowerMessage.includes('quota')) {
        return `Quota Exceeded: You have exceeded your API usage limits. Please check your account status and billing information.`;
    }
    
    if (lowerMessage.includes('billing')) {
         return `Billing Error: There may be an issue with your billing account. Please ensure it's active and has a valid payment method.`;
    }

    if (lowerMessage.includes('network request failed') || lowerMessage.includes('fetch')) {
        return `Network Error: Could not connect to the AI service. Please check your internet connection and try again.`;
    }
    
    // Default Gemini API error
    if (lowerMessage.includes('gemini api')) {
        const cleanerMessage = message.replace(/an error occurred during .*? with the gemini api:/i, '').trim();
        return `AI Model Error during ${operation}: ${cleanerMessage}. Please try a different prompt or try again later.`;
    }

    return `An unexpected error occurred during ${operation}: ${error.message}`;
};


const filters = [
    { name: 'None', value: 'none', type: 'css' },
    { name: 'Sepia', value: 'sepia(1)', type: 'css' },
    { name: 'Grayscale', value: 'grayscale(1)', type: 'css' },
    { name: 'Vintage', value: 'sepia(0.6) contrast(1.1) brightness(0.9) saturate(1.2)', type: 'css' },
    { name: 'Cinematic', value: 'contrast(1.2) saturate(0.8) brightness(0.9)', type: 'css' },
    { name: 'Invert', value: 'invert(1)', type: 'css' },
    { name: 'Saturate', value: 'saturate(2)', type: 'css' },
];

const presets = [
    { name: 'Odinary Neon', value: 'contrast(1.2) saturate(1.8) brightness(1.1) hue-rotate(-15deg)', type: 'css' },
    { name: 'Bear-Market Red', value: 'sepia(0.4) contrast(1.1) brightness(0.9) hue-rotate(-20deg) saturate(1.3)', type: 'css' },
    { name: 'Solana Cyan', value: 'saturate(1.6) contrast(1.1) brightness(1.05) hue-rotate(180deg) sepia(0.2)', type: 'css' },
    { name: 'Vintage Poster', value: 'sepia(0.6) saturate(1.4) contrast(0.9) brightness(1.1)', type: 'css' },
    { name: 'Glitch Noir', value: 'grayscale(1) contrast(1.5) brightness(0.9)', type: 'css' },
    { name: 'Pixel Glow', value: 'saturate(2) contrast(1.2)', type: 'css' },
    { name: 'Meme Bold', value: 'contrast(1.4) saturate(1.5) brightness(1.1)', type: 'css' },
    { name: 'Subtle Grain', value: 'grain', type: 'canvas' },
    { name: 'High Contrast', value: 'contrast(1.8) saturate(1.2)', type: 'css' },
    { name: 'Night Mode', value: 'brightness(0.7) contrast(1.2) hue-rotate(180deg)', type: 'css' },
];

const creativeFilters = [
    { name: 'Vignette', value: 'vignette', type: 'canvas' },
    { name: 'Bloom', value: 'brightness(1.1) contrast(1.2) saturate(1.2)', type: 'css' },
    { name: 'Edge Glow', value: 'brightness(1.1) contrast(1.1)', type: 'css' }, // Simplified
    { name: 'Halftone', value: 'halftone', type: 'canvas' },
    { name: 'Scanlines', value: 'scanlines', type: 'canvas' },
];

interface EditorFilter {
    name: string;
    value: string;
    type: 'css' | 'canvas';
}

const allFilters: EditorFilter[] = [...filters, ...presets, ...creativeFilters] as any;


const defaultAdjustments = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    hue: 0,
};

interface CustomFilter {
  name: string;
  settings: typeof defaultAdjustments;
}

interface VideoPreset {
  name: string;
  prompt: string;
  style: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

const cropAspectRatios = [
    { label: 'Free', value: 'free' },
    { label: '1:1', value: '1:1' },
    { label: '4:5', value: '4:5' },
    { label: '4:3', value: '4:3' },
    { label: '3:4', value: '3:4' },
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
];

interface DeviceFrameProps {
  type: string;
  theme: string;
  children: React.ReactNode;
}

const DeviceFrame: React.FC<DeviceFrameProps> = ({ type, theme, children }) => {
    const frameColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200';
    const screenColor = theme === 'dark' ? 'bg-black' : 'bg-white';

    if (type === 'mobile') {
        return (
            <div className={`w-48 h-96 p-2 rounded-3xl shadow-2xl transition-colors duration-300 ${frameColor}`}>
                <div className={`w-full h-full rounded-2xl overflow-hidden relative ${screenColor}`}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-b-lg z-10"></div>
                    <div className="absolute inset-0 pt-1">{children}</div>
                </div>
            </div>
        );
    }
    if (type === 'tablet') {
        return (
             <div className={`w-96 h-72 p-2 rounded-2xl shadow-2xl transition-colors duration-300 ${frameColor}`}>
                <div className={`w-full h-full rounded-xl overflow-hidden relative ${screenColor}`}>
                    {children}
                </div>
            </div>
        );
    }
    if (type === 'web') {
         return (
            <div className={`w-full max-w-xl h-96 rounded-t-lg shadow-2xl transition-colors duration-300 ${frameColor}`}>
                <div className="h-8 flex items-center px-3 space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className={`w-full h-[calc(100%-2rem)] overflow-hidden ${screenColor}`}>
                    {children}
                </div>
            </div>
        )
    }
    return <>{children}</>;
};

type WatermarkPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type CaptionStyle = 'modern' | 'classic' | 'funky';

const defaultWatermarkState = {
    type: 'text' as 'text' | 'image',
    text: 'ClipYube',
    font: 'Oswald',
    fontSize: 48,
    color: '#ffffff',
    opacity: 0.7,
    imageFile: null as File | null,
    imageUrl: null as string | null,
    scale: 0.2,
    position: 'bottom-right' as WatermarkPosition,
};

const videoStyles = [
    { name: 'Cinematic', description: 'Dramatic, high-contrast lighting and wide shots.' },
    { name: 'Animation', description: 'A vibrant, stylized animated look.' },
    { name: 'Documentary', description: 'Realistic, steady-cam footage feel.' },
    { name: 'Hyper-realistic', description: 'Extremely detailed, sharp, and lifelike visuals.' },
    { name: 'Time-lapse', description: 'Fast-forwarded motion, showing change over time.' },
    { name: 'Vlog', description: 'Handheld, personal, and conversational style.' },
];


// Define a unified state for the history stack
interface HistoryState {
    id: string; // Unique ID for React keys
    imageUrl: string;
    imageFile: File | null;
    prompt: string;
    activeFilter: string;
    adjustments: typeof defaultAdjustments;
    action: string;
}

const defaultEffects = {
    stroke: { color: '#ffffff', width: 0 },
    shadow: { color: 'rgba(0,0,0,0.5)', blur: 0, offsetX: 0, offsetY: 0 },
};

const MotionImg = motion.img;

const HistoryPanel: React.FC<{
    history: HistoryState[];
    currentIndex: number;
    onJump: (index: number) => void;
    onClone: (index: number) => void;
}> = ({ history, currentIndex, onJump, onClone }) => {
    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const currentItem = listRef.current?.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement;
        if (currentItem) {
            currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentIndex]);

    return (
        <div ref={listRef} className="max-h-96 overflow-y-auto space-y-2 pr-2 -mr-2">
            {history.map((state, index) => (
                <motion.div
                    key={state.id}
                    data-index={index}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${currentIndex === index ? 'bg-cyan-500/20' : 'hover:bg-white/10'}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                    <button onClick={() => onJump(index)} className="flex items-center gap-3 flex-grow text-left min-w-0 group">
                        <div className="relative w-10 h-10 flex-shrink-0">
                             <img src={state.imageUrl} alt={state.action} className="w-full h-full object-cover rounded-md border border-white/10" />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <p className={`text-sm truncate font-medium ${currentIndex === index ? 'text-cyan-300' : 'text-slate-200'}`}>{state.action}</p>
                             <p className="text-xs text-slate-500">Step {index + 1}</p>
                        </div>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClone(index); }}
                        className="flex-shrink-0 p-2 rounded-full text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                        title="Clone this step to start a new branch"
                        aria-label={`Clone step ${index + 1}`}
                    >
                        <CloneIcon />
                    </button>
                </motion.div>
            ))}
            {history.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Your edit history will appear here.</p>
            )}
        </div>
    );
};


export const ImageEditor: React.FC = () => {
    const { automation, clearAutomation } = useAppContext();
    const { settings } = useSettings();
    const [prompt, setPrompt] = useState<string>(''); // Prompt is transient UI state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('aspect-square');
    const [quality, setQuality] = useState<string>('Medium');
    const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
    
    // Unified history state management
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

    // Get the current state from history
    const currentHistoryState = useMemo(() => history[currentHistoryIndex] || null, [history, currentHistoryIndex]);
    
    // Transient UI state for adjustments before they are committed to history
    const [transientAdjustments, setTransientAdjustments] = useState(defaultAdjustments);

    // Cropping state
    const [isCropping, setIsCropping] = useState<boolean>(false);
    const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [cropStartPoint, setCropStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [cropAspectRatio, setCropAspectRatio] = useState<string>('free');
    const cropOverlayRef = useRef<HTMLDivElement>(null);

    // Zoom and Pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    
    // Active tool state
    const [activeTool, setActiveTool] = useState<Tool | null>(null);

    // Custom Filters state
    const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);

    // Download options state
    const [showDownloadOptions, setShowDownloadOptions] = useState<boolean>(false);
    const [exportOptions, setExportOptions] = useState({ format: 'image/png', quality: 0.92, size: 'original' as 'original' | '1200x1200' | '1080x1920' });

    // Color Splash state
    const [splashMode, setSplashMode] = useState<'picker' | 'prompt'>('picker');
    const [splashColor, setSplashColor] = useState<string>('#ff0000');
    const [splashTolerance, setSplashTolerance] = useState<number>(20);
    const [splashPreviewUrl, setSplashPreviewUrl] = useState<string | null>(null);
    const [isApplyingSplash, setIsApplyingSplash] = useState<boolean>(false);
    const [splashPrompt, setSplashPrompt] = useState<string>('');
    const [isGeneratingSplash, setIsGeneratingSplash] = useState<boolean>(false);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null); // Still needed for splash prompt preview

    // Effects State
    const [effects, setEffects] = useState(defaultEffects);
    const [hasPendingEffects, setHasPendingEffects] = useState(false);

    // Style Transfer state
    const [showStyleTransfer, setShowStyleTransfer] = useState<boolean>(false);
    const [styleImage, setStyleImage] = useState<File | null>(null);
    const [styleImageUrl, setStyleImageUrl] = useState<string | null>(null);
    const [isApplyingStyle, setIsApplyingStyle] = useState<boolean>(false);
    const styleFileInputRef = useRef<HTMLInputElement>(null);

    // Device Preview state
    const [devicePreview, setDevicePreview] = useState<{ type: string; theme: string } | null>(null);

    // Video Generation State
    const [videoPrompt, setVideoPrompt] = useState<string>('');
    const [videoStyle, setVideoStyle] = useState<string>('Cinematic');
    const [isVideoGenerating, setIsVideoGenerating] = useState<boolean>(false);
    const [videoGenerationProgress, setVideoGenerationProgress] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [caption, setCaption] = useState<{ text: string; style: CaptionStyle } | null>(null);
    const [videoPresets, setVideoPresets] = useState<VideoPreset[]>([]);

    // Watermark State
    const [watermark, setWatermark] = useState({ ...defaultWatermarkState, ...settings.watermarkDefaults });
    const [watermarkImgElement, setWatermarkImgElement] = useState<HTMLImageElement | null>(null);
    const watermarkImageInputRef = useRef<HTMLInputElement>(null);
    const [watermarkPersistence, setWatermarkPersistence] = useState<'session' | 'persistent'>('session');

    // Brush Tool State
    const [brushSettings, setBrushSettings] = useState({ color: '#ff0000', size: 10, opacity: 1 });
    const [isDrawing, setIsDrawing] = useState(false);
    const lastDrawingPointRef = useRef<{ x: number, y: number } | null>(null);
    const [brushHistory, setBrushHistory] = useState<string[]>([]);
    const [brushHistoryIndex, setBrushHistoryIndex] = useState<number>(-1);

    // Image Search state
    const [imageSearchQuery, setImageSearchQuery] = useState<string>('');
    const [imageSearchResults, setImageSearchResults] = useState<string[]>([]);
    const [isSearchingImages, setIsSearchingImages] = useState<boolean>(false);


    // Mock for paid feature
    const [isPaidSubscriber, setIsPaidSubscriber] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadStateInputRef = useRef<HTMLInputElement>(null);
    const mainImageRef = useRef<HTMLImageElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Update transient adjustment state when history changes
    useEffect(() => {
        if (currentHistoryState) {
            setTransientAdjustments(currentHistoryState.adjustments);
        }
    }, [currentHistoryState]);

     // Apply settings defaults to watermark when tool is opened
    useEffect(() => {
        if (activeTool === 'watermark' && watermark.type === 'text') {
            setWatermark(prev => ({ ...prev, ...settings.watermarkDefaults }));
        }
    }, [activeTool, settings.watermarkDefaults, watermark.type]);

    // Handle automation commands from parent
    useEffect(() => {
        if (automation?.type === 'video') {
            setTimeout(() => {
                setActiveTool('video');
                setVideoPrompt(automation.prompt);
                const videoToolPanel = document.getElementById('panel-content-Generate-Video');
                videoToolPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            clearAutomation();
        }
    }, [automation, clearAutomation]);


    const updateHistory = useCallback((newState: Partial<HistoryState>, action: string) => {
        const currentState = history[currentHistoryIndex];
        // If there's no state, we can't update. This should only happen if called before an image is loaded.
        if (!currentState && history.length > 0) {
             console.error("Attempted to update history without a current valid state. This is a bug.");
             return;
        }
        
        const newHistoryState: HistoryState = {
            ...(currentState || {}), // Start with current or empty object
            ...newState,
            action,
            id: `hist-${Date.now()}-${Math.random()}`
        } as HistoryState;

        const newHistory = [...history.slice(0, currentHistoryIndex + 1), newHistoryState];
        
        setHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    }, [history, currentHistoryIndex]);

    // Debounced function to commit adjustment changes to history
    const debouncedUpdateHistoryForAdjustments = useDebouncedCallback((newAdjustments: typeof defaultAdjustments) => {
        updateHistory({ adjustments: newAdjustments }, "Adjustments");
    }, 300);

    const handleAdjustmentChange = (key: keyof typeof defaultAdjustments, value: number) => {
        const newAdjustments = { ...transientAdjustments, [key]: value };
        setTransientAdjustments(newAdjustments);
        debouncedUpdateHistoryForAdjustments(newAdjustments);
    };

    const handleEffectsChange = (type: 'stroke' | 'shadow', key: string, value: any) => {
        setEffects(prev => ({
            ...prev,
            [type]: { ...prev[type], [key]: value }
        }));
        setHasPendingEffects(true);
    };

    const applyCanvasFilter = useCallback(async (filterName: string) => {
        if (!currentHistoryState?.imageUrl) return;

        setLoadingMessage(`Applying ${filterName} filter...`);
        setIsLoading(true);
        setError(null);

        try {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = currentHistoryState.imageUrl;

            await new Promise<void>((resolve, reject) => {
                image.onload = async () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = image.naturalWidth;
                        canvas.height = image.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return reject(new Error("Canvas context failed"));

                        ctx.drawImage(image, 0, 0);

                        // Apply effect
                        if (filterName === 'vignette') {
                            const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/3, canvas.width/2, canvas.height/2, canvas.width/1.5);
                            gradient.addColorStop(0, 'rgba(0,0,0,0)');
                            gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        } else if (filterName === 'scanlines') {
                             for (let i = 0; i < canvas.height; i += 4) {
                                ctx.fillStyle = 'rgba(0, 0, 0, .15)';
                                ctx.fillRect(0, i, canvas.width, 2);
                            }
                        } else if (filterName === 'grain') {
                             const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                             const data = imageData.data;
                             for (let i = 0; i < data.length; i += 4) {
                                 const grain = (Math.random() - 0.5) * 40;
                                 data[i] += grain;
                                 data[i + 1] += grain;
                                 data[i + 2] += grain;
                             }
                             ctx.putImageData(imageData, 0, 0);
                        } else if (filterName === 'halftone') {
                            // Simplified halftone effect
                            const size = 6;
                             for (let y = 0; y < canvas.height; y += size) {
                                for (let x = 0; x < canvas.width; x += size) {
                                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                                    const brightness = (pixel[0]*0.299 + pixel[1]*0.587 + pixel[2]*0.114) / 255;
                                    ctx.fillStyle = 'rgba(0,0,0,0.8)';
                                    ctx.beginPath();
                                    ctx.arc(x + size/2, y + size/2, (size/2) * (1 - brightness), 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                        }

                        const newDataUrl = canvas.toDataURL('image/png');
                        const newFile = await dataUrlToFile(newDataUrl, `${filterName}-effect.png`);
                        updateHistory({ imageUrl: newDataUrl, imageFile: newFile, activeFilter: 'none' }, `Canvas: ${filterName}`);
                        resolve();
                    } catch (e) { reject(e); }
                };
                image.onerror = () => reject(new Error("Failed to load image for canvas filter"));
            });
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Canvas Filter'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [currentHistoryState, updateHistory]);

    const handleFilterChange = (filter: EditorFilter) => {
        if (filter.type === 'css') {
            updateHistory({ activeFilter: filter.value }, `Filter: ${filter.name}`);
        } else {
            applyCanvasFilter(filter.value);
        }
    };

    // Load state from localStorage on component mount
    useEffect(() => {
        const loadState = async () => {
            try {
                const savedStateJSON = localStorage.getItem(EDITOR_STATE_KEY);
                if (savedStateJSON) {
                    const savedState = JSON.parse(savedStateJSON);
                    
                    if (savedState.imageUrl || savedState.currentImageUrl) {
                        const imageUrlToLoad = savedState.imageUrl || savedState.currentImageUrl;
                        const imageFile = await dataUrlToFile(imageUrlToLoad, 'restored-image.png');
                        const initialState: HistoryState = {
                            id: `hist-loaded-${Date.now()}`,
                            imageUrl: imageUrlToLoad,
                            imageFile: imageFile,
                            prompt: savedState.prompt || '',
                            activeFilter: savedState.activeFilter || 'none',
                            adjustments: savedState.adjustments || defaultAdjustments,
                            action: 'Session Restored',
                        };
                        setHistory([initialState]);
                        setCurrentHistoryIndex(0);
                        setPrompt(initialState.prompt);
                        setQuality(savedState.quality || 'Medium');
                        setActiveTool('ai-edit');
                    }
                }
                const savedFiltersJSON = localStorage.getItem(CUSTOM_FILTERS_KEY);
                if (savedFiltersJSON) setCustomFilters(JSON.parse(savedFiltersJSON));
                const savedPresetsJSON = localStorage.getItem(VIDEO_PRESETS_KEY);
                if (savedPresetsJSON) setVideoPresets(JSON.parse(savedPresetsJSON));
            } catch (e) {
                console.error("Failed to load state from localStorage", e);
                localStorage.removeItem(EDITOR_STATE_KEY);
                localStorage.removeItem(CUSTOM_FILTERS_KEY);
                localStorage.removeItem(VIDEO_PRESETS_KEY);
            }
        };
        loadState();
    }, []);

    // Enhanced auto-save
    useEffect(() => {
        if (!currentHistoryState) return;
        const saveState = () => {
            const { imageFile, ...stateToSave } = currentHistoryState;
            try {
                localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify({...stateToSave, quality}));
            } catch (e) {
                console.error("Failed to save state to localStorage", e);
                if (e instanceof Error && e.name === 'QuotaExceededError') {
                    console.warn("LocalStorage quota exceeded. Cannot save current state.");
                }
            }
        };
        const debounceTimeout = setTimeout(saveState, 500);
        return () => clearTimeout(debounceTimeout);
    }, [currentHistoryState, quality]);
    
    useEffect(() => {
        try { localStorage.setItem(CUSTOM_FILTERS_KEY, JSON.stringify(customFilters)); } 
        catch (e) { console.error("Failed to save custom filters", e); }
    }, [customFilters]);

    useEffect(() => {
        try { localStorage.setItem(VIDEO_PRESETS_KEY, JSON.stringify(videoPresets)); }
        catch (e) { console.error("Failed to save video presets", e); }
    }, [videoPresets]);


    const aspectRatios = [
        { label: '1:1', value: 'aspect-square' },
        { label: '16:9', value: 'aspect-video' },
        { label: '4:3', value: 'aspect-[4/3]' },
        { label: '3:4', value: 'aspect-[3/4]' },
        { label: '9:16', value: 'aspect-[9/16]' },
    ];

    const qualityOptions = ['Low', 'Medium', 'High'];

    const processFile = (file: File) => {
        if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            handleReset(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                const imageUrl = reader.result as string;
                const initialState: HistoryState = {
                    id: `hist-init-${Date.now()}`,
                    imageUrl,
                    imageFile: file,
                    prompt: '',
                    activeFilter: 'none',
                    adjustments: defaultAdjustments,
                    action: 'Image Loaded'
                };
                setHistory([initialState]);
                setCurrentHistoryIndex(0);
                setError(null);
                setActiveTool('ai-edit');
            };
            reader.readAsDataURL(file);
        } else {
            setError("Invalid file type. Please upload a PNG, JPG, or WEBP file.");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDraggingOver) setIsDraggingOver(true);
    };
    
    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(false);
    };
    
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const isCurrentStateAdjusted = useMemo(() => {
      if (!currentHistoryState) return false;
      return currentHistoryState.activeFilter !== 'none' ||
             Object.keys(defaultAdjustments).some(key => currentHistoryState.adjustments[key as keyof typeof defaultAdjustments] !== defaultAdjustments[key as keyof typeof defaultAdjustments]);
    }, [currentHistoryState]);

    const bakeAndCommitEffects = useCallback(async (): Promise<Pick<HistoryState, 'imageUrl' | 'imageFile'>> => {
        if (!currentHistoryState || !isCurrentStateAdjusted) {
             return { imageUrl: currentHistoryState!.imageUrl, imageFile: currentHistoryState!.imageFile };
        }

        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = currentHistoryState.imageUrl;

        return new Promise((resolve, reject) => {
            image.onload = async () => {
                try {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = image.naturalWidth;
                    tempCanvas.height = image.naturalHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (!tempCtx) return reject(new Error("Could not create canvas context"));

                    tempCtx.filter = `
                        brightness(${currentHistoryState.adjustments.brightness}) 
                        contrast(${currentHistoryState.adjustments.contrast}) 
                        saturate(${currentHistoryState.adjustments.saturation}) 
                        hue-rotate(${currentHistoryState.adjustments.hue}deg)
                        ${currentHistoryState.activeFilter !== 'none' ? currentHistoryState.activeFilter : ''}
                    `.trim();
                    tempCtx.drawImage(image, 0, 0);
                    
                    const newDataUrl = tempCanvas.toDataURL('image/png');
                    const newFile = await dataUrlToFile(newDataUrl, 'baked-image.png');
                    
                    resolve({ imageUrl: newDataUrl, imageFile: newFile });

                } catch (e) { reject(e); }
            };
            image.onerror = () => reject(new Error("Failed to load image for baking effects."));
        });
    }, [currentHistoryState, isCurrentStateAdjusted]);

    const handleGenerate = useCallback(async () => {
        if (!currentHistoryState?.imageFile || !prompt.trim()) {
            setError('Please upload an image and enter a prompt.');
            return;
        }

        setLoadingMessage('Applying AI edit...');
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setCaption(null);

        try {
            const { imageFile: bakedImageFile } = await bakeAndCommitEffects();
            if (!bakedImageFile) throw new Error("Could not prepare image for AI generation.");
            
            const base64Data = await fileToBase64(bakedImageFile);
            
            let finalPrompt = prompt.trim();
            if (quality === 'Low') finalPrompt += ', low quality, low resolution.';
            else if (quality === 'High') finalPrompt += ', high quality, 4k resolution, sharp details.';

            const resultUrl = await editImageWithPrompt(base64Data, bakedImageFile.type, finalPrompt);
            const resultFile = await dataUrlToFile(resultUrl, 'edited-image.png');
            
            updateHistory({ 
                imageUrl: resultUrl, 
                imageFile: resultFile, 
                prompt: prompt,
                activeFilter: 'none',
                adjustments: defaultAdjustments
            }, `AI: "${prompt.substring(0, 15)}..."`);

        } catch (err) {
            console.error("AI Generation Error:", err);
            setError(getFriendlyErrorMessage(err, 'Image Editing'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [currentHistoryState, prompt, quality, bakeAndCommitEffects, updateHistory]);
    
    const handleRemoveBackground = useCallback(async () => {
        if (!currentHistoryState?.imageFile) {
            setError('Please upload an image first.');
            return;
        }

        setLoadingMessage('Removing background...');
        setIsLoading(true);
        setError(null);

        try {
            const { imageFile: bakedImageFile } = await bakeAndCommitEffects();
            if (!bakedImageFile) {
                throw new Error("Could not prepare image for background removal.");
            }
            
            const base64Data = await fileToBase64(bakedImageFile);
            const resultUrl = await removeImageBackground(base64Data, bakedImageFile.type);
            const resultFile = await dataUrlToFile(resultUrl, 'bg-removed-image.png');
            
            updateHistory({ 
                imageUrl: resultUrl, 
                imageFile: resultFile,
                activeFilter: 'none',
                adjustments: defaultAdjustments
            }, "BG Removal");

        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Background Removal'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [currentHistoryState, bakeAndCommitEffects, updateHistory]);

    const handleUpscale = useCallback(async () => {
        if (!currentHistoryState?.imageFile) {
            setError('Please upload an image first.');
            return;
        }

        setLoadingMessage('Upscaling image (2x)...');
        setIsLoading(true);
        setError(null);

        try {
            const { imageFile: bakedImageFile } = await bakeAndCommitEffects();
            if (!bakedImageFile) {
                throw new Error("Could not prepare image for upscaling.");
            }
            
            const base64Data = await fileToBase64(bakedImageFile);
            const resultUrl = await upscaleImage(base64Data, bakedImageFile.type, 2); // Hardcode 2x for now
            const resultFile = await dataUrlToFile(resultUrl, 'upscaled-image.png');
            
            updateHistory({ 
                imageUrl: resultUrl, 
                imageFile: resultFile,
                activeFilter: 'none',
                adjustments: defaultAdjustments
            }, "Upscale 2x");

        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Image Upscaling'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [currentHistoryState, bakeAndCommitEffects, updateHistory]);

    const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && !isLoading && prompt.trim() && !isCropping) {
            event.preventDefault();
            handleGenerate();
        }
    };

    const resetZoomAndPan = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const handleReset = (isNewImage = false) => {
        setPrompt('');
        setError(null);
        setIsLoading(false);
        setQuality('Medium');
        setIsCropping(false);
        setCrop(null);
        setCropAspectRatio('free');
        resetZoomAndPan();
        setActiveTool(null);
        setSplashPreviewUrl(null);
        setDevicePreview(null);
        setGeneratedVideoUrl(null);
        setIsVideoGenerating(false);
        setVideoPrompt('');
        setCaption(null);
        setEffects(defaultEffects);
        setHasPendingEffects(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
        
        if (!isNewImage) {
            setHistory([]);
            setCurrentHistoryIndex(-1);
            try { localStorage.removeItem(EDITOR_STATE_KEY); } 
            catch (e) { console.error("Failed to clear state from localStorage", e); }
        }
    };

    const handleSaveProject = useCallback(() => {
        if (!currentHistoryState) {
            alert("No active project to save.");
            return;
        }
        
        // Flush pending adjustments if any
        debouncedUpdateHistoryForAdjustments.flush();

        // Serialize history excluding File objects which are not stringifiable
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const serializedHistory = history.map(({ imageFile, ...rest }) => rest);

        const projectData = {
            version: 2,
            history: serializedHistory,
            currentIndex: currentHistoryIndex,
            prompt,
            quality,
            // Keep legacy fields for backward compatibility if loaded by older versions
            imageUrl: currentHistoryState.imageUrl,
            activeFilter: currentHistoryState.activeFilter,
            adjustments: currentHistoryState.adjustments
        };

        try {
            localStorage.setItem(SAVED_PROJECT_KEY, JSON.stringify(projectData));
            alert("Project saved to local storage!");
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save project. The image might be too large for your browser's storage.");
        }
    }, [currentHistoryState, history, currentHistoryIndex, prompt, quality, debouncedUpdateHistoryForAdjustments]);

    const handleLoadProject = useCallback(async () => {
        const savedJSON = localStorage.getItem(SAVED_PROJECT_KEY);
        if (!savedJSON) {
            alert("No saved project found.");
            return;
        }

        if (currentHistoryState && !window.confirm("This will overwrite your current work. Continue?")) {
            return;
        }

        setIsLoading(true);
        setLoadingMessage("Loading project...");

        try {
            const projectData = JSON.parse(savedJSON);
            let restoredHistory: HistoryState[] = [];
            let restoredIndex = 0;

            if (projectData.version === 2 && Array.isArray(projectData.history)) {
                // Restore full history from V2 format
                restoredHistory = await Promise.all(projectData.history.map(async (item: any) => {
                    const file = await dataUrlToFile(item.imageUrl, `restored-${item.id}.png`);
                    return {
                        ...item,
                        imageFile: file
                    } as HistoryState;
                }));
                restoredIndex = projectData.currentIndex ?? (restoredHistory.length - 1);
            } else {
                // Fallback: Restore legacy single-state format
                const file = await dataUrlToFile(projectData.imageUrl, 'project.png');
                const newState: HistoryState = {
                    id: `hist-loaded-${Date.now()}`,
                    imageUrl: projectData.imageUrl,
                    imageFile: file,
                    prompt: projectData.prompt || '',
                    activeFilter: projectData.activeFilter || 'none',
                    adjustments: projectData.adjustments || defaultAdjustments,
                    action: 'Project Loaded'
                };
                restoredHistory = [newState];
                restoredIndex = 0;
            }

            handleReset(true);

            setHistory(restoredHistory);
            setCurrentHistoryIndex(restoredIndex);
            setPrompt(projectData.prompt || '');
            setQuality(projectData.quality || 'Medium');
            setActiveTool('ai-edit');
            
        } catch (e) {
            console.error("Load failed", e);
            alert("Failed to load project data.");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    }, [currentHistoryState]);

    const drawWatermarkOnContext = (
        ctx: CanvasRenderingContext2D,
        bounds: { width: number; height: number; x?: number; y?: number },
        settings: typeof defaultWatermarkState,
        watermarkImageElement: HTMLImageElement | null
    ) => {
        const { width, height, x = 0, y = 0 } = bounds;
        const { type, text, font, fontSize, color, opacity, scale, position } = settings;
        const margin = Math.max(10, width * 0.02);
    
        ctx.save();
        ctx.globalAlpha = opacity;
    
        let itemWidth: number, itemHeight: number;
        let drawX: number, drawY: number;
    
        if (type === 'text') {
            ctx.font = `700 ${fontSize}px ${font}, sans-serif`;
            ctx.fillStyle = color;
            const textMetrics = ctx.measureText(text);
            itemWidth = textMetrics.width;
            itemHeight = fontSize; // Approximate height
        } else if (type === 'image' && watermarkImageElement) {
            itemWidth = watermarkImageElement.naturalWidth * scale;
            itemHeight = watermarkImageElement.naturalHeight * scale;
        } else {
            ctx.restore();
            return;
        }
    
        // Horizontal alignment
        if (position.endsWith('left')) {
            drawX = x + margin;
        } else if (position.endsWith('center') || position === 'center') {
            drawX = x + (width - itemWidth) / 2;
        } else { // right
            drawX = x + width - itemWidth - margin;
        }

        // Vertical alignment
        if (position.startsWith('top')) {
            drawY = y + margin;
        } else if (position.startsWith('center') || position === 'center') {
            drawY = y + (height - itemHeight) / 2;
        } else { // bottom
            drawY = y + height - itemHeight - margin;
        }

        if (type === 'text') {
            ctx.textBaseline = 'top';
            ctx.fillText(text, drawX, drawY);
        } else if (type === 'image' && watermarkImageElement) {
            ctx.drawImage(watermarkImageElement, drawX, drawY, itemWidth, itemHeight);
        }
        ctx.restore();
    };

    const handleTryExample = async (imageUrl: string, examplePrompt: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], "example.jpg", { type: "image/jpeg" });
            processFile(file);
            setPrompt(examplePrompt);
        } catch (error) {
            console.error("Failed to load example image:", error);
            setError("Could not load the example image. Please check your network connection.");
        }
    };

    const handleUndo = () => {
        if (currentHistoryIndex > 0) {
            setCurrentHistoryIndex(currentHistoryIndex - 1);
        }
    };

    const handleRedo = () => {
        if (currentHistoryIndex < history.length - 1) {
            setCurrentHistoryIndex(currentHistoryIndex + 1);
        }
    };

    const handleCloneHistoryState = (indexToClone: number) => {
        if (indexToClone < 0 || indexToClone >= history.length) return;

        const stateToClone = history[indexToClone];
        
        const clonedState: HistoryState = {
            ...stateToClone,
            id: `hist-cloned-${Date.now()}`,
            action: `Cloned: "${stateToClone.action.substring(0, 20)}..."`
        };

        // Create a new branch from the current point, discarding any "redo" steps
        const newHistory = [...history.slice(0, currentHistoryIndex + 1), clonedState];
        setHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    };
    
    const handleVideoGenerate = useCallback(async () => {
        if (!videoPrompt.trim()) {
            setError('Please enter a prompt for the video.');
            return;
        }
        if (!currentHistoryState?.imageFile) {
            setError('An image is required to generate a video with Runway.');
            return;
        }
    
        setIsVideoGenerating(true);
        setVideoGenerationProgress('Initializing video generation...');
        setError(null);
        setGeneratedVideoUrl(null);
    
        try {
            let fullVideoPrompt = videoPrompt;
            if (videoStyle && videoStyle !== 'Custom') {
                const styleInfo = videoStyles.find(s => s.name === videoStyle);
                if (styleInfo) {
                    fullVideoPrompt = `${videoPrompt}. Style: ${styleInfo.description}`;
                }
            }
    
            if (caption?.text) {
                fullVideoPrompt += ` With caption text: "${caption.text}"`;
            }
    
            const { imageFile: bakedImageFile } = await bakeAndCommitEffects();
            if (!bakedImageFile) {
                throw new Error("Could not prepare image for video generation.");
            }
            const imageBase64 = await fileToBase64(bakedImageFile);
            const imageMimeType = bakedImageFile.type;
            
            const videoUrl = await generateVideoWithRunway(
                fullVideoPrompt,
                imageBase64,
                imageMimeType,
                videoAspectRatio,
                setVideoGenerationProgress
            );
            setGeneratedVideoUrl(videoUrl);
    
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Video Generation'));
        } finally {
            setIsVideoGenerating(false);
            setVideoGenerationProgress('');
        }
    }, [videoPrompt, videoStyle, currentHistoryState, videoAspectRatio, caption, bakeAndCommitEffects]);

    // Image Search Logic
    const handleImageSearch = async () => {
        if (!imageSearchQuery.trim()) {
            setError('Please enter a search query.');
            return;
        }
        setIsSearchingImages(true);
        setError(null);
        setImageSearchResults([]);
        try {
            const results = await searchImages(imageSearchQuery);
            if (results.length === 0) {
                setError('No images found for your query.');
            }
            setImageSearchResults(results);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Image Search'));
        } finally {
            setIsSearchingImages(false);
        }
    };

    const handleSelectSearchedImage = async (base64Data: string) => {
        const dataUrl = `data:image/jpeg;base64,${base64Data}`;
        const file = await dataUrlToFile(dataUrl, 'searched-image.jpeg');
        processFile(file);
        setActiveTool(null);
    };

    // Brush Tool Logic
    const handleClearBrush = useCallback(() => {
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setBrushHistory([]);
        setBrushHistoryIndex(-1);
    }, []);

    useEffect(() => {
        const canvas = drawingCanvasRef.current;
        const image = mainImageRef.current;
        if (canvas && image) {
            const setCanvasSize = () => {
                if(image.naturalWidth > 0) {
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    handleClearBrush(); // Clear brush history when image changes
                }
            };

            if (image.complete) {
                setCanvasSize();
            } else {
                image.addEventListener('load', setCanvasSize);
                return () => image.removeEventListener('load', setCanvasSize);
            }
        }
    }, [currentHistoryState?.id, handleClearBrush]);

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number, y: number } | null => {
        const canvas = drawingCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        return { x, y };
    }

    const handleDrawingStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = drawingCanvasRef.current;
        if (!canvas || !toolIsActive('brush')) return;
        const ctx = canvas.getContext('2d');
        const pos = getCanvasCoordinates(e);
        if (!ctx || !pos) return;

        setIsDrawing(true);
        lastDrawingPointRef.current = pos;

        ctx.beginPath();
        ctx.lineWidth = brushSettings.size * (canvas.width / canvas.getBoundingClientRect().width); // Scale brush size
        ctx.strokeStyle = brushSettings.color;
        ctx.globalAlpha = brushSettings.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(pos.x, pos.y);
    };

    const handleDrawingMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !toolIsActive('brush')) return;
        const canvas = drawingCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        const pos = getCanvasCoordinates(e);
        if (!ctx || !pos) return;

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastDrawingPointRef.current = pos;
    };

    const handleDrawingEnd = () => {
        const canvas = drawingCanvasRef.current;
        if (!canvas || !isDrawing) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.closePath();
        setIsDrawing(false);

        // Save state for undo/redo
        const newUrl = canvas.toDataURL();
        if (brushHistory[brushHistoryIndex] === newUrl) return;

        const newHistory = brushHistory.slice(0, brushHistoryIndex + 1);

        if (newHistory.length === 0) {
            // Add the initial empty state before the first stroke
            const emptyCanvas = document.createElement('canvas');
            emptyCanvas.width = canvas.width;
            emptyCanvas.height = canvas.height;
            newHistory.push(emptyCanvas.toDataURL());
        }

        newHistory.push(newUrl);
        setBrushHistory(newHistory);
        setBrushHistoryIndex(newHistory.length - 1);
    };
    
    const restoreBrushState = useCallback((index: number) => {
        const canvas = drawingCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !brushHistory[index]) return;

        const imageUrl = brushHistory[index];
        const image = new Image();
        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0);
        };
        image.src = imageUrl;
    }, [brushHistory]);

    const handleBrushUndo = () => {
        if (brushHistoryIndex > 0) {
            const newIndex = brushHistoryIndex - 1;
            setBrushHistoryIndex(newIndex);
            restoreBrushState(newIndex);
        }
    };

    const handleBrushRedo = () => {
        if (brushHistoryIndex < brushHistory.length - 1) {
            const newIndex = brushHistoryIndex + 1;
            setBrushHistoryIndex(newIndex);
            restoreBrushState(newIndex);
        }
    };

    const handleApplyBrush = async () => {
        if (!currentHistoryState?.imageUrl || !drawingCanvasRef.current) return;
        
        setIsLoading(true);
        setLoadingMessage('Applying brush strokes...');
        setError(null);

        try {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = currentHistoryState.imageUrl;

            await new Promise<void>((resolve, reject) => {
                image.onload = async () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = image.naturalWidth;
                        canvas.height = image.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return reject(new Error("Canvas context failed"));

                        ctx.drawImage(image, 0, 0);
                        ctx.drawImage(drawingCanvasRef.current!, 0, 0);

                        const newDataUrl = canvas.toDataURL('image/png');
                        const newFile = await dataUrlToFile(newDataUrl, 'brushed-image.png');

                        updateHistory({ imageUrl: newDataUrl, imageFile: newFile }, "Brush Applied");
                        handleClearBrush();
                        resolve();

                    } catch (e) { reject(e); }
                };
                image.onerror = () => reject(new Error("Failed to load image for applying brush strokes"));
            });
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Brush Tool'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };


    const toolIsActive = (tool: Tool) => activeTool === tool;
    const toggleTool = (tool: Tool) => setActiveTool(activeTool === tool ? null : tool);
    
    const toolButtonClasses = (tool: Tool) => 
        `p-2 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center text-xs w-full h-16 text-center
        ${toolIsActive(tool) ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`;


    if (!currentHistoryState) {
         return (
            <div className="max-w-4xl mx-auto text-center p-4">
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-10 transition-colors duration-300 ${isDraggingOver ? 'border-cyan-500 bg-slate-800/50' : 'border-slate-700'}`}
                >
                    <UploadIcon />
                    <h3 className="mt-4 text-2xl font-semibold text-white">Drag & Drop an Image</h3>
                    <p className="mt-1 text-slate-400">or</p>
                    <button onClick={() => fileInputRef.current?.click()} className="mt-2 bg-cyan-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-cyan-400 transition-colors">
                        Browse Files
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                </div>
                <div className="mt-12">
                     <ExampleCarousel onTryExample={handleTryExample} />
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col xl:flex-row gap-4 md:gap-8">
            {/* Main content: Image Preview */}
            <div className="flex-grow flex flex-col gap-4">
                 <div className="flex items-center justify-between gap-2 p-2 bg-slate-900/40 rounded-xl">
                    <div className="flex items-center gap-2">
                         <button onClick={handleUndo} disabled={currentHistoryIndex <= 0} className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"><UndoIcon/></button>
                         <button onClick={handleRedo} disabled={currentHistoryIndex >= history.length - 1} className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"><RedoIcon/></button>
                    </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setZoom(z => z * 1.2)} className="p-2 rounded-md hover:bg-white/10"><PlusIcon/></button>
                        <button onClick={() => setZoom(z => z / 1.2)} className="p-2 rounded-md hover:bg-white/10"><MinusIcon/></button>
                        <button onClick={resetZoomAndPan} className="p-2 rounded-md hover:bg-white/10"><ResetZoomIcon/></button>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={handleSaveProject} className="p-2 rounded-md hover:bg-white/10" title="Save Project" aria-label="Save Project"><SaveIcon/></button>
                        <button onClick={handleLoadProject} className="p-2 rounded-md hover:bg-white/10" title="Load Project" aria-label="Load Project"><LoadIcon/></button>
                     </div>
                </div>
                <div ref={imageContainerRef} className="relative w-full aspect-square bg-black/30 rounded-2xl overflow-hidden flex items-center justify-center">
                    <AnimatePresence>
                         <MotionImg
                            ref={mainImageRef}
                            key={currentHistoryState.id}
                            src={currentHistoryState.imageUrl}
                            alt="Editable asset"
                            className="max-w-full max-h-full object-contain pointer-events-none"
                            style={{
                                filter: `
                                    brightness(${transientAdjustments.brightness}) 
                                    contrast(${transientAdjustments.contrast}) 
                                    saturate(${transientAdjustments.saturation}) 
                                    hue-rotate(${transientAdjustments.hue}deg)
                                    ${currentHistoryState.activeFilter !== 'none' ? currentHistoryState.activeFilter : ''}
                                `,
                                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                             }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                         />
                    </AnimatePresence>
                    <canvas
                        ref={drawingCanvasRef}
                        className={`absolute top-0 left-0 w-full h-full ${toolIsActive('brush') ? 'cursor-crosshair' : 'pointer-events-none'}`}
                        onMouseDown={handleDrawingStart}
                        onMouseMove={handleDrawingMove}
                        onMouseUp={handleDrawingEnd}
                        onMouseLeave={handleDrawingEnd}
                        style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
                    />
                    {isCropping && <div ref={cropOverlayRef} className="absolute top-0 left-0 border-2 border-dashed border-cyan-400 bg-cyan-400/20 pointer-events-none" />}
                    {caption && <div className={`caption-base caption-${caption.style}`}>{caption.text}</div>}
                    {devicePreview && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <DeviceFrame type={devicePreview.type} theme={devicePreview.theme}>
                                <img src={currentHistoryState.imageUrl} className="w-full h-full object-cover" />
                            </DeviceFrame>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar: Tools */}
            <div className="w-full xl:w-96 xl:max-w-sm flex-shrink-0 space-y-4">
                 <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center gap-4 mb-4">
                        <div className="flex gap-2">
                             {['Low', 'Medium', 'High'].map(q => (
                                <button key={q} onClick={() => setQuality(q)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${quality === q ? 'bg-cyan-500 text-black' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>{q}</button>
                            ))}
                        </div>
                        <button onClick={() => handleReset()} className="p-2 rounded-md hover:bg-red-500/20 text-slate-300"><TrashIcon/></button>
                    </div>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handlePromptKeyDown}
                        className="w-full h-24 p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
                        placeholder="Describe your edit... (e.g., 'add a cat wearing sunglasses')"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full flex items-center justify-center gap-2 mt-2 bg-cyan-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-cyan-400 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        {isLoading && !loadingMessage.includes('background') ? <><Loader /> {loadingMessage || 'Generating...'}</> : <><MagicWandIcon /> Generate</>}
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>

                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-200 mb-3 text-center">Tools</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => toggleTool('filters')} className={toolButtonClasses('filters')}>
                            <FilterIcon />
                            <span className="mt-1">Filters</span>
                        </button>
                        <button onClick={() => toggleTool('adjustments')} className={toolButtonClasses('adjustments')}>
                            <AdjustmentsIcon />
                            <span className="mt-1">Adjust</span>
                        </button>
                         <button onClick={() => toggleTool('brush')} className={toolButtonClasses('brush')}>
                            <BrushIcon />
                             <span className="mt-1">Brush</span>
                        </button>
                         <button onClick={() => toggleTool('image-search')} className={toolButtonClasses('image-search')}>
                            <SearchIcon />
                            <span className="mt-1">Search</span>
                        </button>
                        <button onClick={() => toggleTool('video')} className={toolButtonClasses('video')}>
                            <VideoIcon />
                             <span className="mt-1">Video</span>
                        </button>
                         <button onClick={() => toggleTool('history')} className={toolButtonClasses('history')}>
                            <HistoryIcon />
                             <span className="mt-1">History</span>
                        </button>
                        <button onClick={handleRemoveBackground} disabled={isLoading} className="p-2 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center text-xs w-full h-16 text-center bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading && loadingMessage.includes('background') ? <Loader/> : <BackgroundEraserIcon />}
                            <span className="mt-1">{isLoading && loadingMessage.includes('background') ? 'Erasing...' : 'BG Erase'}</span>
                        </button>
                        <button onClick={handleUpscale} disabled={isLoading} className="p-2 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center text-xs w-full h-16 text-center bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading && loadingMessage.includes('Upscaling') ? <Loader/> : <UpscaleIcon />}
                            <span className="mt-1">{isLoading && loadingMessage.includes('Upscaling') ? 'Upscaling...' : 'Upscale 2x'}</span>
                        </button>
                    </div>
                </div>

                <ToolOptionsPanel title="History" icon={<HistoryIcon />} isOpen={toolIsActive('history')} onToggle={() => toggleTool('history')}>
                    <HistoryPanel history={history} currentIndex={currentHistoryIndex} onJump={setCurrentHistoryIndex} onClone={handleCloneHistoryState} />
                </ToolOptionsPanel>

                <ToolOptionsPanel title="Filters" icon={<FilterIcon />} isOpen={toolIsActive('filters')} onToggle={() => toggleTool('filters')}>
                    <div className="grid grid-cols-3 gap-2">
                        {allFilters.map(filter => (
                            <button key={filter.name} onClick={() => handleFilterChange(filter)} className="text-center group">
                                <div className={`w-full aspect-square rounded-md bg-cover bg-center transition-all duration-200 group-hover:scale-105 ${currentHistoryState.activeFilter === filter.value ? 'ring-2 ring-cyan-400' : ''}`} style={{backgroundImage: `url(${currentHistoryState.imageUrl})`, filter: filter.type === 'css' ? filter.value : 'none'}}></div>
                                <span className="text-xs mt-1 block">{filter.name}</span>
                            </button>
                        ))}
                    </div>
                </ToolOptionsPanel>

                <ToolOptionsPanel title="Adjustments" icon={<AdjustmentsIcon />} isOpen={toolIsActive('adjustments')} onToggle={() => toggleTool('adjustments')}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
                                <span>Brightness</span>
                                <span className="font-mono text-xs">{((transientAdjustments.brightness - 1) * 100).toFixed(0)}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.01"
                                value={transientAdjustments.brightness}
                                onChange={(e) => handleAdjustmentChange('brightness', parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
                                <span>Contrast</span>
                                <span className="font-mono text-xs">{((transientAdjustments.contrast - 1) * 100).toFixed(0)}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.01"
                                value={transientAdjustments.contrast}
                                onChange={(e) => handleAdjustmentChange('contrast', parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
                                <span>Saturation</span>
                                <span className="font-mono text-xs">{((transientAdjustments.saturation - 1) * 100).toFixed(0)}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.01"
                                value={transientAdjustments.saturation}
                                onChange={(e) => handleAdjustmentChange('saturation', parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div className="pt-2 border-t border-white/10 flex justify-end">
                            <button 
                                onClick={() => {
                                    const newAdjustments = defaultAdjustments;
                                    setTransientAdjustments(newAdjustments);
                                    debouncedUpdateHistoryForAdjustments(newAdjustments);
                                }}
                                className="text-xs text-slate-400 hover:text-cyan-400 font-semibold"
                            >
                                Reset Adjustments
                            </button>
                        </div>
                    </div>
                </ToolOptionsPanel>

                <ToolOptionsPanel title="Brush Tool" icon={<BrushIcon />} isOpen={toolIsActive('brush')} onToggle={() => toggleTool('brush')}>
                    <div className="flex items-center justify-end gap-2 mb-2 pb-2 border-b border-white/10">
                        <button onClick={handleBrushUndo} disabled={brushHistoryIndex <= 0} className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo Brush Stroke"><UndoIcon/></button>
                        <button onClick={handleBrushRedo} disabled={brushHistoryIndex >= brushHistory.length - 1} className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo Brush Stroke"><RedoIcon/></button>
                    </div>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Brush Color</label>
                            <input
                                type="color"
                                value={brushSettings.color}
                                onChange={(e) => setBrushSettings(s => ({ ...s, color: e.target.value }))}
                                className="w-full h-10 p-1 bg-transparent border border-slate-600 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Brush Size: {brushSettings.size}px</label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={brushSettings.size}
                                onChange={(e) => setBrushSettings(s => ({ ...s, size: parseInt(e.target.value, 10) }))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Brush Opacity: {Math.round(brushSettings.opacity * 100)}%</label>
                            <input
                                type="range"
                                min="0.01"
                                max="1"
                                step="0.01"
                                value={brushSettings.opacity}
                                onChange={(e) => setBrushSettings(s => ({ ...s, opacity: parseFloat(e.target.value) }))}
                                className="w-full"
                            />
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                            <button onClick={handleApplyBrush} disabled={isLoading} className="w-full flex justify-center items-center bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-500 disabled:bg-slate-600 transition-colors text-sm">
                                {isLoading && loadingMessage.includes('brush') ? <Loader /> : 'Apply Drawing'}
                            </button>
                            <button onClick={handleClearBrush} disabled={isLoading} className="w-full bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors text-sm">
                                Clear
                            </button>
                        </div>
                    </div>
                </ToolOptionsPanel>
                
                <ToolOptionsPanel title="Image Search" icon={<SearchIcon />} isOpen={toolIsActive('image-search')} onToggle={() => toggleTool('image-search')}>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={imageSearchQuery}
                                onChange={(e) => setImageSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isSearchingImages && handleImageSearch()}
                                placeholder="e.g., A photorealistic cat astronaut"
                                className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                                disabled={isSearchingImages}
                            />
                            <button
                                onClick={handleImageSearch}
                                disabled={isSearchingImages || !imageSearchQuery.trim()}
                                className="flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 transition-colors"
                            >
                                {isSearchingImages ? <Loader /> : <SearchIcon />}
                            </button>
                        </div>

                        {isSearchingImages && (
                            <div className="text-center p-4">
                                <p className="text-slate-300">Generating images...</p>
                            </div>
                        )}

                        {imageSearchResults.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                                {imageSearchResults.map((base64, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectSearchedImage(base64)}
                                        className="aspect-square rounded-md overflow-hidden ring-1 ring-transparent hover:ring-cyan-400 focus:ring-cyan-400 focus:outline-none transition-all"
                                        aria-label={`Select generated image ${index + 1}`}
                                    >
                                        <img
                                            src={`data:image/jpeg;base64,${base64}`}
                                            alt={`Search result ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </ToolOptionsPanel>

                <ToolOptionsPanel title="Generate Video" icon={<VideoIcon />} isOpen={toolIsActive('video')} onToggle={() => toggleTool('video')}>
                     <div className="space-y-4">
                        <div>
                             <label className="block text-sm font-medium text-slate-300 mb-2">Prompt</label>
                             <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} className="w-full h-20 p-2 bg-slate-800/50 border border-slate-700 rounded-lg" placeholder="e.g., A dragon flying through a cyberpunk city" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Caption Text</label>
                            <input 
                                type="text"
                                value={caption?.text || ''}
                                onChange={(e) => setCaption(c => ({ text: e.target.value, style: c?.style || 'modern' }))}
                                className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                                placeholder="Add optional caption..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Caption Style</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['modern', 'classic', 'funky'] as CaptionStyle[]).map(style => (
                                    <button 
                                        key={style}
                                        onClick={() => setCaption(c => ({ text: c?.text || '', style: style }))}
                                        className={`p-2 w-full text-sm font-semibold rounded-md transition-colors capitalize ${caption?.style === style ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
                             <select value={videoStyle} onChange={(e) => setVideoStyle(e.target.value)} className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                                {videoStyles.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                             </select>
                         </div>
                         <div className="grid grid-cols-1 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['16:9', '9:16'] as const).map(ar => (
                                        <button key={ar} onClick={() => setVideoAspectRatio(ar)} className={`p-2 w-full text-sm font-semibold rounded-md transition-colors ${videoAspectRatio === ar ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                                            {ar}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                         <button onClick={handleVideoGenerate} disabled={isVideoGenerating || !videoPrompt.trim()} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-500 disabled:bg-slate-600">
                             {isVideoGenerating ? <><Loader/> {videoGenerationProgress || 'Generating...'}</> : "Generate Video"}
                         </button>
                         {generatedVideoUrl && <video src={generatedVideoUrl} controls className="w-full mt-4 rounded-lg" />}
                     </div>
                </ToolOptionsPanel>
            </div>
        </div>
    );
};
