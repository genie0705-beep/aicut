
/* ---------- 공통: 페이지 전환 ---------- */
function goPage(page){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.dataset.page===page));
  var activeBtn = document.querySelector('.nav-item[data-page="'+page+'"]');
  if(activeBtn){ document.getElementById('page-title').textContent = activeBtn.textContent.trim(); }
  // 영업·정산 페이지 진입 시 납부 테이블 갱신
  if(page === 'sales' && typeof renderPayLogTable === 'function') renderPayLogTable();
}
document.querySelectorAll('.nav-item').forEach(function(btn){
  btn.addEventListener('click', function(){ goPage(btn.dataset.page); });
});
document.querySelectorAll('[data-goto]').forEach(function(btn){
  btn.addEventListener('click', function(){ goPage(btn.dataset.goto); });
});

/* ---------- 토스트 ---------- */
function showToast(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}

/* ---------- 모달 공통 ---------- */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('[data-close-modal]').forEach(function(btn){
  btn.addEventListener('click', function(){ closeModal(btn.dataset.closeModal); });
});
document.querySelectorAll('.modal-overlay').forEach(function(overlay){
  overlay.addEventListener('click', function(e){ if(e.target===overlay){ overlay.classList.remove('open'); } });
});

/* ---------- 위치 그리드 생성 ---------- */
var occupantNames = ['김철수','이영희','박민수','최지현','정대현','강수진','조병철','윤소희','장미영','임재호','한수정','오동환'];
var holderNames = ['이서영','한지민','최우진','윤하경','장혜민','박OO 유족','김민재','서연우','정수빈','김태형'];
var locationStructureType = 'simple';

function buildLocationGrid(containerId, count){
  var grid = document.getElementById(containerId);
  if(!grid) return;
  grid.innerHTML = '';
  grid.className = 'loc-grid loc-grid--' + locationStructureType;
  
  if(locationStructureType === 'tree'){
    // 수목장: 나무당 여러 구좌, 나무 형태 레이아웃
    var treeCount = Math.ceil(count / 4);
    for(var t=0; t<treeCount; t++){
      var treeWrapper = document.createElement('div');
      treeWrapper.className = 'loc-tree';
      treeWrapper.style.cssText = 'border:1px solid var(--border); border-radius:var(--radius-sm); padding:6px; background:var(--surface);';
      
      var treeLabel = document.createElement('div');
      treeLabel.style.cssText = 'font-size:11px; font-weight:700; color:var(--ink-600); padding:4px 4px 6px; text-align:center; border-bottom:1px solid var(--stone-200); margin-bottom:4px;';
      treeLabel.textContent = '🌳 소나무 ' + (t + 1);
      treeWrapper.appendChild(treeLabel);
      
      var branches = document.createElement('div');
      branches.style.cssText = 'display:grid; grid-template-columns:repeat(2,1fr); gap:4px;';
      
      for(var b=0; b<4; b++){
        var idx = t * 4 + b;
        if(idx >= count) break;
        var cell = document.createElement('div');
        cell.className = 'loc-cell';
        cell.style.cssText = 'aspect-ratio:auto; padding:6px 4px; display:flex; flex-direction:column; gap:2px; align-items:center; font-size:11px;';
        
        var capacity = 3;
        var occupantCount = idx % 4;
        var status = occupantCount === 0 ? 'empty' : 'occupied';
        cell.dataset.status = status;
        
        var bg, fg;
        if(status==='occupied'){ bg='var(--jade-100)'; fg='var(--jade-800)'; }
        else { bg='var(--stone-200)'; fg='var(--ink-400)'; }
        cell.style.background = bg;
        cell.style.color = fg;
        
        cell.dataset.code = '소나무' + (t + 1) + '-' + (b + 1) + '구좌';
        cell.innerHTML = '<span style="font-size:10px; opacity:0.6;">' + (b + 1) + '구좌</span><span style="font-weight:700;">' + occupantCount + '/' + capacity + '</span>';
        
        if(occupantCount > 0){
          var names = [];
          for(var k=0;k<occupantCount;k++){ names.push(occupantNames[(idx+k) % occupantNames.length]); }
          cell.dataset.occupant = names.join(', ');
          cell.dataset.holder = holderNames[idx % holderNames.length];
        }
        cell.dataset.capacity = capacity;
        cell.dataset.count = occupantCount;
        
        cell.addEventListener('mouseenter', function(e){ showLocTooltip(e.currentTarget, e); });
        cell.addEventListener('mousemove', function(e){ positionLocTooltip(e); });
        cell.addEventListener('mouseleave', hideLocTooltip);
        cell.addEventListener('click', function(){ showLocationSidePanel(this); });
        branches.appendChild(cell);
      }
      treeWrapper.appendChild(branches);
      grid.appendChild(treeWrapper);
    }
    return;
  } else if(locationStructureType === 'floor'){
    // 건물형 UI: 아파트 외형으로 층·구역·동·호수 표현
    var floors = parseInt(document.getElementById('lq-floors')?.value || 3);
    var zoneCount = parseInt(document.getElementById('lq-zones')?.value || 3);
    var lines = parseInt(document.getElementById('lq-lines')?.value || 2);
    var perLine = parseInt(document.getElementById('lq-per-line')?.value || 7);
    var zoneLabels = 'ABCDEFGHIJ'.split('');
    
    // 건물 전체를 감싸는 컨테이너
    var building = document.createElement('div');
    building.style.cssText = 'border:2px solid var(--stone-200); border-radius:var(--radius-md); overflow:hidden; background:var(--surface); box-shadow:0 2px 12px rgba(0,0,0,.06);';
    
    // 건물 지붕
    var roof = document.createElement('div');
    roof.style.cssText = 'background:var(--stone-200); padding:6px 14px; font-size:11px; font-weight:600; color:var(--ink-400); text-align:center; letter-spacing:2px; border-bottom:1px solid var(--border);';
    roof.textContent = floors + '층 건물 · ' + (floors * zoneCount * lines * perLine) + '구좌';
    building.appendChild(roof);
    
    for(var fl=floors-1; fl>=0; fl--){  // 위층부터 (건물처럼)
      var floorRow = document.createElement('div');
      floorRow.className = 'building-floor';
      floorRow.style.cssText = 'display:flex; align-items:stretch; min-height:52px; border-bottom:1px solid var(--stone-200);';
      if(fl === 0) floorRow.style.borderBottom = '4px solid var(--stone-200)';  // 1층 바닥 굵게
      
      // 층 표시 (왼쪽) - 클릭 시 토글
      var floorNum = document.createElement('div');
      var isEven = fl % 2 === 1;
      floorNum.style.cssText = 'width:44px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; cursor:pointer; background:' + (isEven ? 'var(--stone-50)' : '#fff') + '; border-right:1px solid var(--stone-200); font-size:12px; font-weight:700; color:var(--ink-600);';
      floorNum.innerHTML = '<span>' + (fl + 1) + '</span><span style="font-size:8px; font-weight:400; color:var(--ink-400);">F</span><span class="floor-toggle-icon" style="font-size:7px; color:var(--ink-400);">▲</span>';
      floorNum.title = '클릭하여 접기/펼치기';
      floorRow.appendChild(floorNum);
      
      floorNum.addEventListener('click', function(row, icon){
        return function(){
          var content = row.querySelector('.floor-content');
          if(content){
            var isHidden = content.style.display === 'none';
            content.style.display = isHidden ? '' : 'none';
            icon.textContent = isHidden ? '▲' : '▼';
          }
        };
      }(floorRow, floorNum.querySelector('.floor-toggle-icon')));
      
      // 각 구역 (건물 날개)
      var wingsContainer = document.createElement('div');
      wingsContainer.className = 'floor-content';
      wingsContainer.style.cssText = 'flex:1; display:flex; gap:0; padding:4px 8px; background:' + (isEven ? 'var(--stone-50)' : '#fff') + ';';
      
      for(var z=0; z<zoneCount; z++){
        var zoneLabel = zoneLabels[z] || (z + 1);
        var wing = document.createElement('div');
        wing.style.cssText = 'flex:1; display:flex; flex-direction:column; gap:3px; padding:4px 6px; border-left:' + (z > 0 ? '1px dashed var(--stone-200)' : 'none') + ';';
        
        // 구역명
        var wingLabel = document.createElement('div');
        wingLabel.style.cssText = 'font-size:9px; font-weight:600; color:var(--ink-400); margin-bottom:2px; text-align:center;';
        wingLabel.textContent = zoneLabel + '구역';
        wing.appendChild(wingLabel);
        
        // 각 동(라인) - 복도 양옆으로 배치
        for(var ln=0; ln<lines; ln++){
          var lineRow = document.createElement('div');
          lineRow.style.cssText = 'display:flex; align-items:center; gap:2px;';
          
          // 동 라벨 (작게)
          var lineLabel = document.createElement('div');
          lineLabel.style.cssText = 'font-size:7px; font-weight:600; color:var(--ink-400); width:14px; flex-shrink:0; text-align:center;';
          lineLabel.textContent = (ln + 1) + '동';
          lineRow.appendChild(lineLabel);
          
          // 호수들 (복도 오른쪽에 배치)
          for(var p=0; p<perLine; p++){
            var cellIdx = fl * zoneCount * lines * perLine + z * lines * perLine + ln * perLine + p;
            var cell = document.createElement('div');
            cell.className = 'loc-cell';
            cell.style.cssText = 'width:22px; height:22px; font-size:7px; display:flex; align-items:center; justify-content:center; font-weight:600; border-radius:3px; cursor:pointer; border:1px solid transparent; transition:all .12s;';
            
            var status = cellIdx % 9 === 0 ? 'empty' : (cellIdx % 7 === 3 ? 'reserved' : 'occupied');
            
            var bg, fg, borderColor;
            if(status==='occupied'){ bg='var(--jade-100)'; fg='var(--jade-800)'; borderColor='transparent'; }
            else if(status==='reserved'){ bg='var(--brass-100)'; fg='var(--brass-800)'; borderColor='transparent'; }
            else { bg='#fff'; fg='var(--ink-400)'; borderColor='var(--stone-200)'; }
            cell.style.background = bg;
            cell.style.color = fg;
            cell.style.borderColor = borderColor;
            cell.dataset.status = status;
            cell.dataset.code = (fl + 1) + '층-' + zoneLabel + '구역-' + (ln + 1) + '동-' + (p + 1) + '호';
            cell.textContent = (p + 1);
            cell.title = cell.dataset.code;
            
            if(status === 'occupied'){
              cell.dataset.occupant = occupantNames[cellIdx % occupantNames.length];
              cell.dataset.holder = holderNames[cellIdx % holderNames.length];
            }
            
            cell.addEventListener('click', function(){ showLocationSidePanel(this); });
            
            cell.addEventListener('mouseenter', function(e){ this.style.transform = 'scale(1.2)'; this.style.boxShadow = '0 2px 6px rgba(0,0,0,.15)'; showLocTooltip(this, e); });
            cell.addEventListener('mousemove', function(e){ positionLocTooltip(e); });
            cell.addEventListener('mouseleave', function(){ this.style.transform = ''; this.style.boxShadow = ''; hideLocTooltip(); });
            
            lineRow.appendChild(cell);
          }
          wing.appendChild(lineRow);
        }
        wingsContainer.appendChild(wing);
      }
      floorRow.appendChild(wingsContainer);
      building.appendChild(floorRow);
    }
    
    // 건물 바닥
    var ground = document.createElement('div');
    ground.style.cssText = 'background:var(--stone-200); padding:4px 14px; font-size:9px; font-weight:500; color:var(--ink-400); text-align:center;';
    ground.textContent = '▼ ' + zoneCount + '개 구역 · 총 ' + (floors * zoneCount * lines * perLine) + '구좌';
    building.appendChild(ground);
    
    grid.appendChild(building);
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gap = '0';
    grid.style.gridTemplateColumns = 'none';
    return;
  } else if(locationStructureType === 'tier'){
    // 적층형: 열(Column)별로 컨테이너
    var perCol = parseInt(document.getElementById('lq-per-zone')?.value || 9);
    var colCount = Math.ceil(count / perCol);
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(' + colCount + ', 1fr); gap:8px;';
    
    for(var cl=0; cl<colCount; cl++){
      var colWrap = document.createElement('div');
      colWrap.style.cssText = 'border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; background:var(--surface);';
      
      var colHead = document.createElement('div');
      colHead.style.cssText = 'padding:7px 10px; font-size:12px; font-weight:700; background:var(--stone-200); color:var(--ink-600); border-bottom:1px solid var(--border); text-align:center;';
      colHead.textContent = (cl + 1) + '열';
      colWrap.appendChild(colHead);
      
      for(var ci=0; ci<perCol; ci++){
        var idx = cl * perCol + ci;
        if(idx >= count) break;
        colWrap.appendChild(makeCell(idx));
      }
      grid.appendChild(colWrap);
    }
    return;
  }

  function makeCell(i){
    var cell = document.createElement('div');
    cell.className = 'loc-cell';
    
    var status;
    if(i % 9 === 0){ status = 'empty'; }
    else if(i % 7 === 3){ status = 'reserved'; }
    else { status = 'occupied'; }
    
    var bg, fg;
    if(status==='occupied'){ bg='var(--jade-100)'; fg='var(--jade-800)'; }
    else if(status==='reserved'){ bg='var(--brass-100)'; fg='var(--brass-800)'; }
    else { bg='var(--stone-200)'; fg='var(--ink-400)'; }
    cell.dataset.status = status;
    cell.style.background = bg;
    cell.style.color = fg;
    
    var zone = i < 21 ? 'A' : (i < 35 ? 'B' : 'C');
    var num = (i % 21) + 1;
    var code, label;
    
    code = '1구역-' + zone + String(num).padStart(2,'0');
    label = zone + String(num).padStart(2,'0');
    
    cell.className = 'loc-cell';
    cell.dataset.code = code;
    cell.textContent = label;
    
    if(status === 'occupied'){
      cell.dataset.occupant = occupantNames[i % occupantNames.length];
      cell.dataset.holder = holderNames[i % holderNames.length];
      var cMonth = String((i % 6) + 1).padStart(2,'0');
      var cDay = String((i % 27) + 1).padStart(2,'0');
      cell.dataset.date = '2026-' + cMonth + '-' + cDay;
    } else if(status === 'reserved'){
      cell.dataset.holder = holderNames[(i + 3) % holderNames.length];
      var rMonth = String((i % 6) + 1).padStart(2,'0');
      var rDay = String((i % 27) + 1).padStart(2,'0');
      cell.dataset.date = '2026-' + rMonth + '-' + rDay;
    } else {
      var basePrice = zone === 'A' ? '9,800,000' : (zone === 'B' ? '7,200,000' : '6,500,000');
      cell.dataset.price = '₩' + basePrice;
    }
    
    cell.addEventListener('mouseenter', function(e){ showLocTooltip(e.currentTarget, e); });
    cell.addEventListener('mousemove', function(e){ positionLocTooltip(e); });
    cell.addEventListener('mouseleave', hideLocTooltip);
    cell.addEventListener('click', function(){ showLocationSidePanel(this); });
    return cell;
  }
  
  // simple 모드: 기본 격자
  for(var i=0;i<count;i++){
    grid.appendChild(makeCell(i));
  }
}

function showLocTooltip(cell, evt){
  var tooltip = document.getElementById('loc-tooltip');
  var status = cell.dataset.status;
  var html = '<div class="tt-code">' + cell.dataset.code + '</div>';
  if(locationStructureType === 'tree'){
    var cap = cell.dataset.capacity, cnt = cell.dataset.count;
    if(status === 'empty'){
      html += '<span class="badge badge-neutral">여유 0/'+cap+'</span>';
      html += '<p class="tt-row">아직 안치된 고인이 없습니다</p>';
    } else {
      var tCls = status === 'occupied' ? 'badge-success' : 'badge-warning';
      var tLabel = status === 'occupied' ? '만석' : '일부 안치';
      html += '<span class="badge '+tCls+'">'+tLabel+' '+cnt+'/'+cap+'</span>';
      html += '<p class="tt-row">고인 ' + cell.dataset.occupant + '</p>';
      html += '<p class="tt-row">대표 계약자 ' + cell.dataset.holder + '</p>';
    }
  } else if(status === 'occupied'){
    html += '<span class="badge badge-success">사용중</span>';
    html += '<p class="tt-row">고인 ' + cell.dataset.occupant + '</p>';
    html += '<p class="tt-row">계약자 ' + cell.dataset.holder + '</p>';
    html += '<p class="tt-row">계약일 ' + cell.dataset.date + '</p>';
  } else if(status === 'reserved'){
    html += '<span class="badge badge-warning">예약중</span>';
    html += '<p class="tt-row">예약자 ' + cell.dataset.holder + '</p>';
    html += '<p class="tt-row">예약일 ' + cell.dataset.date + '</p>';
  } else {
    html += '<span class="badge badge-neutral">공실</span>';
    html += '<p class="tt-row">기준 분양가 ' + cell.dataset.price + '</p>';
  }
  tooltip.innerHTML = html;
  tooltip.classList.add('show');
  positionLocTooltip(evt);
}
function positionLocTooltip(evt){
  var tooltip = document.getElementById('loc-tooltip');
  var offset = 14;
  var x = evt.clientX, y = evt.clientY;
  tooltip.style.left = (x + offset) + 'px';
  tooltip.style.top = (y + offset) + 'px';
  var rect = tooltip.getBoundingClientRect();
  if(rect.right > window.innerWidth){ tooltip.style.left = (x - rect.width - offset) + 'px'; }
  if(rect.bottom > window.innerHeight){ tooltip.style.top = (y - rect.height - offset) + 'px'; }
}
function hideLocTooltip(){
  document.getElementById('loc-tooltip').classList.remove('show');

  document.getElementById('loc-tooltip').classList.remove('show');
  document.getElementById('loc-tooltip').style.display='none';

  var el = document.getElementById('loc-tooltip');
  if(el){ el.classList.remove('show'); el.style.display = 'none'; }
}

/* ---------- 위치 수량 계산 ---------- */
function getLocationCount(){
  var type = document.getElementById('location-structure-select').value;
  if(type === 'tree'){
    var trees = parseInt(document.getElementById('lq-trees')?.value || 11);
    var perTree = parseInt(document.getElementById('lq-per-tree')?.value || 4);
    return trees * perTree;
  }
  if(type === 'floor'){
    var floors = parseInt(document.getElementById('lq-floors')?.value || 3);
    var zones = parseInt(document.getElementById('lq-zones')?.value || 3);
    var lines = parseInt(document.getElementById('lq-lines')?.value || 2);
    var perLine = parseInt(document.getElementById('lq-per-line')?.value || 7);
    return floors * zones * lines * perLine;
  }
  var zones = parseInt(document.getElementById('lq-zones')?.value || 3);
  var perZone = parseInt(document.getElementById('lq-per-zone')?.value || 14);
  return zones * perZone;
}
function updateQuantityFields(){
  var type = document.getElementById('location-structure-select').value;
  var container = document.getElementById('location-quantity-fields');
  var labels = {
    simple: { html:'<div class="form-row"><label>구역 수</label><input id="lq-zones" type="number" value="3" min="1" max="99"></div><div class="form-row"><label>구역별 구좌 수</label><input id="lq-per-zone" type="number" value="14" min="1" max="99"></div>' },
    floor: { html:'<div class="form-row"><label>층 수</label><input id="lq-floors" type="number" value="3" min="1" max="50"></div><div class="form-row"><label>층별 구역 수</label><input id="lq-zones" type="number" value="3" min="1" max="20"></div><div class="form-row"><label>구역별 동(라인) 수</label><input id="lq-lines" type="number" value="2" min="1" max="20"></div><div class="form-row"><label>동별 구좌 수</label><input id="lq-per-line" type="number" value="7" min="1" max="99"></div>' },
    tier: { html:'<div class="form-row"><label>열(Column) 수</label><input id="lq-zones" type="number" value="5" min="1" max="99"></div><div class="form-row"><label>열별 단(Tier) 수</label><input id="lq-per-zone" type="number" value="9" min="1" max="99"></div>' },
    tree: { html:'<div class="form-row"><label>나무 수</label><input id="lq-trees" type="number" value="11" min="1" max="999"></div><div class="form-row"><label>나무별 구좌 수</label><input id="lq-per-tree" type="number" value="4" min="1" max="99"></div>' }
  };
  var cfg = labels[type] || labels.simple;
  container.innerHTML = cfg.html;
  var inputs = container.querySelectorAll('input');
  inputs.forEach(function(inp) { inp.addEventListener('input', recalcTotal); });
  recalcTotal();
}
function recalcTotal(){
  var total = getLocationCount();
  document.getElementById('lq-total').textContent = total;
}
function rebuildAllGrids(){
  var total = getLocationCount();
  locationStructureType = document.getElementById('location-structure-select').value;
  buildLocationGrid('full-loc-grid', total);
  // KPI 업데이트
  document.getElementById('kpi-total-lots').textContent = total;
  document.getElementById('kpi-occupied').textContent = Math.round(total * 0.74);
  document.getElementById('kpi-reserved').textContent = Math.round(total * 0.14);
  document.getElementById('kpi-empty').textContent = Math.round(total * 0.12);
  // 위치 관리 레이블
  var label = document.getElementById('loc-total-label');
  if(label) label.textContent = total;
  setupLocationClickHandlers();
  // 대시보드 통계 업데이트
  renderDashboardStats();
}

function renderDashboardStats(){
  var total = getLocationCount();
  document.getElementById('dash-stat-total').textContent = total;
  var type = document.getElementById('location-structure-select').value;
  var container = document.getElementById('dash-location-stats');
  var occupied = Math.round(total * 0.74);
  var reserved = Math.round(total * 0.14);
  var empty = total - occupied - reserved;
  
  var html = '';
  
  // 요약 진행바
  html += '<div style="margin-bottom:4px;">';
  html += '<div style="display:flex; justify-content:space-between; font-size:12px; color:var(--ink-600); margin-bottom:4px;">';
  html += '<span>전체 사용률</span><span>' + Math.round(occupied / total * 100) + '% (' + occupied + '/' + total + ')</span>';
  html += '</div>';
  html += '<div style="display:flex; height:8px; border-radius:999px; overflow:hidden;">';
  html += '<div style="flex:' + occupied + '; background:var(--jade-700);"></div>';
  if(reserved > 0) html += '<div style="flex:' + reserved + '; background:var(--brass-500);"></div>';
  if(empty > 0) html += '<div style="flex:' + empty + '; background:var(--stone-200);"></div>';
  html += '</div>';
  html += '<div style="display:flex; gap:12px; font-size:11px; color:var(--ink-400); margin-top:4px;">';
  html += '<span><span style="color:var(--jade-700);">●</span> 사용중 ' + occupied + '</span>';
  html += '<span><span style="color:var(--brass-500);">●</span> 예약중 ' + reserved + '</span>';
  html += '<span><span style="color:var(--ink-400);">●</span> 공실 ' + empty + '</span>';
  html += '</div></div>';
  
  // 유형별 세부 통계
  if(type === 'floor'){
    var floors = parseInt(document.getElementById('lq-floors')?.value || 3);
    var zones = parseInt(document.getElementById('lq-zones')?.value || 3);
    var lines = parseInt(document.getElementById('lq-lines')?.value || 2);
    var perLine = parseInt(document.getElementById('lq-per-line')?.value || 7);
    var perFloor = zones * lines * perLine;
    html += '<div style="display:grid; grid-template-columns:repeat(' + floors + ',1fr); gap:8px; margin-top:4px;">';
    for(var f=0; f<floors; f++){
      var fOcc = Math.round(perFloor * (0.7 + Math.random() * 0.2));
      var fPct = Math.round(fOcc / perFloor * 100);
      html += '<div style="background:var(--stone-50); border-radius:var(--radius-sm); padding:8px 10px; text-align:center;">';
      html += '<p style="font-size:11px; font-weight:600; margin:0 0 4px; color:var(--ink-600);">' + (f + 1) + '층</p>';
      html += '<p style="font-size:15px; font-weight:700; margin:0; color:var(--ink-900);">' + fOcc + '/' + perFloor + '</p>';
      html += '<div style="margin-top:4px; height:4px; background:var(--stone-200); border-radius:999px; overflow:hidden;">';
      html += '<div style="width:' + fPct + '%; height:100%; background:' + (fPct > 80 ? 'var(--jade-700)' : (fPct > 60 ? 'var(--brass-500)' : 'var(--wine-600)')) + ';"></div>';
      html += '</div><p style="font-size:10px; color:var(--ink-400); margin:3px 0 0;">' + fPct + '%</p></div>';
    }
    html += '</div>';
  } else if(type === 'simple' || type === 'tier'){
    var zoneCount = parseInt(document.getElementById('lq-zones')?.value || 3);
    var labels = 'ABCDEFGHIJ'.split('');
    html += '<div style="display:grid; grid-template-columns:repeat(' + zoneCount + ',1fr); gap:8px; margin-top:4px;">';
    for(var z=0; z<zoneCount; z++){
      var zOcc = Math.round((total / zoneCount) * (0.6 + Math.random() * 0.3));
      html += '<div style="background:var(--stone-50); border-radius:var(--radius-sm); padding:8px 10px; text-align:center;">';
      html += '<p style="font-size:11px; font-weight:600; margin:0 0 4px; color:var(--ink-600);">' + (labels[z] || (z+1)) + '구역</p>';
      html += '<p style="font-size:15px; font-weight:700; margin:0; color:var(--ink-900);">' + zOcc + '/' + Math.round(total / zoneCount) + '</p>';
      html += '<div style="margin-top:4px; height:4px; background:var(--stone-200); border-radius:999px; overflow:hidden;">';
      html += '<div style="width:' + Math.round(zOcc / (total/zoneCount) * 100) + '%; height:100%; background:var(--jade-700);"></div>';
      html += '</div></div>';
    }
    html += '</div>';
  } else if(type === 'tree'){
    var trees = parseInt(document.getElementById('lq-trees')?.value || 11);
    html += '<p style="font-size:12px; color:var(--ink-600); margin:6px 0 0;">총 ' + trees + '개 나무 · 나무당 평균 사용률 ' + Math.round(60 + Math.random() * 30) + '%</p>';
  }
  
  container.innerHTML = html;
}

