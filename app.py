from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import logging
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer
import nltk

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Türkçe stopwords için nltk stopwords yükle (ilk kez çalıştırırken)
nltk.download('stopwords')
from nltk.corpus import stopwords
turkish_stopwords = stopwords.words('turkish')

# Load the multilingual model
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
kw_model = KeyBERT(model=model)

logger.info(f"Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
logger.info("KeyBERT with multilingual model ready for keyword extraction")

def split_text(text, max_words=500):
    words = text.split()
    for i in range(0, len(words), max_words):
        yield " ".join(words[i:i + max_words])

@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    return jsonify({
        "status": "healthy",
        "message": "Backend running (KeyBERT with multilingual model)",
        "device": "CPU (forced)"
    })

@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        data = request.get_json()
        text = data.get('text', '')[:10000]

        if not text or len(text.split()) < 1:
            return jsonify({"error": "Text must be at least 3 words"}), 400

        all_keywords = []

        for chunk in split_text(text, max_words=500):
            keywords = kw_model.extract_keywords(
                chunk,
                keyphrase_ngram_range=(1, 1),  # 1-3 kelimelik ifadeler
                stop_words=turkish_stopwords,  # Türkçe durak kelimeler
                top_n=20,
                highlight=False
            )

            # Yalnızca anahtar kelime stringlerini al (skorları atla)
            chunk_keywords = [kw[0] for kw in keywords]
            all_keywords.extend(chunk_keywords)

        # Tekrar edenleri kaldır, sıra korunsun
        unique_keywords = list(dict.fromkeys(all_keywords))

        return jsonify({
            "keywords": [{"keyword": kw} for kw in unique_keywords],
            "device": "GPU" if torch.cuda.is_available() else "CPU"
        })

    except Exception as e:
        logger.error(f"Keyword extraction error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
