import React, { useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { UploadCloud, File, X } from 'lucide-react';

export const FileUploadField = ({ 
  className, 
  label, 
  error, 
  accept, 
  onFileSelect, 
  helperText,
  maxSizeMB = 5 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (onFileSelect) onFileSelect(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (onFileSelect) onFileSelect(file);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-sm font-black text-text-dark font-label">{label}</label>}
      
      {!selectedFile ? (
        <div
          className={cn(
            "relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer bg-white",
            dragActive ? "border-soft-purple bg-soft-purple/5" : "border-gray-300 hover:border-soft-purple/50",
            error && "border-coral bg-coral/5",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
          <UploadCloud className={cn("w-8 h-8 mb-2", dragActive ? "text-soft-purple" : "text-gray-400")} />
          <p className="text-sm font-bold text-text-dark">Drag & drop your file here</p>
          <p className="text-xs text-text-muted mt-1">or click to browse ({accept})</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-soft-purple/10 rounded-lg text-soft-purple">
              <File className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-text-dark truncate">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={clearFile}
            className="p-2 text-gray-400 hover:text-coral transition-colors rounded-lg hover:bg-coral/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && <p className="text-xs font-bold text-coral">{error}</p>}
      {!error && helperText && <p className="text-xs font-medium text-text-muted">{helperText}</p>}
    </div>
  );
};
