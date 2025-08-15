from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import logging
import nltk
from collections import Counter
import os

app = Flask(__name__)
CORS(app)  # CORS ayarı
socketio = SocketIO(app, cors_allowed_origins="*")  # WebSocket için CORS

# Loglama ayarı
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NLTK verilerini yükle
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

turkish_stopwords = set(nltk.corpus.stopwords.words('turkish'))

# WebSocket bağlantısı
@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('response', {'data': 'Bağlantı başarılı'})

# Anahtar kelime çıkarımı için WebSocket endpoint
@socketio.on('extract_keywords')
def handle_keyword_extraction(json_data):
    try:
        request_id = json_data.get('requestId')
        text = json_data.get('text', '')[:5000]
        
        if len(text) < 20:
            emit('error', {
                'event': 'error',
                'requestId': request_id,
                'payload': {'message': 'Minimum 20 karakter gerekli'}
            })
            return
            
        words = [word.lower() for word in text.split() 
                if word.isalpha() and word.lower() not in turkish_stopwords]
        keywords = [word for word, _ in Counter(words).most_common(15)]
        
        emit('keywords', {
            'event': 'keywords',
            'requestId': request_id,
            'payload': {
                'keywords': keywords,
                'character_count': len(text),
                'word_count': len(text.split()),
                'details': None
            }
        })
        
    except Exception as e:
        logger.error(f"Hata: {str(e)}")
        emit('error', {
            'event': 'error',
            'requestId': json_data.get('requestId'),
            'payload': {'message': 'Sunucu hatası'}
        })

# HTTP Endpoint'ler (mevcut fonksiyonlarınız aynen kalabilir)
@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    return jsonify({
        "status": "healthy",
        "service": "Keyword Extractor",
        "version": "1.1.0"
    })

@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    # ... (mevcut implementasyonunuz aynen kalabilir)

    if __name__ == '__main__':
    # Hem HTTP hem WebSocket için aynı portu kullanın (5000)
        socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))