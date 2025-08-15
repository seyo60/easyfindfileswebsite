from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import logging
import nltk
from collections import Counter
import os
import eventlet

eventlet.monkey_patch()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

turkish_stopwords = set(nltk.corpus.stopwords.words('turkish'))

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

@socketio.on('extract_keywords')
def handle_keyword_extraction(data):
    try:
        request_id = data.get('requestId')
        text = data.get('text', '')[:5000]
        if len(text) < 20:
            emit('error', {'requestId': request_id, 'error': 'Minimum 20 karakter gerekli'})
            return

        words = [word.lower() for word in text.split()
                 if word.isalpha() and word.lower() not in turkish_stopwords]
        keywords = [word for word, _ in Counter(words).most_common(15)]

        emit('keywords_response', {
            'requestId': request_id,
            'keywords': keywords,
            'character_count': len(text),
            'word_count': len(text.split())
        })
    except Exception as e:
        logger.error(f"Hata: {str(e)}")
        emit('error', {'requestId': data.get('requestId'), 'error': str(e)})

@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    return jsonify({"status": "healthy", "service": "Keyword Extractor", "version": "1.1.0"})

@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    try:
        if not request.is_json:
            return jsonify({"error": "JSON body required"}), 400
        text = request.json.get('text', '')[:5000]
        if len(text) < 20:
            return jsonify({"error": "Minimum 20 karakter gerekli"}), 400

        words = [word.lower() for word in text.split()
                 if word.isalpha() and word.lower() not in turkish_stopwords]
        keywords = [word for word, _ in Counter(words).most_common(15)]

        return jsonify({
            "keywords": keywords,
            "character_count": len(text),
            "word_count": len(text.split())
        })
    except Exception as e:
        logger.error(f"Hata: {str(e)}")
        return jsonify({"error": "Sunucu hatası"}), 500

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