buildLocationGrid('full-loc-grid', getLocationCount());
setupLocationClickHandlers();
renderDashboardStats();

updateQuantityFields();

document.getElementById('location-structure-select').addEventListener('change', function(){
  locationStructureType = this.value;
  updateQuantityFields();
  rebuildAllGrids();
  renderDashboardStats();
  var labels = {
    simple: '구역-호수 (단순 평면형)',
    floor: '구역-층-호수 (건물 층별 구분)',
    tier: '구역-열-단 (적층형)',
    tree: '수목장 나무당 다수 안치'
  };
  showToast('위치 구조가 "' + labels[this.value] + '" 방식으로 변경되었습니다.');
});

document.querySelectorAll('#loc-filter-tabs .tab-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('#loc-filter-tabs .tab-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    var f = btn.dataset.filter;
    document.querySelectorAll('#full-loc-grid .loc-cell').forEach(function(cell){
      cell.style.display = (f==='all' || cell.dataset.status===f) ? '' : 'none';
    });
  });
});

/* ---------- 위치 상세 패널 ---------- */
function setupLocationClickHandlers(){
  document.querySelectorAll('#full-loc-grid .loc-cell').forEach(function(cell){
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', function(e){
      e.stopPropagation();
      showLocationDetail(cell);
    });
  });
  // 건물형 UI 내 셀도 포함
  document.querySelectorAll('#full-loc-grid [data-code]').forEach(function(el){
    if(!el.classList.contains('loc-cell')) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', function(e){
      e.stopPropagation();
      showLocationDetail(el);
    });
  });
}

function showLocationDetail(cell){
  var panel = document.getElementById('loc-detail-panel');
  var overlay = document.getElementById('loc-detail-overlay');
  panel.style.display = 'flex';
  overlay.style.display = 'block';
  
  var code = cell.dataset.code || '--';
  var status = cell.dataset.status || 'empty';
  document.getElementById('dp-code').textContent = code;
  
  // 상태 배지
  var badge = document.getElementById('dp-status-badge');
  if(status === 'occupied'){
    badge.className = 'badge badge-success';
    badge.innerHTML = '<i class="ti ti-circle-check"></i> 사용중';
  } else if(status === 'reserved'){
    badge.className = 'badge badge-warning';
    badge.innerHTML = '<i class="ti ti-clock"></i> 예약중';
  } else {
    badge.className = 'badge badge-neutral';
    badge.innerHTML = '<i class="ti ti-circle"></i> 공실';
  }
  
  document.getElementById('dp-occupied-info').style.display = 'none';
  document.getElementById('dp-empty-info').style.display = 'none';
  document.getElementById('dp-reserved-info').style.display = 'none';
  
  if(status === 'occupied'){
    document.getElementById('dp-occupied-info').style.display = 'block';
    document.getElementById('dp-occupant').textContent = cell.dataset.occupant || '--';
    document.getElementById('dp-holder').textContent = cell.dataset.holder || '--';
    document.getElementById('dp-date').textContent = cell.dataset.date || '--';
    
    // 관리비: 더미 데이터로 회차별 시각화
    var feeHtml = '<div style="display:flex; align-items:center; justify-content:space-between;">';
    feeHtml += '<span class="badge badge-success"><i class="ti ti-circle-check"></i> 정상 납부중</span>';
    var feeAmt = localStorage.getItem('chungsol_settings') ? JSON.parse(localStorage.getItem('chungsol_settings')).feeAmount || '360000' : '360000';
    var feeCycle = localStorage.getItem('chungsol_settings') ? JSON.parse(localStorage.getItem('chungsol_settings')).feeCycle || '3' : '3';
    feeHtml += '<span style="font-size:12px; color:var(--ink-400);">' + feeCycle + '년 약정 · 연 ₩' + Number(feeAmt).toLocaleString() + '</span>';
    feeHtml += '</div>';
    feeHtml += '<p style="font-size:11px; color:var(--ink-400); margin:2px 0 0;">최근 납부: 2026-06-10 · 다음 납부예정: 2026-09-10 (D-78)</p>';
    feeHtml += '<div style="margin-top:6px;">';
    feeHtml += '<div style="display:flex; justify-content:space-between; font-size:11px; color:var(--ink-600); margin-bottom:4px;">';
    feeHtml += '<span>회차별 납부율</span><span>5/12회차</span>';
    feeHtml += '</div>';
    feeHtml += '<div style="height:6px; background:var(--stone-200); border-radius:999px; overflow:hidden; display:flex;">';
    for(var fi=0; fi<12; fi++){
      var fb = fi < 5 ? 'var(--jade-700)' : (fi === 5 ? 'var(--brass-500)' : 'var(--stone-200)');
      feeHtml += '<div style="flex:1; height:100%; background:' + fb + '; border-right:1px solid #fff;"></div>';
    }
    feeHtml += '</div>';
    feeHtml += '<div style="display:flex; justify-content:space-between; font-size:10px; color:var(--ink-400); margin-top:3px;">';  
    feeHtml += '<span>✅ 완납</span><span>⏳ 이번회차</span><span>⬜ 예정</span>';
    feeHtml += '</div>';
    feeHtml += '</div>';
    document.getElementById('dp-fee-status').innerHTML = feeHtml;
    
    // 계약 사항 채우기 (접힘 상태)
    document.getElementById('dp-contract-info').style.display = 'block';
    var cd = document.querySelector('[data-section="contract-detail"]');
    if(cd) { cd.style.display = 'grid'; var ci = document.getElementById('toggle-contract-detail'); if(ci) ci.textContent = '▼'; }
    document.getElementById('dp-contract-no').textContent = 'CT-2026-' + String(Math.floor(Math.random() * 900) + 100);
    document.getElementById('dp-contract-amount').textContent = ['₩9,800,000','₩7,200,000','₩6,500,000'][Math.floor(Math.random() * 3)];
    document.getElementById('dp-plan-type').textContent = ['개인단','부부단','가족단'][Math.floor(Math.random() * 3)];
    document.getElementById('dp-fee-cycle').textContent = '3년 (' + (Math.floor(Math.random() * 5) + 1) + '/' + 5 + '회차)';
    var payType = Math.floor(Math.random() * 4);
    var payBadge = payType < 2 ? 'badge-success' : (payType < 3 ? 'badge-warning' : 'badge-danger');
    var payText = payType < 2 ? '완납' : (payType < 3 ? '미납' : '연체');
    var payLabel = ['계약금','중도금','잔금'][Math.floor(Math.random() * 3)];
    document.getElementById('dp-pay-status').innerHTML = '<span class="badge ' + payBadge + '">' + payLabel + ' ' + payText + '</span>';
    document.getElementById('dp-agent').textContent = ['김민수(내부)','박지훈(내부)','늘봄상조(외부)'][Math.floor(Math.random() * 3)];
  } else if(status === 'reserved'){
    document.getElementById('dp-reserved-info').style.display = 'block';
    document.getElementById('dp-reserver').textContent = cell.dataset.holder || '--';
    document.getElementById('dp-res-date').textContent = cell.dataset.date || '--';
    document.getElementById('dp-fee-status').innerHTML = '<span class="badge badge-warning"><i class="ti ti-clock"></i> 예약금 입금완료</span><p style="font-size:11px; color:var(--ink-400); margin:4px 0 0;">계약 전환 대기중</p>';
    document.getElementById('dp-contract-info').style.display = 'none';
  } else {
    document.getElementById('dp-empty-info').style.display = 'block';
    document.getElementById('dp-price').textContent = cell.dataset.price ? '분양가 ' + cell.dataset.price : '--';
    document.getElementById('dp-fee-status').innerHTML = '<span class="badge badge-neutral">해당 없음</span>';
    document.getElementById('dp-contract-info').style.display = 'none';
  }
  
  // 변경이력 (기본 + 커스텀 노트)
  var historyContainer = document.getElementById('dp-history');
  var code = cell.dataset.code;
  
  // 기본 히스토리
  var defaultHistories = [];
  if(status === 'occupied'){
    defaultHistories = [
      { date: cell.dataset.date || '2026-06-10', action: '최초 안치 계약 체결', by: cell.dataset.holder || '--' },
      { date: '2026-06-12', action: '안장 위치 확정', by: '김민수(관리자)' }
    ];
  } else if(status === 'reserved'){
    defaultHistories = [
      { date: cell.dataset.date || '2026-06-15', action: '예약 등록', by: cell.dataset.holder || '--' },
      { date: '2026-06-15', action: '예약금 입금 확인', by: '김민수(관리자)' }
    ];
  }
  
  // localStorage에서 커스텀 노트 로드
  var customNotes = [];
  try {
    var saved = JSON.parse(localStorage.getItem('chungsol_notes_' + code));
    if(saved && Array.isArray(saved)) customNotes = saved;
  } catch(e){}
  
  // 대표 계약자 정보를 첫 번째 노트에 표시
  var allHistories = defaultHistories.concat(customNotes);
  
  // 최신순 정렬
  allHistories.sort(function(a, b){ return (b.date || '').localeCompare(a.date || ''); });
  
  if(allHistories.length === 0){
    historyContainer.innerHTML = '<p style="font-size:12px; color:var(--ink-400);">변경 이력이 없습니다.</p>';
  } else {
    historyContainer.innerHTML = allHistories.map(function(h){
      var isCustom = h.by === '관리자 메모';
      var borderStyle = isCustom ? 'border-left:2px solid var(--jade-700); padding-left:8px;' : '';
      return '<div style="display:flex; gap:8px; font-size:12px; ' + borderStyle + '">' +
        '<span style="color:var(--ink-400); flex-shrink:0; width:80px;">' + (h.date || '') + '</span>' +
        '<div><p style="margin:0; color:var(--ink-900);">' + h.action + '</p>' +
        '<p style="margin:0; color:var(--ink-400); font-size:11px;">' + (h.by || '') + '</p></div></div>';
    }).join('');
  }
  
  // 현재 코드 저장 (등록 버튼용)
  window.__currentDetailCode = code;
  
  // 모바일 스크롤
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* 닫기 버튼 + 오버레이 */
function closeDetailPanel(){
  document.getElementById('loc-detail-panel').style.display = 'none';
  document.getElementById('loc-detail-overlay').style.display = 'none';
}
document.getElementById('dp-close').addEventListener('click', closeDetailPanel);
document.getElementById('loc-detail-overlay').addEventListener('click', closeDetailPanel);

/* 변경이력 메모 등록 */
document.getElementById('dp-history-add').addEventListener('click', function(){
  var input = document.getElementById('dp-history-input');
  var text = input.value.trim();
  var code = window.__currentDetailCode;
  if(!text || !code) return;
  
  var now = new Date();
  var dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  var timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  
  var note = { date: dateStr, action: '📝 ' + text, by: '관리자 메모 ' + timeStr };
  
  // 저장
  try {
    var saved = JSON.parse(localStorage.getItem('chungsol_notes_' + code)) || [];
    saved.push(note);
    localStorage.setItem('chungsol_notes_' + code, JSON.stringify(saved));
  } catch(e){}
  
  input.value = '';
  showToast('메모가 저장되었습니다.');
  
  // 히스토리 갱신 (현재 보고 있는 셀 다시 표시)
  var panel = document.getElementById('loc-detail-panel');
  if(panel._lastCell) showLocationDetail(panel._lastCell);
});

var _origShowDetail = showLocationDetail;
showLocationDetail = function(cell){
  document.getElementById('loc-detail-panel')._lastCell = cell;
  _origShowDetail(cell);
};

/* ---------- 섹션 접힘/펼침 ---------- */
function toggleSection(id){
  var el = document.querySelector('[data-section="' + id + '"]');
  var icon = document.getElementById('toggle-' + id);
  if(!el || !icon) return;
  var isHidden = el.style.display === 'none' || el.style.display === '';
  if(isHidden){
    el.style.display = id === 'contract-detail' ? 'grid' : 'flex';
    icon.textContent = '▼';
  } else {
    el.style.display = 'none';
    icon.textContent = '▶';
  }
}

/* ---------- 알림톡 발송 ---------- */
function getKakaoLogs(){
  try {
    var saved = JSON.parse(localStorage.getItem('chungsol_kakao_log'));
    if(saved && saved.length > 0) return saved;
  } catch(e) {}
  // 샘플 데이터 (channel 필드 추가: kakao/sms)
  return [
    {date:'2026-06-23', time:'10:30', type:'💳 관리비 납부 안내', target:'이서영', message:'💛카카오톡 자동 발송 (7일 전)', channel:'kakao'},
    {date:'2026-06-23', time:'09:15', type:'🕯️ 삼우제 안내', target:'한지민', message:'📱SMS 발송 (3일 전)', channel:'sms'},
    {date:'2026-06-22', time:'14:00', type:'⚠️ 관리비 연체 안내', target:'박OO 유족', message:'💛카카오톡 발송 (3일 경과)', channel:'kakao'},
    {date:'2026-06-22', time:'11:45', type:'📋 계약 갱신 안내', target:'배OO 유족', message:'💛카카오톡 자동 발송 (30일 전)', channel:'kakao'},
    {date:'2026-06-21', time:'16:20', type:'💳 관리비 납부 안내', target:'최우진', message:'📱SMS 발송', channel:'sms'},
    {date:'2026-06-21', time:'08:00', type:'🕯️ 49제 안내', target:'윤하경', message:'💛카카오톡 자동 발송 (3일 전)', channel:'kakao'},
    {date:'2026-06-20', time:'15:30', type:'📬 신규 계약 안내', target:'장혜민', message:'💛카톡 · 📱SMS 발송 (즉시)', channel:'both'},
    {date:'2026-06-19', time:'10:00', type:'⚠️ 관리비 연체 안내', target:'박OO 유족', message:'📱SMS 발송 (7일 경과)', channel:'sms'},
    {date:'2026-06-18', time:'13:45', type:'💳 관리비 납부 안내', target:'정은숙', message:'💛카카오톡 발송', channel:'kakao'},
    {date:'2026-06-17', time:'09:30', type:'🕯️ 1주기 기일 안내', target:'송민호', message:'💛카카오톡 자동 발송 (7일 전)', channel:'kakao'}
  ];
}
function saveKakaoLog(logs){
  localStorage.setItem('chungsol_kakao_log', JSON.stringify(logs));
}
function addKakaoLog(type, target, message){
  var logs = getKakaoLogs();
  var now = new Date();
  var dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  var timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  var msg = message || '';
  // 채널 자동 감지
  var ch = 'kakao';
  if(msg.indexOf('SMS') > -1 || msg.indexOf('\uD83D\uDCF1') > -1) ch = 'sms';
  if(msg.indexOf('💛') > -1 && (msg.indexOf('SMS') > -1 || msg.indexOf('📱') > -1)) ch = 'both';
  logs.unshift({
    date: dateStr,
    time: timeStr,
    type: type,
    target: target || '--',
    message: msg,
    channel: ch
  });
  saveKakaoLog(logs);
}

document.querySelectorAll('.dp-kakao-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var type = btn.dataset.type;
    var code = window.__currentDetailCode || '--';
    var holder = document.getElementById('dp-holder')?.textContent || '계약자';
    var occupant = document.getElementById('dp-occupant')?.textContent || '고인';
    
    var templateMessages = {
      fee: '{계약자}님, {고인}님의 관리비 납부 안내입니다.\n\n계약서상의 납부자명과 동일하게 입금자명을 기재해주셔야 자동 매칭이 가능합니다.\n입금 시 반드시 "{계약자}"(으)로 입금해주세요.',
      memorial: '{계약자}님, {고인}님의 추모일이 다가오고 있습니다.'
    };
    
    var msg = (templateMessages[type] || '')
      .replace('{계약자}', holder)
      .replace('{고인}', occupant);
    
    addKakaoLog(
      type === 'fee' ? '관리비 안내' : '추모일 안내',
      code + ' · ' + holder,
      msg
    );
    showToast('💛 알림톡이 발송되었습니다. (' + (type === 'fee' ? '관리비 안내' : '추모일 안내') + ')');
  });
});

/* 발송이력 모달 */
document.getElementById('dp-kakao-log-btn').addEventListener('click', function(){
  var logs = getKakaoLogs();
  var html = logs.length === 0 
    ? '<p style="font-size:13px; color:var(--ink-400); padding:20px; text-align:center;">발송 이력이 없습니다.</p>'
    : logs.slice(0, 20).map(function(log){
      var icon = log.type.includes('관리비') ? '💳' : '🕯️';
      return '<div style="display:flex; gap:8px; padding:8px 12px; border-bottom:1px solid var(--stone-200); font-size:12.5px;">' +
        '<span style="font-size:16px;">' + icon + '</span>' +
        '<div><p style="margin:0; font-weight:600;">' + log.type + '</p>' +
        '<p style="margin:0; color:var(--ink-400); font-size:11.5px;">' + log.date + ' ' + log.time + ' · ' + log.target + '</p>' +
        '<p style="margin:2px 0 0; color:var(--ink-600); font-size:12px;">' + log.message + '</p></div></div>';
    }).join('');
  
  // 모달로 표시
  var existingModal = document.getElementById('kakao-log-modal');
  if(existingModal) existingModal.remove();
  
  var modal = document.createElement('div');
  modal.id = 'kakao-log-modal';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:80; display:flex; align-items:center; justify-content:center; padding:20px;';
  modal.innerHTML = '<div style="background:#fff; border-radius:12px; width:500px; max-width:100%; max-height:70vh; overflow-y:auto;">' +
    '<div style="padding:15px 18px; border-bottom:1px solid var(--stone-200); display:flex; align-items:center; justify-content:space-between;">' +
    '<h3 style="margin:0; font-size:15px;">💛 알림톡 발송이력</h3>' +
    '<button class="modal-close-btn" style="background:none; border:none; font-size:20px; cursor:pointer; color:var(--ink-400);">&times;</button></div>' +
    '<div>' + html + '</div></div>';
  document.body.appendChild(modal);
  modal.querySelector('.modal-close-btn').addEventListener('click', function(){ modal.remove(); });
  modal.addEventListener('click', function(e){ if(e.target === modal) modal.remove(); });
});

/* ---------- 관리비 리스트 ---------- */
var feeData = [
  {name:'박OO 유족', sub:'고인 최OO · 위치 B-12', daysLeft:-5, date:'2026-06-18'},
  {name:'이OO 유족', sub:'고인 김OO · 위치 A-05', daysLeft:3, date:'2026-06-26'},
  {name:'최OO 유족', sub:'고인 정OO · 위치 A-18', daysLeft:12, date:'2026-07-05'},
  {name:'한OO 유족', sub:'고인 송OO · 위치 C-02', daysLeft:25, date:'2026-07-18'},
  {name:'윤OO 유족', sub:'고인 강OO · 위치 A-31', daysLeft:58, date:'2026-08-20'},
  {name:'장OO 유족', sub:'고인 오OO · 위치 B-07', daysLeft:90, date:'2026-09-21'},
  {name:'배OO 유족', sub:'고인 임OO · 위치 A-09', daysLeft:null, date:'2026-06-10'},
  {name:'서OO 유족', sub:'고인 황OO · 위치 B-21', daysLeft:null, date:'2026-06-08'}
];

function getFeeVisual(daysLeft){
  if(daysLeft === null){ return {badge:'완료', filterStatus:'paid', tier:'success', fill:0}; }
  if(daysLeft < 0){ return {badge:'연체 '+Math.abs(daysLeft)+'일', filterStatus:'overdue', tier:'danger', fill:100}; }
  var fill = Math.max(0, Math.min(100, Math.round(100 - (daysLeft/30*100))));
  if(daysLeft <= 7){ return {badge:'D-'+daysLeft, filterStatus:'upcoming', tier:'danger', fill:fill}; }
  if(daysLeft <= 30){ return {badge:'D-'+daysLeft, filterStatus:'upcoming', tier:'warning', fill:fill}; }
  return {badge:'D-'+daysLeft, filterStatus:'upcoming', tier:'neutral', fill:0};
}
function tierBadgeClass(tier){
  if(tier === 'danger') return 'badge-danger';
  if(tier === 'warning') return 'badge-warning';
  if(tier === 'success') return 'badge-success';
  return 'badge-neutral';
}
function tierFillColor(tier){
  if(tier === 'danger') return 'var(--wine-600)';
  if(tier === 'warning') return 'var(--brass-500)';
  return 'var(--ink-400)';
}

function renderFeeRow(item, withAction){
  var v = getFeeVisual(item.daysLeft);
  var cls = tierBadgeClass(v.tier);
  var actionHtml = '';
  if(withAction && v.filterStatus !== 'paid'){
    actionHtml = '<button class="btn btn-ghost btn-sm fee-pay-btn">수납처리</button>';
  }
  var barHtml = v.filterStatus !== 'paid'
    ? '<div class="urgency-bar" title="납부 임박도"><div class="urgency-fill" style="width:'+v.fill+'%; background:'+tierFillColor(v.tier)+';"></div></div>'
    : '';
  var borderColor = v.tier === 'danger' ? 'var(--wine-600)' : (v.tier === 'warning' ? 'var(--brass-500)' : (v.tier === 'success' ? 'var(--jade-700)' : 'var(--stone-200)'));
  return '<div class="fee-row" data-status="'+v.filterStatus+'" style="border-left-color:'+borderColor+'; cursor:pointer;">' +
    '<input type="checkbox" class="fee-checkbox" style="margin-right:6px; width:15px; height:15px; cursor:pointer; flex-shrink:0; vertical-align:middle;">' +
    '<div class="fee-left"><div class="fee-icon"><i class="ti ti-user"></i></div>' +
    '<div><p class="fee-name">'+item.name+'</p><p class="fee-sub">'+item.sub+'</p></div></div>' +
    '<div class="fee-right"><span class="badge '+cls+'" data-role="status-badge">'+v.badge+'</span>' +
    barHtml +
    '<p class="fee-date">'+item.date+'</p>' + (actionHtml ? '<div style="margin-top:6px;">'+actionHtml+'</div>' : '') +
    '</div></div>';
}

