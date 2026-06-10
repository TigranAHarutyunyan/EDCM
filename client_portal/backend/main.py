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
from typing import Dict
import uuid
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Google OAuth Settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8002/google-callback")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

SECRET_KEY = os.getenv("SECRET_KEY", "prod-portal-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# We use the internal service name 'backend' defined in docker-compose
# Service Settings
EDCM_BACKEND_URL = os.getenv("EDCM_BACKEND_URL", "http://backend:8000/api")
SMTP_SERVER = os.getenv("EMAIL_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("EMAIL_PORT", "587"))
SMTP_USER = os.getenv("EMAIL_HOST_USER", "")
SMTP_PASS = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_NAME = os.getenv("DEFAULT_FROM_EMAIL_NAME", "EDCM Administrator")
APP_URL = os.getenv("APP_URL", "http://localhost:3001")

app = FastAPI(title="EDCM Client Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = os.getenv("PORTAL_DB_PATH", "portal.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE,
                  email TEXT UNIQUE,
                  password TEXT,
                  full_name TEXT,
                  company TEXT,
                  is_verified INTEGER DEFAULT 0)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS verification_tokens
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  token TEXT,
                  created_at DATETIMEDEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

class UserRegister(BaseModel):
    username: str
    password: str
    email: str
    full_name: str

class User(BaseModel):
    username: str
    email: str
    full_name: str

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
        return {
            "id": row[0], 
            "username": row[1], 
            "email": row[2], 
            "password": row[3], 
            "full_name": row[4], 
            "company": row[5] or "",
            "is_verified": bool(row[6])
        }
    return None

def send_verification_email(email: str, token: str):
    if not SMTP_USER or not SMTP_PASS:
        print(f"SMTP not configured. Verification token for {email}: {token}")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{EMAIL_NAME} <{SMTP_USER}>"
    msg['To'] = email
    msg['Subject'] = f"{token} is your EDCM Verification Code"
    
    body = f"""
Hello,

Your verification code for EDCM Client Portal is:

{token}

Please enter this code on the registration page to activate your account.
This code will expire shortly.

Thank you!
"""
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send email: {e}")

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
                  (user.username, user.email, hashed_password, user.full_name, ""))
        user_id = c.lastrowid
        
        # Generate and store 6-digit code
        code = ''.join(secrets.choice('0123456789') for _ in range(6))
        c.execute("INSERT INTO verification_tokens (user_id, token) VALUES (?, ?)", (user_id, code))
        conn.commit()
        
        # Send email background
        send_verification_email(user.email, code)
        
    except sqlite3.IntegrityError as e:
        error_msg = str(e)
        if "users.username" in error_msg or "UNIQUE constraint failed: users.username" in error_msg:
             raise HTTPException(status_code=400, detail="This username is already taken. Please choose another.")
        if "users.email" in error_msg or "UNIQUE constraint failed: users.email" in error_msg:
             raise HTTPException(status_code=400, detail="This email is already registered. Please login instead.")
        raise HTTPException(status_code=400, detail="Registration failed: Username or email already taken.")
    finally:
        conn.close()
    return {"message": "Verification code sent to your email."}

class VerifyRequest(BaseModel):
    email: str
    code: str

@app.post("/verify-code")
async def verify_code(req: VerifyRequest):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Find user by email first
    c.execute("SELECT id, username FROM users WHERE email=?", (req.email,))
    user_row = c.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id, username = user_row
    # Check token
    c.execute("SELECT user_id FROM verification_tokens WHERE user_id=? AND token=?", (user_id, req.code))
    token_row = c.fetchone()
    
    if not token_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    c.execute("UPDATE users SET is_verified = 1 WHERE id=?", (user_id,))
    c.execute("DELETE FROM verification_tokens WHERE user_id=? AND token=?", (user_id, req.code))
    conn.commit()
    conn.close()
    
    # Generate token for auto-login
    access_token = create_access_token(data={"sub": username})
    return {"access_token": access_token, "token_type": "bearer", "message": "Account activated successfully!"}

@app.get("/verify-email")
async def verify_email(token: str):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT user_id FROM verification_tokens WHERE token=?", (token,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user_id = row[0]
    c.execute("UPDATE users SET is_verified = 1 WHERE id=?", (user_id,))
    c.execute("DELETE FROM verification_tokens WHERE token=?", (token,))
    conn.commit()
    conn.close()
    return {"message": "Email verified successfully. You can now log in."}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox.")
        
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=User)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/submit")
async def submit(title: str = Form(...), description: str = Form(""), files: Optional[List[UploadFile]] = File(None), current_user: dict = Depends(get_current_user)):
    # Standardize data to avoid payload issues
    company_name = current_user.get("company") or ""
    client_name = current_user.get("full_name") or current_user["username"]
    client_email = current_user.get("email") or ""

    data = {
        "title": title, 
        "description": description, 
        "client_name": client_name, 
        "client_email": client_email, 
        "company": company_name
    }

    async with httpx.AsyncClient() as client:
        multipart_files = []
        if files:
            for f in files:
                content = await f.read()
                multipart_files.append(("files", (f.filename, content, f.content_type)))
        
        # If no files,httpx.post(data=...) sends as form-encoded, which Django MultiPart/FormParser handles.
        resp = await client.post(f"{EDCM_BACKEND_URL}/portal/submit/", data=data, files=multipart_files or None)
        return resp.json()

