from flask import Flask, send_from_directory, jsonify, request, make_response
import os
import json
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['JSON_SORT_KEYS'] = False
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000

# Data file for storing submissions and analytics
DATA_DIR = 'portfolio_data'
SUBMISSIONS_FILE = os.path.join(DATA_DIR, 'submissions.json')
ANALYTICS_FILE = os.path.join(DATA_DIR, 'analytics.json')
PROJECTS_VIEWS_FILE = os.path.join(DATA_DIR, 'project_views.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# ===== UTILITY FUNCTIONS =====
def load_json(filepath, default=None):
    """Load JSON file, return default if not exists"""
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
    except:
        pass
    return default if default is not None else {}

def save_json(filepath, data):
    """Save data to JSON file"""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        return False

def track_analytics(event_type, data=None):
    """Track analytics event"""
    analytics = load_json(ANALYTICS_FILE, [])
    event = {
        'timestamp': datetime.now().isoformat(),
        'type': event_type,
        'data': data or {}
    }
    analytics.append(event)
    # Keep only last 1000 events
    if len(analytics) > 1000:
        analytics = analytics[-1000:]
    save_json(ANALYTICS_FILE, analytics)

# ===== ROUTES =====
@app.after_request
def set_cache_headers(response):
    """Set caching headers for static assets"""
    if request.path.startswith('/api/'):
        response.cache_control.no_cache = True
        response.cache_control.no_store = True
    elif request.path.endswith(('.js', '.css', '.woff2', '.png', '.jpg', '.ico', '.svg')):
        response.cache_control.public = True
        response.cache_control.max_age = 31536000
    else:
        response.cache_control.public = True
        response.cache_control.max_age = 3600
    return response

@app.route('/')
def index():
    """Serve the portfolio homepage"""
    track_analytics('page_view', {'page': 'home'})
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    """Serve all other files (CSS, JS, assets, etc.)"""
    try:
        return send_from_directory('.', filename)
    except:
        return jsonify({'error': 'Not found'}), 404

# ===== API ENDPOINTS =====

@app.route('/api/contact', methods=['POST'])
def contact_form():
    """Handle contact form submissions"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('email') or not data.get('message'):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Create submission
        submission = {
            'timestamp': datetime.now().isoformat(),
            'name': data.get('name', '').strip(),
            'email': data.get('email', '').strip(),
            'message': data.get('message', '').strip(),
            'subject': data.get('subject', 'Portfolio Contact').strip()
        }
        
        # Load existing submissions
        submissions = load_json(SUBMISSIONS_FILE, [])
        submissions.append(submission)
        
        # Save submissions
        if save_json(SUBMISSIONS_FILE, submissions):
            track_analytics('contact_form_submitted', {'email': data.get('email')})
            return jsonify({
                'success': True,
                'message': 'Thank you! Your message has been received.'
            }), 201
        else:
            return jsonify({'success': False, 'error': 'Failed to save submission'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get project statistics and views"""
    try:
        project_views = load_json(PROJECTS_VIEWS_FILE, {})
        track_analytics('projects_viewed')
        return jsonify({
            'success': True,
            'project_views': project_views,
            'total_views': sum(project_views.values())
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects/<project_name>/view', methods=['POST'])
def track_project_view(project_name):
    """Track project view"""
    try:
        project_views = load_json(PROJECTS_VIEWS_FILE, {})
        project_views[project_name] = project_views.get(project_name, 0) + 1
        save_json(PROJECTS_VIEWS_FILE, project_views)
        track_analytics('project_view', {'project': project_name})
        return jsonify({'success': True, 'views': project_views[project_name]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data (only if you add authentication later)"""
    try:
        analytics = load_json(ANALYTICS_FILE, [])
        submissions = load_json(SUBMISSIONS_FILE, [])
        project_views = load_json(PROJECTS_VIEWS_FILE, {})
        
        return jsonify({
            'success': True,
            'total_page_views': len([a for a in analytics if a['type'] == 'page_view']),
            'total_submissions': len(submissions),
            'total_project_views': sum(project_views.values()),
            'recent_submissions': submissions[-5:] if submissions else []
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

# ===== ERROR HANDLERS =====
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({'success': False, 'error': 'Server error'}), 500

if __name__ == '__main__':
    # Production-optimized settings
    app.run(
        debug=False,  # Always False in production
        host='localhost',
        port=5000,
        use_reloader=False,
        threaded=True  # Enable threading for better concurrency
    )
