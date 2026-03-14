from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import httpx
import os
import sqlite3

SECRET_KEY = "super-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# We use the internal service name 'backend' defined in docker-compose
EDCM_BACKEND_URL = os.getenv("EDCM_BACKEND_URL", "http://backend:8000/api")

app = FastAPI(title="EDCM Client Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "portal.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE,
                  email TEXT UNIQUE,
                  password TEXT,
                  full_name TEXT,
                  company TEXT)''')
    conn.commit()
    conn.close()

init_db()

class UserRegister(BaseModel):
    username: str
    password: str
    email: str
    full_name: str
    company: Optional[str] = ""

class User(BaseModel):
    username: str
    email: str
    full_name: str
    company: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_user(username: str):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=?", (username,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "username": row[1], "email": row[2], "password": row[3], "full_name": row[4], "company": row[5]}
    return None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise HTTPException(status_code=401)
    except JWTError: raise HTTPException(status_code=401)
    user = get_user(username)
    if user is None: raise HTTPException(status_code=401)
    return user

@app.post("/register")
async def register(user: UserRegister):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        hashed_password = pwd_context.hash(user.password)
        c.execute("INSERT INTO users (username, email, password, full_name, company) VALUES (?, ?, ?, ?, ?)",
                  (user.username, user.email, hashed_password, user.full_name, user.company))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username or email already taken")
    finally:
        conn.close()
    return {"message": "Success"}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=User)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/submit")
async def submit(title: str = Form(...), description: str = Form(""), files: Optional[List[UploadFile]] = File(None), current_user: dict = Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        data = {"title": title, "description": description, "client_name": current_user["full_name"], "client_email": current_user["email"], "company": current_user["company"]}
        multipart_files = []
        if files:
            for f in files:
                content = await f.read()
                multipart_files.append(("files", (f.filename, content, f.content_type)))
        resp = await client.post(f"{EDCM_BACKEND_URL}/portal/submit/", data=data, files=multipart_files)
        return resp.json()

@app.get("/my-documents")
async def sync(current_user: dict = Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{EDCM_BACKEND_URL}/portal/sync-status/", params={"email": current_user["email"]})
        return resp.json()
