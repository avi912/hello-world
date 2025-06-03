
import requests
import sys
import uuid
import time
from datetime import datetime

class ThinkTanksAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_data = None
        self.test_discussion_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        return success, response.json()
                    except:
                        return success, response.text
                return success, None
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, None

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        # Generate unique test user
        username = f"testuser_{uuid.uuid4().hex[:8]}"
        email = f"{username}@example.com"
        
        self.test_user_data = {
            "username": username,
            "email": email,
            "password": "TestPassword123!",
            "full_name": "Test User",
            "title": "Software Engineer",
            "company": "Test Company",
            "expertise_areas": ["AI/ML", "Web3/Blockchain"],
            "bio": "This is a test user for API testing",
            "years_experience": 5,
            "github_url": "https://github.com/testuser",
            "linkedin_url": "https://linkedin.com/in/testuser"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=self.test_user_data
        )
        
        if success and response and 'token' in response:
            self.token = response['token']
            self.user = response['user']
            print(f"Created test user: {username}")
            return True
        return False

    def test_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and response and 'token' in response:
            self.token = response['token']
            self.user = response['user']
            return True
        return False

    def test_auth_me(self):
        """Test authenticated user endpoint"""
        success, response = self.run_test(
            "Get Authenticated User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_users(self):
        """Test getting all users"""
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200
        )
        return success

    def test_create_discussion(self):
        """Test creating a discussion"""
        discussion_data = {
            "title": "Test Discussion",
            "content": "This is a test discussion created by the API tester",
            "category": "AI/ML",
            "tags": ["test", "api"]
        }
        
        success, response = self.run_test(
            "Create Discussion",
            "POST",
            "discussions",
            200,
            data=discussion_data
        )
        
        if success and response and 'id' in response:
            self.test_discussion_id = response['id']
            return True
        return False

    def test_get_discussions(self):
        """Test getting all discussions"""
        success, response = self.run_test(
            "Get All Discussions",
            "GET",
            "discussions",
            200
        )
        return success

    def test_get_discussions_by_category(self):
        """Test getting discussions by category"""
        success, response = self.run_test(
            "Get Discussions by Category",
            "GET",
            "discussions?category=AI/ML",
            200
        )
        return success

    def test_like_discussion(self):
        """Test liking a discussion"""
        if not self.test_discussion_id:
            print("❌ No discussion ID available for like test")
            return False
            
        success, _ = self.run_test(
            "Like Discussion",
            "POST",
            f"discussions/{self.test_discussion_id}/like",
            200
        )
        return success

def main():
    # Get the backend URL from environment variable
    backend_url = "https://3f4bf1be-a3ef-4b80-b0ef-0eb0138ce0d5.preview.emergentagent.com"
    
    print(f"🚀 Starting Think-Tanks & Wizards API Tests against {backend_url}")
    
    # Initialize tester
    tester = ThinkTanksAPITester(backend_url)
    
    # Run tests
    tester.test_root_endpoint()
    
    # User authentication tests
    if not tester.test_register():
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Test logout by clearing token and then login again
    original_token = tester.token
    tester.token = None
    print("\n🔄 Testing logout by clearing token...")
    
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    if original_token != tester.token:
        print("✅ Login generated a new token as expected")
    
    # Test authenticated endpoints
    tester.test_auth_me()
    tester.test_get_users()
    
    # Test discussions
    if not tester.test_create_discussion():
        print("❌ Discussion creation failed, stopping discussion tests")
    else:
        tester.test_get_discussions()
        tester.test_get_discussions_by_category()
        tester.test_like_discussion()
    
    # Print results
    print(f"\n📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
