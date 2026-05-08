from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='.')
CORS(app)

# Serve the dashboard HTML
@app.route('/')
def index():
    return send_from_directory('.', 'FRIDAY_v3.html')

# Proxy endpoint for Dify API
@app.route('/api/run', methods=['POST'])
def run_pipeline():
    data = request.get_json()
    api_key = data.get('api_key')
    feature_list = data.get('feature_list')

    if not api_key:
        return jsonify({'error': 'API key required'}), 400
    if not feature_list:
        return jsonify({'error': 'Feature list required'}), 400

    try:
        response = requests.post(
            'https://api.dify.ai/v1/workflows/run',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'inputs': {'feature_list': feature_list},
                'response_mode': 'blocking',
                'user': 'friday-dashboard'
            },
            timeout=600
        )

        if not response.ok:
            return jsonify({'error': f'Dify API error {response.status_code}: {response.text[:200]}'}), response.status_code

        return jsonify(response.json())

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timed out — Dify took too long to respond'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("  F.R.I.D.A.Y — Project Intelligence System")
    print("  Starting server on http://localhost:5000")
    print("=" * 50)
    app.run(debug=False, port=5000)
