from app import app, db
import models 
from seed import seed_all

def init_db():
    with app.app_context():
        db.create_all()
        print("Tables created successfully.")
        seed_all()

if __name__ == "__main__":
    init_db()