@app.get("/auth/google/login")
async def google_login():
    """Build and return the Google OAuth2 redirect URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_DISCOVERY_URL)
        config = resp.json()
        auth_endpoint = config["authorization_endpoint"]
        
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    print(f"DEBUG: Using GOOGLE_REDIRECT_URI = {GOOGLE_REDIRECT_URI}", flush=True)
    encoded_params = "&".join([f"{k}={v}" for k, v in params.items()])
    return {"url": f"{auth_endpoint}?{encoded_params}"}

@app.get("/auth/google/callback")
async def google_callback(code: str):
    """Exchange the Google code for User info and issue a Portal token."""
    async with httpx.AsyncClient() as client:
        # 1. Get Google Discovery config
        resp = await client.get(GOOGLE_DISCOVERY_URL)
        config = resp.json()
        token_endpoint = config["token_endpoint"]
        userinfo_endpoint = config["userinfo_endpoint"]
        
        # 2. Exchange code for access token
        data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        token_resp = await client.post(token_endpoint, data=data)
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token from Google")
            
        # 3. Get User info
        user_resp = await client.get(userinfo_endpoint, headers={"Authorization": f"Bearer {access_token}"})
        google_user = user_resp.json()
        
    email = google_user.get("email")
    full_name = google_user.get("name", "")
    
    # 4. Check/Create User in local Portal DB
    user = get_user(email) # Using email as username for google logins
    if not user:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT INTO users (username, email, password, full_name, company, is_verified) VALUES (?, ?, ?, ?, ?, ?)",
                  (email, email, "GOOGLE_AUTH_NO_PASSWORD", full_name, "", 1)) # Verified by default
        conn.commit()
        conn.close()
        user = get_user(email)
        
    portal_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": portal_token, "token_type": "bearer"}

@app.get("/my-documents")
async def sync(current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{EDCM_BACKEND_URL}/portal/sync-status/", params={"email": current_user["email"]}, timeout=10.0)
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Backend unreachable: {str(e)}")

@app.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{EDCM_BACKEND_URL}/portal/notifications/", 
                params={"email": current_user["email"]},
                timeout=10.0
            )
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Backend unreachable: {str(e)}")

@app.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: int, current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{EDCM_BACKEND_URL}/portal/notifications/{notif_id}/read/",
                timeout=10.0
            )
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Backend unreachable: {str(e)}")
