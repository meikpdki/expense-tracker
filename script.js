const DELETE_PASSWORD = "meikpdki";

let expenses = [];
let currentTheme = "Dark";
let currentFileTargetId = null;

// ===== Chart fallback (กันพังถ้าโหลดไม่ขึ้น) =====
(function () {
  if (typeof window.Chart === "undefined") {
    console.warn("[Safe] Chart.js not found → using fallback");
    window.Chart = function () {
      return { data: { labels: [], datasets: [{ data: [] }] }, update() {}, destroy() {} };
    };
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
  options: { responsive: true, maintainAspectRatio: false,
    scales: { x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.05)" } },
             y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.04)" } } },
    plugins: { legend: { labels: { color: "#fff" } } }
  }
});

const pieChart = new Chart(pieCtx, {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true } } }
});

// ===== List render =====
function renderList(){
  const keyword = searchInput.value.trim().toLowerCase();
  listEl.innerHTML = "";
  expenses.filter(it => it.name.toLowerCase().includes(keyword)).forEach(item => {
    const row = document.createElement("div"); row.className = "row"; row.dataset.id = item.id;

    const dateInput = document.createElement("input"); dateInput.type = "datetime-local"; dateInput.value = toDatetimeLocalValue(item.date);
    dateInput.addEventListener("change", e => { item.date = fromDatetimeLocalValue(e.target.value); updateCharts(); });
    dateInput.addEventListener("keydown", e => { if(e.key==="Enter") nameInput.focus(); });

    const nameInput = document.createElement("input"); nameInput.type = "text"; nameInput.value = item.name;
    nameInput.addEventListener("input", e => { item.name = e.target.value; updateCharts(); });
    nameInput.addEventListener("keydown", e => { if(e.key==="Enter"){ amountInput.focus(); amountInput.select(); } });

    const amountInput = document.createElement("input"); amountInput.type = "number"; amountInput.value = item.amount;
    amountInput.addEventListener("input", e => { item.amount = Number(e.target.value||0); calcRemaining(); updateCharts(); });
    amountInput.addEventListener("keydown", e => { if(e.key==="Enter") focusNextRowName(item.id); });

    const chooseBtn = document.createElement("button"); chooseBtn.className = "primary action-btn"; chooseBtn.textContent = "เลือกไฟล์";
    chooseBtn.addEventListener("click", () => { currentFileTargetId = item.id; hiddenFileInput.click(); });

    const viewBtn = document.createElement("button"); viewBtn.className = "primary secondary action-btn"; viewBtn.textContent = "view";
    viewBtn.addEventListener("click", () => { if(item.image){ previewImg.src = item.image; imgModal.style.display = "flex"; } else { alert("ยังไม่มีรูปในแถวนี้"); } });

    const delBtn = document.createElement("button"); delBtn.className = "danger action-btn"; delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => { expenses = expenses.filter(x => x.id !== item.id); renderList(); updateCharts(); calcRemaining(); });

    row.append(dateInput, nameInput, amountInput, chooseBtn, viewBtn, delBtn);
    listEl.appendChild(row);
  });
}

function toDatetimeLocalValue(s){ return !s ? "" : (s.includes("T") ? s : s.replace(" ","T")); }
function fromDatetimeLocalValue(s){ return !s ? "" : s.replace("T"," "); }

function updateCharts(){
  lineChart.data.labels = expenses.map((_,i)=>i+1);
  lineChart.data.datasets[0].data = expenses.map(x=>x.amount);
  lineChart.update();

  const active = expenses.filter(x=>Number(x.amount)>0);
  const MAX = 8;
  const base = active.length<=MAX ? active : active.slice(0,MAX);
  const labels = base.map(x=>x.name);
  const values = base.map(x=>x.amount);
  if(active.length>MAX){
    labels.push("อื่นๆ");
    values.push(active.slice(MAX).reduce((s,x)=>s+Number(x.amount||0),0));
  }
  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = values;
  pieChart.data.datasets[0].backgroundColor = generateColors(values.length);
  pieChart.update();
}

