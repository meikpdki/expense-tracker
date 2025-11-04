const DELETE_PASSWORD = "meikpdki";

let expenses = [];
let currentTheme = "Dark";
let currentFileTargetId = null;

// ถ้า Chart.js โหลดไม่ได้ ให้ใช้ fallback เพื่อไม่ให้โค้ดพัง
(function(){
  if (typeof window.Chart === "undefined") {
    window.Chart = function(){ return { data:{labels:[],datasets:[{data:[]}]}, update:function(){}, destroy:function(){} }; };
  }
})();

// ===== DOM =====
const listEl = document.getElementById("list");
const addBtn = document.getElementById("addBtn");
const themeSelect = document.getElementById("themeSelect");
const totalBalanceInput = document.getElementById("totalBalance");
const remainingLabel = document.getElementById("remainingLabel");
const hiddenFileInput = document.getElementById("hiddenFileInput");
const imgModal = document.getElementById("imgModal");
const previewImg = document.getElementById("previewImg");
const closeModal = document.getElementById("closeModal");
const globalDate = document.getElementById("globalDate");
const searchInput = document.getElementById("searchInput");
const syncBtn = document.getElementById("syncBtn");
const deleteCloudBtn = document.getElementById("deleteCloudBtn");

// ===== Charts =====
const lineCtx = document.getElementById("lineCanvas").getContext("2d");
const pieCtx  = document.getElementById("pieCanvas").getContext("2d");

const lineChart = new Chart(lineCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Expenses", data: [], borderColor: "#23d3ff", backgroundColor: "rgba(35,211,255,0.4)", tension: 0.5, fill: true, pointRadius: 3 }] },
  options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.05)" } }, y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.04)" } } }, plugins: { legend: { labels: { color: "#fff" } } } }
});

const pieChart = new Chart(pieCtx, {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true } } }
});

function renderList(){
  const keyword = searchInput.value.trim().toLowerCase();
  listEl.innerHTML = "";
  expenses.filter(function(it){ return it.name.toLowerCase().includes(keyword); }).forEach(function(item){
    const row = document.createElement("div"); row.className = "row"; row.dataset.id = item.id;

    const dateInput = document.createElement("input"); dateInput.type = "datetime-local"; dateInput.value = toDatetimeLocalValue(item.date);
    dateInput.addEventListener("change", function(e){ item.date = fromDatetimeLocalValue(e.target.value); updateCharts(); });

    const nameInput = document.createElement("input"); nameInput.type = "text"; nameInput.value = item.name;
    nameInput.addEventListener("input", function(e){ item.name = e.target.value; updateCharts(); });

    const amountInput = document.createElement("input"); amountInput.type = "number"; amountInput.value = item.amount;
    amountInput.addEventListener("input", function(e){ item.amount = Number(e.target.value || 0); calcRemaining(); updateCharts(); });

    // Enter focus chain
    dateInput.addEventListener("keydown", function(e){ if(e.key === "Enter"){ nameInput.focus(); } });
    nameInput.addEventListener("keydown", function(e){ if(e.key === "Enter"){ amountInput.focus(); amountInput.select(); } });
    amountInput.addEventListener("keydown", function(e){ if(e.key === "Enter"){ focusNextRowName(item.id); } });

    const chooseBtn = document.createElement("button"); chooseBtn.className = "primary action-btn"; chooseBtn.textContent = "เลือกไฟล์"; chooseBtn.addEventListener("click", function(){ currentFileTargetId = item.id; hiddenFileInput.click(); });
    const viewBtn = document.createElement("button"); viewBtn.className = "primary secondary action-btn"; viewBtn.textContent = "view"; viewBtn.addEventListener("click", function(){ if(item.image){ previewImg.src = item.image; imgModal.style.display = "flex"; } else { alert("ยังไม่มีรูปในแถวนี้"); } });
    const delBtn = document.createElement("button"); delBtn.className = "danger action-btn"; delBtn.textContent = "Delete"; delBtn.addEventListener("click", function(){ expenses = expenses.filter(function(x){ return x.id !== item.id; }); renderList(); updateCharts(); calcRemaining(); });

    row.append(dateInput, nameInput, amountInput, chooseBtn, viewBtn, delBtn);
    listEl.appendChild(row);
  });
}

