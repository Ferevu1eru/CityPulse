from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import psycopg2
from datetime import datetime

app = Flask(__name__)
CORS(app)


# Подключение к БД
def get_db_connection():
    return psycopg2.connect(
        dbname='testDataBase',
        user='postgres',
        password='Leon4567',
        host='127.0.0.1'
    )


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/index3')
def index3():
    return render_template('index3.html')


# Эндпоинт для получения дней
@app.route('/api/days', methods=['GET'])
def get_days():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute('SELECT id, day_number FROM days ORDER BY day_number ASC')
        days = [{'id': row[0], 'day_number': row[1]} for row in cur.fetchall()]

        return jsonify(days)

    except Exception as e:
        print(f"Error in get_days: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500

    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()


# Эндпоинт для мероприятий с поиском и фильтрацией
@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        search_query = request.args.get('search')
        day_id = request.args.get('day_id')
        genre = request.args.get('genre')
        event_type = request.args.get('event_type')

        conn = get_db_connection()
        cur = conn.cursor()

        query = '''
            SELECT id, title, genre, event_date, event_time,
                   location_name, x, y, image_url, description, price
            FROM events
            WHERE 1=1
        '''
        params = []

        if search_query:
            query += ' AND (title ILIKE %s OR location_name ILIKE %s OR genre ILIKE %s)'  # Поиск по названию, месту и жанру
            params.extend([f'%{search_query}%', f'%{search_query}%', f'%{search_query}%'])

        if day_id:
            query += ' AND day_id = %s'
            params.append(day_id)

        if genre:  # Фильтрация жанру
            query += ' AND genre ILIKE %s'
            params.append(f'%{genre}%')

        if event_type:  # Фильтрация по типу события
            query += ' AND event_type = %s'
            params.append(event_type)

        query += ' ORDER BY event_date, event_time'
        cur.execute(query, params)

        events = []
        for row in cur.fetchall():
            events.append({
                'id': row[0],
                'title': row[1],
                'genre': row[2],
                'date': row[3].strftime('%d.%m.%Y') if row[3] else None,
                'time': row[4].strftime('%H:%M') if row[4] else None,
                'location': row[5],
                'x': row[6],
                'y': row[7],
                'image': row[8],
                'description': row[9] or 'Описание отсутствует',
                'price': row[10]
            })

        return jsonify(events)

    except Exception as e:
        print(f"Error in get_events: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500

    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    try:
        query = request.args.get('query', '').strip()
        if len(query) < 2:
            return jsonify([])

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute('''
            SELECT DISTINCT title 
            FROM events 
            WHERE title ILIKE %s OR location_name ILIKE %s OR genre ILIKE %s
            LIMIT 10
        ''', [f'%{query}%', f'%{query}%', f'%{query}%'])

        suggestions = [{'title': row[0]} for row in cur.fetchall()]
        return jsonify(suggestions)

    except Exception as e:
        print(f"Error in get_suggestions: {str(e)}")
        return jsonify([])

    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True)