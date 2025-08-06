import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './css/Home.css';

const supabase = createClient(
  "https://ggaefqvwehljoqtgnzrx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnYWVmcXZ3ZWhsam9xdGduenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTUwODIsImV4cCI6MjA2OTQzMTA4Mn0.t_EPI2kUwxjY188Jh9sfFHITEwqPCj_eaAGpq_O72_w"
);

const Home = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [departmentValue, setDepartmentValue] = useState(null);
  const [message, setMessage] = useState("");
  const [AIresponse, setAIresponse] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(FIRESTORE_DB, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setDepartmentValue(data.department); // Kullanıcının bölümünü state'e kaydet
          }
        } catch (error) {
          console.error("Kullanıcı verileri çekilirken hata:", error);
        }
      } else {
        navigate('/SignIn');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      setUserData(null);
      navigate('/SignIn');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
      alert('Çıkış yapılırken bir hata oluştu');
    }
  };

  const handleDownload = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('files')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('İndirme hatası:', error);
      alert('Dosya indirilirken bir hata oluştu: ' + error.message);
    }
  };

  const extractKeywordsFromQuery = async (query) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-r1-0528:free",
          "messages": [{
            "role": "system",
            "content": `Kullanıcı sorgusundaki tüm teknik terimleri, dosya formatlarını, programlama dillerini ve önemli anahtar kelimeleri çıkar. dosya kelimesini dikkate alma! Aşağıdaki kurallara kesinlikle uy:\n\n1. Zamirler, bağlaçlar, artikeller ve 'ver', 'al' gibi genel fiilleri çıkarma\n2. Programlama dillerini ve teknolojileri ilgili dosya uzantılarına dönüştür:\n   - C#, Csharp, C sharp, c#, charp, c sharp → cs\n   - Python, python → py\n   - C, c→ c\n   - C++, c++, c ++, C ++→ cpp\n   - Java, java → java\n   - JavaScript, javascript → js\n   - Unreal Engine , unreal engine→ uproject\n   - Unity, unity → unity\n3. Doküman formatlarını standart uzantılara dönüştür:\n   - Word, doc → docx\n   - Excel → xlsx\n   - PDF → pdf\n   - PowerPoint → pptx\n4. Kelimeleri kök hallerine getir (örneğin 'yazılımları' → 'yazılım')\n5. Marka ve ürün adlarını orijinal halleriyle koru (Adobe Photoshop → photoshop değil)\n6. Teknik olmayan genel kelimeleri (örneğin 'nasıl', 'yapılır') çıkarma\n7. Çıktıyı kesinlikle şu formatta ver: {\"keywords\": [\"kelime1\", \"kelime2\"]}\n8. Eş anlamlıları birleştir (video → film değil, kayıt → video değil)\n9. Kısaltmaları standart halleriyle koru (AI → ai, ML → ml)\n10. Sadece anlam taşıyan kelimeleri çıkar, gereksiz sözcük öbeklerini alma`
          }, {
            "role": "user",
            "content": `Sorgu: "${query}"\n\nAnahtar kelimeleri JSON olarak ver.`
          }],
          "response_format": { "type": "json_object" },
          "temperature": 0.3
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content).keywords || [];
    } catch (error) {
      console.error("Anahtar kelime çıkarım hatası:", error);
      return query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    }
  };

  const searchFilesByKeywords = async (query) => {
    try {
      if (!departmentValue) {
        throw new Error("Kullanıcı bölüm bilgisi bulunamadı");
      }

      // Anahtar kelimeleri çıkar
      const keywords = await extractKeywordsFromQuery(query);
      
      // Önce kullanıcının bölümündeki dosyaları filtrele
      const { data: departmentFiles, error: deptError } = await supabase
        .from('keywords')
        .select('*, files(*)')
        .eq('department', departmentValue);

      if (deptError) throw deptError;

      // Bölüme ait dosya ID'lerini al
      const departmentFileIds = departmentFiles.map(item => item.file_id);

      // Her bir keyword için arama yap, sadece kullanıcının bölümündeki dosyalarda
      const results = await Promise.all(
        keywords.map(async (keyword) => {
          const { data, error } = await supabase
            .rpc('search_files', {
              search_term: keyword,
              similarity_threshold: 0.3
            })
            .select('*, files(*)')
            .in('file_id', departmentFileIds); // Sadece kullanıcının bölümündeki dosyalarda ara
          
          return error ? [] : data;
        })
      );

      // Tüm sonuçları birleştir
      const allResults = results.flat();
      
      // Dosya bazında grupla ve eşleşme skorlarını hesapla
      const fileScores = {};
      allResults.forEach(({ keyword, files }) => {
        if (!files) return;
        
        if (!fileScores[files.id]) {
          fileScores[files.id] = {
            ...files,
            match_score: 0,
            matched_keywords: []
          };
        }
        
        fileScores[files.id].match_score += 1;
        fileScores[files.id].matched_keywords.push(keyword);
      });

      return Object.values(fileScores).sort((a, b) => b.match_score - a.match_score);
    } catch (error) {
      console.error("Arama hatası:", error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setAIresponse("");
    setSearchResults([]);

    try {
      const extractedKeywords = await extractKeywordsFromQuery(message);
      setAIresponse(`Analiz edilen anahtar kelimeler: ${extractedKeywords.join(", ")}`);

      const files = await searchFilesByKeywords(message);
      
      if (files.length > 0) {
        setSearchResults(files);
        setAIresponse(prev => prev + `\n\n${files.length} dosya bulundu (${departmentValue} bölümü)`);
      } else {
        setAIresponse(prev => prev + "\n\nUygun dosya bulunamadı.");
      }
    } catch (error) {
      console.error("Arama hatası:", error);
      setAIresponse(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="home-container">
      <div className="user-section">
        <h2>Hoş Geldin, {userData?.name}!</h2>
        <div className="user-info">
          <p><strong>Email:</strong> {userData?.email}</p>
          <p><strong>Bölüm:</strong> {userData?.department}</p>
          <button className="logout-btn" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>
<div className="content-section">
      <div className="search-section">
        <h3>Dosya Arama</h3>
        <form onSubmit={handleSubmit} className="search-form">
          <textarea
            className="search-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`${departmentValue} bölümündeki dosyalarda arama yapmak için bir açıklama yazın...`}
            rows="3"
          />
          <button
            type="submit"
            className="search-btn"
            disabled={loading || message.trim() === ""}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>

        {AIresponse && (
          <div className="ai-response">
            <h4>Analiz Sonucu:</h4>
            <div className="response-text">{AIresponse}</div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="results-section">
            <h4>{departmentValue} Bölümündeki En Uyumlu Dosyalar ({searchResults.length})</h4>
            <div className="file-list">
              {searchResults.map((file) => (
                <div 
                  key={file.id} 
                  className="file-card"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="file-info">
                    <h5>{file.original_name}</h5>
                    <p>{(file.file_size / 1024).toFixed(2)} KB</p>
                    <p>{new Date(file.created_at).toLocaleDateString()}</p>
                    {file.match_score > 0 && (
                      <div className="match-info">
                        <span className="match-score">Eşleşme: {file.match_score}</span>
                        {file.matched_keywords?.length > 0 && (
                          <div className="keywords">
                            {file.matched_keywords.slice(0, 3).map((kw, i) => (
                              <span key={i} className="keyword-tag">{kw}</span>
                            ))}
                            {file.matched_keywords.length > 3 && (
                              <span className="more-keywords">+{file.matched_keywords.length - 3} daha</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.storage_path, file.original_name);
                    }}
                    className="download-btn"
                  >
                    İndir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
</div>

      {selectedFile && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedFile.original_name}</h3>
            <div className="file-details">
              <p><strong>Boyut:</strong> {(selectedFile.file_size / 1024).toFixed(2)} KB</p>
              <p><strong>Yüklenme Tarihi:</strong> {new Date(selectedFile.created_at).toLocaleString()}</p>
              <p><strong>Bölüm:</strong> {departmentValue}</p>
              
              {selectedFile.match_score > 0 && (
                <div className="match-details">
                  <h4>Eşleşme Detayları</h4>
                  <p><strong>Eşleşme Skoru:</strong> {selectedFile.match_score}</p>
                  {selectedFile.matched_keywords?.length > 0 && (
                    <div className="matched-keywords">
                      <strong>Eşleşen Anahtar Kelimeler:</strong>
                      <div className="keywords-container">
                        {selectedFile.matched_keywords.map((kw, i) => (
                          <span key={i} className="keyword-tag">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => handleDownload(selectedFile.storage_path, selectedFile.original_name)}
                className="modal-download-btn"
              >
                İndir
              </button>
              <button 
                onClick={() => setSelectedFile(null)}
                className="modal-close-btn"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;