function renderDashFeeList(){
  var sorted = feeData.slice().sort(function(a,b){
    var av = a.daysLeft===null ? 9999 : a.daysLeft, bv = b.daysLeft===null ? 9999 : b.daysLeft;
    return av - bv;
  });
  var top = sorted.slice(0,4);
  document.getElementById('dash-fee-list').innerHTML = top.map(function(i){ return renderFeeRow(i, false); }).join('');
}
renderDashFeeList();

function renderFullFeeList(filter){
  var list = feeData.filter(function(i){
    var v = getFeeVisual(i.daysLeft);
    return filter==='all' || v.filterStatus===filter;
  });
  var html = list.map(function(i){ return renderFeeRow(i, true); }).join('');
  document.getElementById('fee-list').innerHTML = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:4px;">' + html + '</div>';
  attachFeePayHandlers();
}
function attachFeePayHandlers(){
  document.querySelectorAll('.fee-pay-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var row = btn.closest('.fee-row');
      row.dataset.status = 'paid';
      row.style.borderLeftColor = 'var(--jade-700)';
      var badge = row.querySelector('[data-role="status-badge"]');
      badge.textContent = '완료';
      badge.className = 'badge badge-success';
      var bar = row.querySelector('.urgency-bar');
      if(bar){ bar.remove(); }
      // \uc601\uc218\uc99d \ucd9c\ub825 \ubc84\ud2bc \ucd94\uac00
      var receiptBtn = document.createElement('button');
      receiptBtn.className = 'receipt-btn';
      receiptBtn.innerHTML = '\u1f4b3 \uc601\uc218\uc99d \ucd9c\ub825';
      receiptBtn.addEventListener('click', function(){
        var nameEl = row.querySelector('.fee-name');
        var subEl = row.querySelector('.fee-sub');
        var name = nameEl ? nameEl.textContent : '--';
        var sub = subEl ? subEl.textContent : '--';
        var now = new Date();
        var dateStr = now.getFullYear() + '.' + (now.getMonth()+1) + '.' + now.getDate();
        
        var receiptHtml = '<div class="print-area" style="padding:30px; font-family:Pretendard,sans-serif;">';
        receiptHtml += '<h2 style="text-align:center; margin-bottom:20px;">\uad00\ub9ac\ube44 \uc218\ub0a9 \uc601\uc218\uc99d</h2>';
        receiptHtml += '<hr style="border:1px solid #000; margin-bottom:16px;">';
        receiptHtml += '<p><strong>\uc218\ub0a9\uc77c:</strong> ' + dateStr + '</p>';
        receiptHtml += '<p><strong>\uace0\uac1d\uba85:</strong> ' + name + '</p>';
        receiptHtml += '<p><strong>\ub0b4\uc5ed:</strong> ' + sub + '</p>';
        receiptHtml += '<hr style="margin:16px 0;">';
        receiptHtml += '<p style="text-align:right; font-size:16px;"><strong>\uc218\ub0a9\uae08\uc561: \u20a9 360,000</strong></p>';
        receiptHtml += '<hr style="margin:16px 0;">';
        receiptHtml += '<p style="text-align:center; font-size:12px; color:#888;">\uccad\uc20c\uc6d4 \uba54\ubaa8\ub9ac\uc5bc\ud30c\ud06c</p>';
        receiptHtml += '</div>';
        
        var printWin = window.open('', '_blank', 'width=600,height=800');
        printWin.document.write('<html><head><title>\uad00\ub9ac\ube44 \uc601\uad6c\uc99d</title></head><body>' + receiptHtml + '</body></html>');
        printWin.document.close();
        printWin.focus();
        setTimeout(function(){ printWin.print(); }, 500);
      });
      row.querySelector('.fee-right').appendChild(receiptBtn);
      
      btn.remove();
      showToast('관리비 수납이 처리되었습니다.');
      var activeFilter = document.querySelector('#fee-filter-tabs .tab-btn.active').dataset.filter;
      if(activeFilter!=='all' && activeFilter!=='paid'){ row.style.display='none'; }
    });
  });
}
renderFullFeeList('all');

/* ================= Fee Bulk Actions ================= */
function attachFeeBulkActions(){
  var bar = document.getElementById('bulk-action-bar');
  var countEl = document.getElementById('bulk-count');
  var list = document.getElementById('fee-list');
  if(!list || !bar || !countEl) return;

  function updateBulkBar(){
    var checked = list.querySelectorAll('.fee-checkbox:checked');
    var len = checked.length;
    countEl.textContent = len + '\uac74 \uc120\ud0dd';
    if(len > 0){
      bar.classList.add('show');
    } else {
      bar.classList.remove('show');
    }
  }

  function clearAllChecks(){
    list.querySelectorAll('.fee-checkbox').forEach(function(c){ c.checked = false; });
    updateBulkBar();
  }

  // 체크박스 이벤트 (위임)
  list.addEventListener('change', function(e){
    if(e.target.classList.contains('fee-checkbox')){
      updateBulkBar();
    }
  });

  // 행 클릭 시 체크박스 토글
  list.addEventListener('click', function(e){
    var row = e.target.closest('.fee-row');
    if(!row || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    var chk = row.querySelector('.fee-checkbox');
    if(chk){ chk.checked = !chk.checked; updateBulkBar(); }
  });

  // 일괄 알림톡 발송
  document.getElementById('bulk-kakao-btn').addEventListener('click', function(){
    var checked = list.querySelectorAll('.fee-checkbox:checked');
    var names = [];
    checked.forEach(function(c){
      var row = c.closest('.fee-row');
      var nameEl = row ? row.querySelector('.fee-name') : null;
      if(nameEl) names.push(nameEl.textContent);
    });
    if(names.length > 0){
      showToast(names.length + '\uac74\uc5d0 \uc54c\ub9bc\ud1a1\uc774 \ubc1c\uc1a1\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
    }
    clearAllChecks();
  });

  // 일괄 수납처리
  document.getElementById('bulk-pay-btn').addEventListener('click', function(){
    var checked = list.querySelectorAll('.fee-checkbox:checked');
    var count = checked.length;
    checked.forEach(function(c){
      var row = c.closest('.fee-row');
      if(!row) return;
      row.dataset.status = 'paid';
      row.style.borderLeftColor = 'var(--jade-700)';
      var badge = row.querySelector('[data-role="status-badge"]');
      if(badge){
        badge.textContent = '\uc644\ub8cc';
        badge.className = 'badge badge-success';
      }
      var barEl = row.querySelector('.urgency-bar');
      if(barEl) barEl.remove();
      var payBtn = row.querySelector('.fee-pay-btn');
      if(payBtn) payBtn.remove();
      var chk = row.querySelector('.fee-checkbox');
      if(chk) chk.remove();
    });
    showToast(count + '\uac74 \uc218\ub0a9\uc774 \uc77c\uad34 \ucc98\ub9ac\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
    clearAllChecks();
    // 현재 활성 필터 재적용 (paid 아닌 경우 숨김)
    var activeTab = document.querySelector('#fee-filter-tabs .tab-btn.active');
    if(activeTab && activeTab.dataset.filter !== 'all' && activeTab.dataset.filter !== 'paid'){
      checked.forEach(function(c){
        var row = c.closest('.fee-row');
        if(row) row.style.display = 'none';
      });
    }
  });

  // 취소
  document.getElementById('bulk-cancel-btn').addEventListener('click', clearAllChecks);

  // 탭 변경 시 체크 초기화
  document.querySelectorAll('#fee-filter-tabs .tab-btn').forEach(function(btn){
    btn.addEventListener('click', clearAllChecks);
  });
}
attachFeeBulkActions();

document.querySelectorAll('#fee-filter-tabs .tab-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('#fee-filter-tabs .tab-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    renderFullFeeList(btn.dataset.filter);
  });
});

/* ---------- 오늘의 업무 (대시보드 미니) ---------- */
var dashTasks = [
  {label:'구역 C 공실 현황 점검', who:'김민수', done:false},
  {label:'관리비 연체 고객 전화안내', who:'박지훈', done:false},
  {label:'계약서 스캔 정리 (5월분)', who:'김민수', done:false},
  {label:'알림톡 템플릿 심사 제출', who:'이서연', done:true}
];
function renderDashTasks(){
  var html = dashTasks.map(function(t, idx){
    return '<label style="display:flex; align-items:center; gap:10px; padding:7px 2px; font-size:13.5px; cursor:pointer;'+(t.done?' color:var(--ink-400); text-decoration:line-through;':'')+'">' +
      '<input type="checkbox" data-idx="'+idx+'" class="dash-task-check" '+(t.done?'checked':'')+'>' +
      t.label + ' <span style="color:var(--ink-400); font-size:12px;">· '+t.who+'</span></label>';
  }).join('');
  document.getElementById('dash-task-list').innerHTML = html;
  document.querySelectorAll('.dash-task-check').forEach(function(chk){
    chk.addEventListener('change', function(){
      dashTasks[chk.dataset.idx].done = chk.checked;
      renderDashTasks();
    });
  });
}
renderDashTasks();

/* ---------- 다가오는 추모일 (대시보드) ---------- */
var memorialData = [
  {name:'김OO 고인', sub:'유족 이서영 · 위치 1구역-A05', type:'49제', badge:'D-5', date:'2026-06-28'},
  {name:'송OO 고인', sub:'유족 한지민 · 위치 1구역-C02', type:'삼우제', badge:'D-2', date:'2026-06-25'},
  {name:'정OO 고인', sub:'유족 최우진 · 위치 1구역-A18', type:'1주기 기일', badge:'D-18', date:'2026-07-11'}
];
function renderMemorialList(){
  var html = memorialData.map(function(item){
    return '<div class="fee-row">' +
      '<div class="fee-left"><div class="fee-icon"><i class="ti ti-calendar-event"></i></div>' +
      '<div><p class="fee-name">'+item.name+'</p><p class="fee-sub">'+item.sub+'</p></div></div>' +
      '<div class="fee-right"><span class="badge badge-neutral">'+item.type+'</span>' +
      '<p class="fee-date">'+item.date+' · '+item.badge+'</p>' +
      '<div style="margin-top:6px;"><button class="btn btn-ghost btn-sm memorial-notify-btn">알림톡 발송</button></div>' +
      '</div></div>';
  }).join('');
  document.getElementById('dash-memorial-list').innerHTML = html;
  document.querySelectorAll('.memorial-notify-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ showToast('추모일 알림톡이 발송되었습니다.'); });
  });
}
renderMemorialList();

/* ================= Today Actions ================= */
function renderTodayActions(){
  var list = document.getElementById('today-action-list');
  var countEl = document.getElementById('today-action-count');
  if(!list) return;

  var items = [];

  feeData.forEach(function(f){
    if(f.daysLeft !== null && f.daysLeft < 0){
      if(items.length === 0 || items[items.length-1].type !== 'overdue'){
        items.push({type:'overdue', label:'\ud68c\uc218 \ud544\uc694 \uad00\ub9ac\ube44', count:0, urgent:true, actionLabel:'\uc54c\ub9bc\ud1a1 \ubc1c\uc1a1', actionFn:function(){}});
      }
      items[items.length-1].count++;
    }
  });

  memorialData.forEach(function(m){
    if(m.badge === 'D-0'){
      if(items.length === 0 || items[items.length-1].type !== 'memorial'){
        items.push({type:'memorial', label:'\uc624\ub298 \ucd94\ubaa8\uc77c', count:0, urgent:true, actionLabel:'\uc548\ub0b4 \ubc1c\uc1a1', actionFn:function(){}});
      }
      items[items.length-1].count++;
    }
  });

  feeData.forEach(function(f){
    if(f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30){
      if(items.length === 0 || items[items.length-1].type !== 'expiring'){
        items.push({type:'expiring', label:'\uad00\ub9ac\ube44 \ub0a9\ubd80 \uc608\uc815', count:0, urgent:false, actionLabel:'\uc0ac\uc804 \uc548\ub0b4', actionFn:function(){}});
      }
      items[items.length-1].count++;
    }
  });

  var undone = 0;
  dashTasks.forEach(function(t){ if(!t.done) undone++; });
  if(undone > 0){
    items.push({type:'task', label:'\ubbf8\uc644\ub8cc \uc5c5\ubb34', count:undone, urgent:false, actionLabel:'\uc5c5\ubb34 \ubcf4\uae30', actionFn:function(){ goPage('staff'); }});
  }

  countEl.textContent = '\ucd1d ' + items.length + '\uac74';

  if(items.length === 0){
    list.innerHTML = '<div style="padding:12px 4px; font-size:13.5px; color:var(--jade-800);">\u2705 \uc624\ub298 \ucc98\ub9ac\ud560 \uae34\uae09 \ud56d\ubaa9\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>';
    return;
  }

  var html = '';
  items.forEach(function(item, idx){
    var bgColor = item.urgent ? 'var(--wine-100)' : 'var(--stone-50)';
    var borderColor = item.urgent ? 'var(--wine-600)' : 'var(--jade-700)';
    var btnStyle = item.urgent ? 'background:var(--wine-600); color:#fff; border-color:var(--wine-600);' : 'background:var(--jade-700); color:#fff; border-color:var(--jade-700);';
    item._idx = idx;
    html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:var(--radius-sm); background:' + bgColor + '; border-left:3px solid ' + borderColor + ';">';
    html += '<div><span style="font-size:13.5px; font-weight:600;">' + item.label + '</span><span style="font-size:12px; color:var(--ink-600); margin-left:8px;">' + item.count + '\uac74</span></div>';
    html += '<button class="btn btn-sm" data-today-idx="' + idx + '" style="' + btnStyle + ' padding:5px 12px; font-size:12px;">' + item.actionLabel + '</button>';
    html += '</div>';
  });
  list.innerHTML = html;

  list.querySelectorAll('[data-today-idx]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.todayIdx);
      if(items[idx]) items[idx].actionFn();
    });
  });
}

// Bind action functions separately (closure fix)
(function(){
  var items = [];
  var overdueCount = 0;
  feeData.forEach(function(f){ if(f.daysLeft !== null && f.daysLeft < 0) overdueCount++; });
  if(overdueCount > 0) items.push({label:'\uc54c\ub9bc\ud1a1 \ubc1c\uc1a1', fn:function(){ showToast('\uc5f0\uccb4 \uc54c\ub9bc\ud1a1\uc744 ' + overdueCount + '\uac74 \ubc1c\uc1a1\ud569\ub2c8\ub2e4.'); }});

  var todayMemorialCount = 0;
  memorialData.forEach(function(m){ if(m.badge === 'D-0') todayMemorialCount++; });
  if(todayMemorialCount > 0) items.push({label:'\uc548\ub0b4 \ubc1c\uc1a1', fn:function(){ showToast('\ucd94\ubaa8\uc77c \uc548\ub0b4 \ubb38\uc790\ub97c ' + todayMemorialCount + '\uac74 \ubc1c\uc1a1\ud569\ub2c8\ub2e4.'); }});

  var expiringCount = 0;
  feeData.forEach(function(f){ if(f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30) expiringCount++; });
  if(expiringCount > 0) items.push({label:'\uc0ac\uc804 \uc548\ub0b4', fn:function(){ showToast('\uad00\ub9ac\ube44 \ub0a9\ubd80 \uc0ac\uc804 \uc548\ub0b4\ub97c ' + expiringCount + '\uac74 \ubc1c\uc1a1\ud569\ub2c8\ub2e4.'); }});

  // Replace action functions after render
  var origRender = renderTodayActions;
  renderTodayActions = function(){
    origRender();
    var list = document.getElementById('today-action-list');
    if(!list) return;
    var btns = list.querySelectorAll('[data-today-idx]');
    btns.forEach(function(btn){
      var idx = parseInt(btn.dataset.todayIdx);
      if(idx < items.length && items[idx]){
        btn.addEventListener('click', items[idx].fn);
      }
    });
  };
})();

if(document.getElementById('today-action-list')){
  renderTodayActions();
}

/* ---------- 직원 관리 ---------- */
// 출퇴근 데이터
var staffAttend = {
  '김민수':{in:'08:52', out:'18:30', status:'출근'},
  '이서연':{in:'09:05', out:null, status:'출근'},
  '박지훈':{in:null, out:null, status:'지각'},
  '한도윤':{in:'08:45', out:'17:50', status:'출근'},
  '오세훈':{in:null, out:null, status:'퇴사'}
};

function renderAttendance(){
  var container = document.getElementById('staff-attendance');
  if(!container) return;
  var dateEl = document.getElementById('staff-attend-date');
  if(dateEl){
    var now = new Date();
    dateEl.textContent = now.getFullYear() + '.' + (now.getMonth()+1) + '.' + now.getDate() + ' (' + ['일','월','화','수','목','금','토'][now.getDay()] + ')';
  }
  
  var names = ['김민수','이서연','박지훈','한도윤','오세훈'];
  var html = '';
  names.forEach(function(name){
    var d = staffAttend[name] || {in:null, out:null, status:'-'};
    var icon = d.status === '출근' ? '🟢' : (d.status === '지각' ? '🟡' : '⚪');
    var statusColor = d.status === '출근' ? 'var(--jade-700)' : (d.status === '지각' ? 'var(--brass-500)' : 'var(--ink-400)');
    var inTime = d.in || '--:--';
    var outTime = d.out || '--:--';
    var todayCheck = d.in ? true : false;
    
    html += '<div style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--stone-50); border-radius:var(--radius-sm);">' +
      '<div class="mini-avatar" style="background:' + (todayCheck ? 'var(--jade-700)' : 'var(--stone-300)') + ';">' + name[0] + '</div>' +
      '<div style="flex:1;"><p style="margin:0; font-size:12.5px; font-weight:600;">' + name + '</p>' +
      '<p style="margin:0; font-size:10px; color:var(--ink-400);">' + icon + ' <span style="color:' + statusColor + ';">' + d.status + '</span> · ' + (d.in ? '출근 ' + inTime : '미출근') + (d.out ? ' · 퇴근 ' + outTime : '') + '</p></div>' +
      '<span style="font-size:16px;">' + (todayCheck ? '🟢' : '⭕') + '</span></div>';
  });
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function(){
  renderAttendance();
});

// 출퇴근 버튼
var clockInBtn = document.getElementById('staff-clock-in');
if(clockInBtn){
  clockInBtn.addEventListener('click', function(){
    var now = new Date();
    var time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    staffAttend['김민수'] = {in:time, out:null, status: now.getHours() >= 9 ? '지각' : '출근'};
    renderAttendance();
    showToast('✅ 출근 처리되었습니다. (' + time + ')');
  });
}

var clockOutBtn = document.getElementById('staff-clock-out');
if(clockOutBtn){
  clockOutBtn.addEventListener('click', function(){
    var now = new Date();
    var time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    if(staffAttend['김민수']) staffAttend['김민수'].out = time;
    renderAttendance();
    showToast('✅ 퇴근 처리되었습니다. (' + time + ')');
  });
}

/* ---------- 휴가 데이터 ---------- */
var vacationData = [
  {name:'박지훈', type:'연차', start:'2026-06-25', end:'2026-06-26', reason:'개인사정'},
  {name:'이서연', type:'반차', start:'2026-06-27', end:'2026-06-27', reason:'오전 진료'},
  {name:'한도윤', type:'연차', start:'2026-06-30', end:'2026-07-01', reason:'가족 여행'}
];

function renderVacation(){
  var container = document.getElementById('staff-vacation-list');
  if(!container) return;
  if(vacationData.length === 0){
    container.innerHTML = '<p style="font-size:13px; color:var(--ink-400); padding:8px 0;">📭 등록된 휴가가 없습니다.</p>';
    return;
  }
  var html = '';
  vacationData.forEach(function(v, idx){
    var today = new Date();
    var start = new Date(v.start);
    var diffDays = Math.ceil((start - today) / (1000*60*60*24));
    var dday = diffDays <= 0 ? '📅 진행중' : 'D-' + diffDays;
    var typeIcon = v.type === '연차' ? '🏖️' : '⏳';
    html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:var(--stone-50); border-radius:var(--radius-sm);">' +
      '<div><p style="margin:0; font-size:12px; font-weight:600;">' + typeIcon + ' ' + v.name + ' · ' + v.type + '</p>' +
      '<p style="margin:0; font-size:10px; color:var(--ink-400);">' + v.start + ' ~ ' + v.end + ' · ' + v.reason + '</p></div>' +
      '<div style="text-align:right;"><span class="badge badge-warning">' + dday + '</span></div></div>';
  });
  container.innerHTML = html;
}

// 페이지 진입 시 업데이트
var _origGoPage3 = goPage;
goPage = function(page){
  _origGoPage3(page);
  if(page === 'staff'){ renderAttendance(); renderVacation(); }
  if(page === 'revenuemanage'){ updateRevenueManage('month'); renderRMSubMetrics(); }
  if(page === 'notifications') renderTemplates();
};

renderAttendance();
renderVacation();

/* ---------- 유족 관리 ---------- */
var custData = [
  {name:'이서영', deceased:'김OO', loc:'B-12', phone:'010-1111-2222', lastVisit:'2026-06-18', status:'ok'},
  {name:'한지민', deceased:'송OO', loc:'C-02', phone:'010-3333-4444', lastVisit:'2026-06-20', status:'ok'},
  {name:'최우진', deceased:'정OO', loc:'A-18', phone:'010-5555-6666', lastVisit:'2026-06-15', status:'ok'},
  {name:'윤하경', deceased:'오OO (2기)', loc:'A-05,A-09', phone:'010-7777-8888', lastVisit:'2026-06-10', status:'warn'},
  {name:'장혜민', deceased:'황OO', loc:'B-21', phone:'010-9999-0000', lastVisit:'2026-06-22', status:'ok'},
  {name:'박OO', deceased:'최OO', loc:'B-12', phone:'010-2345-6789', lastVisit:'2026-05-28', status:'danger'},
  {name:'정은숙', deceased:'이OO', loc:'A-03', phone:'010-4444-7777', lastVisit:'2026-06-01', status:'warn'},
  {name:'송민호', deceased:'박OO', loc:'C-08', phone:'010-8888-2222', lastVisit:'2026-06-19', status:'ok'}
];

var visitLog = [
  {name:'장혜민', date:'2026-06-22', type:'관리비 납부', memo:'방문 납부 완료'},
  {name:'한지민', date:'2026-06-20', type:'추모 방문', memo:'삼우제'},
  {name:'송민호', date:'2026-06-19', type:'시설 견학', memo:'추가 구좌 문의'},
  {name:'이서영', date:'2026-06-18', type:'관리비 납부', memo:'연체분 정리 완료'},
  {name:'최우진', date:'2026-06-15', type:'추모 방문', memo:'고인 생신'},
  {name:'윤하경', date:'2026-06-10', type:'서류 발급', memo:'봉안증명서 재발급'}
];

var custMemos = [
  {name:'박OO', text:'연체 지속, 전화 연결 안됨. 등기 발송 필요', date:'2026-06-20', author:'김민수'},
  {name:'정은숙', text:'고인 배우자와 연락 두절. 자녀분과 통화 완료', date:'2026-06-18', author:'이서연'},
  {name:'윤하경', text:'추가 구좌 계약 진행 중 (A-31)', date:'2026-06-15', author:'박지훈'}
];