function toDatetimeLocalValue(s){ return !s ? "" : (s.indexOf("T") !== -1 ? s : s.replace(" ", "T")); }
function fromDatetimeLocalValue(s){ return !s ? "" : s.replace("T", " "); }

function updateCharts(){
  lineChart.data.labels = expenses.map(function(_, i){ return i + 1; });
  lineChart.data.datasets[0].data = expenses.map(function(x){ return x.amount; });
  lineChart.update();

  const active = expenses.filter(function(x){ return Number(x.amount) > 0; });
  const MAX = 8;
  const base = active.length <= MAX ? active : active.slice(0, MAX);
  const labels = base.map(function(x){ return x.name; });
  const values = base.map(function(x){ return x.amount; });
  if (active.length > MAX){ labels.push("อื่นๆ"); values.push(active.slice(MAX).reduce(function(s, x){ return s + Number(x.amount || 0); }, 0)); }
  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = values;
  pieChart.data.datasets[0].backgroundColor = generateColors(values.length);
  pieChart.update();
}

function generateColors(n){ var base = ["#23d3ff", "#ffbe55", "#ff5e7e", "#63ff9e", "#d35dff", "#ff8f3d", "#8affff", "#ffe45e", "#74ff6a", "#ff6ab7"]; var arr = []; for(var i=0;i<n;i++){ arr.push(base[i % base.length]); } return arr; }
function calcRemaining(){ var total = Number(totalBalanceInput.value || 0); var spent = expenses.reduce(function(s, x){ return s + Number(x.amount || 0); }, 0); remainingLabel.textContent = "Remaining: " + (total - spent); }
function createExpenseRow(){ var now = new Date(); var d = now.toISOString().slice(0,10); var t = now.toTimeString().slice(0,5); return { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)), date: d + " " + t, name: "New Item", amount: 0, image: "" }; }
function focusNextRowName(currentId){ var idx = expenses.findIndex(function(x){ return x.id === currentId; }); if(idx !== -1 && idx + 1 < expenses.length){ var nextId = expenses[idx + 1].id; var nextRow = listEl.querySelector('.row[data-id="' + nextId + '"]'); if(nextRow){ var inp = nextRow.querySelector('input[type="text"]'); if(inp){ inp.focus(); inp.select(); } } } else { var r = createExpenseRow(); expenses.push(r); renderList(); updateCharts(); calcRemaining(); var rowEl = listEl.querySelector('.row[data-id="' + r.id + '"]'); var inp2 = rowEl && rowEl.querySelector('input[type="text"]'); if(inp2){ inp2.focus(); } } }
function applyTheme(theme){ document.body.classList.remove("theme-Dark", "theme-Blue", "theme-Green"); document.body.classList.add("theme-" + theme); currentTheme = theme; }

function payloadFromUI(){ return { expenses: expenses, totalBalance: Number(totalBalanceInput.value || 0), theme: currentTheme }; }
function applyPayload(p){ expenses = (p && p.expenses) ? p.expenses : []; totalBalanceInput.value = (p && typeof p.totalBalance !== 'undefined') ? p.totalBalance : totalBalanceInput.value; applyTheme((p && p.theme) ? p.theme : currentTheme); renderList(); updateCharts(); calcRemaining(); }

async function syncToCloud(){ if(!window.fb){ alert('Firebase ยังไม่โหลด'); return; } const id = await window.fb.write(payloadFromUI()); const shareUrl = location.origin + location.pathname + '?id=' + id; try{ await navigator.clipboard.writeText(shareUrl); }catch(e){} window.fb.setLocalId(id); window.fb.onLive(id, function(live){ if(live){ applyPayload(live); } }); alert('ซิงก์สำเร็จ!\nลิงก์ถูกคัดลอกแล้ว:\n' + shareUrl); }

// ===== Delete (Selective) =====
const deleteModal = document.getElementById('deleteModal');
const deleteListEl = document.getElementById('deleteList');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeDeleteModal = document.getElementById('closeDeleteModal');

