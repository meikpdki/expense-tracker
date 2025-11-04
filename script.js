const DELETE_PASSWORD = "meikpdki";
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