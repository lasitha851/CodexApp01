const STORAGE_KEY = "financeEntries";

const entryForm = document.getElementById("entry-form");
const entryList = document.getElementById("entry-list");
const emptyState = document.getElementById("empty-state");
const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");
const cancelEdit = document.getElementById("cancel-edit");
const formError = document.getElementById("form-error");

const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");

const filters = {
  start: document.getElementById("filter-start"),
  end: document.getElementById("filter-end"),
  category: document.getElementById("filter-category"),
  clear: document.getElementById("clear-filters"),
};

const formFields = {
  id: document.getElementById("entry-id"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  date: document.getElementById("date"),
  category: document.getElementById("category"),
  notes: document.getElementById("notes"),
};

const formatCurrency = (value) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const loadEntries = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
};

const saveEntries = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const getFilters = () => ({
  start: filters.start.value,
  end: filters.end.value,
  category: filters.category.value.trim().toLowerCase(),
});

const applyFilters = (entries) => {
  const { start, end, category } = getFilters();
  return entries.filter((entry) => {
    const matchesCategory = category
      ? entry.category.toLowerCase().includes(category)
      : true;
    const matchesStart = start ? entry.date >= start : true;
    const matchesEnd = end ? entry.date <= end : true;
    return matchesCategory && matchesStart && matchesEnd;
  });
};

const updateSummary = (entries) => {
  const totals = entries.reduce(
    (accumulator, entry) => {
      if (entry.type === "income") {
        accumulator.income += entry.amount;
      } else {
        accumulator.expense += entry.amount;
      }
      return accumulator;
    },
    { income: 0, expense: 0 }
  );
  const balance = totals.income - totals.expense;

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpenseEl.textContent = formatCurrency(totals.expense);
  balanceEl.textContent = formatCurrency(balance);
};

const renderEntries = (entries) => {
  entryList.innerHTML = "";
  if (entries.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  entries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.type === "income" ? "Income" : "Expense"}</td>
      <td>${entry.category}</td>
      <td>${entry.notes ? entry.notes : "—"}</td>
      <td class="amount ${entry.type}">${formatCurrency(entry.amount)}</td>
      <td class="actions">
        <button type="button" data-action="edit" data-id="${entry.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${entry.id}" class="secondary">Delete</button>
      </td>
    `;
    entryList.appendChild(row);
  });
};

const refreshUI = () => {
  const entries = loadEntries();
  const filtered = applyFilters(entries);
  updateSummary(filtered);
  renderEntries(filtered);
};

const resetForm = () => {
  entryForm.reset();
  formFields.id.value = "";
  formTitle.textContent = "Add Entry";
  submitButton.textContent = "Add Entry";
  cancelEdit.hidden = true;
  formError.textContent = "";
};

const populateForm = (entry) => {
  formFields.id.value = entry.id;
  formFields.type.value = entry.type;
  formFields.amount.value = entry.amount.toFixed(2);
  formFields.date.value = entry.date;
  formFields.category.value = entry.category;
  formFields.notes.value = entry.notes;
  formTitle.textContent = "Edit Entry";
  submitButton.textContent = "Save Changes";
  cancelEdit.hidden = false;
};

const validateForm = () => {
  const type = formFields.type.value;
  const amount = Number.parseFloat(formFields.amount.value);
  const date = formFields.date.value;
  const category = formFields.category.value.trim();

  if (!type || !date || !category) {
    return "Please fill out all required fields.";
  }
  if (Number.isNaN(amount) || amount <= 0) {
    return "Please provide a valid amount greater than 0.";
  }
  return "";
};

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const error = validateForm();
  if (error) {
    formError.textContent = error;
    return;
  }

  const entries = loadEntries();
  const payload = {
    id: formFields.id.value || crypto.randomUUID(),
    type: formFields.type.value,
    amount: Number.parseFloat(formFields.amount.value),
    date: formFields.date.value,
    category: formFields.category.value.trim(),
    notes: formFields.notes.value.trim(),
  };

  const existingIndex = entries.findIndex((entry) => entry.id === payload.id);
  if (existingIndex >= 0) {
    entries[existingIndex] = payload;
  } else {
    entries.unshift(payload);
  }

  saveEntries(entries);
  resetForm();
  refreshUI();
});

cancelEdit.addEventListener("click", () => {
  resetForm();
});

entryList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  const action = button.dataset.action;
  const id = button.dataset.id;
  const entries = loadEntries();
  const entry = entries.find((item) => item.id === id);
  if (!entry) {
    return;
  }

  if (action === "edit") {
    populateForm(entry);
  }

  if (action === "delete") {
    const updated = entries.filter((item) => item.id !== id);
    saveEntries(updated);
    refreshUI();
  }
});

[filters.start, filters.end, filters.category].forEach((input) => {
  input.addEventListener("input", refreshUI);
});

filters.clear.addEventListener("click", () => {
  filters.start.value = "";
  filters.end.value = "";
  filters.category.value = "";
  refreshUI();
});

resetForm();
refreshUI();
