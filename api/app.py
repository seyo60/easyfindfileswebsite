# api/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import nltk
from collections import Counter
import os

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

# Basit anahtar kelime çıkarımı (model kullanmadan)
def extract_simple_keywords(text, top_n=10):
    words = [
        word.lower() for word in text.split() 
        if word.isalpha() and word.lower() not in turkish_stopwords
    ]
    return [word for word, _ in Counter(words).most_common(top_n)]

@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    return jsonify({
        "status": "healthy",
        "service": "Keyword Extractor",
        "version": "1.1.0"
    })

@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    try:
        if not request.is_json:
            return jsonify({"error": "JSON body required"}), 400
            
        text = request.json.get('text', '')[:5000]  # 5000 karakter sınırı
        
        if len(text) < 20:
            return jsonify({"error": "Minimum 20 karakter gerekli"}), 400

        keywords = extract_simple_keywords(text, top_n=15)
        
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