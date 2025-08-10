from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account"""
    print("📝 New user registration attempt...")
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Extract user data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validate required fields
        if not all([username, email, password]):
            return jsonify({'message': 'Missing required fields: username, email, password'}), 400
        
        # Create user instance
        user_id = User.create_user_id(email)
        new_user = User(user_id, username, email)
        new_user.password_hash = User.hash_password(password)
        
        # Validate user data
        validation_errors = new_user.validate()
        if validation_errors:
            return jsonify({'message': 'Validation errors', 'errors': validation_errors}), 400
        
        # Use auth service to register user
        auth_service = AuthService(current_app.neo4j_service)
        
        # Check if user already exists
        if auth_service.user_exists(email):
            print(f"❌ Registration failed: User {email} already exists")
            return jsonify({'message': 'User already exists'}), 400
        
        # Create the user
        created_user = auth_service.create_user(new_user)
        if not created_user:
            return jsonify({'message': 'Failed to create user'}), 500
        
        # Create access token
        access_token = create_access_token(identity=created_user.id)
        
        print(f"✅ User {username} registered successfully!")
        return jsonify({
            'access_token': access_token,
            'user': created_user.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in an existing user"""
    print("🔐 User login attempt...")
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'message': 'Missing email or password'}), 400
        
        # Use auth service to authenticate user
        auth_service = AuthService(current_app.neo4j_service)
        user = auth_service.authenticate_user(email, password)
        
        if not user:
            print(f"❌ Login failed for {email}: Invalid credentials")
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        print(f"✅ User {user.username} logged in successfully!")
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        auth_service = AuthService(current_app.neo4j_service)
        user = auth_service.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        print(f"❌ Get current user error: {e}")
        return jsonify({'message': 'Failed to get user information'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """Refresh JWT token"""
    try:
        current_user_id = get_jwt_identity()
        new_token = create_access_token(identity=current_user_id)
        return jsonify({'access_token': new_token}), 200
        
    except Exception as e:
        print(f"❌ Token refresh error: {e}")
        return jsonify({'message': 'Failed to refresh token'}), 500