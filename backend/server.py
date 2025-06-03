from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import bcrypt
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Secret
JWT_SECRET = "think-tanks-wizards-secret-key"
security = HTTPBearer()

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    full_name: str
    title: str
    company: str
    expertise_areas: List[str]
    bio: str
    years_experience: int
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    title: str
    company: str
    expertise_areas: List[str]
    bio: str
    years_experience: int
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

class Discussion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    author_id: str
    author_name: str
    category: str
    tags: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    likes: int = 0
    comments_count: int = 0

class DiscussionCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: List[str]

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    discussion_id: str
    content: str
    author_id: str
    author_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommentCreate(BaseModel):
    content: str

# Auth utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    return jwt.encode({"user_id": user_id}, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id})
        if user:
            return User(**user)
        raise HTTPException(status_code=401, detail="Invalid token")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Think-Tanks & Wizards API"}

@api_router.post("/auth/register", response_model=LoginResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    del user_dict['password']
    user_obj = User(**user_dict)
    
    # Store user with hashed password
    user_with_password = user_obj.dict()
    user_with_password['password'] = hashed_password
    await db.users.insert_one(user_with_password)
    
    # Create token
    token = create_token(user_obj.id)
    return LoginResponse(token=token, user=user_obj)

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    token = create_token(user_obj.id)
    return LoginResponse(token=token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find({}, {"password": 0}).to_list(100)
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.post("/discussions", response_model=Discussion)
async def create_discussion(discussion_data: DiscussionCreate, current_user: User = Depends(get_current_user)):
    discussion_dict = discussion_data.dict()
    discussion_dict['author_id'] = current_user.id
    discussion_dict['author_name'] = current_user.full_name
    discussion_obj = Discussion(**discussion_dict)
    await db.discussions.insert_one(discussion_obj.dict())
    return discussion_obj

@api_router.get("/discussions", response_model=List[Discussion])
async def get_discussions(category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    discussions = await db.discussions.find(query).sort("created_at", -1).to_list(100)
    return [Discussion(**discussion) for discussion in discussions]

@api_router.get("/discussions/{discussion_id}", response_model=Discussion)
async def get_discussion(discussion_id: str):
    discussion = await db.discussions.find_one({"id": discussion_id})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return Discussion(**discussion)

@api_router.post("/discussions/{discussion_id}/like")
async def like_discussion(discussion_id: str, current_user: User = Depends(get_current_user)):
    result = await db.discussions.update_one(
        {"id": discussion_id},
        {"$inc": {"likes": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return {"message": "Discussion liked"}

@api_router.post("/discussions/{discussion_id}/comments", response_model=Comment)
async def create_comment(discussion_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    # Check if discussion exists
    discussion = await db.discussions.find_one({"id": discussion_id})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    comment_dict = comment_data.dict()
    comment_dict['discussion_id'] = discussion_id
    comment_dict['author_id'] = current_user.id
    comment_dict['author_name'] = current_user.full_name
    comment_obj = Comment(**comment_dict)
    
    await db.comments.insert_one(comment_obj.dict())
    
    # Update comment count
    await db.discussions.update_one(
        {"id": discussion_id},
        {"$inc": {"comments_count": 1}}
    )
    
    return comment_obj

@api_router.get("/discussions/{discussion_id}/comments", response_model=List[Comment])
async def get_comments(discussion_id: str):
    comments = await db.comments.find({"discussion_id": discussion_id}).sort("created_at", 1).to_list(100)
    return [Comment(**comment) for comment in comments]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
