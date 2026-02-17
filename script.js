const form = document.getElementById("userForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const ageInput = document.getElementById("age");
const phoneContainer = document.getElementById("phoneContainer");
const addPhoneBtn = document.getElementById("addPhoneBtn");
const tableBody = document.getElementById("tableBody");
const paginationContainer = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const genderFilter = document.getElementById("genderFilter");

let users = JSON.parse(localStorage.getItem("users")) || [];
let editIndex = null;
const rowPerPage = 4;
let currentPage = 1;
let filteredData = [];

const sortOrder = {
  name: "asc",
  email: "asc",
  age: "asc",
  gender: "asc",
};

/* ================= PHONE FIELD ================= */

function createPhoneInput(value = "") {
  const div = document.createElement("div");
  div.classList.add("phone-group");
  div.innerHTML = `
    <input type="text" class="phone-input" value="${value}" placeholder="Enter 10 digit phone">
    <button type="button" class="remove-phone">Remove</button>
    <small class="error"></small>
  `;
  phoneContainer.appendChild(div);

  const input = div.querySelector(".phone-input");
  input.addEventListener("input", () => validateSinglePhone(input));
  input.addEventListener("blur", () => validateSinglePhone(input));
}

createPhoneInput();

addPhoneBtn.addEventListener("click", () => createPhoneInput());

phoneContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-phone")) {
    e.target.parentElement.remove();
  }
});

/* ================= VALIDATION ================= */

function showError(input, message) {
  const errorElement = input.parentElement.querySelector(".error");
  errorElement.textContent = message;
  input.classList.add("error-border");
  input.classList.remove("success-border");
}

function showSuccess(input) {
  const errorElement = input.parentElement.querySelector(".error");
  if (errorElement) errorElement.textContent = "";
  input.classList.remove("error-border");
  input.classList.add("success-border");
}

function validateName() {
  const value = nameInput.value.trim();
  if (!/^[A-Za-z ]{3,}$/.test(value)) {
    showError(nameInput, "Only letters, min 3 chars");
    return false;
  }
  showSuccess(nameInput);
  return true;
}

function validateEmail() {
  const value = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    showError(emailInput, "Invalid email");
    return false;
  }
  showSuccess(emailInput);
  return true;
}

function validatePassword() {
  const value = passwordInput.value.trim();
  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)) {
    showError(passwordInput, "Min 8 chars, 1 uppercase & 1 number");
    return false;
  }
  showSuccess(passwordInput);
  return true;
}

function validateAge() {
  const value = ageInput.value.trim();
  const ageNum = Number(value);

  if (!value || isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
    showError(ageInput, "Age must be 1-100");
    return false;
  }
  showSuccess(ageInput);
  return true;
}

function validateGender() {
  const gender = document.querySelector('input[name="gender"]:checked');
  const errorElement = document.getElementById("genderError");

  if (!gender) {
    errorElement.textContent = "Please select gender";
    return false;
  }
  errorElement.textContent = "";
  return true;
}

function validateSinglePhone(input) {
  const value = input.value.trim();
  const errorElement = input.parentElement.querySelector(".error");

  if (!/^\d{10}$/.test(value)) {
    errorElement.textContent = "Phone must be 10 digits";
    input.classList.add("error-border");
    input.classList.remove("success-border");
    return false;
  }

  showSuccess(input);
  return true;
}

function validatePhones() {
  const phoneInputs = document.querySelectorAll(".phone-input");
  if (phoneInputs.length === 0) return false;

  let valid = true;
  phoneInputs.forEach((input) => {
    if (!validateSinglePhone(input)) valid = false;
  });

  return valid;
}

/* ================= FORM SUBMIT ================= */

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (
    !(
      validateName() &&
      validateEmail() &&
      validatePassword() &&
      validateAge() &&
      validateGender() &&
      validatePhones()
    )
  )
    return;

  const phones = Array.from(document.querySelectorAll(".phone-input")).map(
    (i) => i.value.trim(),
  );

  const userData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value.trim(),
    gender: document.querySelector('input[name="gender"]:checked').value,
    age: Number(ageInput.value.trim()),
    phones,
  };

  if (editIndex === null) {
    users.push(userData);
  } else {
    users[editIndex] = userData;
    editIndex = null;
  }

  localStorage.setItem("users", JSON.stringify(users));

  applyFilters(false);
  renderTable(1);

  // form.reset();
  phoneContainer.innerHTML = "";
  createPhoneInput();
});

/* ================= FILTER ================= */

searchInput.addEventListener("input", () => applyFilters());
genderFilter.addEventListener("change", () => applyFilters());

function applyFilters(shouldRender = true) {
  const query = searchInput.value.trim().toLowerCase();
  const genderVal = genderFilter.value;

  filteredData = users
    .map((u, index) => ({ ...u, originalIndex: index }))
    .filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phones.some((p) => p.includes(query));

      const matchGender = genderVal ? u.gender === genderVal : true;

      return matchSearch && matchGender;
    });

  if (shouldRender) {
    currentPage = 1;
    renderTable(currentPage);
  }
}

/* ================= TABLE RENDER ================= */

function renderTable(page = 1) {
  currentPage = page;
  tableBody.innerHTML = "";

  const start = (currentPage - 1) * rowPerPage;
  const end = start + rowPerPage;
  const slice = filteredData.slice(start, end);

  slice.forEach((user) => {
    tableBody.innerHTML += `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.gender}</td>
        <td>${user.age}</td>
        <td>${user.phones.map((p) => `<div>${p}</div>`).join("")}</td>
        <td>
          <button onclick="editUser(${user.originalIndex})">Edit</button>
          <button onclick="deleteUser(${user.originalIndex})">Delete</button>
        </td>
      </tr>
    `;
  });

  updatePagination();
}

/* ================= PAGINATION ================= */

function updatePagination() {
  const pages = Math.ceil(filteredData.length / rowPerPage);
  paginationContainer.innerHTML = "";

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPage) btn.style.fontWeight = "bold";

    btn.onclick = () => renderTable(i);
    paginationContainer.appendChild(btn);
  }
}

/* ================= DELETE ================= */

function deleteUser(idx) {
  users.splice(idx, 1);
  localStorage.setItem("users", JSON.stringify(users));

  applyFilters(false);

  const totalPages = Math.ceil(filteredData.length / rowPerPage);
  if (currentPage > totalPages && currentPage > 1) {
    currentPage--;
  }

  renderTable(currentPage);
}

/* ================= EDIT ================= */

function editUser(idx) {
  const u = users[idx];

  nameInput.value = u.name;
  emailInput.value = u.email;
  passwordInput.value = u.password;
  ageInput.value = u.age;

  document.querySelector(`input[name="gender"][value="${u.gender}"]`).checked =
    true;

  phoneContainer.innerHTML = "";
  u.phones.forEach((p) => createPhoneInput(p));

  editIndex = idx;
}

/* ================= SORT ================= */

function sortTable(key) {
  filteredData.sort((a, b) => {
    if (key === "age") {
      return sortOrder[key] === "asc" ? a.age - b.age : b.age - a.age;
    }

    const valA = a[key].toLowerCase();
    const valB = b[key].toLowerCase();

    if (valA < valB) return sortOrder[key] === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder[key] === "asc" ? 1 : -1;
    return 0;
  });

  sortOrder[key] = sortOrder[key] === "asc" ? "desc" : "asc";

  renderTable(1);
}

/* ================= INITIAL LOAD ================= */

applyFilters(false);
renderTable(1);
