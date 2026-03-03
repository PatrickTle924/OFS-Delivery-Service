# flask file

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Allow Next.js to communicate with Flask
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/delivery_db'
db = SQLAlchemy(app)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending')

@app.route('/orders', methods=['GET'])
def get_orders():
    orders = Order.query.all()
    return jsonify([{"id": o.id, "customerName": o.customer_name, "status": o.status} for o in orders])