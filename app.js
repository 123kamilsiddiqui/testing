// --- GOOGLE SHEET WEB APP URL ---
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwi3Uk1-RX_CtPoZ2Cg7_WcOeAg4uJ8nvV2fAVbN12Aunk5Jo3qlFgYbSCR1Oalrni5/exec";

// --- Pages mapping ---
const pages = {
  main: renderMainPage,
  orders: renderOrdersPage,
  staff: renderStaffBillbookPage,
  status: renderEntryStatusPage,
  delivery: renderDeliveryPage
};

window.appState = {
  orders: [],
  staffBook: {}, // { billbookNumber: staffName }
  entryStatuses: {} // { sno: [ { product, package } ] }
};

// ------------ GOOGLE SHEETS INTEGRATION ---------------
async function fetchSheetData() {
  try {
    const res = await fetch(SHEET_URL + "?action=getOrders");
    const data = await res.json();
    window.appState.orders = data.orders || [];
    window.appState.staffBook = data.staffBook || {};
    window.appState.entryStatuses = data.entryStatuses || {};
  } catch (e) {
    window.appState.orders = JSON.parse(localStorage.getItem("orders") || "[]");
    window.appState.staffBook = JSON.parse(localStorage.getItem("staffBook") || "{}");
    window.appState.entryStatuses = JSON.parse(localStorage.getItem("entryStatuses") || "{}");
  }
}