function openDeleteModal(){
  deleteListEl.innerHTML = '';
  if(!expenses.length){ deleteListEl.innerHTML = '<div style="opacity:.8">ไม่มีรายการให้ลบ</div>'; }
  else {
    expenses.forEach(function(x){
      var div = document.createElement('div');
      div.className = 'delete-item';
      div.innerHTML = '<input type="checkbox" class="delchk" value="' + x.id + '"><div><div><strong>' + escapeHtml(x.name) + '</strong> — ' + Number(x.amount || 0) + '</div><div class="meta">' + escapeHtml(x.date) + '</div></div>';
      deleteListEl.appendChild(div);
    });
  }
  deleteModal.style.display = 'flex';
}
function closeDelete(){ deleteModal.style.display = 'none'; }
function escapeHtml(s){
  var map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return String(s).replace(/[&<>"']/g, function(m){ return map[m]; });
}

async function deleteSyncedSelective(){ if(!window.fb){ alert('Firebase ยังไม่โหลด'); return; } var pass = prompt('กรอกรหัสเพื่อลบข้อมูลที่ซิงก์:'); if(pass !== DELETE_PASSWORD){ alert('รหัสไม่ถูกต้อง'); return; } openDeleteModal(); }

deleteSelectedBtn && deleteSelectedBtn.addEventListener('click', async function(){
  var ids = new Set([].map.call(deleteListEl.querySelectorAll('.delchk:checked'), function(c){ return c.value; }));
  if(!ids.size){ alert('ยังไม่ได้เลือกแถว'); return; }
  expenses = expenses.filter(function(x){ return !ids.has(x.id); });
  await window.fb.write(payloadFromUI());
  closeDelete(); renderList(); updateCharts(); calcRemaining();
  alert('ลบแถวที่เลือกบนคลาวด์เรียบร้อย');
});

deleteAllBtn && deleteAllBtn.addEventListener('click', async function(){
  var ok = confirm('ลบทั้งหมดบนคลาวด์?'); if(!ok) return;
  var params = new URLSearchParams(location.search);
  var id = params.get('id') || (window.fb && window.fb.getLocalId());
  if(!id){ alert('ยังไม่มีข้อมูลที่ซิงก์ในลิงก์นี้'); return; }
  await window.fb.del(id);
  closeDelete(); alert('ลบทั้งหมดบนคลาวด์เรียบร้อย');
});

[cancelDeleteBtn, closeDeleteModal].forEach(function(btn){ if(btn){ btn.addEventListener('click', closeDelete); }});

async function loadFromFirebaseLinkIfAny(){
  if(!window.fb) return;
  var params = new URLSearchParams(location.search);
  var id = params.get('id');
  if(!id) return;
  window.fb.setLocalId(id);
  var payload = await window.fb.read(id);
  if(payload) applyPayload(payload);
  window.fb.onLive(id, function(live){ if(live){ applyPayload(live); } });
}

addBtn.addEventListener('click', function(){ var item = createExpenseRow(); expenses.push(item); renderList(); updateCharts(); calcRemaining(); });

themeSelect.addEventListener('change', function(e){ applyTheme(e.target.value); });

totalBalanceInput.addEventListener('input', calcRemaining);

hiddenFileInput.addEventListener('change', function(e){ var file = e.target.files[0]; if(!file || !currentFileTargetId) return; var reader = new FileReader(); reader.onload = function(){ var it = expenses.find(function(x){ return x.id === currentFileTargetId; }); if(it) it.image = reader.result; currentFileTargetId = null; hiddenFileInput.value = ""; }; reader.readAsDataURL(file); });

closeModal.addEventListener('click', function(){ imgModal.style.display = 'none'; });
window.addEventListener('click', function(e){ if(e.target === imgModal){ imgModal.style.display = 'none'; } });

globalDate.addEventListener('change', function(e){ var val = e.target.value; if(!val) return; expenses.forEach(function(x){ var timePart = (x.date.split(' ')[1] || '00:00'); x.date = val + ' ' + timePart; }); renderList(); updateCharts(); });

searchInput.addEventListener('input', renderList);

syncBtn.addEventListener('click', function(){ syncToCloud().catch(function(e){ alert('ซิงก์ไม่สำเร็จ: ' + e.message); }); });

deleteCloudBtn.addEventListener('click', function(){ deleteSyncedSelective().catch(function(e){ alert('ลบไม่สำเร็จ: ' + e.message); }); });

function init(){ applyTheme(themeSelect.value || 'Dark'); for(var i=0;i<3;i++){ expenses.push(createExpenseRow()); } loadFromFirebaseLinkIfAny().then(function(){ renderList(); updateCharts(); calcRemaining(); }); }

document.addEventListener('DOMContentLoaded', init);