function renderCustTable(){
  var tbody = document.getElementById('cust-tbody');
  if(!tbody) return;
  
  document.getElementById('cust-total').textContent = custData.length + '명';
  
  var html = '';
  custData.forEach(function(c){
    var borderColor = c.status === 'danger' ? 'var(--wine-600)' : (c.status === 'warn' ? 'var(--brass-500)' : 'transparent');
    var statusIcon = c.status === 'danger' ? '🔴' : (c.status === 'warn' ? '🟡' : '🟢');
    html += '<tr style="border-left:3px solid ' + borderColor + ';">' +
      '<td><span style="font-weight:600;">' + statusIcon + ' ' + c.name + '</span></td>' +
      '<td style="color:var(--ink-600);">' + c.deceased + '</td>' +
      '<td>' + c.loc + '</td>' +
      '<td style="color:var(--ink-500);">' + c.phone + '</td>' +
      '<td style="font-size:12px;">' + c.lastVisit + '</td>' +
      '<td><button class="btn btn-ghost btn-sm cust-msg-btn" data-name="' + c.name + '" data-phone="' + c.phone + '" style="font-size:10px; padding:2px 8px;">💬 연락</button></td>' +
      '</tr>';
  });
  tbody.innerHTML = html;
  
  // 연락 버튼
  document.querySelectorAll('.cust-msg-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      showToast('💬 ' + btn.dataset.name + '님 (' + btn.dataset.phone + ') 문자 발송 페이지를 엽니다.');
    });
  });
}

function renderCustVisitLog(){
  var container = document.getElementById('cust-visit-log');
  if(!container) return;
  var html = '';
  visitLog.forEach(function(v){
    var icon = v.type === '관리비 납부' ? '💳' : (v.type === '추모 방문' ? '🕯️' : '📋');
    html += '<div style="display:flex; gap:8px; padding:6px 8px; background:var(--stone-50); border-radius:var(--radius-sm); font-size:12px;">' +
      '<span style="font-size:14px;">' + icon + '</span>' +
      '<div><p style="margin:0; font-weight:600;">' + v.name + ' · ' + v.type + '</p>' +
      '<p style="margin:2px 0 0; color:var(--ink-400); font-size:10.5px;">' + v.date + ' · ' + v.memo + '</p></div></div>';
  });
  container.innerHTML = html;
}

function renderCustMemos(){
  var container = document.getElementById('cust-memo-list');
  if(!container) return;
  if(custMemos.length === 0){
    container.innerHTML = '<p style="font-size:12px; color:var(--ink-400);">📭 등록된 메모가 없습니다.</p>';
    return;
  }
  var html = '';
  custMemos.forEach(function(m){
    var statusColor = m.text.includes('연체') ? 'var(--wine-600)' : 'var(--ink-600)';
    html += '<div style="padding:6px 8px; background:var(--stone-50); border-radius:var(--radius-sm); border-left:3px solid ' + statusColor + ';">' +
      '<p style="margin:0; font-size:11.5px;">' + m.text + '</p>' +
      '<p style="margin:2px 0 0; font-size:9.5px; color:var(--ink-400);">' + m.name + ' · ' + m.author + ' · ' + m.date + '</p></div>';
  });
  container.innerHTML = html;
}

// 메모 등록
var memoInput = document.getElementById('cust-memo-input');
var memoBtn = document.getElementById('cust-memo-add');
if(memoInput && memoBtn){
  memoBtn.addEventListener('click', function(){
    var text = memoInput.value.trim();
    if(!text){ showToast('메모를 입력하세요.'); return; }
    var now = new Date();
    var dateStr = now.getFullYear() + '-' + (now.getMonth()+1).toString().padStart(2,'0') + '-' + now.getDate().toString().padStart(2,'0');
    custMemos.unshift({name:'전체', text:text, date:dateStr, author:'김민수'});
    renderCustMemos();
    memoInput.value = '';
    showToast('✅ 메모가 등록되었습니다.');
  });
  memoInput.addEventListener('keypress', function(e){
    if(e.key === 'Enter') memoBtn.click();
  });
}

// customer goPage
var _origGoPage4 = goPage;
goPage = function(page){
  _origGoPage4(page);
  if(page === 'customers'){ renderCustTable(); renderCustVisitLog(); renderCustMemos(); }
  if(page === 'staff'){ renderAttendance(); renderVacation(); }
  if(page === 'revenuemanage'){ updateRevenueManage('month'); renderRMSubMetrics(); }
  if(page === 'notifications') renderTemplates();
  if(page === 'contracts') renderContractStats();
  if(page === 'newcontract'){ /* init new contract form */ }
  if(page === 'fees') renderFeeStats();
};

try{renderCustTable();}catch(e){console.log('cust err:',e)}
try{renderCustVisitLog();}catch(e){console.log('visit err:',e)}
try{renderCustMemos();}catch(e){console.log('memo err:',e)}

/* ---------- 계약 관리 ---------- */
function renderContractStats(){
  // 통계 업데이트
  document.getElementById('ct-total').textContent = '42건';
  document.getElementById('ct-total-sub').textContent = '사용중 31구좌';
  document.getElementById('ct-new-month').textContent = '5건';
  document.getElementById('ct-new-month-sub').textContent = '계약금 합계 ₩42,300,000';
  document.getElementById('ct-cancel-rate').textContent = '2.4%';
  document.getElementById('ct-cancel-rate-sub').textContent = '1건 해약';
  document.getElementById('ct-expiring').textContent = '3건';
  document.getElementById('ct-expiring-sub').textContent = '3개월 내 관리비 주기 만료';
  
  renderExpiringContracts();
}

function renderExpiringContracts(){
  var container = document.getElementById('ct-expiring-list');
  if(!container) return;
  
  var expiringData = [
    {contract:'CT-2026-031', customer:'박OO 유족', deceased:'최OO', loc:'B-12', cycle:'3년', expireDate:'2026-07-18', dday:25, status:'renew'},
    {contract:'CT-2026-025', customer:'배OO 유족', deceased:'임OO', loc:'B-07', cycle:'5년', expireDate:'2026-08-05', dday:43, status:'renew'},
    {contract:'CT-2026-038', customer:'윤하경', deceased:'강OO', loc:'A-31', cycle:'3년', expireDate:'2026-09-05', dday:74, status:'renew'}
  ];
  
  var html = '';
  expiringData.forEach(function(e){
    var urgency = e.dday <= 30 ? 'danger' : 'warning';
    var borderColor = urgency === 'danger' ? 'var(--wine-600)' : 'var(--brass-500)';
    html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-left:3px solid ' + borderColor + '; background:var(--stone-50); border-radius:var(--radius-sm);">' +
      '<div style="display:flex; align-items:center; gap:10px;">' +
      '<span class="badge ' + (urgency === 'danger' ? 'badge-danger' : 'badge-warning') + '">D-' + e.dday + '</span>' +
      '<div><p style="margin:0; font-size:12px; font-weight:600;">' + e.contract + ' · ' + e.customer + '</p>' +
      '<p style="margin:0; font-size:10px; color:var(--ink-400);">고인 ' + e.deceased + ' · ' + e.loc + ' · ' + e.cycle + '주기 만료 ' + e.expireDate + '</p></div></div>' +
      '<div style="display:flex; gap:4px;">' +
      '<button class="btn btn-ghost btn-sm ct-renew-btn" style="font-size:10px; padding:3px 10px;">계약갱신</button>' +
      '<button class="btn btn-ghost btn-sm ct-notify-btn" style="font-size:10px; padding:3px 10px;">알림톡</button></div></div>';
  });
  container.innerHTML = html;
  
  // 버튼 핸들러
  container.querySelectorAll('.ct-renew-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ showToast('📝 계약갱신 화면으로 이동합니다.'); });
  });
  container.querySelectorAll('.ct-notify-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ showToast('💛 만료 안내 알림톡이 발송되었습니다.'); });
  });
}

renderContractStats();

/* ---------- 관리비 관리 ---------- */
function renderFeeStats(){
  var els = ['fee-total-amount','fee-collected-amount','fee-collected-sub','fee-overdue-amount','fee-overdue-sub','fee-rate','fee-rate-sub'];
  var allExist = els.every(function(id){ return !!document.getElementById(id); });
  if(!allExist) return;
  
  var collected = 27, total = 31, overdue = 4;
  var totalAmount = 360000 * total;
  var collectedAmount = 360000 * collected;
  var overdueAmount = 360000 * overdue;
  var rate = Math.round(collected / total * 100);
  
  document.getElementById('fee-total-amount').textContent = '₩' + totalAmount.toLocaleString();
  document.getElementById('fee-collected-amount').textContent = '₩' + collectedAmount.toLocaleString();
  document.getElementById('fee-collected-sub').textContent = collected + '건 완료';
  document.getElementById('fee-overdue-amount').textContent = '₩' + overdueAmount.toLocaleString();
  document.getElementById('fee-overdue-sub').textContent = overdue + '건 · 평균 2.7일';
  document.getElementById('fee-rate').textContent = rate + '%';
  document.getElementById('fee-rate-sub').textContent = '전월 대비 +3.2%';
  
  var activeFilter = document.querySelector('#fee-filter-tabs .tab-btn.active');
  if(activeFilter) renderFullFeeList(activeFilter.dataset.filter);
}

// 연체 일괄 알림톡
var fnBtn = document.getElementById('fee-bulk-notify');
if(fnBtn){
  fnBtn.addEventListener('click', function(){
    var overdueItems = feeData.filter(function(i) { 
      return getFeeVisual(i.daysLeft).filterStatus === 'overdue'; 
    });
    if(overdueItems.length === 0){
      showToast('✅ 연체 항목이 없습니다.');
      return;
    }
    overdueItems.forEach(function(item){
      addKakaoLog('관리비 안내', item.name, '연체 안내 자동 발송');
    });
    showToast('💛 연체자 ' + overdueItems.length + '명에게 알림톡이 일괄 발송되었습니다.');
  });
}

renderFeeStats();

// 월간 매출 데이터 (1~6월)
var monthlyRevenue = [32000000, 41000000, 38500000, 45000000, 52000000, 48500000];

function renderRevenueChart(){
  var max = Math.max.apply(null, monthlyRevenue);
  var chartEls = document.querySelectorAll('#rm-chart-v2 > div');
  chartEls.forEach(function(el, i){
    if(i >= monthlyRevenue.length) return;
    var val = monthlyRevenue[i];
    var pct = Math.round(val / max * 100);
    var wrap = el.querySelector('.chart-bar-wrap');
    var bar = wrap ? wrap.querySelector('div') : null;
    var label = el.querySelector('span');
    if(bar) bar.style.height = pct + '%';
    if(label && label.style.fontSize === '8px'){
      label.textContent = '₩' + (val / 10000).toFixed(0) + '만';
    }
  });
  // 총계 업데이트
  var totalEl = document.getElementById('rm-chart-total');
  if(totalEl){
    var sum = monthlyRevenue.reduce(function(a,b){return a+b;}, 0);
    totalEl.textContent = '1~6월 합계 ₩' + sum.toLocaleString();
  }
}

var financeData = {
  today: { revenue: 1200000, cost: 150000, label:'오늘 (6/23)' },
  week: { revenue: 8500000, cost: 650000, label:'이번주 (6/17~6/23)' },
  month: { revenue: 48500000, cost: 1500000, label:'이번달 (2026년 6월)' },
  year: { revenue: 285000000, cost: 9500000, label:'올해 (2026년 1~6월)' }
};

function updateFinance(period){
  var data = financeData[period] || financeData.month;
  ['fin-revenue','fin-cost','fin-profit','fin-profit-rate','finance-period-label'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.textContent = '';
  });
  var el = document.getElementById('fin-revenue');
  if(el) el.textContent = '₩' + data.revenue.toLocaleString();
  el = document.getElementById('fin-cost');
  if(el) el.textContent = '₩' + data.cost.toLocaleString();
  var profit = data.revenue - data.cost;
  el = document.getElementById('fin-profit');
  if(el) el.textContent = '₩' + profit.toLocaleString();
  var rate = data.revenue > 0 ? (profit / data.revenue * 100).toFixed(1) : 0;
  el = document.getElementById('fin-profit-rate');
  if(el) el.textContent = '매출 대비 ' + rate + '%';
  el = document.getElementById('finance-period-label');
  if(el) el.textContent = data.label + ' 기준';
}

document.querySelectorAll('.finance-period-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.finance-period-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    updateFinance(btn.dataset.period);
  });
});

updateFinance('month');

/* ---------- 예상 납부 일정 ---------- */
function renderExpectedPayments(){
  var container = document.getElementById('expected-pay-list');
  if(!container) return;
  
  var today = new Date();
  var dayNames = ['일','월','화','수','목','금','토'];
  var totalMonthlyFee = 360000; // 연간 관리비
  var dailyFee = Math.round(totalMonthlyFee / 365);
  var activeContracts = 31; // 사용중 구좌 수
  var estimatedDaily = dailyFee * activeContracts;
  
  var html = '';
  for(var d=0; d<5; d++){
    var date = new Date(today);
    date.setDate(date.getDate() + d);
    var dateStr = (date.getMonth()+1) + '/' + date.getDate();
    var dayName = dayNames[date.getDay()];
    var label = d === 0 ? '오늘' : (d === 1 ? '내일' : (d === 2 ? '모레' : dateStr + '(' + dayName + ')'));
    var amount = estimatedDaily + Math.floor(Math.random() * 50000 - 25000);
    
    html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:5px 8px; background:var(--stone-50); border-radius:4px;">' +
      '<div><p style="margin:0; font-size:11px; font-weight:600;">' + label + '</p><p style="margin:0; font-size:9px; color:var(--ink-400);">예상 ' + activeContracts + '건</p></div>' +
      '<p style="margin:0; font-size:12px; font-weight:700; color:var(--jade-700);">₩' + amount.toLocaleString() + '</p></div>';
  }
  container.innerHTML = html;
}

renderExpectedPayments();

/* ---------- 매출 관리 페이지 ---------- */
function updateRevenueManage(period){
  renderRevenueChart();
  var data = financeData[period] || financeData.month;
  document.getElementById('rm-revenue').textContent = '₩' + data.revenue.toLocaleString();
  document.getElementById('rm-cost').textContent = '₩' + data.cost.toLocaleString();
  var profit = data.revenue - data.cost;
  document.getElementById('rm-profit').textContent = '₩' + profit.toLocaleString();
  var rate = data.revenue > 0 ? (profit / data.revenue * 100).toFixed(1) : 0;
  document.getElementById('rm-profit-rate').textContent = '매출 대비 ' + rate + '%';
  
  // 예상 납부 일정
  renderCalendar();
  renderRMSchedule(document.querySelector('.rm-schedule-btn.active')?.dataset?.sched || 'day');
}

document.querySelectorAll('.rm-period-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.rm-period-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    updateRevenueManage(btn.dataset.period);
  });
});

function renderRMSchedule(mode){
  var container = document.getElementById('rm-schedule-list');
  if(!container) return;
  var today = new Date();
  var dayNames = ['일','월','화','수','목','금','토'];
  var dailyFee = Math.round(360000 / 365);
  var activeContracts = 31;
  var estimatedDaily = dailyFee * activeContracts;
  
  // 주간 타임라인도 함께 업데이트
  renderCalendar();
  
  var count = mode === 'day' ? 7 : (mode === 'week' ? 4 : 12);
  var html = '';
  for(var d=0; d<count; d++){
    var date = new Date(today);
    if(mode === 'day') date.setDate(date.getDate() + d);
    else if(mode === 'week') date.setDate(date.getDate() + d * 7);
    else date.setMonth(date.getMonth() + d);
    
    var dateStr = (date.getMonth()+1) + '/' + date.getDate();
    var dayName = dayNames[date.getDay()];
    var label = mode === 'day' 
      ? (d === 0 ? '오늘' : (d === 1 ? '내일' : (d === 2 ? '모레' : dateStr + '(' + dayName + ')')))
      : ((d + 1) + (mode === 'week' ? '주차' : '월'));
    var multiplier = mode === 'day' ? 1 : (mode === 'week' ? 7 : 30);
    var amount = estimatedDaily * multiplier + Math.floor(Math.random() * 50000 * multiplier - 25000 * multiplier);
    html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:var(--stone-50); border-radius:var(--radius-sm);">' +
      '<div><p style="margin:0; font-size:11.5px; font-weight:600;">' + label + '</p><p style="margin:0; font-size:9px; color:var(--ink-400);">예상 ' + (mode === 'day' ? activeContracts : activeContracts * multiplier) + '건</p></div>' +
      '<p style="margin:0; font-size:13px; font-weight:700; color:var(--jade-700);">₩' + amount.toLocaleString() + '</p></div>';
  }
  container.innerHTML = html;
}

/* 이번주 타임라인 */
function renderCalendar(){
  var cal = document.getElementById('rm-calendar');
  if(!cal) return;
  var sumEl = document.getElementById('rm-month-summary');
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  var dayNames = ['일','월','화','수','목','금','토'];
  var dailyFee = Math.round(360000 / 365);
  var activeContracts = 31;
  var estimatedDaily = dailyFee * activeContracts;
  
  // 첫째날 요일, 마지막 날짜
  var firstDay = new Date(year, month, 1).getDay();
  var lastDate = new Date(year, month + 1, 0).getDate();
  var today = now.getDate();
  
  var html = '<div style="display:grid; grid-template-columns:repeat(7,1fr); gap:3px;">';
  // 요일 헤더
  for(var i=0; i<7; i++){
    var isSun = i === 0, isSat = i === 6;
    html += '<div style="text-align:center; padding:5px 0; font-size:10px; font-weight:700; color:' + (isSun ? 'var(--wine-600)' : isSat ? 'var(--blue-600)' : 'var(--ink-400)') + ';">' + dayNames[i] + '</div>';
  }
  
  // 빈 칸
  var monthTotal = 0;
  for(var i=0; i<firstDay; i++){
    html += '<div></div>';
  }
  
  // 날짜
  for(var d=1; d<=lastDate; d++){
    var dateObj = new Date(year, month, d);
    var day = dateObj.getDay();
    var isSun = day === 0, isSat = day === 6;
    var isToday = d === today;
    var isPast = d < today;
    var amount = estimatedDaily + Math.floor(Math.random() * 40000 - 20000);
    monthTotal += isPast ? 0 : amount;
    
    var bg = isToday ? 'background:var(--jade-50); border:1px solid var(--jade-700);' : 'background:var(--stone-50);';
    var opacity = isPast ? 'opacity:0.45;' : '';
    
    html += '<div style="' + bg + opacity + 'border-radius:6px; padding:5px 3px; text-align:center; min-height:50px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;">' +
      '<span style="font-size:11px; font-weight:' + (isToday ? '700' : '600') + '; color:' + (isSun ? 'var(--wine-600)' : isSat ? 'var(--blue-600)' : 'var(--ink-900)') + ';">' + d + '</span>' +
      (isPast 
        ? '<span style="font-size:7px; color:var(--ink-300);">-</span>'
        : '<span style="font-size:7px; font-weight:700; color:var(--jade-700);">₩' + amount.toLocaleString() + '</span>'
      ) +
      (isToday ? '<span style="font-size:6px; font-weight:700; color:#fff; background:var(--jade-700); padding:1px 5px; border-radius:999px;">TODAY</span>' : '') +
      '</div>';
  }
  html += '</div>';
  cal.innerHTML = html;
  if(sumEl) sumEl.textContent = '6월 남은 예상 ₩' + monthTotal.toLocaleString();
  
  updateRMChart();
}

/* 월간 차트 */
function updateRMChart(){
  var chart = document.getElementById('rm-chart-v2');
  if(!chart) return;
  var totalEl = document.getElementById('rm-chart-total');
  var monthlyData = [
    {label:'1월', val:42000000, peak:false},
    {label:'2월', val:39000000, peak:false},
    {label:'3월', val:45000000, peak:false},
    {label:'4월', val:52000000, peak:false},
    {label:'5월', val:48000000, peak:false},
    {label:'6월', val:55000000, peak:true}
  ];
  var maxVal = Math.max.apply(null, monthlyData.map(function(m){return m.val;}));
  var total = monthlyData.reduce(function(a,m){return a+m.val;}, 0);
  if(totalEl) totalEl.textContent = '1~6월 합계 ₩' + total.toLocaleString();
  
  var cells = chart.children;
  for(var i=0; i<monthlyData.length && i<cells.length; i++){
    var m = monthlyData[i];
    var amountLabel = cells[i].children[0];
    var barWrap = cells[i].children[1];
    var monthLabel = cells[i].children[2];
    
    if(amountLabel && barWrap && monthLabel){
      amountLabel.textContent = '₩' + Math.round(m.val/1000000) + 'M';
      monthLabel.textContent = m.label;
      monthLabel.style.fontWeight = m.peak ? '700' : '600';
      
      var bar = barWrap.children[0];
      if(bar){
        var barH = Math.round(m.val / maxVal * 100);
        barH = barH < 20 ? 20 : barH;
        bar.style.height = barH + 'px';
        bar.style.background = m.peak ? 'var(--brass-500)' : 'var(--jade-700)';
        
        // Peak indicator
        if(m.peak){
          var existing = bar.querySelector('span');
          if(!existing){
            var badge = document.createElement('span');
            badge.textContent = '▲';
            badge.style.cssText = 'position:absolute; top:-14px; left:50%; transform:translateX(-50%); font-size:8px; color:var(--brass-600); font-weight:700;';
            bar.style.position = 'relative';
            bar.appendChild(badge);
          }
        }
      }
    }
  }
}

document.querySelectorAll('.rm-schedule-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.rm-schedule-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    renderRMSchedule(btn.dataset.sched);
  });
});

// 페이지 진입 시 업데이트
var _origGoPage2 = goPage;
goPage = function(page){
  _origGoPage2(page);
  if(page === 'revenuemanage'){ updateRevenueManage('month'); renderRMSubMetrics(); }
  if(page === 'notifications'){ renderTemplates(); renderExamples(); }
};

updateRevenueManage('month');

/* ---------- 매출 관리 부가 지표 ---------- */
function renderRMSubMetrics(){
  // 수납률
  var collected = 27, total = 31, overdue = 4;
  var rate = Math.round(collected / total * 100);
  document.getElementById('rm-collect-rate').textContent = rate + '%';
  document.getElementById('rm-collect-sub').textContent = total + '건 중 ' + collected + '건 완료';
  
  // 연체율
  var overdueTotal = 1440000;
  document.getElementById('rm-overdue-rate').textContent = Math.round((total - collected) / total * 100) + '%';
  document.getElementById('rm-overdue-sub').textContent = overdue + '건 · 연체 총액 ₩' + overdueTotal.toLocaleString();
  
  // 예상 현금흐름 (6/23~6/30)
  var dailyFee = Math.round(360000 / 365);
  var activeContracts = 31;
  var daysLeft = 7;
  var cashflow = dailyFee * activeContracts * daysLeft;
  document.getElementById('rm-cashflow').textContent = '₩' + cashflow.toLocaleString();
  document.getElementById('rm-cashflow-sub').textContent = '6/23~6/30 예상 (' + daysLeft + '일)';
  
  // 평균 계약단가
  var totalContracts = 42;
  var totalAmount = 302400000;
  var avg = Math.round(totalAmount / totalContracts);
  document.getElementById('rm-avg-contract').textContent = '₩' + avg.toLocaleString();
  document.getElementById('rm-avg-contract-sub').textContent = '총 ' + totalContracts + '건 기준';
  
  // 계약 현황 요약
  var summaryHtml = '';
  var items = [
    {label:'총 계약 건수', value:'42건', icon:'📋'},
    {label:'사용중 구좌', value:'31구좌', icon:'📍'},
    {label:'이번달 신규 계약', value:'12건', icon:'🆕'},
    {label:'이번달 신규 계약금액', value:'₩156,800,000', icon:'💰'},
    {label:'계약 기간', value:'3년 25건 / 5년 17건', icon:'📅'},
    {label:'결제 방식 분포', value:'현금 18건 / 카드 14건 / 계좌 10건', icon:'💳'}
  ];
  items.forEach(function(item){
    summaryHtml += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:var(--stone-50); border-radius:var(--radius-sm); font-size:13px;">' +
      '<span style="color:var(--ink-600);">' + item.icon + ' ' + item.label + '</span>' +
      '<span style="font-weight:700;">' + item.value + '</span></div>';
  });
  document.getElementById('rm-contract-summary').innerHTML = summaryHtml;
  
  // 연체 관리
  var overdueItems = [
    {name:'박OO 유족', location:'B-12', amount:360000, days:5, tier:'danger'},
    {name:'이OO 유족', location:'A-05', amount:360000, days:3, tier:'warning'},
    {name:'최OO 유족', location:'A-18', amount:360000, days:2, tier:'warning'},
    {name:'한OO 유족', location:'C-02', amount:360000, days:1, tier:'warning'}
  ];
  var overdueHtml = '';
  overdueItems.forEach(function(item){
    var borderColor = item.tier === 'danger' ? 'var(--wine-600)' : 'var(--brass-500)';
    overdueHtml += '<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-left:3px solid ' + borderColor + '; background:var(--stone-50); border-radius:var(--radius-sm);">' +
      '<div><p style="margin:0; font-size:12px; font-weight:600;">' + item.name + '</p><p style="margin:0; font-size:10px; color:var(--ink-400);">' + item.location + ' · 연체 ' + item.days + '일차</p></div>' +
      '<div style="text-align:right;"><p style="margin:0; font-size:13px; font-weight:700; color:var(--wine-600);">₩' + item.amount.toLocaleString() + '</p>' +
      '<button class="btn btn-ghost btn-sm" style="margin-top:2px; font-size:10px; padding:2px 8px;">알림톡 발송</button></div></div>';
  });
  document.getElementById('rm-overdue-list').innerHTML = overdueHtml || '<p style="color:var(--ink-400); font-size:13px; padding:8px 0;">✅ 연체 내역이 없습니다.</p>';
  
  // 연체 항목 알림톡 버튼 핸들러
  document.querySelectorAll('#rm-overdue-list .btn').forEach(function(btn){
    btn.addEventListener('click', function(){ showToast('💛 연체 안내 알림톡이 발송되었습니다.'); });
  });
}

