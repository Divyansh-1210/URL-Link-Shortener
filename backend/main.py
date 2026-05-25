from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, FileResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
import qrcode
import os
import logging
import asyncio
import httpx
from io import BytesIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import models, schemas, utils, auth
from database import engine, get_db

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

# Paths
BASE_DIR     = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
# Auto-detect Render's URL, or use BASE_URL env var, or fallback to localhost
BASE_URL = (
    os.environ.get("BASE_URL") or
    os.environ.get("RENDER_EXTERNAL_URL") or
    "http://localhost:8000"
).rstrip("/")

app = FastAPI(
    title="Trimly URL Shortener API",
    description="Shorten URLs, track clicks, generate QR codes. JWT auth included.",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Serve frontend static assets (css/ and js/ subfolders)
app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
app.mount("/js",  StaticFiles(directory=str(FRONTEND_DIR / "js")),  name="js")


# ------------------------------------------------------------------
# FRONTEND
# ------------------------------------------------------------------
@app.get("/")
def serve_frontend():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


# ------------------------------------------------------------------
# PING — Health check (use this to test if server is reachable)
# ------------------------------------------------------------------
@app.get("/ping")
def ping():
    logger.info("Ping received — server is awake!")
    return JSONResponse({"status": "ok", "message": "Trimly is alive!"})


# ------------------------------------------------------------------
# STARTUP — Keep-alive background task
# ------------------------------------------------------------------
@app.on_event("startup")
async def start_keepalive():
    """Ping self every 4 minutes to prevent Render free tier sleep"""
    async def keepalive():
        await asyncio.sleep(60)  # wait 1 min after startup
        while True:
            try:
                async with httpx.AsyncClient() as client:
                    await client.get(f"{BASE_URL}/ping", timeout=10)
                    logger.info("Keepalive ping sent.")
            except Exception as e:
                logger.warning(f"Keepalive failed: {e}")
            await asyncio.sleep(240)  # every 4 minutes
    asyncio.create_task(keepalive())


# ------------------------------------------------------------------
# AUTH Γò¼├┤Γö£├ºΓö£Γòó Register
# ------------------------------------------------------------------
@app.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(request: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new user account"""

    # Check username taken
    if db.query(models.User).filter(models.User.username == request.username).first():
        raise HTTPException(status_code=409, detail="Username already taken.")

    # Check email taken
    if db.query(models.User).filter(models.User.email == request.email).first():
        raise HTTPException(status_code=409, detail="Email already registered.")

    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Create user
    new_user = models.User(
        username=request.username,
        email=request.email,
        hashed_password=auth.hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return token immediately (auto-login after register)
    token = auth.create_access_token({"sub": new_user.username})
    return schemas.TokenResponse(access_token=token, username=new_user.username)


# ------------------------------------------------------------------
# AUTH Γò¼├┤Γö£├ºΓö£Γòó Login
# ------------------------------------------------------------------
@app.post("/login", response_model=schemas.TokenResponse)
def login(request: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login with username and password"""

    user = db.query(models.User).filter(models.User.username == request.username).first()

    if not user or not auth.verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = auth.create_access_token({"sub": user.username})
    return schemas.TokenResponse(access_token=token, username=user.username)


# ------------------------------------------------------------------
# AUTH Γò¼├┤Γö£├ºΓö£Γòó Get current user profile
# ------------------------------------------------------------------
@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user_required)):
    """Get the currently logged-in user's profile"""
    return current_user


