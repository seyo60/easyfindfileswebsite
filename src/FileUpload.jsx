import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'; // navigate hook'unu ekle
import { createClient } from "@supabase/supabase-js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import './css/FileUpload.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const FileUpload = () => {
    const navigate = useNavigate(); // navigate hook'unu kullanıma al

    // *** Korumalı rota mekanizması burasıdır ***
    useEffect(() => {
        // localStorage'daki 'isAdmin' durumunu kontrol et
        const isAdmin = localStorage.getItem('isAdmin') === 'true';

        // Eğer admin yetkisi yoksa, giriş sayfasına yönlendir
        if (!isAdmin) {
            navigate("/AdminLogin");
        }
    }, [navigate]); // navigate bağımlılığı ile çalışması için eklenir

    const SUPABASE_CONFIG = {
        url: "https://ggaefqvwehljoqtgnzrx.supabase.co",
        key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnYWVmcXZ3ZWhsam9xdGduenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTUwODIsImV4cCI6MjA2OTQzMTA4Mn0.t_EPI2kUwxjY188Jh9sfFHITEwqPCj_eaAGpq_O72_w"
    };

    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    const [files, setFiles] = useState([]);
    const [departmentValue, setDepartmentValue] = useState(null);
    const [keywords, setKeywords] = useState([]);
    const [uploadStatus, setUploadStatus] = useState({
        isUploading: false,
        progress: 0,
        step: ""
    });
    const [showKeywords, setShowKeywords] = useState(false);
    const [analysisDetails, setAnalysisDetails] = useState(null);

    // Desteklenen tüm dosya uzantıları
    const supportedExtensions = [
        // Web Geliştirme
        '.html', '.htm', '.css', '.js', '.ts', '.jsx', '.tsx',
        // Python
        '.py', '.ipynb', '.pyc',
        // Backend
        '.php', '.java', '.go',
        // Yapılandırma
        '.json', '.yaml', '.yml', '.toml', '.env',
        // Diğer
        '.md', '.sh', '.bat', '.c', '.cpp', '.cc', '.cs', '.kt', '.swift', '.sql',
        // Orijinal desteklenenler
        '.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx',
        // Orijinal desteklenenler
        '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp',
        // 3D model dosyaları
        '.blend', '.mlt', '.obj', '.3ds'
    ];

    // Dosya okuma fonksiyonları
    const readTextFile = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });

    const extractTextFromPdf = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + "\n";
        }
        return text;
    };

    const extractTextFromDocx = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    const extractTextFromXlsx = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        let text = "";
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            text += XLSX.utils.sheet_to_csv(sheet) + "\n";
        });
        return text;
    };

    const extractTextFromIpynb = async (file) => {
        const content = await readTextFile(file);
        const notebook = JSON.parse(content);
        let text = "";
        notebook.cells?.forEach(cell => {
            if (cell.cell_type === "markdown") {
                text += cell.source.join("") + "\n";
            } else if (cell.cell_type === "code") {
                text += cell.source.join("") + "\n";
            }
        });
        return text;
    };

    const extractKeywordsFromFilename = (filename) => {
        // Örnek: "proje-taslak-2024.png" → ["proje", "taslak", "2024"]
        return filename
            .replace(/\.png$/i, '') 
            .split(/[_\-\s]+/) 
            .filter(word => word.length > 2) 
            .map(word => word.toLowerCase());
    };

    const readFileContent = async (file) => {
        try {
            const extension = file.name.split('.').pop().toLowerCase();

            if (extension === 'png') {
                const keywordsFromName = extractKeywordsFromFilename(file.name);
                return keywordsFromName.join(' ');
            }

            if (['blend', 'mlt', 'obj', '3ds'].includes(extension)) {
                const keywordsFromName = extractKeywordsFromFilename(file.name);
                return keywordsFromName.join(' ');
            }

            // Diğer dosya türleri için orijinal işlemler
            if (file.type === "application/pdf" || extension === 'pdf') {
                return await extractTextFromPdf(file);
            } else if (
                file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                extension === 'docx'
            ) {
                return await extractTextFromDocx(file);
            } else if (
                file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
                extension === 'xlsx'
            ) {
                return await extractTextFromXlsx(file);
            } else if (extension === 'ipynb') {
                return await extractTextFromIpynb(file);
            }
            else if (
                file.type.startsWith("text/") || 
                [
                    'txt', 'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 
                    'py', 'php', 'java', 'go', 'json', 'yaml', 'yml', 'toml',
                    'env', 'md', 'sh', 'bat', 'c', 'cpp', 'cc', 'cs', 'kt',
                    'swift', 'sql'
                ].includes(extension)
            ) {
                return await readTextFile(file);
            } else {
                console.warn(`Desteklenmeyen dosya türü: ${file.type} (${file.name})`);
                return null;
            }
        } catch (error) {
            console.error(`Dosya okuma hatası (${file.name}):`, error);
            return null;
        }
    };


    // Gelişmiş anahtar kelime çıkarma fonksiyonu
    const analyzeText = async (text) => {
        try {
            const healthCheck = await fetch('http://localhost:5001/healthcheck');
            if (!healthCheck.ok) {
                throw new Error('Backend hizmeti çalışmıyor');
            }

            const response = await fetch('http://localhost:5001/extract-keywords', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ text: text.slice(0, 5000) })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API hatası: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            if (!data.keywords) {
                throw new Error("Anahtar kelime döndürülmedi");
            }

            return {
                keywords: data.keywords || [],
                details: data.techniques || null
            };
        } catch (error) {
            throw error;
        }
    };

    const analyzeFiles = async (files) => {
        try {
            const fileAnalyses = await Promise.all(files.map(async (file) => {
                const content = await readFileContent(file);
                
                if (!content || content.trim().length === 0) {
                    return {
                        file,
                        keywords: [],
                        summary: "Metin içeriği bulunamadı",
                        details: null
                    };
                }

                try {
                    const { keywords, details } = await analyzeText(content);
                    return {
                        file,
                        keywords,
                        summary: `Metinden ${keywords.length} anahtar kelime çıkarıldı`,
                        details
                    };
                } catch (error) {
                    return {
                        file,
                        keywords: [],
                        summary: `Hata: ${error.message}`,
                        details: null
                    };
                }
            }));

            return fileAnalyses;
        } catch (error) {
            return files.map(file => ({
                file,
                keywords: [],
                summary: `Hata: ${error.message}`,
                details: null
            }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            
            const validFiles = selectedFiles.filter(file => {
                const extension = file.name.split('.').pop().toLowerCase();
                return supportedExtensions.includes(`.${extension}`);
            });

            if (validFiles.length !== selectedFiles.length) {
                alert("Bazı dosya türleri desteklenmiyor ve yüklenmeyecek!");
            }

            setFiles(validFiles);
            setKeywords([]);
            setShowKeywords(false);
            setAnalysisDetails(null);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploadStatus({ isUploading: true, progress: 10, step: "Dosyalar analiz ediliyor..." });

        try {
            const fileAnalyses = await analyzeFiles(files);
            console.log("Analiz sonuçları:", fileAnalyses);

            setUploadStatus(prev => ({ ...prev, progress: 30, step: "Dosyalar yükleniyor..." }));

            const uploadResults = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const analysis = fileAnalyses[i];
                
                const normalizedKeywords = analysis.keywords
                    .map(k => {
                        if (typeof k === "string") return k.trim();
                        if (typeof k === "object" && k.keyword) return k.keyword.trim();
                        return null;
                    })
                    .filter(k => k && k.length > 0);

                console.log(`Dosya ${i+1} için anahtar kelimeler:`, normalizedKeywords);

                const timestamp = Date.now();
                const fileName = `${timestamp}_${file.name}`;
                const storagePath = `uploads/${fileName}`;

                const { data: storageData, error: storageError } = await supabase.storage
                    .from('files')
                    .upload(storagePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (storageError) {
                    console.error(`Yükleme hatası (${file.name}):`, storageError);
                    throw new Error(`Dosya yükleme hatası (${file.name}): ${storageError.message}`);
                }

                const { data: publicUrlData } = supabase.storage
                    .from('files')
                    .getPublicUrl(storagePath);

                uploadResults.push({
                    file,
                    storagePath,
                    publicUrl: publicUrlData.publicUrl,
                    analysis,
                    normalizedKeywords
                });

                const progressPerFile = 40 / files.length;
                setUploadStatus(prev => ({
                    ...prev,
                    progress: 30 + (progressPerFile * (i + 1)),
                    step: `Dosya ${i + 1}/${files.length} yüklendi...`
                }));
            }

            setUploadStatus(prev => ({ ...prev, progress: 80, step: "Veritabanına kaydediliyor..." }));

            const dbOperations = uploadResults.map(async (result) => {
                const { data: fileData, error: fileError } = await supabase
                    .from('files')
                    .insert({
                        original_name: result.file.name,
                        storage_path: result.storagePath,
                        public_url: result.publicUrl,
                        file_size: result.file.size,
                        mime_type: result.file.type,
                        analysis_summary: result.analysis.summary,
                        entities: result.analysis.entities
                    })
                    .select('id')
                    .single();

                if (fileError) {
                    console.error('Dosya kaydetme hatası:', fileError);
                    throw fileError;
                }

                console.log(`Dosya ID: ${fileData.id} için anahtar kelimeler:`, result.normalizedKeywords);

                if (result.normalizedKeywords.length > 0) {
                    const keywordRecords = result.normalizedKeywords.map(k => ({
                        department: departmentValue,
                        keyword: k.toLowerCase().trim(),
                        file_id: fileData.id,
                        created_at: new Date().toISOString(),
                        original_name: result.file.name
                    }));

                    console.log('Eklenen anahtar kelimeler:', keywordRecords);

                    const { error: keywordError } = await supabase
                        .from('keywords')
                        .insert(keywordRecords);

                    if (keywordError) {
                        console.error('Anahtar kelime ekleme hatası:', keywordError);
                        throw keywordError;
                    }
                }

                return fileData;
            });

            await Promise.all(dbOperations);

            if (fileAnalyses.length > 0) {
                setKeywords(fileAnalyses[0].keywords);
                setAnalysisDetails(fileAnalyses[0].details);
                setShowKeywords(true);
            }

            setUploadStatus({
                isUploading: false,
                progress: 100,
                step: `${files.length} dosya başarıyla yüklendi! 🎉`
            });

            console.log("Yükleme başarıyla tamamlandı");

        } catch (error) {
            console.error("Yükleme hatası:", error);
            setUploadStatus({
                isUploading: false,
                progress: 0,
                step: `Hata: ${error.message}`
            });
            setShowKeywords(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="upload-container">
                <h2>Dosya Yükleme Sistemi</h2>
                <div className={`dropzone ${files.length > 0 ? 'active' : ''}`}>
                    <input
                        type="file"
                        id="fileInput"
                        onChange={handleFileChange}
                        disabled={uploadStatus.isUploading}
                        multiple
                        accept={supportedExtensions.join(',')}
                    />
                    <label htmlFor="fileInput">
                        {files.length > 0 ? `${files.length} dosya seçildi` : "Dosya Seç veya Sürükle"}
                    </label>
                </div>
                
                {uploadStatus.isUploading && (
                    <div className="upload-progress">
                        <div className="progress-bar" style={{ width: `${uploadStatus.progress}%` }} />
                        <p>{uploadStatus.step}</p>
                    </div>
                )}
                
                {files.length > 0 && (
                    <div className="file-info">
                        {files.map((file, i) => (
                            <p key={i}>
                                <strong>Dosya {i + 1}:</strong> {file.name} - {(file.size / 1024).toFixed(2)} KB - {file.type || "Belirsiz"}
                            </p>
                        ))}
                    </div>
                )}
                
                <div className="mb-3">
                    <label className="form-label">Bölüm seçiniz</label>
                    <DropdownButton
                        id="dropdown-basic-button"
                        title={departmentValue || "Bölüm Seçiniz"}
                        drop="down"
                        className="w-100"
                    >
                        <Dropdown.Item onClick={() => setDepartmentValue('Finans')}>Finans</Dropdown.Item>
                        <Dropdown.Item onClick={() => setDepartmentValue('AR-GE')}>AR-GE</Dropdown.Item>
                        <Dropdown.Item onClick={() => setDepartmentValue('Yaratıcı Tasarım')}>Yaratıcı Tasarım</Dropdown.Item>
                        <Dropdown.Item onClick={() => setDepartmentValue('Robotik')}>Robotik</Dropdown.Item>
                    </DropdownButton>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploadStatus.isUploading || !departmentValue}
                    className="upload-button"
                >
                    {uploadStatus.isUploading ? (
                        <>
                            <span className="spinner"></span>
                            {uploadStatus.step}
                        </>
                    ) : (
                        'Yükle ve Analiz Et'
                    )}
                </button>
                
                {uploadStatus.step.includes("Hata") && (
                    <div className="error-message">{uploadStatus.step}</div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;