from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import nltk
import os
from keybert import KeyBERT

app = Flask(__name__)
CORS(app)  # Basit CORS ayarı

# Loglama ayarı
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NLTK verilerini yükle (sadece stopwords)
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

turkish_stopwords = set(nltk.corpus.stopwords.words('turkish'))

# KeyBERT modelini yükle
kw_model = KeyBERT()

# Anahtar kelime çıkarım fonksiyonu (KeyBERT ile)
def extract_keywords_with_keybert(text, top_n=20):
    keywords = kw_model.extract_keywords(text,
                                       keyphrase_ngram_range=(1, 2),
                                       stop_words=list(turkish_stopwords),
                                       top_n=top_n)
    return [kw[0] for kw in keywords]

@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    return jsonify({
        "status": "healthy",
        "service": "Keyword Extractor (KeyBERT)",
        "version": "2.0.0"
    })

@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    try:
        if not request.is_json:
            return jsonify({"error": "JSON body required"}), 400
            
        text = request.json.get('text', '')[:5000]  # 5000 karakter sınırı
        
        if len(text) < 20:
            return jsonify({"error": "Minimum 20 karakter gerekli"}), 400

        keywords = extract_keywords_with_keybert(text, top_n=20)
        
        return jsonify({
            "keywords": keywords,
            "character_count": len(text),
            "word_count": len(text.split())
        })

    except Exception as e:
        logger.error(f"Hata: {str(e)}")
        return jsonify({"error": "Sunucu hatası"}), 500

# Vercel için WSGI uyumluluğu
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))