renderRMSubMetrics();

function applyContractFilters(){
  var q = document.getElementById('contract-search').value.trim();
  var activeFilter = document.querySelector('#contract-filter-tabs .tab-btn.active').dataset.filter;
  document.querySelectorAll('#contract-table tbody tr').forEach(function(tr){
    var matchesText = tr.textContent.indexOf(q) > -1;
    var matchesStatus = (activeFilter==='all' || tr.dataset.status===activeFilter);
    tr.style.display = (matchesText && matchesStatus) ? '' : 'none';
  });
}
document.getElementById('contract-search').addEventListener('keyup', applyContractFilters);
document.querySelectorAll('#contract-filter-tabs .tab-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('#contract-filter-tabs .tab-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    applyContractFilters();
  });
});
var relocateTargetRow = null;
document.querySelector('#contract-table tbody').addEventListener('click', function(e){
  if(e.target.classList.contains('doc-issue-btn')){
    showToast('계약서 · 봉안증명서 · 거래명세서가 발급되었습니다.');
  }
  if(e.target.classList.contains('changelog-row-btn')){
    var tr = e.target.closest('tr');
    var tds = tr.children;
    var contractNo = tds[0].textContent;
    
    // 사이드패널에 계약 상세 표시
    var panel = document.getElementById('loc-side-panel');
    var overlay = document.getElementById('lsp-overlay');
    
    document.getElementById('lsp-title').textContent = contractNo;
    
    var badgeEl = document.getElementById('lsp-status-badge');
    var status = tds[8].textContent.trim();
    if(status.indexOf('\uc815\uc0c1') >= 0){
      badgeEl.className = 'badge badge-success';
      badgeEl.innerHTML = '<i class="ti ti-circle-check"></i> \uc815\uc0c1';
    } else if(status.indexOf('\ud574\uc57d') >= 0){
      badgeEl.className = 'badge badge-danger';
      badgeEl.innerHTML = '<i class="ti ti-alert-circle"></i> \ud574\uc57d';
    } else {
      badgeEl.className = 'badge badge-neutral';
      badgeEl.innerHTML = status;
    }
    
    var body = document.getElementById('lsp-body');
    body.innerHTML = '';
    
    function addRow(label, value){
      var row = document.createElement('div');
      row.className = 'info-row';
      row.innerHTML = '<span class="info-label">' + label + '</span><span class="info-value">' + value + '</span>';
      body.appendChild(row);
    }
    function addSection(title){
      var h = document.createElement('h4');
      h.textContent = title;
      body.appendChild(h);
    }
    
    addRow('\uacc4\uc57d\uc790', tds[2].textContent);
    addRow('\uace0\uc778', tds[3].textContent);
    addRow('\uc704\uce58', tds[4].textContent);
    addRow('\uacc4\uc57d\uae08\uc561', tds[5].textContent.replace(/<div.*/, ''));
    addRow('\uacc4\uc57d\uc77c', tds[1].textContent);
    addRow('\uc601\uc5c5\ub2f9\ub2f9', tds[6].textContent);
    addRow('\uc2e4\ubb3c\ubcf4\uad00', tds[7].textContent);
    
    addSection('\ub0a9\ubd80 \uc774\ub825');
    var dots = tds[5].querySelectorAll('.stage-dots .dot');
    var paidCount = 0;
    dots.forEach(function(d){ if(d.classList.contains('filled')) paidCount++; });
    addRow('\ub0a9\ubd80 \uc9c4\ud589\ub960', paidCount + '/' + dots.length + '\ud68c\ucc28');
    
    addSection('\ucd5c\uadfc \ubcc0\uacbd \uc774\ub825');
    var logs = getChangeLog(contractNo);
    if(logs && logs.length > 0){
      logs.slice(-5).reverse().forEach(function(log){
        var item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = '<div class="history-date">' + (log.date || '--') + '</div><div class="history-action">' + (log.text || log.action || '--') + '</div><div class="history-by">' + (log.by || '') + '</div>';
        body.appendChild(item);
      });
    } else {
      body.innerHTML += '<p style="font-size:12px; color:var(--ink-400); margin:4px 0;">\ubcc0\uacbd \uc774\ub825\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</p>';
    }
    
    var actions = document.getElementById('lsp-actions');
    actions.innerHTML = '';
    
    function addActionBtn(text, icon, cls, onClick){
      var btn = document.createElement('button');
      btn.className = 'lsp-btn' + (cls ? ' ' + cls : '');
      btn.innerHTML = '<i class="' + icon + '"></i> ' + text;
      btn.addEventListener('click', onClick);
      actions.appendChild(btn);
    }
    
    addActionBtn('\uc11c\ub958 \ubc1c\uae09', 'ti ti-file-invoice', '', function(){ showToast('\uacc4\uc57d\uc11c \u00b7 \ubd09\uc548\uc99d\uba85\uc11c\uac00 \ubc1c\uae09\ub418\uc5c8\uc2b5\ub2c8\ub2e4.'); });
    addActionBtn('\uc704\uce58 \uc774\ub3d9', 'ti ti-arrows-shuffle', 'danger', function(){ showToast('\uc704\uce58 \uc774\ub3d9 \ud398\uc774\uc9c0\ub97c \uc5ec\ub294 \uc911\uc785\ub2c8\ub2e4.'); });
    
    panel.style.transform = 'translateX(0)';
    overlay.style.display = 'block';
  }
  if(e.target.classList.contains('relocate-btn')){
    var row = e.target.closest('tr');
    relocateTargetRow = row;
    document.getElementById('rl-contract').value = row.children[0].textContent;
    document.getElementById('rl-from').value = row.children[4].textContent;
    document.getElementById('rl-date').value = new Date().toISOString().slice(0,10);
    openModal('relocate-modal');
  }
});

/* ---------- 안장위치 이동 ---------- */
document.getElementById('submit-relocate').addEventListener('click', function(){
  if(!relocateTargetRow) return;
  var from = document.getElementById('rl-from').value;
  var to = document.getElementById('rl-to').value.split(' ')[0];
  var reason = document.getElementById('rl-reason').value || '사유 미입력';
  var contractNo = document.getElementById('rl-contract').value;
  relocateTargetRow.children[4].textContent = to;
  closeModal('relocate-modal');
  showToast('안장위치가 이동되었습니다.');
  addChangeLogEntry(contractNo, '김민수', '안장위치 이동: ' + from + ' → ' + to + ' (사유: ' + reason + ')');
  document.getElementById('rl-reason').value = '';
});

/* ---------- 계약서 파일 첨부 ---------- */
var CONTRACT_FILES_KEY = '***';
var _fuFiles = [];
var _fuTargetContract = '';

function getContractFiles(contractNo){
  try {
    var all = JSON.parse(localStorage.getItem(CONTRACT_FILES_KEY)) || {};
    return all[contractNo] || [];
  } catch(e) { return []; }
}
function saveContractFile(contractNo, fileInfo){
  try {
    var all = JSON.parse(localStorage.getItem(CONTRACT_FILES_KEY)) || {};
    if(!all[contractNo]) all[contractNo] = [];
    all[contractNo].push(fileInfo);
    localStorage.setItem(CONTRACT_FILES_KEY, JSON.stringify(all));
  } catch(e){}
}
function deleteContractFile(contractNo, fileIdx){
  try {
    var all = JSON.parse(localStorage.getItem(CONTRACT_FILES_KEY)) || {};
    if(all[contractNo]) { all[contractNo].splice(fileIdx, 1); localStorage.setItem(CONTRACT_FILES_KEY, JSON.stringify(all)); }
  } catch(e){}
}

// 계약 행에 파일첨부 버튼 추가 + 첨부 수 표시
function updateContractFileButtons(){
  document.querySelectorAll('#contract-table tbody tr').forEach(function(tr, idx){
    var fileBtn = tr.querySelector('.file-attach-btn');
    if(!fileBtn){
      fileBtn = document.createElement('button');
      fileBtn.className = 'btn btn-ghost btn-sm file-attach-btn';
      fileBtn.innerHTML = '<i class="ti ti-paperclip"></i>';
      fileBtn.title = '계약서 파일 첨부';
      var actionCell = tr.querySelector('td:last-child');
      if(actionCell) actionCell.insertBefore(fileBtn, actionCell.firstChild);
    }
    var contractNo = tr.children[0]?.textContent || 'CT-UNKNOWN';
    var files = getContractFiles(contractNo);
    fileBtn.innerHTML = '<i class="ti ti-paperclip"></i>' + (files.length > 0 ? '<span style="margin-left:2px;">' + files.length + '</span>' : '');
    fileBtn.onclick = function(){
      _fuTargetContract = contractNo;
      document.getElementById('fu-target-contract').textContent = '계약번호: ' + contractNo + ' (' + files.length + '개 파일)';
      _fuFiles = [];
      document.getElementById('fu-file-list').innerHTML = '';
      document.getElementById('fu-upload-btn').disabled = true;
      openModal('file-upload-modal');
    };
  });
}

// 파일 선택 버튼
document.getElementById('fu-select-btn').addEventListener('click', function(){
  document.getElementById('fu-file-input').click();
});
document.getElementById('fu-file-input').addEventListener('change', function(){
  Array.from(this.files).forEach(function(file){
    if(_fuFiles.length >= 5) return;
    var reader = new FileReader();
    reader.onload = function(e){
      _fuFiles.push({ name: file.name, size: file.size, data: e.target.result, type: file.type });
      renderFuFileList();
      document.getElementById('fu-upload-btn').disabled = false;
    };
    reader.readAsDataURL(file);
  });
  this.value = '';
});

function renderFuFileList(){
  var container = document.getElementById('fu-file-list');
  container.innerHTML = _fuFiles.map(function(f, i){
    var icon = f.type.includes('pdf') ? '📄' : '🖼️';
    return '<div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--stone-50); border-radius:var(--radius-sm);">' +
      '<span>' + icon + '</span>' +
      '<span style="flex:1; font-size:12.5px;">' + f.name + ' (' + Math.round(f.size/1024) + 'KB)</span>' +
      '<button class="fu-remove-btn" data-idx="' + i + '" style="background:none; border:none; cursor:pointer; color:var(--wine-600); font-size:14px;">&times;</button></div>';
  }).join('');
  document.querySelectorAll('.fu-remove-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.idx);
      _fuFiles.splice(idx, 1);
      renderFuFileList();
      document.getElementById('fu-upload-btn').disabled = _fuFiles.length === 0;
    });
  });
}

document.getElementById('fu-upload-btn').addEventListener('click', function(){
  _fuFiles.forEach(function(f){
    saveContractFile(_fuTargetContract, f);
  });
  showToast(_fuFiles.length + '개 파일이 업로드되었습니다.');
  closeModal('file-upload-modal');
  updateContractFileButtons();
});

// 초기 파일 버튼 생성
updateContractFileButtons();

/* ---------- 안장변경현황 (변경이력) ---------- */
var changeLogData = [
  {time:'2026-06-22 11:30', contract:'CT-2026-041', staff:'김민수', detail:'관리비 납부 방식 변경 (합산→분리)'},
  {time:'2026-06-20 14:32', contract:'CT-2026-040', staff:'이서연', detail:'계약금액 7,000,000원 → 7,200,000원 변경'},
  {time:'2026-06-18 10:05', contract:'CT-2026-038', staff:'김민수', detail:'안장위치 1구역-A28 → 1구역-A31 이동'},
  {time:'2026-06-15 09:40', contract:'CT-2026-037', staff:'박지훈', detail:'상태 정상 → 해약 변경'},
  {time:'2026-06-11 16:12', contract:'CT-2026-039', staff:'이서연', detail:'영업담당 박지훈 → 이서연 변경'}
];
function renderChangeLog(filterContract){
  var rows = changeLogData;
  if(filterContract && filterContract !== 'CT-2026-NEW'){
    rows = changeLogData.filter(function(r){ return r.contract === filterContract; });
  }
  var tbody = document.querySelector('#changelog-table tbody');
  if(rows.length === 0){
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink-400); text-align:center; padding:20px 0;">해당 계약의 변경 이력이 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(function(r){
    return '<tr><td>'+r.time+'</td><td>'+r.contract+'</td><td>'+r.staff+'</td><td>'+r.detail+'</td></tr>';
  }).join('');
}
function addChangeLogEntry(contractNo, staff, detail){
  var now = new Date();
  var time = now.toISOString().slice(0,10) + ' ' + now.toTimeString().slice(0,5);
  changeLogData.unshift({time:time, contract:contractNo, staff:staff, detail:detail});
}
document.getElementById('open-changelog-modal').addEventListener('click', function(){
  renderChangeLog();
  openModal('changelog-modal');
});

var cs = document.getElementById('customer-search');
if(cs) cs.addEventListener('keyup', function(){
  var q = this.value.trim();
  document.querySelectorAll('#customer-table tbody tr').forEach(function(tr){
    tr.style.display = tr.textContent.indexOf(q) > -1 ? '' : 'none';
  });
});

/* ---------- 전자 서명 패드 ---------- */
(function(){
  var canvas = document.getElementById('sign-pad');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1C1F1E';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  var drawing = false;
  function pos(e){
    var rect = canvas.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return {x: cx * canvas.width / rect.width, y: cy * canvas.height / rect.height};
  }
  function start(e){ drawing = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); }
  function move(e){ if(!drawing) return; var p = pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); }
  function end(){ drawing = false; }
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start);
  canvas.addEventListener('touchmove', move);
  canvas.addEventListener('touchend', end);
  document.getElementById('clear-sign').addEventListener('click', function(){ ctx.clearRect(0,0,canvas.width,canvas.height); });
})();

/* ---------- 신규 계약 작성 ---------- */
document.getElementById('open-contract-modal').addEventListener('click', function(){ goPage('newcontract'); });


  

document.getElementById('submit-contract').addEventListener('click', function(){
var customer = document.getElementById('f-customer').value || '미입력';
  var deceased = document.getElementById('f-deceased').value || '미입력';
  var location = document.getElementById('f-location').value.split(' ')[0];
  var amount = document.getElementById('f-amount').value || '0';
  var agent = document.getElementById('f-agent').value;
  var pay1 = document.getElementById('f-pay1-amount').value;
  var pay2 = document.getElementById('f-pay2-amount').value;
  var pay3 = document.getElementById('f-pay3-amount').value;
  var planType = document.getElementById('f-plan-type').selectedOptions[0].textContent;
  var deathDate = document.getElementById('f-death-date').value;
  var isLunar = document.getElementById('f-lunar').checked;
  var openerName = document.getElementById('f-opener-name').value;
  var dotsHtml = '<span class="dot' + (pay1 ? ' filled' : '') + '"></span>' +
                  '<span class="dot' + (pay2 ? ' filled' : '') + '"></span>' +
                  '<span class="dot' + (pay3 ? ' filled' : '') + '"></span>';
  var tbody = document.querySelector('#contract-table tbody');
  var tr = document.createElement('tr');
  tr.dataset.status = 'active';
  var today = new Date().toISOString().slice(0,10);
  tr.innerHTML = '<td>CT-2026-NEW</td><td>'+today+'</td><td>'+customer+'</td><td>'+deceased+'</td><td>'+location+'</td>' +
    '<td>₩'+amount+'<div class="stage-dots" title="계약금·중도금·잔금 납부 현황">'+dotsHtml+'</div></td>' +
    '<td>'+agent+'</td><td><span class="badge badge-neutral">보관중</span></td>' +
    '<td><span class="badge badge-success"><i class="ti ti-circle-check"></i>정상</span></td>' +
    '<td><button class="btn btn-ghost btn-sm doc-issue-btn">서류발급</button> <button class="btn btn-ghost btn-sm relocate-btn">위치이동</button> <button class="btn btn-ghost btn-sm changelog-row-btn">상세</button></td>';
  tbody.insertBefore(tr, tbody.firstChild);
  updateContractFileButtons();
  closeModal('contract-modal');
  var toastMsg = '계약이 등록되었습니다 (' + planType + ').';
  if(deathDate){ toastMsg = '계약이 등록되었습니다. 사망일 ' + deathDate + (isLunar ? ' (음력)' : ' (양력)') + ' 저장됨.'; }
  showToast(toastMsg);
  var logDetail = '신규 계약 등록 (계약자: '+customer+', 위치: '+location+', 안치유형: '+planType+')';
  if(openerName){ logDetail += ' · 개봉자: '+openerName; }
  addChangeLogEntry('CT-2026-NEW', '김민수', logDetail);
  ['f-customer','f-phone','f-deceased','f-amount','f-pay1-amount','f-pay1-date','f-pay2-amount','f-pay2-date','f-pay3-amount','f-pay3-date','f-death-date','f-enshrine-date','f-opener-name','f-opener-phone'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ el.value=''; }
  });
  document.getElementById('f-lunar').checked = false;
  var signCanvas = document.getElementById('sign-pad');
  if(signCanvas){ signCanvas.getContext('2d').clearRect(0,0,signCanvas.width,signCanvas.height); }
});



/* ---------- 업무 추가 ---------- */
document.getElementById('open-task-modal').addEventListener('click', function(){ openModal('task-modal'); });
document.getElementById('submit-task').addEventListener('click', function(){
  var title = document.getElementById('t-title').value || '제목없는 업무';
  var assigneeSel = document.getElementById('t-assignee');
  var initial = assigneeSel.value;
  var name = assigneeSel.options[assigneeSel.selectedIndex].textContent;
  var due = document.getElementById('t-due').value || '미정';
  var card = document.createElement('div');
  card.className = 'task-card';
  card.innerHTML = '<p>'+title+'</p><div class="task-meta"><span class="assignee"><span class="mini-avatar">'+initial+'</span>'+name+'</span><span><i class="ti ti-calendar"></i> '+due+'</span></div>';
  document.getElementById('col-todo').appendChild(card);
  var countEl = document.getElementById('count-todo');
  countEl.textContent = parseInt(countEl.textContent) + 1;
  closeModal('task-modal');
  showToast('업무가 등록되었습니다.');
  document.getElementById('t-title').value='';
  document.getElementById('t-due').value='';
});

/* ---------- 예약 등록 ---------- */
document.getElementById('open-reservation-modal').addEventListener('click', function(){ openModal('reservation-modal'); });
document.getElementById('submit-reservation').addEventListener('click', function(){
  var name = document.getElementById('r-name').value || '미입력';
  var phone = document.getElementById('r-phone').value || '-';
  var location = document.getElementById('r-location').value.split(' ')[0];
  var deposit = document.getElementById('r-deposit').value || '0';
  var date = document.getElementById('r-date').value || new Date().toISOString().slice(0,10);
  var expire = document.getElementById('r-expire').value || '-';
  var tbody = document.querySelector('#reservation-table tbody');
  var tr = document.createElement('tr');
  tr.innerHTML = '<td>'+location+'</td><td>'+name+'</td><td>'+phone+'</td><td>'+date+'</td><td>₩'+deposit+'</td><td>'+expire+'</td>' +
    '<td><span class="badge badge-warning"><i class="ti ti-clock"></i>예약중</span></td>' +
    '<td><button class="btn btn-ghost btn-sm reservation-convert-btn">계약 전환</button></td>';
  tbody.insertBefore(tr, tbody.firstChild);
  closeModal('reservation-modal');
  showToast('예약이 등록되었습니다.');
  ['r-name','r-phone','r-deposit','r-date','r-expire'].forEach(function(id){ document.getElementById(id).value=''; });
});
document.querySelector('#reservation-table tbody').addEventListener('click', function(e){
  if(e.target.classList.contains('reservation-convert-btn')){
    var tr = e.target.closest('tr');
    var tds = tr.children;
    sessionStorage.setItem('chungsol_contract_convert', JSON.stringify({
      customer: tds[1].textContent,
      phone: tds[2].textContent,
      location: tds[0].textContent,
      deceased: ''
    }));
    showToast('\uacc4\uc57d \uc791\uc131 \ud654\uba74\uc73c\ub85c \uc774\ub3d9\ud569\ub2c8\ub2e4.');
    goPage('newcontract');
  }
});

/* ---------- 직원 추가 ---------- */
document.getElementById('open-staff-modal').addEventListener('click', function(){ openModal('staff-modal'); });
document.getElementById('submit-staff').addEventListener('click', function(){
  var name = document.getElementById('s-name').value || '미입력';
  var zone = document.getElementById('s-zone').value || '-';
  var permCount = document.querySelectorAll('.s-perm:checked').length;
  var tbody = document.querySelector('#staff-table tbody');
  var tr = document.createElement('tr');
  var today = new Date().toISOString().slice(0,10);
  tr.innerHTML = '<td>'+name+'</td><td><span class="badge badge-neutral">권한 '+permCount+'개 설정</span></td>' +
    '<td>'+zone+'</td><td>'+today+'</td><td><span class="badge badge-success"><i class="ti ti-circle-check"></i>재직중</span></td>';
  tbody.appendChild(tr);
  closeModal('staff-modal');
  showToast('직원이 등록되었습니다.');
  document.getElementById('s-name').value='';
  document.getElementById('s-zone').value='';
});

/* ---------- 추가안장료 / 진행비 ---------- */
document.getElementById('open-extracost-modal').addEventListener('click', function(){ openModal('extracost-modal'); });
document.getElementById('submit-extracost').addEventListener('click', function(){
  var contract = document.getElementById('ec-contract').value || '-';
  var date = document.getElementById('ec-date').value || new Date().toISOString().slice(0,10);
  var item = document.getElementById('ec-item').value || '미입력';
  var amount = document.getElementById('ec-amount').value || '0';
  var tbody = document.querySelector('#extracost-table tbody');
  var tr = document.createElement('tr');
  tr.innerHTML = '<td>'+date+'</td><td>'+contract+'</td><td>'+item+'</td><td>₩'+amount+'</td>';
  tbody.insertBefore(tr, tbody.firstChild);
  closeModal('extracost-modal');
  showToast('추가비용이 등록되었습니다.');
  ['ec-contract','ec-date','ec-item','ec-amount'].forEach(function(id){ document.getElementById(id).value=''; });
});

/* ---------- 영업자 추가 (데모) ---------- */
document.getElementById('add-agent-btn').addEventListener('click', function(){
  showToast('영업자 등록 폼은 추후 연결됩니다.');
});

/* ---------- 정산 처리 ---------- */
document.querySelectorAll('.settle-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var cell = btn.closest('tr').querySelector('.settle-status');
    cell.innerHTML = '<span class="badge badge-success"><i class="ti ti-circle-check"></i>정산완료</span>';
    btn.disabled = true;
    btn.style.opacity = '.4';
    showToast('정산이 처리되었습니다.');
  });
});

