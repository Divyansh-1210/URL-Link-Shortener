# ⚡ Trimly — URL Shortener

A full-stack URL shortener built with **FastAPI**, **SQLite**, and vanilla **HTML/CSS/JS**.  
Trim long URLs, track clicks, generate QR codes, and manage links with a personal account.

---

## 🚀 Live Features

| Feature | Status |
|---|---|
| 🔗 URL Shortening (auto + custom alias) | ✅ |
| 🔐 JWT Authentication (Register / Login) | ✅ |
| 👤 User dashboard & personal links | ✅ |
| 📊 Click analytics with Chart.js | ✅ |
| 🖼️ QR Code generator (downloadable PNG) | ✅ |
| 🌙 Dark / Light mode toggle | ✅ |
| 📱 Fully responsive design | ✅ |
| 📄 Swagger API docs at `/docs` | ✅ |

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM for database interaction
- [SQLite](https://www.sqlite.org/) — Lightweight database, zero setup
- [python-jose](https://python-jose.readthedocs.io/) — JWT token generation & validation
- [bcrypt](https://pypi.org/project/bcrypt/) — Secure password hashing
- [qrcode](https://pypi.org/project/qrcode/) — QR code image generation

**Frontend**
- Vanilla HTML / CSS / JavaScript
- [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- [Chart.js](https://www.chartjs.org/) — Analytics bar chart
- [Material Symbols](https://fonts.google.com/icons) — Icons

---

## 📁 Project Structure

```
url-shortener/
│
├── backend/
│   ├── main.py          # FastAPI app & all API routes
│   ├── auth.py          # JWT auth logic (tokens, hashing)
│   ├── models.py        # Database table definitions (User, URL)
│   ├── schemas.py       # Pydantic request/response models
│   ├── database.py      # DB connection & session setup
│   ├── utils.py         # URL validation & short code generator
│   └── requirements.txt # Python dependencies
│
├── frontend/
│   └── index.html       # Complete UI (single page app)
│
├── db/
│   └── url_shortener.db # SQLite database (auto-created, git-ignored)
│
├── .gitignore
└── README.md
```

---

## ⚙️ How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/Divyansh-1210/URL-Link-Shortener.git
cd URL-Link-Shortener
```

### 2. Install dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Start the server
```bash
cd backend
uvicorn main:app --reload
```

### 4. Open in browser
```
http://localhost:8000
```

> 📄 Interactive API docs available at: `http://localhost:8000/docs`

---

## 📌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Login & receive JWT token |
| `GET` | `/me` | Get current user profile |

### URLs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/shorten` | Shorten a URL (auth optional) |
| `GET` | `/urls` | List all shortened URLs |
| `GET` | `/my-urls` | List only your URLs (auth required) |
| `GET` | `/stats/{code}` | Get click stats for a short URL |
| `GET` | `/qr/{code}` | Get QR code PNG for a short URL |
| `GET` | `/{code}` | Redirect to original URL |

---

## 📋 Example Usage

### Register
```json
POST /register
{
  "username": "john",
  "email": "john@example.com",
  "password": "mypassword"
}
```

### Shorten a URL
```json
POST /shorten
Authorization: Bearer <token>

{
  "long_url": "https://github.com/Divyansh-1210",
  "custom_code": "my-github"
}
```

**Response:**
```json
{
  "short_code": "my-github",
  "long_url": "https://github.com/Divyansh-1210",
  "short_url": "http://localhost:8000/my-github",
  "created_at": "2025-05-24T14:00:00",
  "click_count": 0,
  "owner": "john"
}
```

### Get QR Code
```
GET /qr/my-github
→ Returns PNG image
```

---

## 🔮 Upcoming (Phase 4)

- [ ] Deploy on Render (free hosting)
- [ ] Link expiry (auto-delete after N days)
- [ ] Per-link analytics detail page
- [ ] Email verification on register

---

## 👨‍💻 Author

**Divyansh Singh**  
GitHub: [@Divyansh-1210](https://github.com/Divyansh-1210)
