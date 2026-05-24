import random
import string
from sqlalchemy.orm import Session
from models import URL


def generate_short_code(length: int = 6) -> str:
    """Generate a random alphanumeric short code e.g. 'aB3xZ9'"""
    characters = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return "".join(random.choices(characters, k=length))


def create_unique_code(db: Session, length: int = 6) -> str:
    """Keep generating codes until we find one that doesn't exist in DB"""
    while True:
        code = generate_short_code(length)
        existing = db.query(URL).filter(URL.short_code == code).first()
        if not existing:
            return code


def is_valid_url(url: str) -> bool:
    """Basic URL validation"""
    return url.startswith("http://") or url.startswith("https://")