function generateColors(n){ const base=["#23d3ff","#ffbe55","#ff5e7e","#63ff9e","#d35dff","#ff8f3d","#8affff","#ffe45e","#74ff6a","#ff6ab7"]; return Array.from({length:n},(_,i)=>base[i%base.length]); }
function calcRemaining(){ const total=Number(totalBalanceInput.value||0); const spent=expenses.reduce((s,x)=>s+Number(x.amount||0),0); remainingLabel.textContent = "Remaining: "+(total-spent); }
function createExpenseRow(){ const now=new Date(); const d=now.toISOString().slice(0,10); const t=now.toTimeString().slice(0,5); return { id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2)), date:`${d} ${t}`, name:"New Item", amount:0, image:"" }; }
function focusNextRowName(currentId){ const idx=expenses.findIndex(x=>x.id===currentId); if(idx!==-1 && idx+1<expenses.length){ const nextId=expenses[idx+1].id; const nextRow=listEl.querySelector(`.row[data-id="${nextId}"]`); if(nextRow){ const inp=nextRow.querySelector('input[type="text"]'); inp && (inp.focus(), inp.select()); } } else { const r=createExpenseRow(); expenses.push(r); renderList(); updateCharts(); calcRemaining(); const rowEl=listEl.querySelector(`.row[data-id="${r.id}"]`); const inp=rowEl && rowEl.querySelector('input[type="text"]'); inp && inp.focus(); } }
function applyTheme(theme){ document.body.classList.remove("theme-Dark","theme-Blue","theme-Green"); document.body.classList.add(`theme-${theme}`); currentTheme = theme; }

function payloadFromUI(){ return { expenses, totalBalance:Number(totalBalanceInput.value||0), theme: currentTheme }; }
function applyPayload(p){ expenses = p?.expenses || []; totalBalanceInput.value = p?.totalBalance ?? totalBalanceInput.value; applyTheme(p?.theme || currentTheme); renderList(); updateCharts(); calcRemaining(); }

// ===== Cloud Sync (Firebase) =====
async function syncToCloud(){
  if(!window.fb){ alert("Firebase ยังไม่โหลด"); return; }
  const id = await window.fb.write(payloadFromUI());
  window.fb.setLocalId(id);

  // ใส่ ?id=... ให้ลิงก์ปัจจุบัน และผูก realtime ทันที
  const url = new URL(location.href);
  url.searchParams.set("id", id);
  history.replaceState(null, "", url.toString());

  window.fb.onLive(id, live => { if(live) applyPayload(live); });
  // คัดลอกลิงก์ให้ด้วย
  const shareUrl = `${location.origin}${location.pathname}?id=${id}`;
  try{ await navigator.clipboard.writeText(shareUrl); }catch{}
  alert(`ซิงก์สำเร็จ!\nลิงก์ถูกคัดลอกแล้ว:\n${shareUrl}`);
}

// ลบแบบมีรหัสผ่าน + เลือกแถว
const deleteModal = document.getElementById('deleteModal');
const deleteListEl = document.getElementById('deleteList');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeDeleteModal = document.getElementById('closeDeleteModal');