async function saveOrderToSheet(order) {
  try {
    await fetch(SHEET_URL + "?action=addOrder", {
      method: "POST",
      body: JSON.stringify(order),
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    const arr = window.appState.orders;
    const idx = arr.findIndex(x => x.sno == order.sno);
    if (idx >= 0) arr[idx] = order;
    else arr.push(order);
    localStorage.setItem("orders", JSON.stringify(arr));
  }
}

async function saveStaffBookToSheet(staffBook) {
  try {
    await fetch(SHEET_URL + "?action=addStaffBook", {
      method: "POST",
      body: JSON.stringify(staffBook),
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    localStorage.setItem("staffBook", JSON.stringify(staffBook));
  }
}

async function saveEntryStatusToSheet(entryStatuses) {
  try {
    await fetch(SHEET_URL + "?action=addEntryStatus", {
      method: "POST",
      body: JSON.stringify(entryStatuses),
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    localStorage.setItem("entryStatuses", JSON.stringify(entryStatuses));
  }
}

// ----------- PAGE RENDERERS ------------------

async function renderMainPage(main) {
  await fetchSheetData();
  main.innerHTML = `<h2>Orders List</h2>`;

  // --- FILTER BAR CODE START ---
  const filterBar = document.createElement("div");
  filterBar.className = "filter-bar";
  filterBar.innerHTML = `
    <label>Search S No: <input type="text" id="search-sno" placeholder="S No"></label>
    <label>Product:
      <input type="text" id="filter-product" placeholder="Type product"/>
    </label>
    <label>Status:
      <select id="filter-delivery-status">
        <option value="">Any</option>
        <option value="delivered">Delivered</option>
        <option value="pending">Pending</option>
        <option value="canceled">Canceled</option>
      </select>
    </label>
    <label>Date:
      <select id="filter-date">
        <option value="">Any</option>
        <option value="today">Today</option>
        <option value="tomorrow">Tomorrow</option>
        <option value="thisweek">Current Week</option>
        <option value="thismonth">Current Month</option>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </label>
    <button class="btn-action" id="btn-filter">Apply Filter</button>
  `;
  main.appendChild(filterBar);

  document.getElementById("btn-filter").onclick = function() {
    let snoVal = document.getElementById("search-sno").value.trim();
    let productVal = document.getElementById("filter-product").value.trim().toLowerCase();
    let statusVal = document.getElementById("filter-delivery-status").value;
    let dateVal = document.getElementById("filter-date").value;

    let filteredOrders = window.appState.orders;
    if (snoVal) filteredOrders = filteredOrders.filter(o => String(o.sno).includes(snoVal));
    if (productVal) filteredOrders = filteredOrders.filter(o => o.product && o.product.toLowerCase().includes(productVal));
    if (statusVal) filteredOrders = filteredOrders.filter(o => o.deliveryStatus === statusVal);

    // Date filter logic
    const today = new Date();
    if (dateVal) {
      filteredOrders = filteredOrders.filter(o => {
        const dDate = new Date(o.dDate);
        if (!o.dDate) return false;
        if (dateVal === "today") return dDate.toDateString() === today.toDateString();
        if (dateVal === "tomorrow") {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          return dDate.toDateString() === tomorrow.toDateString();
        }
        if (dateVal === "thisweek") {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return dDate >= weekStart && dDate <= weekEnd;
        }
        if (dateVal === "thismonth") {
          return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
      if (dateVal === "asc") {
        filteredOrders = filteredOrders.sort((a, b) => new Date(a.dDate) - new Date(b.dDate));
      }
      if (dateVal === "desc") {
        filteredOrders = filteredOrders.sort((a, b) => new Date(b.dDate) - new Date(a.dDate));
      }
    }

    renderOrdersTable(main, filteredOrders);
  };
  // --- FILTER BAR CODE END ---

  renderOrdersTable(main);
}

function renderOrdersTable(main, filteredOrders) {
  let orders = filteredOrders || window.appState.orders;
  const table = document.createElement("table");
  table.className = "orders-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>S No</th><th>Delivery Date</th><th>Product</th>
        <th>Staff</th><th>Entry Statuses</th><th>Delivery Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${
        orders.map(order => {
          let entryStatuses = window.appState.entryStatuses[order.sno] || [];
          let statuses = entryStatuses.map(es => `${es.product} ${es.package?"✔️":"❌"}`).join(" | ");
          return `
            <tr class="${rowColorClass(order.deliveryStatus)}" data-sno="${order.sno}">
              <td>${order.sno}</td>
              <td>${order.dDate}</td>
              <td>${order.product}</td>
              <td>${order.staffName || ""}</td>
              <td>${statuses}</td>
              <td>${statusLabel(order.deliveryStatus)}</td>
              <td>
                <button class="small-btn" onclick="event.stopPropagation(); showOrderDetails('${order.sno}', document.getElementById('main'));">Full Details</button>
                <button class="small-btn" onclick="event.stopPropagation(); editOrderDetails('${order.sno}')">Edit</button>
              </td>
            </tr>
          `;
        }).join("")
      }
    </tbody>
  `;
  // Use event delegation for row click
  table.querySelectorAll("tbody tr").forEach(tr => {
    tr.onclick = (e) => {
      // Only open details if not clicking edit/full detail buttons
      if (!e.target.classList.contains("small-btn")) {
        showOrderDetails(tr.getAttribute("data-sno"), main);
      }
    };
  });
  main.appendChild(table);
}

function showOrderDetails(sno, main) {
  // Remove existing details section for scroll-to-top
  const prevDetails = main.querySelector(".details-section");
  if (prevDetails) prevDetails.remove();

  const order = window.appState.orders.find(o => String(o.sno) === String(sno));
  if(!order) return;
  let entryStatuses = window.appState.entryStatuses[sno] || [];
  let statuses = entryStatuses.map(es => `${es.product} ${es.package?"✔️":"❌"}`).join(" | ");
  let details = document.createElement("div");
  details.className = "details-section";
  details.innerHTML = `
    <h3>Order Details</h3>
    <p><strong>S No:</strong> ${order.sno}</p>
    <p><strong>Product:</strong> ${order.product}</p>
    <p><strong>Additional:</strong> ${order.additional}</p>
    <p><strong>Order Date:</strong> ${order.oDate}</p>
    <p><strong>Delivery Date:</strong> ${order.dDate}</p>
    <p><strong>Telephone:</strong> ${order.tel}</p>
    <p><strong>Staff:</strong> ${order.staffName}</p>
    <p><strong>Entry Statuses:</strong> ${statuses}</p>
    <p><strong>Delivery Status:</strong> ${statusLabel(order.deliveryStatus)}</p>
    <p><strong>Image:</strong>${order.link ? `<br><img src="${order.link}" alt="Product Image"/><br><a href="${order.link}" download class="btn-action">Download Image</a>` : ""}</p>
    <button class="btn-action" onclick="this.parentElement.remove()">Close Details</button>
    <button class="btn-action" onclick="editOrderDetails('${order.sno}')">Edit Details</button>
  `;
  main.appendChild(details);
  details.scrollIntoView({behavior: "smooth"});
}

function editOrderDetails(sno) {
  showPage('orders');
  setTimeout(() => {
    const order = window.appState.orders.find(o => String(o.sno) === String(sno));
    if (!order) return;
    document.getElementById("order-sno").value = order.sno;
    document.getElementById("order-product").value = order.product;
    document.getElementById("order-additional").value = order.additional;
    document.getElementById("order-o-date").value = order.oDate;
    document.getElementById("order-d-date").value = order.dDate;
    document.getElementById("order-telephone").value = order.tel;
    document.getElementById("order-link").value = order.link;
    document.getElementById("order-delivery-status").value = order.deliveryStatus;
  }, 400);
}

async function renderOrdersPage(main) {
  await fetchSheetData();
  main.innerHTML = `<h2>Add/Update Order</h2>`;
  const form = document.createElement("form");
  form.className = "form-section";
  form.innerHTML = `
    <div class="input-group"><label>S No</label><input type="number" id="order-sno" required></div>
    <div class="input-group"><label>Product</label>
      <input type="text" id="order-product" required placeholder="Type product name"/>
    </div>
    <div class="input-group"><label>Additional</label><input type="text" id="order-additional"></div>
    <div class="input-group"><label>Order Date</label><input type="date" id="order-o-date" required></div>
    <div class="input-group"><label>Delivery Date</label><input type="date" id="order-d-date" required></div>
    <div class="input-group"><label>Telephone</label><input type="tel" id="order-telephone" required></div>
    <div class="input-group"><label>Image Link</label><input type="url" id="order-link"></div>
    <div class="input-group"><label>Delivery Status</label>
      <select id="order-delivery-status">
        <option value="pending">Pending</option>
        <option value="delivered">Delivered</option>
        <option value="canceled">Canceled</option>
      </select>
    </div>
    <button type="submit">Save Order</button>
  `;
  form.onsubmit = async function(e) {
    e.preventDefault();
    const sno = form.querySelector("#order-sno").value;
    const product = form.querySelector("#order-product").value;
    const additional = form.querySelector("#order-additional").value;
    const oDate = form.querySelector("#order-o-date").value;
    const dDate = form.querySelector("#order-d-date").value;
    const tel = form.querySelector("#order-telephone").value;
    const link = form.querySelector("#order-link").value;
    const deliveryStatus = form.querySelector("#order-delivery-status").value;
    let staffName = "";
    for(const billbook in window.appState.staffBook) {
      if(withinRange(sno, billbook)) staffName = window.appState.staffBook[billbook];
    }
    const order = { sno, product, additional, oDate, dDate, tel, link, deliveryStatus, staffName };
    await saveOrderToSheet(order);
    alert("Order saved!");
    showPage("orders");
  };
  main.appendChild(form);
}

async function renderStaffBillbookPage(main) {
  await fetchSheetData();
  main.innerHTML = `<h2>Staff/Billbook Assignment</h2>`;
  const addDiv = document.createElement("div");
  addDiv.className = "form-section";
  addDiv.innerHTML = `
    <div class="input-group">
      <label>Billbook Number</label>
      <input type="text" id="new-billbook" placeholder="e.g. 301-350"/>
      <label>Staff Name</label>
      <input type="text" id="new-staff" placeholder="Staff Name"/>
      <button class="btn-action" id="btn-add-billbook">Add Billbook</button>
    </div>
  `;
  addDiv.querySelector("#btn-add-billbook").onclick = async function() {
    const billbook = addDiv.querySelector("#new-billbook").value.trim();
    const staff = addDiv.querySelector("#new-staff").value.trim();
    if(!billbook || !staff) return alert("Enter both billbook and staff name.");
    window.appState.staffBook[billbook] = staff;
    await saveStaffBookToSheet(window.appState.staffBook);
    alert("Billbook added!");
    showPage("staff");
  };
  main.appendChild(addDiv);

  const listDiv = document.createElement("div");
  listDiv.className = "billbook-list";
  listDiv.innerHTML = `<h3>Billbooks</h3>`;
  Object.entries(window.appState.staffBook).forEach(([billbook, staff]) => {
    const item = document.createElement("div");
    item.className = "billbook-item";
    item.innerHTML = `<input value="${billbook}" disabled/><span>${staff}</span>`;
    listDiv.appendChild(item);
  });
  main.appendChild(listDiv);
}

async function renderEntryStatusPage(main) {
  await fetchSheetData();
  main.innerHTML = `<h2>Entry Status</h2>`;
  const form = document.createElement("form");
  form.className = "form-section";
  form.innerHTML = `
    <div class="input-group"><label>S No</label><input type="number" id="status-sno" required></div>
    <div class="input-group"><label>Product</label>
      <select id="status-product" required>
        <option value="sherwani">Sherwani</option>
        <option value="indo western">Indo Western</option>
        <option value="jodhpuri">Jodhpuri</option>
        <option value="coat pant">Coat Pant</option>
      </select>
    </div>
    <div class="input-group">
      <label>Pakage?</label>
      <select id="status-pakage">
        <option value="yes">Yes</option>
        <option value="no" selected>No</option>
      </select>
    </div>
    <button type="submit">Add Entry Status</button>
  `;
  form.onsubmit = async function(e) {
    e.preventDefault();
    const sno = form.querySelector("#status-sno").value;
    const product = form.querySelector("#status-product").value;
    const pkg = form.querySelector("#status-pakage").value === "yes";
    if(!window.appState.entryStatuses[sno]) window.appState.entryStatuses[sno] = [];
    window.appState.entryStatuses[sno].push({ product, package: pkg });
    await saveEntryStatusToSheet(window.appState.entryStatuses);
    alert("Entry status added!");
    showPage("status");
  };
  main.appendChild(form);

  const table = document.createElement("table");
  table.className = "orders-table";
  table.innerHTML = `
    <thead><tr><th>S No</th><th>Products</th></tr></thead>
    <tbody>
      ${Object.entries(window.appState.entryStatuses).map(([sno, arr]) => `
        <tr>
          <td>${sno}</td>
          <td>${arr.map(entry => `${entry.product} ${entry.package ? "✔️" : "❌"}`).join(" | ")}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
  main.appendChild(table);
}

async function renderDeliveryPage(main) {
  await fetchSheetData();
  main.innerHTML = `<h2>Delivery Status</h2>`;
  const form = document.createElement("form");
  form.className = "form-section";
  form.innerHTML = `
    <div class="input-group"><label>S No</label><input type="number" id="delivery-sno" required></div>
    <button type="submit">Show Details</button>
    <div id="delivery-details"></div>
  `;
  form.onsubmit = async function(e) {
    e.preventDefault();
    const sno = form.querySelector("#delivery-sno").value;
    const order = window.appState.orders.find(o => String(o.sno) === String(sno));
    const detailsDiv = form.querySelector("#delivery-details");
    if(!order) {
      detailsDiv.innerHTML = `<p>Order not found.</p>`;
      return;
    }
    let entryStatuses = window.appState.entryStatuses[sno] || [];
    let statuses = entryStatuses.map(es => `${es.product} ${es.package?"✔️":"❌"}`).join(" | ");
    detailsDiv.innerHTML = `
      <div class="details-section">
        <h3>Order Details</h3>
        <p><strong>S No:</strong> ${order.sno}</p>
        <p><strong>Product:</strong> ${order.product}</p>
        <p><strong>Additional:</strong> ${order.additional}</p>
        <p><strong>Order Date:</strong> ${order.oDate}</p>
        <p><strong>Delivery Date:</strong> ${order.dDate}</p>
        <p><strong>Telephone:</strong> ${order.tel}</p>
        <p><strong>Staff:</strong> ${order.staffName}</p>
        <p><strong>Entry Statuses:</strong> ${statuses}</p>
        <p><strong>Delivery Status:</strong>
          <select id="delivery-status-select">
            <option value="delivered" ${order.deliveryStatus==="delivered"?"selected":""}>Delivered</option>
            <option value="pending" ${order.deliveryStatus==="pending"?"selected":""}>Pending</option>
            <option value="canceled" ${order.deliveryStatus==="canceled"?"selected":""}>Canceled</option>
          </select>
        </p>
        <p><strong>Image:</strong>${order.link ? `<br><img src="${order.link}" alt="Product Image"/><br><a href="${order.link}" download class="btn-action">Download Image</a>` : ""}</p>
        <button class="btn-action" id="btn-update-delivery">Update Delivery Status</button>
      </div>
    `;
    detailsDiv.scrollIntoView({behavior:"smooth"});
    document.getElementById("btn-update-delivery").onclick = async function() {
      order.deliveryStatus = document.getElementById("delivery-status-select").value;
      await saveOrderToSheet(order);
      alert("Delivery status updated!");
      showPage("delivery");
    };
  };
  main.appendChild(form);
}

// --------- Utility ---------
function withinRange(val, range) {
  if(!range.includes("-")) return false;
  const [from,to] = range.split("-").map(Number);
  return +val >= from && +val <= to;
}
function rowColorClass(status) {
  if(status==="delivered") return "order-delivered";
  if(status==="pending") return "order-pending";
  if(status==="canceled") return "order-canceled";
  return "";
}
function statusLabel(status) {
  if(status==="delivered") return "Delivered";
  if(status==="pending") return "Pending";
  if(status==="canceled") return "Canceled";
  return "";
}

// ------- Navigation -------
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("nav-main").onclick = () => showPage("main");
  document.getElementById("nav-orders").onclick = () => showPage("orders");
  document.getElementById("nav-staff").onclick = () => showPage("staff");
  document.getElementById("nav-status").onclick = () => showPage("status");
  document.getElementById("nav-delivery").onclick = () => showPage("delivery");
  showPage("main");
});

function showPage(page) {
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  document.getElementById("nav-" + page).classList.add("active");
  const main = document.getElementById("main");
  main.innerHTML = "";
  pages[page](main);
}