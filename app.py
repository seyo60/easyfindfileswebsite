from flask import Flask, request, jsonify
from flask_cors import CORS
import yake
import torch
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info(f"Cihaz: {'GPU' if torch.cuda.is_available() else 'CPU'}")
    # Burada top'u yüksek tutuyoruz, çünkü parçalardan fazla çıkarıp sonra kırpacağız
    YAKE_MODEL = yake.KeywordExtractor(lan="tr", n=2, dedupLim=0.3, top=10)
    logger.info("YAKE modeli yüklendi")
except Exception as e:
    logger.error(f"YAKE modeli yüklenemedi: {e}")
    YAKE_MODEL = None

def split_text(text, max_words=500):
    words = text.split()
    for i in range(0, len(words), max_words):
        yield " ".join(words[i:i + max_words])

@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    return jsonify({
        "status": "healthy" if YAKE_MODEL else "degraded",
        "message": "Backend çalışıyor" if YAKE_MODEL else "YAKE modeli yüklenemedi",
        "device": "GPU" if torch.cuda.is_available() else "CPU"
    })

@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    try:
        if not request.is_json:
            return jsonify({"error": "Request JSON olmalı"}), 400
        data = request.get_json()
        text = data.get('text', '')[:10000]

        if not text or len(text.split()) < 3:
            return jsonify({"error": "Metin en az 3 kelime olmalı"}), 400

        if not YAKE_MODEL:
            return jsonify({"error": "YAKE modeli yüklenemedi"}), 500

        all_keywords = []
        for chunk in split_text(text, max_words=500):
            kws = YAKE_MODEL.extract_keywords(chunk)
            all_keywords.extend(kws)

        # Aynı anahtar kelimeleri küçük harfe çevirip skor bazlı filtrele
        filtered = {}
        for kw, score in all_keywords:
            kw_lower = kw.lower()
            if kw_lower not in filtered or score < filtered[kw_lower]:
                filtered[kw_lower] = score

        # Skora göre sırala
        sorted_keywords = sorted(filtered.items(), key=lambda x: x[1])

        # En iyi 50 anahtar kelimeyi al
        top_keywords = sorted_keywords[:50]

        keywords_list = [{"keyword": kw, "score": score} for kw, score in top_keywords]

        return jsonify({
            "keywords": keywords_list,
            "device": "GPU" if torch.cuda.is_available() else "CPU"
        })

    except Exception as e:
        logger.error(f"Anahtar kelime çıkarma hatası: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
