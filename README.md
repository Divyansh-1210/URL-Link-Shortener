# 🔗 URL Shortener API

A clean, beginner-friendly URL Shortener built with **Python**, **FastAPI**, and **SQLite**.

## 🛠️ Tech Stack

- **Python 3.x**
- **FastAPI** — modern web framework for building APIs
- **SQLAlchemy** — ORM for database interaction
- **SQLite** — lightweight database (no setup needed)
- **Pydantic** — data validation

## 📁 Project Structure

```
url-shortener/
├── main.py          # FastAPI app & all API routes
├── database.py      # Database connection setup
├── models.py        # Database table definitions
├── schemas.py       # Request/Response data shapes
├── utils.py         # Helper functions
├── requirements.txt # Project dependencies
└── README.md        # This file
```

## 🚀 How to Run

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the server
```bash
uvicorn main:app --reload
```

### 3. Open API docs in browser
```
http://localhost:8000/docs
```

## 📌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check & welcome message |
| POST | `/shorten` | Shorten a long URL |
| GET | `/{short_code}` | Redirect to original URL |
| GET | `/stats/{short_code}` | Get click stats for a URL |
| GET | `/urls` | List all shortened URLs |

## 📋 Example Usage

### Shorten a URL
```json
POST /shorten
{
  "long_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "short_code": "aB3xZ9",
  "long_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "short_url": "http://localhost:8000/aB3xZ9",
  "created_at": "2025-05-23T20:00:00",
  "click_count": 0
}
```

### Custom Short Code
```json
POST /shorten
{
  "long_url": "https://github.com/yourusername",
  "custom_code": "github"
}
```

### Get Stats
```
GET /stats/aB3xZ9
```

**Response:**
```json
{
  "short_code": "aB3xZ9",
  "long_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "short_url": "http://localhost:8000/aB3xZ9",
  "click_count": 42,
  "created_at": "2025-05-23T20:00:00"
}
```

## ✨ Features

- ✅ Shorten any valid URL
- ✅ Custom short codes (optional)
- ✅ Auto-redirect when visiting short URL
- ✅ Click tracking / analytics
- ✅ Duplicate URL detection
- ✅ List all shortened URLs
- ✅ Auto-generated Swagger UI docs at `/docs`

## 🔮 Future Improvements (Phase 2 & 3)

- [ ] Frontend UI (HTML/CSS/JS)
- [ ] User authentication (JWT)
- [ ] Personal dashboard
- [ ] URL expiry feature
- [ ] QR code generation
- [ ] Deploy to Render/Railway