function openDeleteModal(){
  deleteListEl.innerHTML = "";
  if(!expenses.length){ deleteListEl.innerHTML = '<div style="opacity:.8">ไม่มีรายการให้ลบ</div>'; }
  else{
    expenses.forEach(x=>{
      const div = document.createElement('div');
      div.className = 'delete-item';
      div.style = "display:flex;gap:.5rem;align-items:flex-start;margin:.25rem 0;";
      div.innerHTML = `<input type="checkbox" class="delchk" value="${x.id}">
      <div><div><strong>${escapeHtml(x.name)}</strong> — ${Number(x.amount||0)}</div>
      <div class="meta" style="opacity:.75">${escapeHtml(x.date)}</div></div>`;
      deleteListEl.appendChild(div);
    });
  }
  deleteModal.style.display = 'flex';
}
function closeDelete(){ deleteModal.style.display = 'none'; }
function escapeHtml(s){ const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}; return String(s).replace(/[&<>"']/g,m=>map[m]); }

async function deleteSyncedSelective(){
  if(!window.fb){ alert('Firebase ยังไม่โหลด'); return; }
  const pass = prompt('กรอกรหัสเพื่อลบข้อมูลที่ซิงก์:');
  if(pass !== DELETE_PASSWORD){ alert('รหัสไม่ถูกต้อง'); return; }
  openDeleteModal();
}

deleteSelectedBtn && deleteSelectedBtn.addEventListener('click', async ()=>{
  const ids = new Set([...deleteListEl.querySelectorAll('.delchk:checked')].map(c=>c.value));
  if(!ids.size){ alert('ยังไม่ได้เลือกแถว'); return; }
  expenses = expenses.filter(x=>!ids.has(x.id));
  await window.fb.write(payloadFromUI());
  closeDelete(); renderList(); updateCharts(); calcRemaining();
  alert('ลบแถวที่เลือกบนคลาวด์เรียบร้อย');
});

deleteAllBtn && deleteAllBtn.addEventListener('click', async ()=>{
  const ok = confirm('ลบทั้งหมดบนคลาวด์?'); if(!ok) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || (window.fb && window.fb.getLocalId());
  if(!id){ alert('ยังไม่มีข้อมูลที่ซิงก์ในลิงก์นี้'); return; }
  await window.fb.del(id);
  closeDelete(); alert('ลบทั้งหมดบนคลาวด์เรียบร้อย');
});

[cancelDeleteBtn, closeDeleteModal].forEach(btn => btn && btn.addEventListener('click', closeDelete));

// ===== Load on start =====
async function loadFromFirebaseIfAny(){
  if(!window.fb) return;

  const params = new URLSearchParams(location.search);
  let id = params.get('id');

  // ถ้า URL ไม่มี id ให้ลองดึงจาก localStorage
  if(!id){ id = window.fb.getLocalId(); if(id){ const url=new URL(location.href); url.searchParams.set('id', id); history.replaceState(null,'',url.toString()); } }

  if(!id) return;

  window.fb.setLocalId(id);
  const payload = await window.fb.read(id);
  if(payload) applyPayload(payload);

  // realtime ต่อให้เสมอ
  window.fb.onLive(id, live => { if(live) applyPayload(live); });
}

// ===== Events =====
addBtn.addEventListener("click", ()=>{ const item=createExpenseRow(); expenses.push(item); renderList(); updateCharts(); calcRemaining(); });
themeSelect.addEventListener("change", e=>applyTheme(e.target.value));
totalBalanceInput.addEventListener("input", calcRemaining);
hiddenFileInput.addEventListener("change", e=>{
  const file=e.target.files[0]; if(!file||!currentFileTargetId) return;
  const reader=new FileReader();
  reader.onload=()=>{ const it=expenses.find(x=>x.id===currentFileTargetId); if(it) it.image=reader.result; currentFileTargetId=null; hiddenFileInput.value=""; };
  reader.readAsDataURL(file);
});
closeModal.addEventListener("click", ()=> imgModal.style.display="none");
window.addEventListener("click", e=>{ if(e.target===imgModal) imgModal.style.display="none"; });
globalDate.addEventListener("change", e=>{
  const val=e.target.value; if(!val) return;
  expenses.forEach(x=>{ const timePart=(x.date.split(' ')[1]||'00:00'); x.date=`${val} ${timePart}`; });
  renderList(); updateCharts();
});
searchInput.addEventListener("input", renderList);
syncBtn.addEventListener("click", ()=>{ syncToCloud().catch(e=>alert('ซิงก์ไม่สำเร็จ: '+e.message)); });
deleteCloudBtn.addEventListener("click", ()=>{ deleteSyncedSelective().catch(e=>alert('ลบไม่สำเร็จ: '+e.message)); });

// ===== Init =====
function init(){
  applyTheme(themeSelect.value || "Dark");
  if(!expenses.length){ for(let i=0;i<3;i++) expenses.push(createExpenseRow()); }
  loadFromFirebaseIfAny().then(()=>{ renderList(); updateCharts(); calcRemaining(); });
}
document.addEventListener("DOMContentLoaded", init);
