from datetime import datetime, timezone

from flask import Blueprint, jsonify, render_template, request
from sqlalchemy import text

from . import db
from .models import Reservation

bp = Blueprint('main', __name__)


@bp.get('/')
def index():
    return render_template('index.html')


@bp.get('/api/reservations')
def list_reservations():
    reservations = Reservation.query.order_by(Reservation.reservation_time.asc()).all()
    return jsonify([reservation.to_dict() for reservation in reservations])


@bp.get('/api/reservations/upcoming')
def list_upcoming_reservations():
    now_utc = datetime.utcnow()
    reservations = (
        Reservation.query.filter(Reservation.reservation_time >= now_utc)
        .order_by(Reservation.reservation_time.asc())
        .all()
    )
    return jsonify([reservation.to_dict() for reservation in reservations])


@bp.post('/api/reservations')
def create_reservation():
    payload = request.get_json(silent=True) or {}

    required_fields = ['customer_name', 'phone', 'email', 'party_size', 'reservation_time']
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    try:
        party_size = int(payload['party_size'])
        raw_reservation_time = datetime.fromisoformat(payload['reservation_time'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid party_size or reservation_time format.'}), 400

    if party_size < 1:
        return jsonify({'error': 'party_size must be at least 1.'}), 400

    # Normalize to naive UTC before persistence so comparisons remain consistent.
    if raw_reservation_time.tzinfo is not None:
        reservation_time = raw_reservation_time.astimezone(timezone.utc).replace(tzinfo=None)
    else:
        reservation_time = raw_reservation_time

    reservation = Reservation(
        customer_name=payload['customer_name'].strip(),
        phone=payload['phone'].strip(),
        email=payload['email'].strip(),
        party_size=party_size,
        reservation_time=reservation_time,
        special_request=(payload.get('special_request') or '').strip(),
    )

    db.session.add(reservation)
    db.session.commit()

    return jsonify(reservation.to_dict()), 201


@bp.put('/api/reservations/<int:reservation_id>')
def update_reservation(reservation_id: int):
    reservation = Reservation.query.get_or_404(reservation_id)
    payload = request.get_json(silent=True) or {}

    required_fields = ['customer_name', 'phone', 'email', 'party_size', 'reservation_time']
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    try:
        party_size = int(payload['party_size'])
        raw_reservation_time = datetime.fromisoformat(payload['reservation_time'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid party_size or reservation_time format.'}), 400

    if party_size < 1:
        return jsonify({'error': 'party_size must be at least 1.'}), 400

    if raw_reservation_time.tzinfo is not None:
        reservation_time = raw_reservation_time.astimezone(timezone.utc).replace(tzinfo=None)
    else:
        reservation_time = raw_reservation_time

    reservation.customer_name = payload['customer_name'].strip()
    reservation.phone = payload['phone'].strip()
    reservation.email = payload['email'].strip()
    reservation.party_size = party_size
    reservation.reservation_time = reservation_time
    reservation.special_request = (payload.get('special_request') or '').strip()

    db.session.commit()
    return jsonify(reservation.to_dict())


@bp.delete('/api/reservations/<int:reservation_id>')
def delete_reservation(reservation_id: int):
    reservation = Reservation.query.get_or_404(reservation_id)
    db.session.delete(reservation)
    db.session.commit()
    return jsonify({'message': 'Reservation deleted.'})


@bp.post('/api/db/execute')
def execute_db_operation():
    payload = request.get_json(silent=True) or {}
    sql = (payload.get('sql') or '').strip()
    if not sql:
        return jsonify({'error': 'SQL is required.'}), 400

    first_token = sql.split(maxsplit=1)[0].upper() if sql else ''
    allowed = {'INSERT', 'UPDATE', 'DELETE', 'ALTER', 'DROP'}
    if first_token not in allowed:
        return jsonify({'error': 'Only INSERT, UPDATE, DELETE, ALTER, DROP are allowed.'}), 400

    if ';' in sql[:-1]:
        return jsonify({'error': 'Only one SQL statement is allowed per request.'}), 400

    lowered = sql.lower()
    if ' reservations' not in lowered and 'reservation' not in lowered:
        return jsonify({'error': 'Only operations on reservation table(s) are allowed.'}), 400

    try:
        result = db.session.execute(text(sql))
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({'error': str(exc)}), 400

    return jsonify(
        {
            'message': f'{first_token} executed successfully.',
            'rowcount': int(result.rowcount or 0),
        }
    )
