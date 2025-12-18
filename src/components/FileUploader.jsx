import React, { useRef, useEffect } from 'react';
import { FolderUp, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FileUploader = ({ onFilesSelected, isProcessing }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.setAttribute("webkitdirectory", "");
            inputRef.current.setAttribute("directory", "");
        }
    }, []);

    const handleFolderSelect = (e) => {
        // Relaxed filtering: Check MIME type OR file extension
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.pdf'];

        const files = Array.from(e.target.files).filter(file => {
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();

            const isValidType = fileType.startsWith('image/') || fileType === 'application/pdf';
            const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));

            return isValidType || isValidExt;
        });

        if (files.length > 0) {
            // DEBUG ALERT
            alert(`FileUploader: Found ${files.length} valid files. Proceeding to notify parent component.`);
            onFilesSelected(files);
        } else {
            // DEBUG ALERT
            alert(`FileUploader: Found 0 valid files. Total files in folder: ${e.target.files.length}. Please check if files are images/pdfs.`);

            // Optional: Alert user if no valid files found
            if (e.target.files.length > 0) {
                // alert("在此資料夾中找不到支援的圖片檔案。"); // Already covered by debug alert
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 text-center cursor-pointer hover:bg-white/10 transition-colors border-dashed border-2 border-white/20 group"
                onClick={() => inputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    onChange={handleFolderSelect}
                    disabled={isProcessing}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {isProcessing ? (
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        ) : (
                            <FolderUp className="w-8 h-8 text-blue-400" />
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-2">選擇圖片資料夾</h3>
                        <p className="text-gray-400 text-sm">
                            系統將讀取資料夾中的圖片並進行文字辨識
                        </p>
                    </div>

                    <div className="flex gap-4 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-black/20 px-3 py-1 rounded-full">
                            <ImageIcon className="w-3 h-3" /> JPG/PNG
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-black/20 px-3 py-1 rounded-full">
                            <FileText className="w-3 h-3" /> WebP/HEIC
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default FileUploader;
