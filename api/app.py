from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import logging
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer
import nltk

app = Flask(__name__)

# Gelişmiş CORS ayarları
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "https://your-production-domain.com"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 86400
    }
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NLTK verilerini yükle
nltk.download('stopwords')
from nltk.corpus import stopwords
turkish_stopwords = stopwords.words('turkish')

# Modelleri yükle
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
kw_model = KeyBERT(model=model)

logger.info(f"Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
logger.info("KeyBERT with multilingual model ready for keyword extraction")

def split_text(text, max_words=500):
    """Metni parçalara ayırır (kelime bazlı)"""
    words = text.split()
    for i in range(0, len(words), max_words):
        yield " ".join(words[i:i + max_words])

@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    """Servis sağlık kontrolü"""
    return jsonify({
        "status": "healthy",
        "message": "Backend running (KeyBERT with multilingual model)",
        "device": "GPU" if torch.cuda.is_available() else "CPU",
        "version": "1.0.0"
    })

@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    """Anahtar kelime çıkarım endpoint'i"""
    try:
        # İstek doğrulama
        if not request.is_json:
            return jsonify({"error": "Request must be JSON", "code": 400}), 400
            
        data = request.get_json()
        text = data.get('text', '')[:10000]  # 10.000 karakter sınırı

        # Metin validasyonu
        if not text or len(text.strip()) < 10:  # En az 10 karakter
            return jsonify({"error": "Text must be at least 10 characters", "code": 400}), 400

        all_keywords = []
        
        # Metni parçalara ayırıp işle
        for chunk in split_text(text, max_words=500):
            keywords = kw_model.extract_keywords(
                chunk,
                keyphrase_ngram_range=(1, 2),  # 1-2 kelimelik ifadeler
                stop_words=turkish_stopwords,
                top_n=15,  # Parça başına 15 anahtar kelime
                highlight=False,
                use_mmr=True,  # Çeşitlilik için
                diversity=0.5
            )
            all_keywords.extend([kw[0] for kw in keywords])

        # Tekilleri al ve sırala (frekansa göre)
        keyword_counts = {}
        for kw in all_keywords:
            keyword_counts[kw] = keyword_counts.get(kw, 0) + 1
            
        sorted_keywords = sorted(
            keyword_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:20]  # En fazla 20 anahtar kelime

        # React ile uyumlu format (düz dizi)
        return jsonify({
            "keywords": [kw[0] for kw in sorted_keywords],  # Düz string listesi
            "stats": {
                "total_chunks": len(list(split_text(text, max_words=500))),
                "total_keywords": len(all_keywords),
                "unique_keywords": len(sorted_keywords)
            },
            "device": "GPU" if torch.cuda.is_available() else "CPU"
        })

    except Exception as e:
        logger.error(f"Keyword extraction error: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
            "code": 500
        }), 500

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True,
        ssl_context='adhoc'  # Geliştirme için HTTPS
    )