# ------------------------------------------------------------------
# POST /shorten Γò¼├┤Γö£├ºΓö£Γòó Create short URL (works for both guests & logged-in)
# ------------------------------------------------------------------
@app.post("/shorten", response_model=schemas.URLResponse, status_code=201)
def shorten_url(
    request: schemas.URLCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_optional)
):
    if not utils.is_valid_url(request.long_url):
        raise HTTPException(status_code=400, detail="Invalid URL. Must start with http:// or https://")

    if request.custom_code:
        existing = db.query(models.URL).filter(models.URL.short_code == request.custom_code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Custom code '{request.custom_code}' is already taken.")
        short_code = request.custom_code
    else:
        short_code = utils.create_unique_code(db)

    # Check for duplicate long URL (only for same user)
    query = db.query(models.URL).filter(models.URL.long_url == request.long_url)
    if current_user:
        query = query.filter(models.URL.owner_id == current_user.id)
    else:
        query = query.filter(models.URL.owner_id == None)

    existing_url = query.first()
    if existing_url:
        return schemas.URLResponse(
            short_code=existing_url.short_code,
            long_url=existing_url.long_url,
            short_url=f"{BASE_URL}/{existing_url.short_code}",
            created_at=existing_url.created_at,
            click_count=existing_url.click_count,
            owner=existing_url.owner.username if existing_url.owner else None
        )

    new_url = models.URL(
        short_code=short_code,
        long_url=request.long_url,
        owner_id=current_user.id if current_user else None
    )
    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    return schemas.URLResponse(
        short_code=new_url.short_code,
        long_url=new_url.long_url,
        short_url=f"{BASE_URL}/{new_url.short_code}",
        created_at=new_url.created_at,
        click_count=new_url.click_count,
        owner=current_user.username if current_user else None
    )


# ------------------------------------------------------------------
# GET /urls Γò¼├┤Γö£├ºΓö£Γòó List all URLs
# ------------------------------------------------------------------
@app.get("/urls", response_model=list[schemas.URLStats])
def get_all_urls(db: Session = Depends(get_db)):
    urls = db.query(models.URL).order_by(models.URL.created_at.desc()).all()
    return [
        schemas.URLStats(
            short_code=u.short_code,
            long_url=u.long_url,
            short_url=f"{BASE_URL}/{u.short_code}",
            click_count=u.click_count,
            created_at=u.created_at,
            owner=u.owner.username if u.owner else None
        )
        for u in urls
    ]


# ------------------------------------------------------------------
# GET /my-urls Γò¼├┤Γö£├ºΓö£Γòó List only current user's URLs
# ------------------------------------------------------------------
@app.get("/my-urls", response_model=list[schemas.URLStats])
def get_my_urls(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Get only the URLs created by the logged-in user"""
    urls = (
        db.query(models.URL)
        .filter(models.URL.owner_id == current_user.id)
        .order_by(models.URL.created_at.desc())
        .all()
    )
    return [
        schemas.URLStats(
            short_code=u.short_code,
            long_url=u.long_url,
            short_url=f"{BASE_URL}/{u.short_code}",
            click_count=u.click_count,
            created_at=u.created_at,
            owner=current_user.username
        )
        for u in urls
    ]


# ------------------------------------------------------------------
# GET /stats/{short_code}
# ------------------------------------------------------------------
@app.get("/stats/{short_code}", response_model=schemas.URLStats)
def get_stats(short_code: str, db: Session = Depends(get_db)):
    url_entry = db.query(models.URL).filter(models.URL.short_code == short_code).first()
    if not url_entry:
        raise HTTPException(status_code=404, detail=f"Short URL '{short_code}' not found.")
    return schemas.URLStats(
        short_code=url_entry.short_code,
        long_url=url_entry.long_url,
        short_url=f"{BASE_URL}/{url_entry.short_code}",
        click_count=url_entry.click_count,
        created_at=url_entry.created_at,
        owner=url_entry.owner.username if url_entry.owner else None
    )


# ------------------------------------------------------------------
# GET /qr/{short_code} Γò¼├┤Γö£├ºΓö£Γòó Generate QR Code
# ------------------------------------------------------------------
@app.get("/qr/{short_code}")
def get_qr_code(short_code: str, db: Session = Depends(get_db)):
    """Generate and return a QR code PNG for the short URL"""
    url_entry = db.query(models.URL).filter(models.URL.short_code == short_code).first()
    if not url_entry:
        raise HTTPException(status_code=404, detail=f"Short URL '{short_code}' not found.")

    short_url = f"{BASE_URL}/{short_code}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(short_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#7c3aed", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return Response(
        content=buf.getvalue(),
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qr-{short_code}.png"}
    )


# ------------------------------------------------------------------
# GET /{short_code} ΓÇö Redirect (MUST be last)
# ------------------------------------------------------------------
@app.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    try:
        url_entry = db.query(models.URL).filter(models.URL.short_code == short_code).first()
        if not url_entry:
            raise HTTPException(status_code=404, detail=f"Short URL '{short_code}' not found.")
        # Capture long_url BEFORE commit (avoids session expiry issues)
        long_url = url_entry.long_url
        url_entry.click_count += 1
        db.commit()
        return RedirectResponse(url=long_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Redirect error for '{short_code}': {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Redirect failed: {type(e).__name__}: {str(e)}")
