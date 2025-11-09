from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS expenses
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  amount REAL NOT NULL,
                  category TEXT NOT NULL,
                  description TEXT,
                  date TEXT NOT NULL)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    # Renders index.html, which must be in the 'templates' folder
    return render_template('index.html')

@app.route('/add_expense', methods=['POST'])
def add_expense():
    data = request.get_json()
    try:
        amount = float(data['amount'])
        category = data['category']
        description = data.get('description', '')
        date = data['date']
    except (ValueError, KeyError):
        return jsonify({'success': False, 'message': 'Invalid data provided'}), 400

    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute("INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)",
              (amount, category, description, date))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/get_expenses', methods=['GET'])
def get_expenses():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute("SELECT * FROM expenses ORDER BY date DESC")
    expenses = c.fetchall()
    conn.close()
    return jsonify([
        {'id': e[0], 'amount': e[1], 'category': e[2], 'description': e[3], 'date': e[4]}
        for e in expenses
    ])

@app.route('/delete_expense/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/get_statistics', methods=['GET'])
def get_statistics():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    
    c.execute("SELECT SUM(amount) FROM expenses")
    total = c.fetchone()[0] or 0
    
    c.execute("SELECT category, SUM(amount) FROM expenses GROUP BY category")
    category_data = c.fetchall()
    
    current_month = datetime.now().strftime('%Y-%m')
    c.execute("SELECT SUM(amount) FROM expenses WHERE date LIKE ?", (f'{current_month}%',))
    monthly_total = c.fetchone()[0] or 0
    
    conn.close()
    categories = {cat: amt for cat, amt in category_data}
    
    return jsonify({
        'total': round(total, 2),
        'monthly_total': round(monthly_total, 2),
        'categories': categories
    })

if __name__ == '__main__':
    app.run(debug=True)