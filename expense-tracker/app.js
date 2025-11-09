document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
    }

    loadExpenses();
    loadStatistics();
});

const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
};

async function loadExpenses() {
    const response = await fetch('/get_expenses');
    const expenses = await response.json();
    const container = document.getElementById('expenses-container');
    container.innerHTML = '';

    if (expenses.length === 0) {
        container.innerHTML = '<p class="no-data">No expenses recorded yet.</p>';
        return;
    }

    expenses.forEach(expense => {
        const card = document.createElement('div');
        card.className = 'expense-card';
        card.innerHTML = `
            <div class="centered">
                <span class="expense-category">${expense.category}:</span>
                <span class="expense-amount">${formatCurrency(expense.amount)}</span>
            </div>
            <p class="expense-date">${expense.date}</p>
            <p class="centered description">${expense.description || 'No description'}</p>
            <button class="btn-delete" onclick="deleteExpense(${expense.id})">Delete</button>
        `;
        container.appendChild(card);
    });
}

async function addExpense() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    // This validation might be causing the button to appear "broken" if you miss a field.
    if (!amount || !category || !date) {
        alert("Please fill in Amount, Category, and Date.");
        return;
    }

    const response = await fetch('/add_expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, category: category, description: description, date: date })
    });

    if (response.ok) {
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';

        loadExpenses();
        loadStatistics();
    } else {
        alert('Failed to add expense.');
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    const response = await fetch(`/delete_expense/${id}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        loadExpenses();
        loadStatistics();
    } else {
        alert('Failed to delete expense.');
    }
}

async function loadStatistics() {
    const response = await fetch('/get_statistics');
    const stats = await response.json();

    document.getElementById('total-stat').textContent = formatCurrency(stats.total);
    document.getElementById('monthly-stat').textContent = formatCurrency(stats.monthly_total);

    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = '';

    if (Object.keys(stats.categories).length === 0) {
        categoryList.innerHTML = '<p class="no-data">No category data yet.</p>';
        return;
    }

    const sortedCategories = Object.entries(stats.categories).sort(([, a], [, b]) => b - a);

    sortedCategories.forEach(([category, amount]) => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <span>${category}</span>
            <span>${formatCurrency(amount)}</span>
        `;
        categoryList.appendChild(item);
    });
}