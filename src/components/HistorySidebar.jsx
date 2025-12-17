import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2, Clock, FileText, ChevronRight } from 'lucide-react';
import { getHistory, deleteHistory } from '../services/historyService';

const HistorySidebar = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, searchQuery]);

    const fetchHistory = async () => {
        setIsLoading(true);
        const data = await getHistory(searchQuery);
        setHistory(data);
        setIsLoading(false);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('確定要刪除這筆紀錄嗎？')) {
            const success = await deleteHistory(id);
            if (success) {
                fetchHistory(); // Reload list
            }
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('zh-TW', {
            month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Sidebar Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                歷史紀錄
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-white/10 bg-black/20">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="搜尋檔名或內容..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">載入中...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {searchQuery ? '沒有找到符合的紀錄' : '暫無歷史紀錄'}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-colors group cursor-pointer"
                                        // Future: Click to expand or copy
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                    <span className="font-medium text-white truncate text-sm" title={item.name}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(item.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-all"
                                                    title="刪除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <p className="text-gray-400 text-xs mb-3 line-clamp-2 font-mono bg-black/20 p-2 rounded">
                                                {item.text}
                                            </p>

                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatDate(item.timestamp)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HistorySidebar;
