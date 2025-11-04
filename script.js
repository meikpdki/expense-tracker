const DELETE_PASSWORD = "meikpdki";
function generateColors(n){ const base = ["#23d3ff","#ffbe55","#ff5e7e","#63ff9e","#d35dff","#ff8f3d","#8affff","#ffe45e","#74ff6a","#ff6ab7"]; return Array.from({length:n}, (_,i) => base[i % base.length]); }
function calcRemaining(){ const total = Number(totalBalanceInput.value || 0); const spent = expenses.reduce((s, x) => s + Number(x.amount || 0), 0); remainingLabel.textContent = "Remaining: " + (total - spent); }
function createExpenseRow(){ const now = new Date(); const d = now.toISOString().slice(0,10); const t = now.toTimeString().slice(0,5); return { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random().toString(36).slice(2)), date: d + " " + t, name: "New Item", amount: 0, image: "" }; }
function focusNextRowName(currentId){ const idx = expenses.findIndex(x => x.id === currentId); if(idx !== -1 && idx + 1 < expenses.length){ const nextId = expenses[idx + 1].id; const nextRow = listEl.querySelector('.row[data-id="' + nextId + '"]'); if(nextRow){ const inp = nextRow.querySelector('input[type="text"]'); if(inp){ inp.focus(); inp.select(); } } } else { const r = createExpenseRow(); expenses.push(r); renderList(); updateCharts(); calcRemaining(); const rowEl = listEl.querySelector('.row[data-id="' + r.id + '"]'); const inp2 = rowEl && rowEl.querySelector('input[type="text"]'); if(inp2){ inp2.focus(); } } }
function applyTheme(theme){ document.body.classList.remove("theme-Dark", "theme-Blue", "theme-Green"); document.body.classList.add("theme-" + theme); currentTheme = theme; }


function payloadFromUI(){ return { expenses: expenses, totalBalance: Number(totalBalanceInput.value || 0), theme: currentTheme }; }
function applyPayload(p){ expenses = (p && p.expenses) ? p.expenses : []; totalBalanceInput.value = (p && typeof p.totalBalance !== 'undefined') ? p.totalBalance : totalBalanceInput.value; applyTheme((p && p.theme) ? p.theme : currentTheme); renderList(); updateCharts(); calcRemaining(); }


async function syncToCloud(){ if(!window.fb){ alert('Firebase ยังไม่โหลด'); return; } const id = await window.fb.write(payloadFromUI()); const shareUrl = location.origin + location.pathname + '?id=' + id; try{ await navigator.clipboard.writeText(shareUrl); }catch(e){} window.fb.setLocalId(id); window.fb.onLive(id, function(live){ if(live){ applyPayload(live); } }); alert('ซิงก์สำเร็จ!\nลิงก์ถูกคัดลอกแล้ว:\n' + shareUrl); }


// ===== Delete (Selective) =====
function openDeleteModal(){
if(!deleteModal || !deleteListEl){ alert('Delete UI missing'); return; }
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
function closeDelete(){ if(deleteModal) deleteModal.style.display = 'none'; }
function escapeHtml(s){ var map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }; return String(s).replace(/[&<>"']/g, m => map[m]); }


async function deleteSyncedSelective(){ if(!window.fb){ alert('Firebase ยังไม่โหลด'); return; } var pass = prompt('กรอกรหัสเพื่อลบข้อมูลที่ซิงก์:'); if(pass !== DELETE_PASSWORD){ alert('รหัสไม่ถูกต้อง'); return; } openDeleteModal(); }


deleteSelectedBtn && deleteSelectedBtn.addEventListener('click', async function(){
var ids = new Set([].map.call(deleteListEl.querySelectorAll('.delchk:checked'), c => c.value));
if(!ids.size){ alert('ยังไม่ได้เลือกแถว'); return; }
expenses = expenses.filter(x => !ids.has(x.id));
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


[cancelDeleteBtn, closeDeleteModal].forEach(btn => { if(btn){ btn.addEventListener('click', closeDelete); }});


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


hiddenFileInput.addEventListener('change', function(e){ var file = e.target.files[0]; if(!file || !currentFileTargetId) return; var reader = new FileReader(); reader.onload = function(){ var it = expenses.find(x => x.id === currentFileTargetId); if(it) it.image = reader.result; currentFileTargetId = null; hiddenFileInput.value = ""; }; reader.readAsDataURL(file); });


closeModal && closeModal.addEventListener('click', function(){ imgModal.style.display = 'none'; });
window.addEventListener('click', function(e){ if(e.target === imgModal){ imgModal.style.display = 'none'; } if(e.target === deleteModal){ closeDelete(); } });


globalDate.addEventListener('change', function(e){ var val = e.target.value; if(!val) return; expenses.forEach(function(x){ var timePart = (x.date.split(' ')[1] || '00:00'); x.date = val + ' ' + timePart; }); renderList(); updateCharts(); });


searchInput.addEventListener('input', renderList);


syncBtn.addEventListener('click', function(){ syncToCloud().catch(function(e){ alert('ซิงก์ไม่สำเร็จ: ' + e.message); }); });


deleteCloudBtn.addEventListener('click', function(){ deleteSyncedSelective().catch(function(e){ alert('ลบไม่สำเร็จ: ' + e.message); }); });


function init(){ applyTheme(themeSelect.value || 'Dark'); for(var i=0;i<3;i++){ expenses.push(createExpenseRow()); } loadFromFirebaseLinkIfAny().then(function(){ renderList(); updateCharts(); calcRemaining(); }); }


document.addEventListener('DOMContentLoaded', init);