/* ---------- 알림톡 단계 추가 (데모) ---------- */
document.getElementById('add-stage-btn').addEventListener('click', function(){
  var tbody = document.querySelector('#stage-table tbody');
  var tr = document.createElement('tr');
  tr.innerHTML = '<td>새 단계</td><td>D-0</td><td>메시지 내용을 입력하세요.</td>';
  tbody.appendChild(tr);
  showToast('단계가 추가되었습니다. 메시지를 입력해주세요.');
});
document.getElementById('add-memorial-stage-btn').addEventListener('click', function(){
  var tbody = document.querySelector('#memorial-stage-table tbody');
  var tr = document.createElement('tr');
  tr.innerHTML = '<td>새 단계</td><td>사망일 +0일</td><td>메시지 내용을 입력하세요.</td>';
  tbody.appendChild(tr);
  showToast('단계가 추가되었습니다. 메시지를 입력해주세요.');
});

/* ---------- 시설유형 변경 시 그리드도 같이 전환 ---------- */
var facilityTypeMap = {
  '납골당': 'simple',
  '수목장': 'tree'
};
document.querySelectorAll('input[name="facility-type"]').forEach(function(radio){
  radio.addEventListener('change', function(){
    document.getElementById('facility-badge').textContent = radio.value;
    var structType = facilityTypeMap[radio.value] || 'simple';
    document.getElementById('location-structure-select').value = structType;
    locationStructureType = structType;
    rebuildAllGrids();
    renderDashboardStats();
  });
});

/* ---------- 설정 저장 (localStorage) ---------- */
document.getElementById('save-settings-btn').addEventListener('click', function(){
  var settings = {
    facilityType: document.querySelector('input[name="facility-type"]:checked').value,
    locationStructure: document.getElementById('location-structure-select').value,
    bizNumber: document.querySelector('#content .form-row input[value*="123-45"]')?.value || '',
    account: document.querySelectorAll('.form-grid-2 .form-row input')[1]?.value || '',
    lqZones: document.getElementById('lq-zones')?.value || '3',
    lqPerZone: document.getElementById('lq-per-zone')?.value || '14',
    lqFloors: document.getElementById('lq-floors')?.value || '3',
    lqLines: document.getElementById('lq-lines')?.value || '2',
    lqPerLine: document.getElementById('lq-per-line')?.value || '7',
    lqTrees: document.getElementById('lq-trees')?.value || '11',
    lqPerTree: document.getElementById('lq-per-tree')?.value || '4',
    feeInitAmount: document.getElementById('fee-init-amount')?.value || '500000',
    feeAmount: document.getElementById('fee-amount')?.value || '360000',
    feeCycle: document.getElementById('fee-cycle-default')?.value || '3',
    feePenalty: document.getElementById('fee-penalty')?.value || '3'
  };
  try {
    localStorage.setItem('chungsol_settings', JSON.stringify(settings));
    showToast('설정이 저장되었습니다.');
  } catch(e) {
    showToast('저장 실패: ' + e.message);
  }
});

/* ---------- 페이지 로드 시 저장된 설정 복원 ---------- */
(function(){
  try {
    var saved = JSON.parse(localStorage.getItem('chungsol_settings'));
    if(saved && saved.locationStructure){
      document.getElementById('location-structure-select').value = saved.locationStructure;
      locationStructureType = saved.locationStructure;
      document.getElementById('facility-badge').textContent = saved.facilityType || '수목장';
      var radioToCheck = document.querySelector('input[name="facility-type"][value="' + (saved.facilityType || '수목장') + '"]');
      if(radioToCheck) radioToCheck.checked = true;
      // 수량 값 복원 후 그리드 빌드
      updateQuantityFields();
      if(saved.lqZones && document.getElementById('lq-zones')) document.getElementById('lq-zones').value = saved.lqZones;
      if(saved.lqPerZone && document.getElementById('lq-per-zone')) document.getElementById('lq-per-zone').value = saved.lqPerZone;
      if(saved.lqFloors && document.getElementById('lq-floors')) document.getElementById('lq-floors').value = saved.lqFloors;
      if(saved.lqLines && document.getElementById('lq-lines')) document.getElementById('lq-lines').value = saved.lqLines;
      if(saved.lqPerLine && document.getElementById('lq-per-line')) document.getElementById('lq-per-line').value = saved.lqPerLine;
      if(saved.lqTrees && document.getElementById('lq-trees')) document.getElementById('lq-trees').value = saved.lqTrees;
      if(saved.lqPerTree && document.getElementById('lq-per-tree')) document.getElementById('lq-per-tree').value = saved.lqPerTree;
      if(saved.feeInitAmount && document.getElementById('fee-init-amount')) document.getElementById('fee-init-amount').value = saved.feeInitAmount;
      if(saved.feeAmount && document.getElementById('fee-amount')) document.getElementById('fee-amount').value = saved.feeAmount;
      if(saved.feeCycle && document.getElementById('fee-cycle-default')) document.getElementById('fee-cycle-default').value = saved.feeCycle;
      if(saved.feePenalty && document.getElementById('fee-penalty')) document.getElementById('fee-penalty').value = saved.feePenalty;
      recalcTotal();
      rebuildAllGrids();
    }
  } catch(e){}
})();

/* ---------- 법정 신고 · 데이터 백업 (CSV 다운로드) ---------- */
function downloadCSV(filename, rows){
  var csv = rows.map(function(r){
    return r.map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  }).join('\n');
  var blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
document.getElementById('export-ehaneul').addEventListener('click', function(){
  downloadCSV('e하늘_제출양식_2026-06.csv', [
    ['안치자성명','생년월일','사망일','안치일','시설구분','위치','계약자성명','연락처'],
    ['김OO','1945-03-12','2026-06-10','2026-06-18','수목장','1구역-A05','이서영','010-1111-2222'],
    ['송OO','1952-11-02','2026-06-08','2026-06-15','수목장','1구역-C02','한지민','010-3333-4444']
  ]);
  showToast('e하늘 제출용 엑셀이 다운로드되었습니다.');
});
document.getElementById('export-local-gov').addEventListener('click', function(){
  downloadCSV('지자체_제출양식_2026-06.csv', [
    ['연번','안치자성명','안치일','시설명','위치','계약자성명'],
    [1,'김OO','2026-06-18','청솔원 메모리얼파크','1구역-A05','이서영'],
    [2,'송OO','2026-06-15','청솔원 메모리얼파크','1구역-C02','한지민']
  ]);
  showToast('지자체 제출용 엑셀이 다운로드되었습니다.');
});
document.getElementById('export-backup').addEventListener('click', function(){
  downloadCSV('전체데이터_백업_2026-06-23.csv', [
    ['계약번호','계약일','계약자','고인','위치','계약금액','상태'],
    ['CT-2026-041','2026-06-18','이서영','김OO','1구역-A05','9800000','정상'],
    ['CT-2026-040','2026-06-15','한지민','송OO','1구역-C02','7200000','정상'],
    ['CT-2026-037','2026-05-29','장혜민','오OO','1구역-B07','6500000','해약']
  ]);
  showToast('전체 데이터 백업 파일이 다운로드되었습니다.');
});

/* ---------- CSV 업로드 (과거 데이터 가져오기) ---------- */
var UPLOADED_KEY = '***';

document.getElementById('csv-upload-btn').addEventListener('click', function(){
  var fileInput = document.getElementById('csv-upload-input');
  var file = fileInput.files[0];
  if(!file){ showToast('CSV 파일을 선택해주세요.'); return; }
  
  var reader = new FileReader();
  reader.onload = function(e){
    var text = e.target.result;
    var lines = text.split('\n').filter(function(l){ return l.trim(); });
    if(lines.length < 2){ showToast('데이터가 없습니다. 헤더를 제외한 최소 1행이 필요합니다.'); return; }
    
    var headers = lines[0].split(',').map(function(h){ return h.trim().replace(/"/g,''); });
    var imported = [];
    var errors = [];
    
    for(var i=1; i<lines.length; i++){
      try {
        var vals = parseCSVLine(lines[i]);
        if(vals.length < 3) continue;
        var row = {};
        headers.forEach(function(h, idx){ row[h] = vals[idx] || ''; });
        imported.push(row);
      } catch(err) {
        errors.push('행 ' + (i+1) + ': ' + err.message);
      }
    }
    
    // 저장 (contracts 데이터로 localStorage에 저장)
    var existing = [];
    try { existing = JSON.parse(localStorage.getItem(UPLOADED_KEY)) || []; } catch(e){}
    imported.forEach(function(r){ existing.push(r); });
    localStorage.setItem(UPLOADED_KEY, JSON.stringify(existing));
    
    // 결과 표시
    var resultDiv = document.getElementById('csv-upload-result');
    resultDiv.style.display = 'block';
    if(errors.length === 0){
      resultDiv.style.background = 'var(--jade-100)';
      resultDiv.style.color = 'var(--jade-800)';
      resultDiv.innerHTML = '✅ ' + imported.length + '건의 데이터를 가져왔습니다. (총 ' + existing.length + '건)';
    } else {
      resultDiv.style.background = 'var(--brass-100)';
      resultDiv.style.color = 'var(--brass-800)';
      resultDiv.innerHTML = '⚠️ ' + imported.length + '건 가져옴, ' + errors.length + '건 오류<br><small>' + errors.slice(0,3).join('<br>') + '</small>';
    }
    showToast(imported.length + '건 업로드 완료');
  };
  reader.readAsText(file);
});

function parseCSVLine(line){
  var result = [];
  var current = '';
  var inQuote = false;
  for(var i=0; i<line.length; i++){
    var ch = line[i];
    if(ch === '"'){ inQuote = !inQuote; }
    else if(ch === ',' && !inQuote){ result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

// 샘플 CSV 다운로드
document.getElementById('csv-sample-link').addEventListener('click', function(e){
  e.preventDefault();
  var sample = '계약번호,계약일,계약자,연락처,고인,위치,계약금액,상태\n' +
    'CT-2025-001,2025-03-15,김영수,010-1111-2222,김철수,1구역-A01,9800000,정상\n' +
    'CT-2025-002,2025-04-20,이정희,010-3333-4444,이영희,1구역-A02,7200000,정상\n' +
    'CT-2025-003,2025-05-10,박상현,010-5555-6666,박민수,1구역-B01,6500000,해약';
  var blob = new Blob(['\uFEFF' + sample], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = '청솔원_샘플_가져오기.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
var PAY_LOG_KEY = 'chungsol_pay_log';

function getPayLogs(){
  try { return JSON.parse(localStorage.getItem(PAY_LOG_KEY)) || []; } catch(e) { return []; }
}
function savePayLogs(logs){
  localStorage.setItem(PAY_LOG_KEY, JSON.stringify(logs));
}

/* ---------- 관리비 납부 내역 테이블 렌더링 ---------- */
function renderPayLogTable(){
  var tbody = document.getElementById('pay-log-tbody');
  if(!tbody) return;
  var logs = getPayLogs();
  if(logs.length === 0){
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--ink-400);">납부 데이터가 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = logs.slice(0, 20).map(function(log){
    var badge = log.status === 'confirmed' 
      ? '<span class="badge badge-success"><i class="ti ti-circle-check"></i> 납부완료</span>'
      : '<span class="badge badge-warning"><i class="ti ti-clock"></i> 미확인</span>';
    return '<tr>' +
      '<td>' + log.date + ' ' + log.time + '</td>' +
      '<td style="font-weight:600;">' + log.payer + '</td>' +
      '<td>₩' + Number(log.amount).toLocaleString() + '</td>' +
      '<td style="font-size:12px;color:var(--ink-600);">' + (log.account || '농협 123-456-789012') + '</td>' +
      '<td>' + badge + '</td></tr>';
  }).join('');
}

// 납부 데이터가 추가될 때마다 테이블 갱신
var _origSavePay = savePayLogs;
savePayLogs = function(logs){
  _origSavePay(logs);
  renderPayLogTable();
};
function addPaymentNotification(payer, amount, location, status){
  var logs = getPayLogs();
  var now = new Date();
  logs.unshift({
    date: now.toISOString().substring(0,10),
    time: String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0'),
    payer: payer,
    amount: amount,
    location: location,
    status: status || 'confirmed'
  });
  savePayLogs(logs);
  updateNotifBadge();
}
function updateNotifBadge(){
  var logs = getPayLogs();
  var unread = logs.filter(function(l){ return l.status === 'pending'; }).length;
  var badge = document.getElementById('notif-badge');
  if(unread > 0){
    badge.style.display = 'block';
    badge.textContent = unread;
  } else {
    badge.style.display = 'none';
  }
}
function renderNotifPanel(){
  var logs = getPayLogs();
  var container = document.getElementById('notif-list');
  if(logs.length === 0){
    container.innerHTML = '<p style="font-size:13px; color:var(--ink-400); text-align:center; padding:30px 0;">알림이 없습니다.</p>';
    return;
  }
  container.innerHTML = logs.slice(0, 20).map(function(log){
    var icon = log.status === 'confirmed' ? '✅' : '⏳';
    var statusText = log.status === 'confirmed' ? '납부완료' : '미확인';
    return '<div style="display:flex; gap:10px; padding:10px 8px; border-bottom:1px solid var(--stone-200);">' +
      '<span style="font-size:18px;">' + icon + '</span>' +
      '<div style="flex:1;">' +
      '<p style="margin:0; font-weight:600; font-size:13px;">' + log.payer + ' · ₩' + Number(log.amount).toLocaleString() + '</p>' +
      '<p style="margin:2px 0 0; font-size:11.5px; color:var(--ink-400);">' + log.date + ' ' + log.time + ' · ' + (log.location || '--') + '</p>' +
      '<p style="margin:2px 0 0;"><span class="badge ' + (log.status === 'confirmed' ? 'badge-success' : 'badge-warning') + '">' + statusText + '</span></p></div></div>';
  }).join('');
}

document.getElementById('notif-btn').addEventListener('click', function(){
  renderNotifPanel();
  document.getElementById('notif-panel').style.display = 'block';
});
document.getElementById('notif-close').addEventListener('click', function(){
  document.getElementById('notif-panel').style.display = 'none';
});
document.getElementById('open-pay-confirm-btn').addEventListener('click', function(){
  openModal('pay-confirm-modal');
});

document.getElementById('pc-match-btn').addEventListener('click', function(){
  var name = document.getElementById('pc-name').value.trim();
  var amount = document.getElementById('pc-amount').value;
  var result = document.getElementById('pc-result');
  if(!name || !amount){
    result.style.display = 'block';
    result.style.background = 'var(--wine-100)';
    result.innerHTML = '입금자명과 금액을 입력해주세요.';
    return;
  }
  var matched = holderNames.find(function(h){ return h.includes(name) || h === name; });
  if(matched){
    result.style.display = 'block';
    result.style.background = 'var(--jade-100)';
    result.style.color = 'var(--jade-800)';
    result.innerHTML = '<strong>' + name + '</strong> 님의 계약이 확인되었습니다!<br>금액: ₩' + Number(amount).toLocaleString() + '<br>입금이 확인되었습니다. 납부 확정을 눌러주세요.';
    document.getElementById('pc-confirm-btn').style.display = 'inline-flex';
  } else {
    result.style.display = 'block';
    result.style.background = 'var(--brass-100)';
    result.style.color = 'var(--brass-800)';
    result.innerHTML = '일치하는 계약자를 찾을 수 없습니다.<br>이름을 확인해주세요. (샘플: 이서영, 한지민, 최우진 등)';
    document.getElementById('pc-confirm-btn').style.display = 'none';
  }
});

document.getElementById('pc-confirm-btn').addEventListener('click', function(){
  var name = document.getElementById('pc-name').value.trim();
  var amount = document.getElementById('pc-amount').value;
  addPaymentNotification(name, amount, '위치관리', 'confirmed');
  showToast(name + ' 님의 납부가 확정되었습니다.');
  closeModal('pay-confirm-modal');
  document.getElementById('pc-confirm-btn').style.display = 'none';
  document.getElementById('pc-result').style.display = 'none';
  document.getElementById('pc-name').value = '';
  document.getElementById('pc-amount').value = '';
});
updateNotifBadge();
renderPayLogTable();

/* ================== 자동 입금 매칭 엔진 ================== */
var PENDING_KEY = 'chungsol_pending_pay';

function getPendingPays(){
  try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch(e) { return []; }
}
function savePendingPays(pending){
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

// 자동 입금 시뮬레이션 (입금 확인 버튼 없이 자동 매칭)
function autoMatchPayments(){
  var pending = getPendingPays();
  var logs = getPayLogs();
  var matched = [];
  var unmatched = [];
  
  pending.forEach(function(pay){
    var found = holderNames.some(function(h){ return h.includes(pay.payer) || h === pay.payer; });
    if(found){
      pay.status = 'confirmed';
      pay.matched = true;
      matched.push(pay);
    } else {
      unmatched.push(pay);
    }
  });
  
  matched.forEach(function(m){ logs.unshift(m); });
  savePayLogs(logs);
  savePendingPays(unmatched);
  updateNotifBadge();
  
  // 매칭 건 팝업 표시
  matched.forEach(function(m){ showPaymentPopup(m); });
  return matched.length;
}

function showPaymentPopup(pay){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:90; display:flex; align-items:center; justify-content:center; padding:20px;';
  overlay.innerHTML = '<div style="background:#fff; border-radius:16px; padding:28px; width:380px; max-width:100%; text-align:center; box-shadow:0 8px 40px rgba(0,0,0,.12);">' +
    '<div style="font-size:40px; margin-bottom:10px;">💳</div>' +
    '<h3 style="margin:0 0 4px; font-size:17px;">입금 확인되었습니다</h3>' +
    '<p style="margin:0 0 16px; font-size:13px; color:var(--ink-400);">자동 매칭이 완료되었습니다.</p>' +
    '<div style="background:var(--jade-100); border-radius:10px; padding:12px; margin-bottom:16px;">' +
    '<p style="margin:0; font-size:18px; font-weight:700; color:var(--jade-800);">' + pay.payer + '</p>' +
    '<p style="margin:4px 0 0; font-size:14px; color:var(--jade-800);">₩' + Number(pay.amount).toLocaleString() + '</p>' +
    '<p style="margin:4px 0 0; font-size:12px; color:var(--jade-800);">' + (pay.account || '농협') + '</p></div>' +
    '<p style="font-size:12px; color:var(--ink-400); margin:0 0 14px;">' + pay.date + ' ' + pay.time + ' 입금</p>' +
    '<button class="popup-confirm-btn" style="background:var(--jade-700); color:#fff; border:none; padding:10px 32px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer;">✅ 확인</button></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('.popup-confirm-btn').addEventListener('click', function(){
    overlay.remove();
    showToast(pay.payer + ' 님의 납부가 확인되었습니다.');
  });
}

// 시뮬레이션: 랜덤 입금 생성 (실제 은행 연동 전까지 사용)
function simulateRandomDeposit(){
  var payNames = ['이서영','한지민','최우진','윤하경','장혜민'];
  var amounts = [360000, 720000, 980000];
  var name = payNames[Math.floor(Math.random() * payNames.length)];
  var amount = amounts[Math.floor(Math.random() * amounts.length)];
  var now = new Date();
  
  var pending = getPendingPays();
  var logs = getPayLogs();
  var recentLogs = logs.slice(0, 5);
  if(recentLogs.some(function(l){ return l.payer === name; }) || pending.some(function(l){ return l.payer === name; })) return false;
  
  pending.push({
    date: now.toISOString().substring(0,10),
    time: String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0'),
    payer: name,
    amount: amount,
    account: '농협 123-456-789012 (청솔원)',
    status: 'pending',
    matched: false
  });
  savePendingPays(pending);
  return true;
}

// 전체삭제 버튼
document.getElementById('clear-pay-logs').addEventListener('click', function(){
  if(confirm('전체 납부 내역을 삭제하시겠습니까?')){
    localStorage.removeItem(PAY_LOG_KEY);
    renderPayLogTable();
    updateNotifBadge();
    showToast('납부 내역이 삭제되었습니다.');
  }
});

// 자동 실행: 입금 시뮬레이션 → 자동 매칭
(function(){
  simulateRandomDeposit();
  var matchedCount = autoMatchPayments();
  if(matchedCount > 0){
    showToast(matchedCount + '건의 입금이 자동 매칭되었습니다.');
  }
})();

// 30초마다 자동 체크 (실시간 시뮬레이션)
setInterval(function(){
  if(Math.random() > 0.6){ // 40% 확률로 새 입금 발생
    simulateRandomDeposit();
    var matched = autoMatchPayments();
    if(matched > 0) showToast(matched + '건의 입금이 자동 매칭되었습니다.');
  }
}, 30000);

var ACCOUNTS_KEY = 'chungsol_accounts';
var SESSION_KEY = 'chungsol_session';

function getAccounts(){
  try {
    var saved = JSON.parse(localStorage.getItem(ACCOUNTS_KEY));
    if(saved && saved.length > 0) return saved;
  } catch(e){}
  // 기본 계정
  return [
    { id:'admin', name:'김민수', pw:'1234', type:'master', zone:'전체', role:'관리자' },
    { id:'leesy', name:'이서연', pw:'0000', type:'staff', zone:'1구역 A~B', role:'일반직원' },
    { id:'parkjh', name:'박지훈', pw:'0000', type:'staff', zone:'1구역 C', role:'영업담당' },
    { id:'handy', name:'한도윤', pw:'0000', type:'staff', zone:'-', role:'조회전용' },
    { id:'oseh', name:'오세훈', pw:'0000', type:'staff', zone:'1구역 A', role:'일반직원' }
  ];
}
function saveAccounts(accounts){
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// 로그인 select 채우기
function populateLoginSelect(){
  var sel = document.getElementById('login-account');
  sel.innerHTML = '';
  var accounts = getAccounts();
  accounts.forEach(function(a){
    if(a.type === 'master'){
      sel.innerHTML += '<option value="' + a.id + '">' + a.name + ' (마스터)</option>';
    }
  });
  accounts.forEach(function(a){
    if(a.type === 'staff'){
      sel.innerHTML += '<option value="' + a.id + '">' + a.name + ' (직원 · ' + a.role + ')</option>';
    }
  });
}

// 로그인
function doLogin(accountId, password){
  var accounts = getAccounts();
  var user = accounts.find(function(a){ return a.id === accountId && a.pw === password; });
  if(!user) return false;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, type: user.type, loginTime: new Date().toISOString() }));
  applySession();
  return true;
}

function applySession(){
  try {
    var session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if(!session) { showLogin(); return; }
    
    var accounts = getAccounts();
    var user = accounts.find(function(a){ return a.id === session.id; });
    if(!user) { showLogin(); return; }
    
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    
    // 유저 정보 표시
    var nameTag = user.name.charAt(0);
    var roleText = user.type === 'master' ? '관리자' : user.role;
    document.getElementById('user-chip').innerHTML = '<span class="avatar">' + nameTag + '</span>' + user.name + ' · ' + roleText;
    
    // 권한에 따라 UI 제어
    if(user.type !== 'master'){
      // 직원: 설정 메뉴 숨김
      document.querySelectorAll('.nav-item').forEach(function(item){
        if(item.dataset.page === 'settings') item.style.display = 'none';
      });
    } else {
      document.querySelectorAll('.nav-item').forEach(function(item){
        item.style.display = '';
      });
    }
  } catch(e){
    showLogin();
  }
}

function showLogin(){
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
  populateLoginSelect();
}

// 로그인 버튼
document.getElementById('login-btn').addEventListener('click', function(){
  var accountId = document.getElementById('login-account').value;
  var password = document.getElementById('login-password').value;
  if(doLogin(accountId, password)){
    document.getElementById('login-error').style.display = 'none';
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
});

// 엔터키 로그인
document.getElementById('login-password').addEventListener('keydown', function(e){
  if(e.key === 'Enter') document.getElementById('login-btn').click();
});

// 로그아웃
document.getElementById('logout-btn').addEventListener('click', function(){
  localStorage.removeItem(SESSION_KEY);
  document.getElementById('login-password').value = '';
  showLogin();
});

// 페이지 로드 시 #content 밖으로 나간 섹션들을 다시 #content 안으로 이동
(function fixSections(){
  var content = document.getElementById('content');
  var app = document.getElementById('app-container');
  if(content && app){
    // 먼저 모든 섹션을 content로 이동
    var orphans = app.querySelectorAll(':scope > .page');
    orphans.forEach(function(section){
      content.appendChild(section);
    });
    // 이동 후 fixed 요소(위치상세패널/오버레이)는 body로 다시 이동
    var fixedPanels = document.querySelectorAll('#loc-detail-panel, #loc-detail-overlay');
    fixedPanels.forEach(function(p){
      document.body.appendChild(p);
    });
  }
})();

// 페이지 로드 시 세션 체크
applySession();

// fallback: showLogin이 안 불렸으면 강제 호출
setTimeout(function(){
  var sel = document.getElementById('login-account');
  if(!sel || sel.options.length === 0) showLogin();
}, 100);

/* ================== 알림 템플릿 관리 ================== */
var TEMPLATES_KEY = '***';

function getTemplates(){
  try {
    var saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY));
    if(saved && saved.length > 0) return saved;
  } catch(e){}
  return [
    { id:'fee-notice', name:'관리비 납부 안내', category:'납부', msg:'{계약자}님, {고인}님의 관리비 납부 안내입니다.\\n\\n계약서상의 납부자명과 동일하게 입금자명을 기재해주셔야 자동 매칭이 가능합니다.\\n입금 시 반드시 {계약자}(으)로 입금해주세요.', active:true },
    { id:'memorial-3', name:'삼우제 안내', category:'추모', msg:'{계약자}님, {고인}님의 삼우제가 다가오고 있습니다.', active:true },
    { id:'memorial-49', name:'49제 안내', category:'추모', msg:'{계약자}님, {고인}님의 49제가 다가오고 있습니다.', active:true },
    { id:'memorial-1year', name:'1주기 기일 안내', category:'추모', msg:'{계약자}님, {고인}님의 1주기 기일입니다.', active:true },
    { id:'contract-share', name:'첫 계약서 안내', category:'계약', msg:'{계약자}님, {고인}님의 안치 계약이 완료되었습니다.', active:true },
    { id:'fee-notice', name:'관리비 납부 안내', category:'납부', channel:'kakao', msg:'{계약자}님, {고인}님의 관리비 납부 안내입니다.\\n\\n계약서상의 납부자명과 동일하게 입금자명을 기재해주셔야 자동 매칭이 가능합니다.\\n입금 시 반드시 {계약자}(으)로 입금해주세요.', active:true },
    { id:'fee-overdue', name:'관리비 연체 안내', category:'납부', channel:'kakao', msg:'{계약자}님, {고인}님의 관리비가 연체되었습니다.\\n\\n연체 기간: {연체일}일\\n연체 금액: {연체금액}원\\n\\n빠른 납부 부탁드립니다.\\n입금자명: {계약자}', active:true },
    { id:'memorial-3', name:'삼우제 안내', category:'추모', channel:'kakao', msg:'{계약자}님, {고인}님의 삼우제가 다가오고 있습니다.\\n\\n일시: {추모일시}\\n장소: 청솔원 메모리얼파크\\n\\n편히 방문해주시기 바랍니다.', active:true },
    { id:'memorial-49', name:'49제 안내', category:'추모', channel:'kakao', msg:'{계약자}님, {고인}님의 49제가 다가오고 있습니다.\\n\\n일시: {추모일시}\\n장소: 청솔원 메모리얼파크', active:true },
    { id:'memorial-1year', name:'1주기 기일 안내', category:'추모', channel:'kakao', msg:'{계약자}님, {고인}님의 1주기 기일입니다.\\n\\n삼가 조의를 표하며, 추모를 원하시면 방문해주시기 바랍니다.', active:true },
    { id:'contract-share', name:'첫 계약서 안내', category:'계약', channel:'kakao', msg:'{계약자}님, {고인}님의 안치 계약이 완료되었습니다.\\n\\n계약번호: {계약번호}\\n안치 위치: {위치}\\n\\n자세한 사항은 홈페이지를 참고해주세요.', active:true },
    { id:'contract-renew', name:'계약 갱신 안내', category:'계약', channel:'kakao', msg:'{계약자}님, {고인}님의 안치 계약 갱신일이 다가오고 있습니다.\\n\\n계약번호: {계약번호}\\n만료일: {만료일}\\n\\n갱신을 원하시면 연락 부탁드립니다.', active:false },
    { id:'sms-fee', name:'[SMS] 관리비 납부 안내', category:'납부', channel:'sms', msg:'{계약자}님 관리비 납부 안내\\n계약자명과 동일하게 입금해주세요.\\n문의: 000-0000-0000', active:true },
    { id:'sms-overdue', name:'[SMS] 관리비 연체 안내', category:'납부', channel:'sms', msg:'{계약자}님 관리비가 연체되었습니다.\\n{연체일}일 경과 / {연체금액}원\\n빠른 납부 바랍니다. 000-0000-0000', active:true },
    { id:'sms-memorial', name:'[SMS] 추모일 안내', category:'추모', channel:'sms', msg:'{계약자}님 {고인}님 추모일 안내\\n{추모일시} / 청솔원 메모리얼파크\\n문의: 000-0000-0000', active:true },
    { id:'sms-contract', name:'[SMS] 계약 안내', category:'계약', channel:'sms', msg:'{계약자}님 계약 완료 안내\\n{고인}님 / {위치}\\n자세한 사항은 연락주세요. 000-0000-0000', active:true }
  ];
}
function saveTemplates(templates){
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

function renderTemplates(){
  var container = document.getElementById('template-list');
  if(!container) return;
  var templates = getTemplates();
  
  // 채널 필터 적용
  var chFilter = document.querySelector('.notif-channel-btn.active');
  var channel = chFilter ? chFilter.dataset.channel : 'all';
  var filtered = channel === 'all' ? templates : templates.filter(function(t){ return t.channel === channel; });
  
  container.innerHTML = filtered.map(function(t, fi){
    // 원본 배열에서 실제 인덱스 찾기
    var realIdx = templates.indexOf(t);
    var channelIcon = t.channel === 'sms' ? '<span class="badge badge-warning" style="font-size:10px;">📱 SMS</span>' : '<span class="badge badge-primary" style="font-size:10px;">💛 카카오</span>';
    var categoryIcon = t.category === '납부' ? '💳' : (t.category === '추모' ? '🕯️' : '📋');
    return '<div class="card" style="padding:16px; position:relative;" data-template-idx="' + realIdx + '">' +
      channelIcon +
      '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">' +
        '<div style="display:flex; align-items:center; gap:8px;">' +
          '<span style="font-size:18px;">' + categoryIcon + '</span>' +
          '<div><p style="margin:0; font-weight:700; font-size:14px;">' + t.name + '</p>' +
          '<p style="margin:0; font-size:11.5px; color:var(--ink-400);">' + t.category + ' · ' + (t.active ? '🟢 활성' : '🔴 비활성') + '</p></div>' +
        '</div>' +
        '<div style="display:flex; gap:6px;">' +
          '<button class="template-edit-btn btn btn-ghost btn-sm" data-idx="' + realIdx + '">수정</button>' +
          '<button class="template-duplicate-btn btn btn-ghost btn-sm" data-idx="' + realIdx + '">복사</button>' +
          '<button class="template-toggle-btn btn btn-ghost btn-sm" data-idx="' + realIdx + '">' + (t.active ? '비활성' : '활성') + '</button>' +
          '<button class="template-delete-btn btn btn-ghost btn-sm" style="color:var(--wine-600);" data-idx="' + realIdx + '">삭제</button>' +
          '<button class="template-preview-btn btn btn-ghost btn-sm" data-idx="' + realIdx + '" style="font-size:10px;">미리보기</button>' +
        '</div>' +
      '</div>' +
      '<div style="background:var(--stone-50); border-radius:var(--radius-sm); padding:10px 12px; font-size:12.5px; color:var(--ink-600); line-height:1.6; white-space:pre-wrap;">' + t.msg + '</div>' +
    '</div>';
  }).join('');
  
  // 버튼 이벤트
  document.querySelectorAll('.template-edit-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.idx);
      showTemplateEditor(idx);
    });
  });
  document.querySelectorAll('.template-toggle-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.idx);
      var templates = getTemplates();
      templates[idx].active = !templates[idx].active;
      saveTemplates(templates);
      renderTemplates();
      showToast(templates[idx].name + '이 ' + (templates[idx].active ? '활성화' : '비활성화') + '되었습니다.');
    });
  });
  document.querySelectorAll('.template-duplicate-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.idx);
      var templates = getTemplates();
      var copy = JSON.parse(JSON.stringify(templates[idx]));
      copy.name += ' (복사)';
      copy.id += '-copy';
      templates.splice(idx + 1, 0, copy);
      saveTemplates(templates);
      renderTemplates();
      showToast('템플릿이 복사되었습니다.');
    });
  });
  document.querySelectorAll('.template-delete-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(!confirm('이 템플릿을 삭제하시겠습니까?')) return;
      var idx = parseInt(btn.dataset.idx);
      var templates = getTemplates();
      templates.splice(idx, 1);
      saveTemplates(templates);
      renderTemplates();
      showToast('템플릿이 삭제되었습니다.');
    });
  });
}

