// -------------------- QUICK SAFETIES --------------------
// -------------------- LIST RENDER --------------------
function renderList(){
const keyword = searchInput.value.trim().toLowerCase();
listEl.innerHTML = '';
expenses.filter(it => it.name.toLowerCase().includes(keyword)).forEach(item => {
const row = document.createElement('div'); row.className = 'row'; row.dataset.id = item.id;


const dateInput = document.createElement('input');
dateInput.type = 'datetime-local';
dateInput.value = toDatetimeLocalValue(item.date);
dateInput.addEventListener('change', e => { item.date = fromDatetimeLocalValue(e.target.value); updateCharts(); });
dateInput.addEventListener('keydown', e => { if(e.key==='Enter') nameInput.focus(); });


const nameInput = document.createElement('input');
nameInput.type = 'text'; nameInput.value = item.name;
nameInput.addEventListener('input', e => { item.name = e.target.value; updateCharts(); });
nameInput.addEventListener('keydown', e => { if(e.key==='Enter'){ amountInput.focus(); amountInput.select(); } });


const amountInput = document.createElement('input');
amountInput.type = 'number'; amountInput.value = item.amount;
amountInput.addEventListener('input', e => { item.amount = Number(e.target.value||0); calcRemaining(); updateCharts(); });
amountInput.addEventListener('keydown', e => { if(e.key==='Enter') focusNextRowName(item.id); });


const chooseBtn = document.createElement('button'); chooseBtn.className = 'primary action-btn'; chooseBtn.textContent = 'เลือกไฟล์';
chooseBtn.addEventListener('click', () => { currentFileTargetId = item.id; hiddenFileInput.click(); });


const viewBtn = document.createElement('button'); viewBtn.className = 'primary secondary action-btn'; viewBtn.textContent = 'view';
viewBtn.addEventListener('click', () => { if(item.image){ previewImg.src=item.image; imgModal.style.display='flex'; } else { alert('ยังไม่มีรูปในแถวนี้'); } });


const delBtn = document.createElement('button'); delBtn.className = 'danger action-btn'; delBtn.textContent = 'Delete';
delBtn.addEventListener('click', () => { expenses = expenses.filter(x => x.id !== item.id); renderList(); updateCharts(); calcRemaining(); });


row.append(dateInput, nameInput, amountInput, chooseBtn, viewBtn, delBtn);
listEl.appendChild(row);
});
}


// -------------------- HELPERS --------------------
const toDatetimeLocalValue = s => !s ? '' : (s.includes('T') ? s : s.replace(' ', 'T'));
const fromDatetimeLocalValue = s => !s ? '' : s.replace('T', ' ');
function generateColors(n){ const base=['#23d3ff','#ffbe55','#ff5e7e','#63ff9e','#d35dff','#ff8f3d','#8affff','#ffe45e','#74ff6a','#ff6ab7']; return Array.from({length:n},(_,i)=>base[i%base.length]); }
function calcRemaining(){ const total=Number(totalBalanceInput.value||0); const spent=expenses.reduce((s,x)=>s+Number(x.amount||0),0); remainingLabel.textContent = 'Remaining: '+(total-spent); }
function createExpenseRow(){ const now=new Date(); const d=now.toISOString().slice(0,10); const t=now.toTimeString().slice(0,5); return { id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2)), date:`${d} ${t}`, name:'New Item', amount:0, image:'' }; }
function focusNextRowName(currentId){ const idx=expenses.findIndex(x=>x.id===currentId); if(idx!==-1 && idx+1<expenses.length){ const nextId=expenses[idx+1].id; const nextRow=listEl.querySelector(`.row[data-id="${nextId}"]`); if(nextRow){ const inp=nextRow.querySelector('input[type="text"]'); inp && (inp.focus(), inp.select()); } } else { const r=createExpenseRow(); expenses.push(r); renderList(); updateCharts(); calcRemaining(); const rowEl=listEl.querySelector(`.row[data-id="${r.id}"]`); const inp=rowEl && rowEl.querySelector('input[type="text"]'); inp && inp.focus(); } }
function applyTheme(theme){ document.body.classList.remove('theme-Dark','theme-Blue','theme-Green'); document.body.classList.add(`theme-${theme}`); currentTheme=theme; }


function updateCharts(){
lineChart.data.labels = expenses.map((_,i)=>i+1);
lineChart.data.datasets[0].data = expenses.map(x=>x.amount);
lineChart.update();
const active = expenses.filter(x=>Number(x.amount)>0); const MAX=8; const base = active.length<=MAX?active:active.slice(0,MAX);
const labels = base.map(x=>x.name); const values = base.map(x=>x.amount);
if (active.length>MAX){ labels.push('อื่นๆ'); values.push(active.slice(MAX).reduce((s,x)=>s+Number(x.amount||0),0)); }
pieChart.data.labels = labels; pieChart.data.datasets[0].data = values; pieChart.data.datasets[0].backgroundColor = generateColors(values.length); pieChart.update();
}


// -------------------- EVENTS --------------------
function wireEvents(){
addBtn.addEventListener('click', ()=>{ const item=createExpenseRow(); expenses.push(item); renderList(); updateCharts(); calcRemaining(); });
themeSelect.addEventListener('change', e=> applyTheme(e.target.value));
totalBalanceInput.addEventListener('input', calcRemaining);
hiddenFileInput.addEventListener('change', e=>{ const file=e.target.files[0]; if(!file||!currentFileTargetId) return; const reader=new FileReader(); reader.onload=()=>{ const it=expenses.find(x=>x.id===currentFileTargetId); if(it) it.image=reader.result; currentFileTargetId=null; hiddenFileInput.value=''; }; reader.readAsDataURL(file); });
closeModal.addEventListener('click', ()=> (imgModal.style.display='none'));
window.addEventListener('click', e=>{ if(e.target===imgModal) imgModal.style.display='none'; });
globalDate.addEventListener('change', e=>{ const val=e.target.value; if(!val) return; expenses.forEach(x=>{ const timePart=(x.date.split(' ')[1]||'00:00'); x.date=`${val} ${timePart}`; }); renderList(); updateCharts(); });
searchInput.addEventListener('input', renderList);
}


// -------------------- INIT (safe) --------------------
function init(){
try {
applyTheme(themeSelect.value || 'Dark');
createCharts();
if (!expenses.length) for(let i=0;i<3;i++) expenses.push(createExpenseRow());
renderList(); updateCharts(); calcRemaining();
wireEvents();
console.log('[Hotfix] App initialized');
} catch(err){
console.error('[Hotfix] init failed:', err);
}
}


// เรียกอย่างปลอดภัยทั้งสองกรณี (มี/ไม่มี defer)
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}