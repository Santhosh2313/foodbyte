from datetime import datetime

from . import db


class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    party_size = db.Column(db.Integer, nullable=False)
    reservation_time = db.Column(db.DateTime, nullable=False)
    special_request = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'phone': self.phone,
            'email': self.email,
            'party_size': self.party_size,
            'reservation_time': self.reservation_time.isoformat(),
            'special_request': self.special_request or '',
            'created_at': self.created_at.isoformat(),
        }
