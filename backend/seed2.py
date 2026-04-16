import random
from datetime import datetime, timedelta, timezone

from app import app
from database import db
from models import User, CustomerProfile, Product, Order, OrderItem, Payment


USER_EMAIL = "tester@gmail.com"
NUM_ORDERS = 4


def seed_orders_for_user(user_email: str, num_orders: int = 3) -> None:
    user = User.query.filter_by(email=user_email).first()
    if not user:
        raise ValueError(f"User with email '{user_email}' not found.")

    if not user.customer_profile:
        raise ValueError(f"User '{user_email}' is not a customer.")

    customer_profile: CustomerProfile = user.customer_profile

    products = Product.query.all()
    if len(products) < 2:
        raise ValueError("Need at least 2 products in the database to create sample orders.")

    created_order_ids = []

    for i in range(num_orders):
        chosen_products = random.sample(products, k=min(3, len(products)))

        subtotal = 0.0
        total_weight = 0.0
        order_items_payload = []

        for product in chosen_products:
            quantity = random.randint(1, 3)
            line_price = float(product.cost) * quantity
            line_weight = float(product.weight) * quantity

            subtotal += line_price
            total_weight += line_weight

            order_items_payload.append(
                {
                    "product": product,
                    "quantity": quantity,
                    "unit_price": float(product.cost),
                    "unit_weight": float(product.weight),
                }
            )

        delivery_fee = 0.0 if total_weight < 20 else 4.99
        total_cost = round(subtotal + delivery_fee, 2)

        ordered_at = datetime.now(timezone.utc) - timedelta(days=(num_orders - i), hours=random.randint(1, 10))

        order = Order(
            customer_id=customer_profile.id,
            delivery_address=customer_profile.delivery_address or "123 Main St",
            delivery_city="San Jose",
            delivery_state="CA",
            delivery_zip="95112",
            delivery_lat=37.3382 + random.uniform(-0.02, 0.02),
            delivery_lng=-121.8863 + random.uniform(-0.02, 0.02),
            subtotal=round(subtotal, 2),
            total_weight=round(total_weight, 2),
            delivery_fee=delivery_fee,
            total_cost=total_cost,
            status=random.choice(["pending", "delivered", "cancelled"]),
            ordered_at=ordered_at,
        )

        if order.status == "cancelled":
            order.cancelled_at = ordered_at + timedelta(hours=1)
            order.cancel_reason = "Customer changed mind"

        db.session.add(order)
        db.session.flush()

        for item in order_items_payload:
            order_item = OrderItem(
                order_id=order.order_id,
                product_id=item["product"].product_id,
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                unit_weight=item["unit_weight"],
            )
            db.session.add(order_item)

        payment_status = "paid" if order.status != "cancelled" else "refunded"
        payment = Payment(
            order_id=order.order_id,
            payment_method="card",
            payment_status=payment_status,
            currency="USD",
            paid_amount=total_cost,
            paid_at=ordered_at + timedelta(minutes=5),
            stripe_session_id=f"cs_test_{order.order_id}",
            payment_intent_id=f"pi_test_{order.order_id}",
        )
        db.session.add(payment)

        created_order_ids.append(order.order_id)

    db.session.commit()
    print(f"Created {len(created_order_ids)} orders for {user_email}: {created_order_ids}")


if __name__ == "__main__":
    with app.app_context():
        seed_orders_for_user(USER_EMAIL, NUM_ORDERS)