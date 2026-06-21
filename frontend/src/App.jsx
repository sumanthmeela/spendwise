import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const [month, setMonth] = useState(currentMonth);

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [filterUserId, setFilterUserId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterSubcategoryId, setFilterSubcategoryId] = useState("");
  const [filterSubcategories, setFilterSubcategories] = useState([]);

  const [newUserName, setNewUserName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] =
    useState("");

  const [form, setForm] = useState({
    user_id: "",
    category_id: "",
    subcategory_id: "",
    amount: "",
    spent_on: today,
    note: "",
  });

  async function fetchUsers() {
    const response = await fetch(`${API_URL}/api/users`);
    const data = await response.json();
    setUsers(data);
  }

  async function fetchCategories() {
    const response = await fetch(`${API_URL}/api/categories`);
    const data = await response.json();
    setCategories(data);
  }

  async function fetchSubcategories(categoryId) {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    const response = await fetch(
      `${API_URL}/api/subcategories?category_id=${categoryId}`
    );

    const data = await response.json();
    setSubcategories(data);
  }

  async function fetchFilterSubcategories(categoryId) {
    if (!categoryId) {
      setFilterSubcategories([]);
      return;
    }

    const response = await fetch(
      `${API_URL}/api/subcategories?category_id=${categoryId}`
    );

    const data = await response.json();
    setFilterSubcategories(data);
  }

  function buildFilterParams() {
    const params = new URLSearchParams();

    params.append("month", month);

    if (filterUserId) {
      params.append("user_id", filterUserId);
    }

    if (filterCategoryId) {
      params.append("category_id", filterCategoryId);
    }

    if (filterSubcategoryId) {
      params.append("subcategory_id", filterSubcategoryId);
    }

    return params.toString();
  }

  async function fetchExpenses() {
    const response = await fetch(
      `${API_URL}/api/expenses?${buildFilterParams()}`
    );
    const data = await response.json();
    setExpenses(data);
  }

  async function fetchSummary() {
    const response = await fetch(
      `${API_URL}/api/summary?${buildFilterParams()}`
    );
    const data = await response.json();
    setSummary(data);
  }

  async function loadData() {
    setLoading(true);
    await fetchExpenses();
    await fetchSummary();
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, []);

  useEffect(() => {
    loadData();
  }, [month, filterUserId, filterCategoryId, filterSubcategoryId]);

  useEffect(() => {
    fetchSubcategories(form.category_id);
  }, [form.category_id]);

  useEffect(() => {
    fetchFilterSubcategories(filterCategoryId);
    setFilterSubcategoryId("");
  }, [filterCategoryId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => {
      if (name === "category_id") {
        return {
          ...previousForm,
          category_id: value,
          subcategory_id: "",
        };
      }

      return {
        ...previousForm,
        [name]: value,
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      user_id: Number(form.user_id),
      category_id: Number(form.category_id),
      subcategory_id: form.subcategory_id
        ? Number(form.subcategory_id)
        : null,
      amount: Number(form.amount),
      spent_on: form.spent_on,
      note: form.note,
    };

    const url = editingExpenseId
      ? `${API_URL}/api/expenses/${editingExpenseId}`
      : `${API_URL}/api/expenses`;

    const method = editingExpenseId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to save expense");
      return;
    }

    setForm({
      user_id: "",
      category_id: "",
      subcategory_id: "",
      amount: "",
      spent_on: today,
      note: "",
    });

    setEditingExpenseId(null);

    await loadData();
  }

  async function handleDeleteExpense(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`${API_URL}/api/expenses/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to delete expense");
      return;
    }

    await loadData();
  }

  function handleEditExpense(expense) {
    setEditingExpenseId(expense.id);

    setForm({
      user_id: expense.app_users?.id || "",
      category_id: expense.categories?.id || "",
      subcategory_id: expense.subcategories?.id || "",
      amount: expense.amount,
      spent_on: expense.spent_on,
      note: expense.note || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingExpenseId(null);

    setForm({
      user_id: "",
      category_id: "",
      subcategory_id: "",
      amount: "",
      spent_on: today,
      note: "",
    });
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    if (!newUserName.trim()) {
      alert("User name is required");
      return;
    }

    const response = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newUserName }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to create user");
      return;
    }

    setNewUserName("");
    await fetchUsers();
  }

  async function handleCreateCategory(event) {
    event.preventDefault();

    if (!newCategoryName.trim()) {
      alert("Category name is required");
      return;
    }

    const response = await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newCategoryName }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to create category");
      return;
    }

    setNewCategoryName("");
    await fetchCategories();
  }

  async function handleCreateSubcategory(event) {
    event.preventDefault();

    if (!selectedCategoryForSubcategory) {
      alert("Please select a category");
      return;
    }

    if (!newSubcategoryName.trim()) {
      alert("Subcategory name is required");
      return;
    }

    const response = await fetch(`${API_URL}/api/subcategories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category_id: Number(selectedCategoryForSubcategory),
        name: newSubcategoryName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to create subcategory");
      return;
    }

    setNewSubcategoryName("");

    if (form.category_id) {
      await fetchSubcategories(form.category_id);
    }

    if (filterCategoryId) {
      await fetchFilterSubcategories(filterCategoryId);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>SpendWise</h1>
        <p>Track monthly spending by user, category, and subcategory.</p>
      </header>

      <section className="card">
        <label>Select Month</label>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
      </section>

      <section className="card">
        <h2>Filters</h2>

        <div className="filter-grid">
          <div>
            <label>User</label>
            <select
              value={filterUserId}
              onChange={(event) => setFilterUserId(event.target.value)}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option value={user.id} key={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Category</label>
            <select
              value={filterCategoryId}
              onChange={(event) => setFilterCategoryId(event.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Subcategory</label>
            <select
              value={filterSubcategoryId}
              onChange={(event) => setFilterSubcategoryId(event.target.value)}
            >
              <option value="">All Subcategories</option>
              {filterSubcategories.map((subcategory) => (
                <option value={subcategory.id} key={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="clear-filters-button"
            onClick={() => {
              setFilterUserId("");
              setFilterCategoryId("");
              setFilterSubcategoryId("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="card">
        <h2>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>

        <form className="form" onSubmit={handleSubmit}>
          <div>
            <label>User</label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              required
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option value={user.id} key={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="18.50"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Date</label>
            <input
              name="spent_on"
              type="date"
              value={form.spent_on}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Category</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Subcategory</label>
            <select
              name="subcategory_id"
              value={form.subcategory_id}
              onChange={handleChange}
            >
              <option value="">Select subcategory</option>
              {subcategories.map((subcategory) => (
                <option value={subcategory.id} key={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Note</label>
            <input
              name="note"
              placeholder="Example: chicken from Walmart"
              value={form.note}
              onChange={handleChange}
            />
          </div>

          <button type="submit">
            {editingExpenseId ? "Update Expense" : "Add Expense"}
          </button>

          {editingExpenseId && (
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      <section className="card">
        <h2>Manage Users, Categories, and Subcategories</h2>

        <div className="management-grid">
          <form className="mini-form" onSubmit={handleCreateUser}>
            <h3>Add User</h3>

            <input
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              placeholder="Example: Sumanth"
            />

            <button type="submit">Create User</button>
          </form>

          <form className="mini-form" onSubmit={handleCreateCategory}>
            <h3>Add Category</h3>

            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Example: Entertainment"
            />

            <button type="submit">Create Category</button>
          </form>

          <form className="mini-form" onSubmit={handleCreateSubcategory}>
            <h3>Add Subcategory</h3>

            <select
              value={selectedCategoryForSubcategory}
              onChange={(event) =>
                setSelectedCategoryForSubcategory(event.target.value)
              }
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              value={newSubcategoryName}
              onChange={(event) => setNewSubcategoryName(event.target.value)}
              placeholder="Example: Movies"
            />

            <button type="submit">Create Subcategory</button>
          </form>
        </div>
      </section>

      {loading && <p>Loading...</p>}

      <section className="summary-grid">
        <div className="summary-card">
          <h2>Total Spent</h2>
          <p className="big-number">
            ${summary ? Number(summary.total).toFixed(2) : "0.00"}
          </p>
          <p>{summary ? `${summary.expenseCount} expense(s)` : "0 expense(s)"}</p>
        </div>

        <div className="summary-card">
          <h2>By User</h2>
          {summary &&
            Object.entries(summary.byUser).map(([user, amount]) => (
              <p key={user}>
                {user}: ${Number(amount).toFixed(2)}
              </p>
            ))}
        </div>

        <div className="summary-card">
          <h2>By Category</h2>
          {summary &&
            Object.entries(summary.byCategory).map(([category, amount]) => (
              <p key={category}>
                {category}: ${Number(amount).toFixed(2)}
              </p>
            ))}
        </div>
      </section>

      <section className="card">
        <h2>Expenses</h2>

        {expenses.length === 0 && <p>No expenses found for selected filters.</p>}

        <div className="expense-list">
          {expenses.map((expense) => (
            <div className="expense-card" key={expense.id}>
              <div>
                <h3>${Number(expense.amount).toFixed(2)}</h3>

                <p>
                  <strong>{expense.categories?.name}</strong>
                  {expense.subcategories?.name
                    ? ` → ${expense.subcategories.name}`
                    : ""}
                </p>

                <p>{expense.note}</p>

                <small>
                  {expense.app_users?.name} | {expense.spent_on}
                </small>
              </div>

              <div className="expense-actions">
                <button
                  className="edit-button"
                  onClick={() => handleEditExpense(expense)}
                >
                  Edit
                </button>

                <button
                  className="delete-button"
                  onClick={() => handleDeleteExpense(expense.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;