/* ---------- 주제별 예시 문구 ---------- */
var exampleData = [
  { topic:'관리비 납부', samples:[
    '{계약자}님, {고인}님의 관리비 납부 안내입니다.\\n계약자명과 동일하게 입금해주세요.',
    '안녕하세요, {계약자}님. 이번달 관리비 납부 기간입니다.\\n금액: 360,000원 / 입금자: {계약자}',
    '{계약자}님, {고인}님 관리비 납부 부탁드립니다.\\n문의: 000-0000-0000 (청솔원)'
  ]},
  { topic:'연체 안내', samples:[
    '{계약자}님, {고인}님 관리비가 {연체일}일째 연체중입니다.\\n연체금액: {연체금액}원 / 빠른 납부 바랍니다.',
    '{계약자}님 관리비 연체 안내\\n계약번호: {계약번호} / {연체일}일 경과',
    '안내드립니다. {계약자}님의 관리비가 연체되어 연락드립니다.\\n문의: 000-0000-0000'
  ]},
  { topic:'추모일 안내', samples:[
    '{계약자}님, {고인}님의 추모일이 다가오고 있습니다.\\n일시: {추모일시} / 장소: 청솔원 메모리얼파크',
    '{계약자}님 {고인}님 삼우제/49제 안내\\n청솔원 메모리얼파크에서 편히 모십니다.',
    '삼가 알려드립니다. {고인}님의 추모일이 도래하였습니다.\\n{계약자}님의 방문을 기다립니다.'
  ]},
  { topic:'계약 안내', samples:[
    '{계약자}님, {고인}님 안치 계약이 완료되었습니다.\\n계약번호: {계약번호} / 위치: {위치}',
    '{계약자}님 계약 완료 안내\\n{고인}님 / {위치} / 청솔원 메모리얼파크',
    '안녕하세요 청솔원입니다. {계약자}님의 계약이 완료되었습니다.'
  ]},
  { topic:'계약 갱신', samples:[
    '{계약자}님 {고인}님의 안치 계약 갱신일이 다가옵니다.\\n만료일: {만료일} / 갱신 문의: 000-0000-0000',
    '{계약자}님 계약 갱신 안내\\n계약번호: {계약번호} / 만료 예정일: {만료일}',
    '안내드립니다. {계약자}님의 안치 계약이 곧 만료됩니다.\\n갱신을 원하시면 연락주세요.'
  ]},
  { topic:'기타 안내', samples:[
    '{계약자}님, 청솔원 메모리얼파크입니다.\\n문의: 000-0000-0000',
    '{계약자}님 시설 정기 점검 안내\\n일시: {일시} / 이용에 참고 부탁드립니다.',
    '안녕하세요, {계약자}님. 청솔원 운영팀입니다.\\n{고인}님께 항상 감사드립니다.'
  ]}
];

function renderExamples(){
  var container = document.getElementById('notif-examples');
  if(!container) return;
  var html = '';
  exampleData.forEach(function(group){
    html += '<div style="background:var(--stone-50); border-radius:var(--radius-sm); padding:10px;">' +
      '<p style="margin:0 0 6px; font-size:12px; font-weight:700; color:var(--ink-700);">📝 ' + group.topic + '</p>';
    group.samples.forEach(function(s, si){
      var preview = s.replace(/\\n/g, ' ').substring(0, 35);
      html += '<div style="padding:4px 8px; margin-bottom:3px; background:#fff; border-radius:4px; font-size:11px; color:var(--ink-600); border:1px solid var(--stone-200); display:flex; align-items:center; justify-content:space-between;">' +
        '<span>' + (si+1) + '. ' + preview + (s.length > 35 ? '...' : '') + '</span>' +
        '<button class="btn btn-ghost btn-sm preview-example-btn" style="font-size:10px; padding:1px 6px;" data-msg="' + s.replace(/"/g,'&quot;') + '">프리뷰</button></div>';
    });
    html += '</div>';
  });
  container.innerHTML = html;
  
  // 프리뷰 버튼
  document.querySelectorAll('.preview-example-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var msg = btn.dataset.msg;
      var display = msg
        .replace(/{계약자}/g, '김철수')
        .replace(/{고인}/g, '김영희')
        .replace(/{연체일}/g, '5')
        .replace(/{연체금액}/g, '360,000')
        .replace(/{추모일시}/g, '2026년 7월 15일')
        .replace(/{계약번호}/g, 'CT-2026-041');
      var bubble = document.getElementById('mp-bubble');
      if(bubble){ bubble.innerHTML = display.replace(/\n/g, '<br>'); }
      document.getElementById('mp-channel-icon').textContent = '📱';
      document.getElementById('mp-channel-name').textContent = 'SMS (예시)';
      document.getElementById('mp-sms-footer').style.display = 'block';
      showToast('✅ 예시 문구가 미리보기에 표시됩니다.');
    });
  });
}

function showTemplateEditor(idx){
  var templates = getTemplates();
  var t = templates[idx];
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:80; display:flex; align-items:center; justify-content:center; padding:20px;';
  overlay.innerHTML = '<div style="background:#fff; border-radius:12px; width:520px; max-width:100%; max-height:80vh; overflow-y:auto; padding:24px;">' +
    '<h3 style="margin:0 0 16px; font-size:16px;">템플릿 수정</h3>' +
    '<div class="form-row"><label>템플릿명</label><input id="te-name" value="' + t.name.replace(/"/g,'&quot;') + '" style="width:100%;"></div>' +
    '<div class="form-row"><label>카테고리</label>' +
    '<select id="te-category" style="width:100%;">' +
      '<option ' + (t.category==='납부'?'selected':'') + '>납부</option>' +
      '<option ' + (t.category==='추모'?'selected':'') + '>추모</option>' +
      '<option ' + (t.category==='계약'?'selected':'') + '>계약</option>' +
      '<option ' + (t.category==='기타'?'selected':'') + '>기타</option>' +
    '</select></div>' +
    '<div class="form-row"><label>메시지 내용</label>' +
    '<textarea id="te-msg" rows="5" style="width:100%; resize:vertical;">' + t.msg.replace(/</g,'&lt;') + '</textarea></div>' +
    '<div style="background:var(--stone-50); border-radius:var(--radius-sm); padding:10px 12px; margin-bottom:14px; font-size:12px; color:var(--ink-400);">' +
      '<p style="margin:0 0 4px; font-weight:600;">🔍 미리보기</p>' +
      '<p id="te-preview" style="margin:0; white-space:pre-wrap; color:var(--ink-600);">' + t.msg.replace(/{계약자}/g, '이서영').replace(/{고인}/g, '김철수') + '</p></div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="te-cancel-btn">취소</button>' +
      '<button class="btn btn-primary" id="te-save-btn"><i class="ti ti-device-floppy"></i> 저장</button></div></div>';
  document.body.appendChild(overlay);
  
  document.getElementById('te-msg').addEventListener('input', function(){
    var preview = this.value.replace(/{계약자}/g, '이서영').replace(/{고인}/g, '김철수');
    document.getElementById('te-preview').textContent = preview;
  });
  
  document.getElementById('te-cancel-btn').addEventListener('click', function(){ overlay.remove(); });
  document.getElementById('te-save-btn').addEventListener('click', function(){
    var templates = getTemplates();
    templates[idx].name = document.getElementById('te-name').value;
    templates[idx].category = document.getElementById('te-category').value;
    templates[idx].msg = document.getElementById('te-msg').value;
    saveTemplates(templates);
    renderTemplates();
    overlay.remove();
    showToast('템플릿이 저장되었습니다.');
  });
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
}

// 템플릿 추가
document.getElementById('add-template-btn').addEventListener('click', function(){
  var templates = getTemplates();
  templates.push({ id:'custom-' + Date.now(), name:'새 템플릿', category:'기타', msg:'메시지 내용을 입력하세요.', active:true });
  saveTemplates(templates);
  renderTemplates();
  showTemplateEditor(templates.length - 1);
});

// 알림 관리 페이지 진입 시 템플릿 렌더링
var _origGoPage = goPage;
goPage = function(page){
  _origGoPage(page);
  if(page === 'notifications') renderTemplates();
};

// 초기 로드
renderTemplates();
renderExamples();

/* 채널 필터 탭 */
document.querySelectorAll('.notif-channel-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.notif-channel-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    renderTemplates();
    // 프리뷰 초기화
    var firstCard = document.querySelector('#template-list .card');
    if(firstCard) updateMobilePreview(parseInt(firstCard.dataset.templateIdx));
  });
});

/* ---------- 모바일 프리뷰 ---------- */
function updateMobilePreview(idx){
  var templates = getTemplates();
  if(idx < 0 || idx >= templates.length) return;
  var t = templates[idx];
  
  var sampleData = {
    '{계약자}': '김철수',
    '{고인}': '김영희',
    '{연체일}': '5',
    '{연체금액}': '360,000',
    '{추모일시}': '2026년 7월 15일 오전 10시',
    '{계약번호}': 'CT-2026-041',
    '{위치}': '1구역 A-05',
    '{만료일}': '2026년 8월 20일',
    '{일시}': '2026년 7월 1일'
  };
  var msg = t.msg;
  Object.keys(sampleData).forEach(function(k){
    msg = msg.replace(new RegExp(k.replace(/[{}]/g,'\\$&'),'g'), sampleData[k]);
  });
  
  var isSMS = t.channel === 'sms';
  document.getElementById('mp-channel-icon').textContent = isSMS ? '📱' : '💛';
  document.getElementById('mp-channel-name').textContent = isSMS ? 'SMS 문자' : '카카오 알림톡';
  document.getElementById('mp-bubble').innerHTML = msg.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
  document.getElementById('mp-sms-footer').style.display = isSMS ? 'block' : 'none';
}

document.addEventListener('click', function(e){
  var btn = e.target.closest('.template-preview-btn');
  if(btn && btn.dataset.idx !== undefined){
    updateMobilePreview(parseInt(btn.dataset.idx));
  }
  // 카드 클릭 시에도 미리보기
  var card = e.target.closest('.card[data-template-idx]');
  if(card && !e.target.closest('button')){
    var idx = parseInt(card.dataset.templateIdx);
    if(!isNaN(idx)) updateMobilePreview(idx);
  }
});

setTimeout(function(){
  var templates = getTemplates();
  if(templates.length > 0) updateMobilePreview(0);
}, 100);

/* ---------- 발송 로그 페이지 ---------- */
var logsFilter = 'all';
var logsSearch = '';

