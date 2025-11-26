import React from 'react';
import { ArrowLeft, Loader2, Tag } from 'lucide-react';

interface ScanViewProps {
    scanImages: string[];
    isAnalyzing: boolean;
    scanError: string | null;
    theme: string;
    t: (key: string) => string;
    onBack: () => void;
    onAddPhoto: () => void;
    onProcessScan: () => Promise<void>;
}

export const ScanView: React.FC<ScanViewProps> = ({
    scanImages,
    isAnalyzing,
    scanError,
    theme,
    t,
    onBack,
    onAddPhoto,
    onProcessScan,
}) => {
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';

    return (
        <div className="h-full flex flex-col">
            <button onClick={onBack} className="self-start mb-4" aria-label={t('back')}>
                <ArrowLeft />
            </button>
            <div className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center mb-4 overflow-hidden ${card}`}>
                {scanImages.length === 0 ? (
                    <div className="text-center text-slate-600">
                        <p>{t('addPhoto')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 w-full h-full p-2 overflow-auto">
                        {scanImages.map((s, i) => (
                            <img key={i} src={s} className="w-full h-24 object-cover rounded" alt={`Scan ${i + 1}`} />
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-3">
                <button
                    onClick={onAddPhoto}
                    className={`w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold flex justify-center gap-2 ${card}`}
                >
                    {t('addPhoto')}
                </button>
                {scanImages.length > 0 && (
                    <button
                        onClick={onProcessScan}
                        disabled={isAnalyzing}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2"
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin" /> : <Tag />}
                        {isAnalyzing ? 'Processing...' : t('scanBtn')}
                    </button>
                )}
            </div>
            {scanError && (
                <div className="mt-4 text-red-500 text-center text-sm">{scanError}</div>
            )}
        </div>
    );
};
