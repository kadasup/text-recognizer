import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileCheck, Copy, Check, Loader2, FileText, X, RotateCw, Clock } from 'lucide-react';
import FileUploader from './components/FileUploader';
import HistorySidebar from './components/HistorySidebar';
import { convertFileToBase64, identifyText } from './services/aiService';
import { saveHistory } from './services/historyService';

// 你可以在這裡直接填入 API Key，或是使用 .env 檔案
const DEFAULT_API_KEY = import.meta.env.VITE_AZURE_API_KEY || "";
const DEFAULT_ENDPOINT = import.meta.env.VITE_AZURE_ENDPOINT || "";

function App() {
    const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
    const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
    const [showSettings, setShowSettings] = useState(false);
    const [files, setFiles] = useState([]);
    const [results, setResults] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [mergedResult, setMergedResult] = useState(null);
    const [retryingFiles, setRetryingFiles] = useState(new Set());
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const handleFilesSelected = async (selectedFiles) => {
        if (!apiKey) {
            setError("請先設定 API 金鑰。");
            return;
        }
        setError(null);
        setFiles(selectedFiles);
        setResults({});
        setIsProcessing(true);

        // Process files sequentially to avoid rate limits
        // In a production app, you might want a queue or limited concurrency
        for (const file of selectedFiles) {
            try {
                const base64 = await convertFileToBase64(file);
                const text = await identifyText(apiKey, base64, undefined, endpoint);
                setResults(prev => ({
                    ...prev,
                    [file.name]: { status: 'success', text }
                }));
                // Auto-save to history
                saveHistory(file.name, text);
            } catch (err) {
                setResults(prev => ({
                    ...prev,
                    [file.name]: { status: 'error', text: err.message }
                }));
            }
        }
        setIsProcessing(false);
    };

    const handleRetry = async (file) => {
        if (!apiKey) return;

        setRetryingFiles(prev => new Set(prev).add(file.name));
        // Reset status for this file to force loading state if needed, or just rely on retryingFiles
        setResults(prev => ({
            ...prev,
            [file.name]: { ...prev[file.name], status: 'retrying' } // Keep old text/error accessible if wanted, or clear it
        }));

        try {
            const base64 = await convertFileToBase64(file);
            const text = await identifyText(apiKey, base64, undefined, endpoint);
            setResults(prev => ({
                ...prev,
                [file.name]: { status: 'success', text }
            }));
            // Auto-save logic
            saveHistory(file.name, text);
        } catch (err) {
            setResults(prev => ({
                ...prev,
                [file.name]: { status: 'error', text: err.message }
            }));
        } finally {
            setRetryingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(file.name);
                return newSet;
            });
        }
    };

    const handleMerge = () => {
        const successFiles = Object.entries(results)
            .filter(([_, result]) => result.status === 'success')
            .map(([name, result]) => ({ name, text: result.text }));

        if (successFiles.length === 0) return;

        // Natural sort (1.jpg, 2.jpg, 10.jpg)
        successFiles.sort((a, b) => {
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });

        const mergedText = successFiles.map(f => `--- ${f.name} ---\n${f.text}`).join('\n\n');
        setMergedResult(mergedText);
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto relative">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        AI 智慧文字辨識
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors font-medium border border-white/10"
                    >
                        <Clock className="w-4 h-4" />
                        歷史紀錄
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors border border-white/10 ${showSettings ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-gray-300 hover:text-white'}`}
                        title="設定"
                    >
                        <RotateCw className={`w-4 h-4 ${showSettings ? 'rotate-180' : ''} transition-transform`} />
                    </button>
                    {Object.keys(results).length > 0 && !isProcessing && (
                        <button
                            onClick={handleMerge}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                        >
                            <FileText className="w-4 h-4" />
                            合併所有結果
                        </button>
                    )}
                </div>
            </header>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-3 text-red-400"
                    >
                        <div className="flex items-center gap-3">
                            <X className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button 
                            onClick={() => setError(null)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="glass-panel p-6 border-blue-500/20 bg-blue-500/5">
                            <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                API 設定
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 block ml-1">Azure OpenAI API Key</label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="輸入 API 金鑰..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 block ml-1">Azure Endpoint</label>
                                    <input
                                        type="text"
                                        value={endpoint}
                                        onChange={(e) => setEndpoint(e.target.value)}
                                        placeholder="https://your-resource.openai.azure.com/"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-gray-500">
                                * 設定將儲存在當前階段。如果您在 .env 中有設定 VITE_AZURE_API_KEY，系統會優先載入。
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* API Key Input */}


            {/* Main Content */}
            <FileUploader onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <AnimatePresence>
                    {files.map((file, index) => {
                        const result = results[file.name];
                        const isRetrying = retryingFiles.has(file.name);

                        return (
                            <motion.div
                                key={file.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-panel p-6 flex flex-col h-96"
                            >
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                                            <FileCheck className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <span className="font-medium truncate text-sm" title={file.name}>{file.name}</span>
                                    </div>
                                    {result?.status === 'success' && (
                                        <button
                                            onClick={() => copyToClipboard(result.text, file.name)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                        >
                                            {copiedId === file.name ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    )}
                                    {(result?.status === 'error' && !isRetrying) && (
                                        <button
                                            onClick={() => handleRetry(file)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-white"
                                            title="重試"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isRetrying && (
                                        <div className="p-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-lg p-4 font-mono text-sm text-gray-300">
                                    {(!result || result.status === 'retrying') ? (
                                        <div className="h-full flex items-center justify-center text-gray-600 gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {result?.status === 'retrying' ? '重試中...' : '等待中...'}
                                        </div>
                                    ) : result.status === 'error' ? (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-red-400">錯誤: {result.text}</span>
                                            <span className="text-gray-500 text-xs mt-2">請查看主控台了解詳情或是重試。</span>
                                        </div>
                                    ) : (
                                        <span className="whitespace-pre-wrap">{result.text}</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Merged Result Modal */}
            <AnimatePresence>
                {mergedResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                        onClick={() => setMergedResult(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    合併結果
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(mergedResult, 'merged')}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                                    >
                                        {copiedId === 'merged' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        {copiedId === 'merged' ? '已複製！' : '複製全部'}
                                    </button>
                                    <button
                                        onClick={() => setMergedResult(null)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-gray-300 custom-scrollbar">
                                <pre className="whitespace-pre-wrap font-sans">{mergedResult}</pre>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Footer */}
            <footer className="w-full text-center py-6 text-gray-500 text-sm mt-auto">
                Version 1.0.0
            </footer>

            {/* History Sidebar */}
            <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        </div>
    );
}

export default App;