function renderLogs(){
  var container = document.getElementById('logs-list');
  var emptyEl = document.getElementById('logs-empty');
  if(!container) return;
  
  var logs = getKakaoLogs();
  var filtered = logs.filter(function(log){
    if(logsFilter !== 'all'){
      if(logsFilter === 'kakao' && log.channel !== 'kakao' && log.channel !== 'both') return false;
      if(logsFilter === 'sms' && log.channel !== 'sms' && log.channel !== 'both') return false;
    }
    if(logsSearch && log.target.indexOf(logsSearch) === -1 && log.message.indexOf(logsSearch) === -1 && log.type.indexOf(logsSearch) === -1){
      return false;
    }
    return true;
  });
  
  if(filtered.length === 0){
    container.innerHTML = '';
    if(emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  
  var html = '';
  filtered.slice(0, 100).forEach(function(log){
    var isSMS = log.channel === 'sms' || log.channel === 'both' ? (log.message.indexOf('💛') > -1 ? false : true) : (log.channel === 'sms');
    if(log.channel === 'both') isSMS = false; // both는 카카오 우선 표시
    var chanIcon = isSMS ? '\uD83D\uDCF1' : '\uD83D\uDC9B';
    var chanLabel = isSMS ? 'SMS' : '\uCE74\uCE74\uC624';
    html += '<div style="display:flex; gap:10px; padding:10px 14px; border-bottom:1px solid var(--stone-200); align-items:flex-start;">' +
      '<div style="font-size:16px; flex-shrink:0; padding-top:2px;">' + chanIcon + '</div>' +
      '<div style="flex:1; min-width:0;">' +
        '<div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">' +
          '<span style="font-size:11px; font-weight:600;">' + log.type + '</span>' +
          '<span class="badge ' + (isSMS ? 'badge-warning' : 'badge-primary') + '" style="font-size:9px; padding:1px 6px;">' + chanIcon + ' ' + chanLabel + '</span>' +
          '<span style="margin-left:auto; font-size:10px; color:var(--ink-400);">' + log.date + ' ' + log.time + '</span>' +
        '</div>' +
        '<p style="margin:0; font-size:11.5px; color:var(--ink-600);">\uB300\uC0C1: ' + log.target + '</p>' +
        '<p style="margin:2px 0 0; font-size:11px; color:var(--ink-400);">' + log.message + '</p>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// 검색
document.addEventListener('input', function(e){
  if(e.target && e.target.id === 'logs-search'){
    logsSearch = e.target.value.trim();
    renderLogs();
  }
});

// 필터 탭
document.querySelectorAll('.logs-filter-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.logs-filter-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    logsFilter = btn.dataset.filter;
    renderLogs();
  });
});

// 전체 삭제
var clrBtn = document.getElementById('logs-clear');
if(clrBtn){
  clrBtn.addEventListener('click', function(){
    if(!confirm('\uBC1C\uC1A1 \uB85C\uADF8\uB97C \uC804\uCCB4 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;
    localStorage.setItem('chungsol_kakao_log', '[]');
    renderLogs();
    showToast('\u2705 \uBC1C\uC1A1 \uB85C\uADF8\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
  });
}

// goPage
var _origGoPage5 = goPage;
goPage = function(page){
  _origGoPage5(page);
  if(page === 'logs') renderLogs();
  if(page === 'customers'){ renderCustTable(); renderCustVisitLog(); renderCustMemos(); }
  if(page === 'staff'){ renderAttendance(); renderVacation(); }
  if(page === 'revenuemanage'){ updateRevenueManage('month'); renderRMSubMetrics(); }
  if(page === 'notifications'){ renderTemplates(); renderExamples(); }
  if(page === 'contracts') renderContractStats();
  if(page === 'fees') renderFeeStats();
  if(page === 'newcontract'){ 
    document.getElementById('page-title').textContent = '신규 계약 작성';
    initNewContractForm();
  }
};

renderLogs();

/* ---------- 신규 계약 작성 페이지 ---------- */
function initNewContractForm(){
  // 오늘 날짜 기본값
  var today = new Date().toISOString().slice(0,10);
  var ncDeath = document.getElementById('nc-death-date');
  var ncEnshrine = document.getElementById('nc-enshrine-date');
  if(ncDeath && !ncDeath.value) ncDeath.value = today;
  if(ncEnshrine && !ncEnshrine.value) ncEnshrine.value = today;
  
  // \uc608\uc57d\uc5d0\uc11c \uacc4\uc57d \uc804\ud658 \ub370\uc774\ud130 \uc790\ub3d9 \uce44\uc6b0\uae30
  try {
    var saved = sessionStorage.getItem('chungsol_contract_convert');
    if(saved){
      var data = JSON.parse(saved);
      if(data.customer) document.getElementById('nc-customer').value = data.customer;
      if(data.phone) document.getElementById('nc-phone').value = data.phone;
      if(data.deceased) document.getElementById('nc-deceased').value = data.deceased;
      if(data.location){
        var locSelect = document.getElementById('nc-location');
        for(var i=0; i<locSelect.options.length; i++){
          if(locSelect.options[i].text.indexOf(data.location) >= 0){
            locSelect.selectedIndex = i;
            break;
          }
        }
      }
      sessionStorage.removeItem('chungsol_contract_convert');
    }
  } catch(e){}
  
  showToast('\uc2e0\uaddc \uacc4\uc57d \uc791\uc131 \ud3fc\uc774 \uc900\ube44\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
}

// 뒤로가기
document.getElementById('newcontract-back').addEventListener('click', function(){ goPage('contracts'); });
document.getElementById('nc-cancel-btn').addEventListener('click', function(){ goPage('contracts'); });

// 계약서 생성
document.getElementById('nc-submit-btn').addEventListener('click', function(){
  var customer = document.getElementById('nc-customer').value.trim();
  var phone = document.getElementById('nc-phone').value.trim();
  var deceased = document.getElementById('nc-deceased').value.trim();
  var location = document.getElementById('nc-location').value;
  if(!customer || !phone || !deceased){
    showToast('계약자명, 연락처, 고인명은 필수 입력 항목입니다.');
    return;
  }
  if(!document.getElementById('nc-privacy-required').checked){
    showToast('[\ud544\uc218] \uac1c\uc778\uc815\ubcf4 \uc218\uc9d1 \ubc0f \uc774\uc6a9\uc5d0 \ub3d9\uc758\ud574 \uc8fc\uc138\uc694.');
    document.getElementById('nc-privacy-required').focus();
    return;
  }
  // \ub85c\uadf8 \uae30\ub85d
  addKakaoLog('\uc2e0\uaddc \uacc4\uc57d \ub4f1\ub85d', customer + '\u00b7' + deceased, '\uc704\uce58: ' + location + ', \uc218\ub3d9 \ub4f1\ub85d');
  showToast('\u2705 \uacc4\uc57d\uc11c\uac00 \uc0dd\uc131\ub418\uc5c8\uc2b5\ub2c8\ub2e4. (\uc2dc\ubbac\ub808\uc774\uc158)');
  goPage('contracts');
});

/* ================= 전자서명 패드 ================= */
(function(){
  var canvas = document.getElementById('nc-sign-pad');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var drawing = false;
  var rect = {};

  function getPos(e){
    var r = canvas.getBoundingClientRect();
    var scaleX = canvas.width / r.width;
    var scaleY = canvas.height / r.height;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - r.left) * scaleX, y: (clientY - r.top) * scaleY };
  }

  function startDraw(e){
    e.preventDefault();
    drawing = true;
    var pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e){
    e.preventDefault();
    if(!drawing) return;
    var pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#15171C';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw(e){
    e.preventDefault();
    drawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, {passive:false});
  canvas.addEventListener('touchmove', draw, {passive:false});
  canvas.addEventListener('touchend', endDraw);

  // 서명 지우기
  document.getElementById('nc-sign-clear').addEventListener('click', function(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
})();

/* ---------- 자동 발송 엔진 ---------- */
var autoEngineRunning = false;
var autoEngineTimer = null;
var AS_KEY = 'chungsol_autosend';

function getAutoSendConfig(){
  try {
    var saved = JSON.parse(localStorage.getItem(AS_KEY));
    if(saved) return saved;
  } catch(e){}
  return {
    'fee-timing':'7', 'fee-kakao':true, 'fee-sms':true,
    'overdue-timing':'3', 'overdue-kakao':true, 'overdue-sms':true,
    'memorial-timing':'3', 'memorial-kakao':true, 'memorial-sms':false,
    'renew-timing':'30', 'renew-kakao':true, 'renew-sms':false,
    'newcontract-timing':'0', 'newcontract-kakao':true, 'newcontract-sms':false
  };
}

function saveAutoSendConfig(){
  var config = {};
  document.querySelectorAll('.as-timing').forEach(function(sel){
    config[sel.dataset.key] = sel.value;
  });
  document.querySelectorAll('.as-channel').forEach(function(chk){
    config[chk.dataset.key] = chk.checked;
  });
  localStorage.setItem(AS_KEY, JSON.stringify(config));
}

function loadAutoSendConfig(){
  var config = getAutoSendConfig();
  document.querySelectorAll('.as-timing').forEach(function(sel){
    if(config[sel.dataset.key]) sel.value = config[sel.dataset.key];
  });
  document.querySelectorAll('.as-channel').forEach(function(chk){
    if(config[chk.dataset.key] !== undefined) chk.checked = config[chk.dataset.key];
  });
}

loadAutoSendConfig();
var asc = document.getElementById('auto-send-config');
if(asc) asc.addEventListener('change', function(){ saveAutoSendConfig(); });

var engineBtn = document.getElementById('auto-engine-toggle');
var engineStatus = document.getElementById('auto-engine-status');
var engineLog = document.getElementById('auto-engine-log');

if(engineBtn && engineStatus){
  engineBtn.addEventListener('click', function(){
    if(autoEngineRunning){
      autoEngineRunning = false;
      clearInterval(autoEngineTimer);
      engineStatus.textContent = '● 중지';
      engineStatus.style.color = 'var(--ink-400)';
      engineBtn.textContent = '▶ 시작';
      if(engineLog) engineLog.textContent = '';
    } else {
      autoEngineRunning = true;
      engineStatus.textContent = '● 실행중';
      engineStatus.style.color = 'var(--jade-700)';
      engineBtn.textContent = '■ 중지';
      if(engineLog) engineLog.textContent = '체크 주기: 30초';
      runAutoSendCheck();
      autoEngineTimer = setInterval(runAutoSendCheck, 30000);
    }
  });
}

function runAutoSendCheck(){
  var config = getAutoSendConfig();
  var now = new Date();
  var checks = [
    {name:'관리비 납부', timing:parseInt(config['fee-timing']), kakao:config['fee-kakao'], sms:config['fee-sms']},
    {name:'연체', timing:parseInt(config['overdue-timing']), kakao:config['overdue-kakao'], sms:config['overdue-sms']},
    {name:'추모일', timing:parseInt(config['memorial-timing']), kakao:config['memorial-kakao'], sms:config['memorial-sms']}
  ];
  var sent = [];
  checks.forEach(function(c){
    if(Math.random() > 0.7){
      sent.push(c.name);
      var channels = [];
      if(c.kakao) channels.push('💛카톡');
      if(c.sms) channels.push('📱SMS');
      addKakaoLog('자동:' + c.name, '(시뮬레이션)', channels.join('/') + ' 자동 발송됨');
    }
  });
  if(sent.length > 0 && engineLog){
    var ts = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') + ':' + now.getSeconds().toString().padStart(2,'0');
    engineLog.textContent = '[' + ts + '] ' + sent.join(', ') + ' 발송';
    setTimeout(function(){ if(engineLog) engineLog.textContent = '체크 주기: 30초'; }, 5000);
  }
}

/* 계약 관리 발송 버튼 */
function addSendButtonsToContracts(){
  var rows = document.querySelectorAll('#contract-table tbody tr');
  rows.forEach(function(tr){
    var actionCell = tr.querySelector('td:last-child');
    if(actionCell && !actionCell.querySelector('.ct-send-btn')){
      var btn = document.createElement('button');
      btn.className = 'btn btn-ghost btn-sm ct-send-btn';
      btn.textContent = '💬';
      btn.style.cssText = 'font-size:10px; padding:2px 6px; margin-left:2px;';
      btn.addEventListener('click', function(){
        var contractNo = tr.children[0].textContent;
        var customerName = tr.children[2].textContent;
        showSendModal(contractNo, customerName);
      });
      actionCell.appendChild(btn);
    }
  });
}

function showSendModal(contractNo, customerName){
  var templates = getTemplates();
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:80; display:flex; align-items:center; justify-content:center; padding:20px;';
  var typeOpts = '<option value="kakao">💛 카카오 알림톡</option><option value="sms">📱 SMS 문자</option>';
  var tmplOpts = templates.filter(function(t){ return t.active; }).map(function(t, i){
    return '<option value="' + i + '">' + t.name + '</option>';
  }).join('');
  overlay.innerHTML = '<div style="background:#fff; border-radius:12px; width:420px; padding:24px;">' +
    '<h3 style="margin:0 0 14px; font-size:15px;">💬 메시지 발송</h3>' +
    '<div style="margin-bottom:10px; font-size:12px; color:var(--ink-600);">계약: ' + contractNo + ' · 대상: ' + customerName + '</div>' +
    '<div class="form-row"><label>발송 방식</label><select id="sm-type" style="width:100%;">' + typeOpts + '</select></div>' +
    '<div class="form-row"><label>템플릿</label><select id="sm-tmpl" style="width:100%;">' + tmplOpts + '</select></div>' +
    '<div class="form-row"><label>미리보기</label><div id="sm-preview" style="background:var(--stone-50); border-radius:var(--radius-sm); padding:10px; font-size:12px; min-height:40px; white-space:pre-wrap;"></div></div>' +
    '<div style="display:flex; gap:6px; justify-content:flex-end;">' +
    '<button class="btn btn-ghost" data-close>취소</button>' +
    '<button class="btn btn-primary" id="sm-send">발송</button></div></div>';
  document.body.appendChild(overlay);
  
  function updPreview(){
    var tIdx = parseInt(document.getElementById('sm-tmpl').value);
    var t = templates[tIdx];
    var el = document.getElementById('sm-preview');
    if(t && el) el.textContent = t.msg;
  }
  document.getElementById('sm-type').addEventListener('change', updPreview);
  document.getElementById('sm-tmpl').addEventListener('change', updPreview);
  updPreview();
  
  document.getElementById('sm-send').addEventListener('click', function(){
    var type = document.getElementById('sm-type').value;
    var tIdx = parseInt(document.getElementById('sm-tmpl').value);
    var t = templates[tIdx];
    var label = type === 'kakao' ? '💛카톡' : '📱SMS';
    addKakaoLog('수동:' + (t ? t.name : ''), contractNo + '·' + customerName, label + ' 발송');
    showToast(label + ' 발송 완료!');
    overlay.remove();
  });
  overlay.querySelector('[data-close]').addEventListener('click', function(){ overlay.remove(); });
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
}

setTimeout(function(){
  addSendButtonsToContracts();
  var obs = new MutationObserver(function(){ addSendButtonsToContracts(); });
  var tbl = document.getElementById('contract-table');
  if(tbl) obs.observe(tbl, {childList:true, subtree:true});
}, 500);

/* ================= Global Search ================= */
(function(){
  var searchInput = document.getElementById('global-search-input');
  var searchResults = document.getElementById('global-search-results');
  if(!searchInput || !searchResults) return;

  function getSearchData(){
    var rows = [];
    var tbody = document.querySelector('#contract-table tbody');
    if(!tbody) return rows;
    var trs = tbody.querySelectorAll('tr');
    trs.forEach(function(tr){
      var tds = tr.querySelectorAll('td');
      if(tds.length < 9) return;
      rows.push({
        contractNo: (tds[0].textContent || '').trim(),
        contractDate: (tds[1].textContent || '').trim(),
        contractor: (tds[2].textContent || '').trim(),
        deceased: (tds[3].textContent || '').trim(),
        location: (tds[4].textContent || '').trim(),
        amount: (tds[5].textContent || '').trim(),
        staff: (tds[6].textContent || '').trim(),
        status: (tds[8].textContent || '').trim()
      });
    });
    return rows;
  }

  function searchData(query, data){
    if(query.length < 2) return [];
    var q = query.toLowerCase();
    var results = [];
    data.forEach(function(d){
      var score = 0;
      var matched = '';
      if(d.contractNo.toLowerCase().indexOf(q) >= 0){
        score += 10; matched = d.contractNo;
      }
      if(d.contractor.indexOf(q) >= 0){
        if(d.contractor.indexOf(q) === 0) score += 8;
        else score += 5;
        if(!matched) matched = d.contractor;
      }
      if(d.deceased.indexOf(q) >= 0){
        if(d.deceased.indexOf(q) === 0) score += 8;
        else score += 5;
        if(!matched) matched = d.deceased;
      }
      if(d.location.toLowerCase().indexOf(q) >= 0){
        if(d.location.toLowerCase().indexOf(q) === 0) score += 7;
        else score += 4;
        if(!matched) matched = d.location;
      }
      if(score > 0){
        results.push({data:d, score:score, matched:matched});
      }
    });
    results.sort(function(a,b){ return b.score - a.score; });
    return results.slice(0, 10);
  }

  function renderResults(results){
    searchResults.innerHTML = '';
    if(results.length === 0){
      searchResults.innerHTML = '<div class="search-no-result">검색 결과가 없습니다</div>';
      searchResults.classList.add('show');
      return;
    }
    results.forEach(function(r){
      var d = r.data;
      var item = document.createElement('div');
      item.className = 'search-result-item';

      var badge = document.createElement('span');
      badge.className = 'type-badge contract';
      if(d.contractor.indexOf(r.matched) >= 0) { badge.textContent = '계약'; badge.className = 'type-badge contract'; }
      else if(d.deceased.indexOf(r.matched) >= 0) { badge.textContent = '고인'; badge.className = 'type-badge deceased'; }
      else if(d.location.indexOf(r.matched) >= 0) { badge.textContent = '위치'; badge.className = 'type-badge location'; }
      else { badge.textContent = '번호'; }

      var info = document.createElement('div');
      info.style.cssText = 'min-width:0;';
      var name = document.createElement('p');
      name.className = 'result-name';
      name.textContent = d.contractor + ' \u00b7 ' + d.deceased;
      var sub = document.createElement('p');
      sub.className = 'result-sub';
      sub.textContent = d.location + ' | ' + d.contractNo;

      info.appendChild(name);
      info.appendChild(sub);

      var meta = document.createElement('span');
      meta.className = 'result-meta';
      meta.textContent = d.status;

      item.appendChild(badge);
      item.appendChild(info);
      item.appendChild(meta);

      item.addEventListener('click', function(){
        goPage('contracts');
        var tbody = document.querySelector('#contract-table tbody');
        if(tbody){
          var trs = tbody.querySelectorAll('tr');
          trs.forEach(function(tr){
            tr.style.background = '';
            var firstTd = tr.querySelector('td');
            if(firstTd && (firstTd.textContent || '').trim() === d.contractNo){
              tr.style.background = 'rgba(91,95,239,.08)';
              tr.scrollIntoView({behavior:'smooth', block:'center'});
            }
          });
        }
        searchInput.value = '';
        searchResults.classList.remove('show');
        searchResults.innerHTML = '';
      });

      searchResults.appendChild(item);
    });
    searchResults.classList.add('show');
  }

  var lastData = [];
  searchInput.addEventListener('keyup', function(e){
    if(e.key === 'Escape'){
      searchInput.value = '';
      searchResults.classList.remove('show');
      return;
    }
    var val = searchInput.value.trim();
    if(val.length < 2){
      searchResults.classList.remove('show');
      return;
    }
    if(lastData.length === 0){
      lastData = getSearchData();
    }
    var results = searchData(val, lastData);
    renderResults(results);
  });

  searchInput.addEventListener('focus', function(){
    if(searchInput.value.trim().length >= 2){
      searchResults.classList.add('show');
    }
  });

  document.addEventListener('keydown', function(e){
    if(e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey){
      var tag = (e.target || {}).tagName || '';
      if(tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT'){
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  document.addEventListener('click', function(e){
    if(!searchInput.contains(e.target) && !searchResults.contains(e.target)){
      searchResults.classList.remove('show');
    }
  });

  var observer = new MutationObserver(function(){
    lastData = [];
  });
  var tbody = document.querySelector('#contract-table tbody');
  if(tbody) observer.observe(tbody, {childList:true, subtree:true});
})();

/* ================= Location Side Panel ================= */
function showLocationSidePanel(cell){
  var panel = document.getElementById('loc-side-panel');
  var overlay = document.getElementById('lsp-overlay');
  if(!panel || !overlay) return;

  var code = cell.dataset.code || '--';
  var status = cell.dataset.status || 'empty';

  document.getElementById('lsp-title').textContent = code;

  var badgeEl = document.getElementById('lsp-status-badge');
  var badgeCls, badgeIcon, badgeText;
  if(status === 'occupied'){
    badgeCls = 'badge badge-success'; badgeIcon = 'ti ti-circle-check'; badgeText = '\uc0ac\uc6a9\uc911';
  } else if(status === 'reserved'){
    badgeCls = 'badge badge-warning'; badgeIcon = 'ti ti-clock'; badgeText = '\uc608\uc57d\uc911';
  } else {
    badgeCls = 'badge badge-neutral'; badgeIcon = 'ti ti-circle'; badgeText = '\uacf5\uc2e4';
  }
  badgeEl.className = badgeCls;
  badgeEl.innerHTML = '<i class="' + badgeIcon + '"></i> ' + badgeText;

  var body = document.getElementById('lsp-body');
  body.innerHTML = '';

  function addRow(label, value){
    var row = document.createElement('div');
    row.className = 'info-row';
    row.innerHTML = '<span class="info-label">' + label + '</span><span class="info-value">' + value + '</span>';
    body.appendChild(row);
  }

  function addSection(title){
    var h = document.createElement('h4');
    h.textContent = title;
    body.appendChild(h);
  }

  if(status === 'occupied'){
    addRow('\uace0\uc778', cell.dataset.occupant || '--');
    addRow('\uacc4\uc57d\uc790', cell.dataset.holder || '--');
    addRow('\uacc4\uc57d\uc77c', cell.dataset.date || '--');
    addSection('\uad00\ub9ac\ube44');
    var settings = localStorage.getItem('chungsol_settings');
    var parsed = settings ? JSON.parse(settings) : {};
    var feeAmt = parsed.feeAmount || '360000';
    addRow('\uc815\uae09\uae08\uc561', '\u20a9 ' + Number(feeAmt).toLocaleString() + '/\ub144');
    addRow('\ub0a9\ubd80\uc0c1\ud0dc', '<span class="badge badge-success">\uc815\uc0c1 \ub0a9\ubd80\uc911</span>');
    addRow('\ub2e4\uc74c \ub0a9\ubd80\uc608\uc815\uc77c', '2026-09-10 (D-78)');
    addSection('\ucd5c\uadfc \uc774\ub3d9 \uc774\ub825');
    var histories = [
      { date: cell.dataset.date || '2026-06-10', action: '\ucd5c\ucd08 \uc548\uce58 \uacc4\uc57d \uccb4\uacb0', by: cell.dataset.holder || '--' },
      { date: '2026-06-12', action: '\uc548\uc7a5 \uc704\uce58 \ud655\uc815', by: '\uae40\ubbfc\uc218(\uad00\ub9ac\uc790)' }
    ];
    histories.forEach(function(h){
      var item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = '<div class="history-date">' + h.date + '</div><div class="history-action">' + h.action + '</div><div class="history-by">' + h.by + '</div>';
      body.appendChild(item);
    });
  } else if(status === 'reserved'){
    addRow('\uc608\uc57d\uc790', cell.dataset.holder || '--');
    addRow('\uc608\uc57d\uc77c', cell.dataset.date || '--');
    addRow('\ub9cc\ub8cc\uc77c', (cell.dataset.date ? (function(d){ var dt=new Date(d); dt.setFullYear(dt.getFullYear()+1); return dt.toISOString().slice(0,10); })(cell.dataset.date) : '--'));
    addRow('\uc608\uc57d\uae08', '\u20a9 500,000');
  } else {
    addRow('\uad6c\uc88c \ucf54\ub4dc', code);
    addRow('\uae30\uc900 \ubd84\uc591\uac00', cell.dataset.price || '--');
  }

  var actions = document.getElementById('lsp-actions');
  actions.innerHTML = '';

  function addActionBtn(text, icon, cls, onClick){
    var btn = document.createElement('button');
    btn.className = 'lsp-btn' + (cls ? ' ' + cls : '');
    btn.innerHTML = '<i class="' + icon + '"></i> ' + text;
    btn.addEventListener('click', onClick);
    actions.appendChild(btn);
  }

  if(status === 'empty'){
    addActionBtn('\uc2e0\uaddc \uacc4\uc57d \uc791\uc131', 'ti ti-file-plus', 'primary', function(){
      closeSidePanel();
      goPage('newcontract');
    });
  } else if(status === 'occupied'){
    addActionBtn('\uad00\ub9ac\ube44 \uc218\ub0a9', 'ti ti-coin', '', function(){ showToast('\uad00\ub9ac\ube44 \uc218\ub0a9 \ud398\uc774\uc9c0\ub97c \uc5ec\ub294 \uc911\uc785\ub2c8\ub2e4.'); });
    addActionBtn('\uc54c\ub9bc\ud1a1 \ubc1c\uc1a1', 'ti ti-message', '', function(){ showToast('\uc54c\ub9bc\ud1a1 \ubc1c\uc1a1 \ud398\uc774\uc9c0\ub97c \uc5ec\ub294 \uc911\uc785\ub2c8\ub2e4.'); });
    addActionBtn('\uc704\uce58 \uc774\ub3d9', 'ti ti-arrows-shuffle', 'danger', function(){ showToast('\uc704\uce58 \uc774\ub3d9 \uae30\ub2a5\uc740 \uc900\ube44 \uc911\uc785\ub2c8\ub2e4.'); });
  } else {
    addActionBtn('\uacc4\uc57d \uc804\ud658', 'ti ti-file-text', 'primary', function(){
      closeSidePanel();
      var cell = panel._lastCell;
      if(cell){
        var data = {customer: cell.dataset.holder || '', phone: '', location: cell.dataset.code || '', deceased: cell.dataset.occupant || ''};
        sessionStorage.setItem('chungsol_contract_convert', JSON.stringify(data));
      }
      goPage('newcontract');
    });
    addActionBtn('\uc608\uc57d \ucde8\uc18c', 'ti ti-x', 'danger', function(){ showToast('\uc608\uc57d\uc774 \ucde8\uc18c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.'); closeSidePanel(); });
  }

  panel.style.transform = 'translateX(0)';
  overlay.style.display = 'block';
}

function closeSidePanel(){
  var panel = document.getElementById('loc-side-panel');
  var overlay = document.getElementById('lsp-overlay');
  if(panel) panel.style.transform = 'translateX(100%)';
  if(overlay) overlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('lsp-close').addEventListener('click', closeSidePanel);
  document.getElementById('lsp-overlay').addEventListener('click', closeSidePanel);
});

/* ================= CSV \ub0b4\ubcf4\ub0b4\uae30 ================= */
document.getElementById('export-csv-btn').addEventListener('click', function(){
  var rows = [];
  document.querySelectorAll('#settle-table tbody tr').forEach(function(tr){
    var tds = tr.querySelectorAll('td');
    if(tds.length < 7) return;
    rows.push([
      tds[0].textContent.trim(),
      tds[1].textContent.trim(),
      tds[2].textContent.trim(),
      tds[3].textContent.trim(),
      tds[4].textContent.trim(),
      tds[5].textContent.trim().replace(/\s+/g, ' ')
    ]);
  });
  if(rows.length === 0){ showToast('\ub0b4\ubcf4\ub0bc \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.'); return; }
  var csv = '\uc601\uc5c5\uc790,\ubbf8\uc815\uc0b0 \uac74\uc218,\uc138\uc804 \ud569\uacc4,\uc6d0\ucc9c\uc9d5\uc218,\uc2e4\uc9c0\uae09\uc561,\uc0c1\ud0dc\n';
  rows.forEach(function(r){ csv += r.join(',') + '\n'; });
  var blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '\uc218\uc218\ub8cc_\uc815\uc0b0_' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV \ud30c\uc77c\uc774 \ub2e4\uc6b4\ub85c\ub4dc\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
});

