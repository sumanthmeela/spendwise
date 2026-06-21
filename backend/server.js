const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get("/", (req, res) => {
  res.send("SpendWise backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is connected",
  });
});

app.get("/api/expenses", async (req, res) => {
  const { month, user_id, category_id, subcategory_id } = req.query;

  let query = supabase
    .from("expenses")
    .select(`
      id,
      amount,
      spent_on,
      note,
      app_users (
        id,
        name
      ),
      categories (
        id,
        name
      ),
      subcategories (
        id,
        name
      )
    `)
    .order("spent_on", { ascending: false });

  if (month) {
    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = `${month}-01`;

    let nextYear = year;
    let nextMonth = monthNumber + 1;

    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear = year + 1;
    }

    const nextMonthString = String(nextMonth).padStart(2, "0");
    const endDate = `${nextYear}-${nextMonthString}-01`;

    query = query.gte("spent_on", startDate).lt("spent_on", endDate);
  }

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  if (subcategory_id) {
    query = query.eq("subcategory_id", subcategory_id);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

const PORT = process.env.PORT || 5050;

app.post("/api/users", async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "User name is required" });
  }

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({
    message: "User created successfully",
    user: data,
  });
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "User name is required" });
  }

  const { data, error } = await supabase
    .from("app_users")
    .update({
      name: name.trim(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "User updated successfully",
    user: data,
  });
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("app_users")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "User deleted successfully",
    deleted_id: id,
  });
});

app.post("/api/categories", async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({
    message: "Category created successfully",
    category: data,
  });
});

app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const { data, error } = await supabase
    .from("categories")
    .update({
      name: name.trim(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Category updated successfully",
    category: data,
  });
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({
      error: error.message,
      hint: "If this category is used by expenses, delete or move those expenses first.",
    });
  }

  res.json({
    message: "Category deleted successfully",
    deleted_id: id,
  });
});


app.post("/api/subcategories", async (req, res) => {
  const { category_id, name } = req.body;

  if (!category_id || !name || !name.trim()) {
    return res.status(400).json({
      error: "category_id and subcategory name are required",
    });
  }

  const { data, error } = await supabase
    .from("subcategories")
    .insert({
      category_id,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({
    message: "Subcategory created successfully",
    subcategory: data,
  });
});

app.put("/api/subcategories/:id", async (req, res) => {
  const { id } = req.params;
  const { category_id, name } = req.body;

  const updatedSubcategory = {};

  if (category_id !== undefined) {
    updatedSubcategory.category_id = category_id;
  }

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({
        error: "Subcategory name cannot be empty",
      });
    }

    updatedSubcategory.name = name.trim();
  }

  const { data, error } = await supabase
    .from("subcategories")
    .update(updatedSubcategory)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Subcategory updated successfully",
    subcategory: data,
  });
});

app.delete("/api/subcategories/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("subcategories")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Subcategory deleted successfully",
    deleted_id: id,
  });
});



app.get("/api/categories", async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.get("/api/users", async (req, res) => {
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.get("/api/subcategories", async (req, res) => {
  const { category_id } = req.query;

  let query = supabase
    .from("subcategories")
    .select(`
      id,
      name,
      category_id,
      categories (
        id,
        name
      )
    `)
    .order("id", { ascending: true });

  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.post("/api/expenses", async (req, res) => {
  const {
    user_id,
    category_id,
    subcategory_id,
    amount,
    spent_on,
    note,
  } = req.body;

  if (!user_id || !category_id || !amount || !spent_on) {
    return res.status(400).json({
      error: "user_id, category_id, amount, and spent_on are required",
    });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id,
      category_id,
      subcategory_id: subcategory_id || null,
      amount,
      spent_on,
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({
    message: "Expense created successfully",
    expense: data,
  });
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Expense deleted successfully",
    deleted_id: id,
  });
});

app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  const {
    user_id,
    category_id,
    subcategory_id,
    amount,
    spent_on,
    note,
  } = req.body;

  const updatedExpense = {};

  if (user_id !== undefined) updatedExpense.user_id = user_id;
  if (category_id !== undefined) updatedExpense.category_id = category_id;
  if (subcategory_id !== undefined) {
    updatedExpense.subcategory_id = subcategory_id || null;
  }
  if (amount !== undefined) updatedExpense.amount = amount;
  if (spent_on !== undefined) updatedExpense.spent_on = spent_on;
  if (note !== undefined) updatedExpense.note = note || null;

  const { data, error } = await supabase
    .from("expenses")
    .update(updatedExpense)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Expense updated successfully",
    expense: data,
  });
});
app.get("/api/summary", async (req, res) => {
  const { month, user_id, category_id, subcategory_id } = req.query;

  if (!month) {
    return res.status(400).json({
      error: "month is required. Example: /api/summary?month=2026-06",
    });
  }

  const [year, monthNumber] = month.split("-").map(Number);

  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    return res.status(400).json({
      error: "Invalid month format. Use YYYY-MM. Example: 2026-06",
    });
  }

  const startDate = `${month}-01`;

  let nextYear = year;
  let nextMonth = monthNumber + 1;

  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear = year + 1;
  }

  const nextMonthString = String(nextMonth).padStart(2, "0");
  const endDate = `${nextYear}-${nextMonthString}-01`;

  let query = supabase
    .from("expenses")
    .select(`
      id,
      amount,
      spent_on,
      note,
      app_users (
        id,
        name
      ),
      categories (
        id,
        name
      ),
      subcategories (
        id,
        name
      )
    `)
    .gte("spent_on", startDate)
    .lt("spent_on", endDate);

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  if (subcategory_id) {
    query = query.eq("subcategory_id", subcategory_id);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  let total = 0;
  const byUser = {};
  const byCategory = {};
  const bySubcategory = {};
  const byDate = {};

  data.forEach((expense) => {
    const amount = Number(expense.amount);

    total += amount;

    const userName = expense.app_users?.name || "Unknown User";
    const categoryName = expense.categories?.name || "Unknown Category";
    const subcategoryName = expense.subcategories?.name || "No Subcategory";
    const spentDate = expense.spent_on;

    byUser[userName] = (byUser[userName] || 0) + amount;
    byCategory[categoryName] = (byCategory[categoryName] || 0) + amount;
    bySubcategory[subcategoryName] =
      (bySubcategory[subcategoryName] || 0) + amount;
    byDate[spentDate] = (byDate[spentDate] || 0) + amount;
  });

  res.json({
    month,
    startDate,
    endDate,
    total: Number(total.toFixed(2)),
    byUser,
    byCategory,
    bySubcategory,
    byDate,
    expenseCount: data.length,
    expenses: data,
  });
});

app.listen(PORT, () => {
  console.log(`SpendWise backend running on port ${PORT}`);
});