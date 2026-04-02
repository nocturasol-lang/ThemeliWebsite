/**
 * THEMELI — Admin Panel Logic (PHP/SQLite)
 */

let projects = [];
let editingId = null;
let pendingImageFile = null;

// DOM refs
const tableBody = document.getElementById('adminTableBody');
const emptyState = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const addProjectBtn = document.getElementById('addProjectBtn');
const exportBtn = document.getElementById('exportBtn');
const publishBtn = document.getElementById('publishBtn');
const importFile = document.getElementById('importFile');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');
const statusEl = document.getElementById('adminStatus');

// Form fields
const fName = document.getElementById('fName');
const fYear = document.getElementById('fYear');
const fTypology = document.getElementById('fTypology');
const fNameEn = document.getElementById('fNameEn');
const fLocation = document.getElementById('fLocation');
const fRegion = document.getElementById('fRegion');
const fDesc = document.getElementById('fDesc');
const fDescEn = document.getElementById('fDescEn');
const fArchitect = document.getElementById('fArchitect');
const fSize = document.getElementById('fSize');
const fStatus = document.getElementById('fStatus');
const fClient = document.getElementById('fClient');
const fContractor = document.getElementById('fContractor');
const fParticipation = document.getElementById('fParticipation');
const fYearStart = document.getElementById('fYearStart');
const fBudget = document.getElementById('fBudget');
const fImage = document.getElementById('fImage');
const fImagePreview = document.getElementById('fImagePreview');
const fImageFile = document.getElementById('fImageFile');
const fImageDropzone = document.getElementById('fImageDropzone');
const fImagePrompt = document.getElementById('fImagePrompt');
const fImageRemove = document.getElementById('fImageRemove');
const fGalleryDropzone = document.getElementById('fGalleryDropzone');
const fGalleryThumbs = document.getElementById('fGalleryThumbs');
const fGalleryFile = document.getElementById('fGalleryFile');
const fGalleryPrompt = document.getElementById('fGalleryPrompt');
let galleryImages = [];       // URLs of already-uploaded gallery images
let pendingGalleryFiles = [];  // Files waiting to be uploaded on save

// Map picker
const mapPickerContainer = document.getElementById('mapPickerContainer');
const mapPickerDot = document.getElementById('mapPickerDot');
const mapPickerDot2 = document.getElementById('mapPickerDot2');
const mapPickerLine = document.getElementById('mapPickerLine');
const mapPickerCoords = document.getElementById('mapPickerCoords');
const mapPickerHint = document.getElementById('mapPickerHint');
let pickerX = null;
let pickerY = null;
let pickerX2 = null;
let pickerY2 = null;
let pickerPoints = []; // Multi-point polyline for linear projects
const LINEAR_TYPES = ['Railways', 'Tunnels', 'Roadworks'];

// ========== API HELPERS ==========

// Map DB snake_case → JS camelCase
function fromDb(row) {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en || '',
    description: row.description || '',
    descriptionEn: row.description_en || '',
    year: row.year,
    typology: row.typology,
    location: row.location || '',
    region: row.region || '',
    architect: row.architect || '',
    size: row.size || '',
    status: row.status || 'Completed',
    dateCompleted: row.date_completed || '',
    image: row.image_url || '',
    images: (() => { try { return JSON.parse(row.images || '[]'); } catch(_) { return []; } })(),
    mapX: row.map_x,
    mapY: row.map_y,
    mapX2: row.map_x2,
    mapY2: row.map_y2,
    mapPoints: (() => { try { return JSON.parse(row.map_points || 'null'); } catch(_) { return null; } })(),
    client: row.client || '',
    contractor: row.contractor || '',
    participation: row.participation || '',
    yearStart: row.year_start,
    budget: row.budget
  };
}

// Map JS camelCase → DB snake_case
function toDb(data) {
  return {
    name: data.name,
    name_en: data.nameEn || '',
    description: data.description || '',
    description_en: data.descriptionEn || '',
    year: data.year,
    typology: data.typology,
    location: data.location || '',
    region: data.region || '',
    architect: data.architect || '',
    size: data.size || '',
    status: data.status || 'Completed',
    date_completed: data.dateCompleted || '',
    image_url: data.image || '',
    images: JSON.stringify(data.images || []),
    map_x: data.mapX,
    map_y: data.mapY,
    map_x2: data.mapX2,
    map_y2: data.mapY2,
    map_points: data.mapPoints ? JSON.stringify(data.mapPoints) : null,
    client: data.client || '',
    contractor: data.contractor || '',
    participation: data.participation || '',
    year_start: data.yearStart,
    budget: data.budget
  };
}

async function loadProjects() {
  try {
    const res = await fetch('../api/projects.php');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(fromDb);
  } catch (e) {
    console.error('Failed to load projects:', e);
    return [];
  }
}

async function uploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  try {
    const res = await fetch('../api/upload.php', { method: 'POST', body: form });
    if (!res.ok) return '';
    const data = await res.json();
    return data.url;
  } catch (e) {
    console.error('Image upload failed:', e);
    return '';
  }
}

// ========== STATUS ==========
function updateStatus() {
  if (!statusEl) return;
  statusEl.textContent = `${projects.length} έργα στη βάση`;
  statusEl.className = 'admin-status is-published';
}

// ========== RENDER TABLE ==========
const typologyLabels = {
  'Buildings': 'Κτίρια', 'Railways': 'Σιδηρόδρομοι', 'Roadworks': 'Οδοποιία',
  'Tunnels': 'Σήραγγες', 'Industrial & Energy': 'Βιομηχ. & Ενέργεια',
  'Utility Networks': 'Δίκτυα Κ.Ω.', 'Dams': 'Φράγματα',
  'Ports & Marine': 'Λιμάνια & Θαλάσσια', 'Urban Redevelopment': 'Αστική Ανάπλαση'
};
const statusLabels = {
  'Completed': 'Ολοκληρωμένο', 'In Progress': 'Σε Εξέλιξη', 'Planning': 'Σχεδιασμός'
};

function formatBudget(val) {
  if (val == null) return '';
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M €';
  if (val >= 1000) return Math.round(val / 1000) + 'K €';
  return Math.round(val) + ' €';
}

function yearRange(p) {
  if (p.yearStart && p.year && p.yearStart !== p.year) return `${p.yearStart}\u2013${p.year}`;
  if (p.yearStart && p.status === 'In Progress') return `${p.yearStart}\u2013\u03c3\u03ae\u03bc\u03b5\u03c1\u03b1`;
  if (p.yearStart) return `${p.yearStart}`;
  if (p.year) return `${p.year}`;
  return '\u2014';
}

function renderTable() {
  tableBody.innerHTML = '';
  emptyState.style.display = projects.length === 0 ? '' : 'none';

  projects.forEach(p => {
    const row = document.createElement('div');
    row.className = 'proj-row';
    row.setAttribute('data-edit', p.id);

    const imgStyle = p.image ? `background-image:url('${p.image}')` : '';
    const statusTag = p.status === 'In Progress' ? 'tag-progress' :
                      p.status === 'Planning' ? 'tag-planning' : '';

    // Build meta items (only show non-empty fields)
    const meta = [];
    if (p.client) meta.push(`<span><strong>Φορέας:</strong> ${esc(p.client)}</span>`);
    if (p.contractor) meta.push(`<span><strong>Ανάδοχος:</strong> ${esc(p.contractor)}</span>`);
    if (p.participation) meta.push(`<span><strong>Συμμετοχή:</strong> ${esc(p.participation)}</span>`);
    if (p.budget) meta.push(`<span><strong>Π/Υ:</strong> ${formatBudget(p.budget)}</span>`);
    if (p.location) meta.push(`<span><strong>Τοποθεσία:</strong> ${esc(p.location)}</span>`);
    if (p.region) meta.push(`<span><strong>Περιοχή:</strong> ${esc(p.region)}</span>`);
    const mapSet = p.mapX != null && p.mapY != null;
    if (mapSet) meta.push(`<span><strong>Χάρτης:</strong> \u2713</span>`);

    row.innerHTML = `
      <div class="thumb" style="${imgStyle}"></div>
      <div class="proj-info">
        <div class="proj-info-top">
          <span class="proj-title">${esc(p.name)}</span>
          <div class="proj-tags">
            <span class="proj-tag">${yearRange(p)}</span>
            <span class="proj-tag">${esc(typologyLabels[p.typology] || p.typology)}</span>
            ${p.status !== 'Completed' ? `<span class="proj-tag ${statusTag}">${esc(statusLabels[p.status] || p.status)}</span>` : ''}
          </div>
        </div>
        ${p.description ? `<div class="proj-desc">${esc(p.description)}</div>` : ''}
        ${meta.length ? `<div class="proj-meta">${meta.join('')}</div>` : ''}
      </div>
      <div class="proj-actions">
        <button class="btn btn-sm" data-edit="${p.id}">Επεξ.</button>
        <button class="btn btn-sm btn-danger" data-delete="${p.id}">Διαγρ.</button>
      </div>
    `;
    tableBody.appendChild(row);
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ========== MODAL ==========
function openModal(project) {
  pendingImageFile = null;
  if (project) {
    editingId = project.id;
    modalTitle.textContent = 'Επεξεργασία Έργου';
    fName.value = project.name;
    fNameEn.value = project.nameEn || '';
    fYear.value = project.year;
    fTypology.value = project.typology;
    fLocation.value = project.location;
    fRegion.value = project.region || '';
    fDesc.value = project.description || '';
    fDescEn.value = project.descriptionEn || '';
    fArchitect.value = project.architect || '';
    fSize.value = project.size || '';
    fStatus.value = project.status || 'Completed';
    fClient.value = project.client || '';
    fContractor.value = project.contractor || '';
    fParticipation.value = project.participation || '';
    fYearStart.value = project.yearStart || '';
    fBudget.value = project.budget || '';
    setImagePreview(project.image || '');
    galleryImages = Array.isArray(project.images) ? [...project.images] : [];
    pendingGalleryFiles = [];
    renderGalleryThumbs();
    if (project.mapX != null && project.mapY != null) {
      pickerX = project.mapX;
      pickerY = project.mapY;
      mapPickerDot.style.left = pickerX + '%';
      mapPickerDot.style.top = pickerY + '%';
      mapPickerDot.classList.add('is-placed');
      // Load polyline points or legacy 2-point
      if (project.mapPoints && project.mapPoints.length >= 2) {
        pickerPoints = [...project.mapPoints];
        pickerX2 = pickerPoints[pickerPoints.length - 1][0];
        pickerY2 = pickerPoints[pickerPoints.length - 1][1];
        renderPickerPoints();
        mapPickerCoords.textContent = `${pickerPoints.length} σημεία γραμμής`;
      } else if (project.mapX2 != null && project.mapY2 != null) {
        pickerX2 = project.mapX2;
        pickerY2 = project.mapY2;
        pickerPoints = [[pickerX, pickerY], [pickerX2, pickerY2]];
        renderPickerPoints();
        mapPickerCoords.textContent = `2 σημεία γραμμής`;
      } else {
        pickerX2 = null; pickerY2 = null;
        pickerPoints = [];
        mapPickerDot2.classList.remove('is-placed');
        renderPickerPoints();
        mapPickerCoords.textContent = `X: ${pickerX.toFixed(1)}%  Y: ${pickerY.toFixed(1)}%`;
      }
    } else {
      pickerX = null; pickerY = null; pickerX2 = null; pickerY2 = null;
      mapPickerDot.classList.remove('is-placed');
      mapPickerDot2.classList.remove('is-placed');
      mapPickerLine.classList.remove('is-placed');
      mapPickerCoords.textContent = 'X: \u2014 Y: \u2014';
    }
    updatePickerHint();
  } else {
    editingId = null;
    modalTitle.textContent = 'Προσθήκη Έργου';
    fName.value = '';
    fNameEn.value = '';
    fYear.value = '';
    fTypology.value = 'Buildings';
    fLocation.value = '';
    fRegion.value = '';
    fDesc.value = '';
    fDescEn.value = '';
    fArchitect.value = '';
    fSize.value = '';
    fStatus.value = 'Completed';
    fClient.value = '';
    fContractor.value = '';
    fParticipation.value = '';
    fYearStart.value = '';
    fBudget.value = '';
    setImagePreview('');
    galleryImages = [];
    pendingGalleryFiles = [];
    renderGalleryThumbs();
    pickerX = null; pickerY = null; pickerX2 = null; pickerY2 = null;
    pickerPoints = [];
    mapPickerDot.classList.remove('is-placed');
    mapPickerDot2.classList.remove('is-placed');
    renderPickerPoints();
    mapPickerCoords.textContent = 'X: \u2014 Y: \u2014';
    // Reset zoom
    mpScale = 1; mpPanX = 0; mpPanY = 0; mpApply(false);
    updatePickerHint();
  }
  modalOverlay.classList.add('is-open');
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  editingId = null;
  pendingImageFile = null;
}

// ========== MAP PICKER ==========
const mapPickerInner = document.getElementById('mapPickerInner');
const mapPickerZoomIn = document.getElementById('mapPickerZoomIn');
const mapPickerZoomOut = document.getElementById('mapPickerZoomOut');
let mpScale = 1, mpPanX = 0, mpPanY = 0;

function mpApply(smooth) {
  mapPickerInner.style.transition = smooth ? 'transform 0.3s ease' : 'none';
  mapPickerInner.style.transform = `translate(${mpPanX}px, ${mpPanY}px) scale(${mpScale})`;
}
function mpClamp() {
  if (mpScale <= 1) { mpPanX = 0; mpPanY = 0; return; }
  const r = mapPickerContainer.getBoundingClientRect();
  const maxX = (r.width * (mpScale - 1)) / 2;
  const maxY = (r.height * (mpScale - 1)) / 2;
  mpPanX = Math.max(-maxX, Math.min(maxX, mpPanX));
  mpPanY = Math.max(-maxY, Math.min(maxY, mpPanY));
}

mapPickerZoomIn.addEventListener('click', (e) => {
  e.preventDefault();
  mpScale = Math.min(4, mpScale + 0.5);
  mpClamp(); mpApply(true);
});
mapPickerZoomOut.addEventListener('click', (e) => {
  e.preventDefault();
  mpScale = Math.max(1, mpScale - 0.5);
  mpClamp(); mpApply(true);
});

// Direction pad for panning when zoomed
document.getElementById('mapPickerNav').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-dir]');
  if (!btn || mpScale <= 1) return;
  e.preventDefault();
  const step = 40;
  const dir = btn.dataset.dir;
  if (dir === 'up')    mpPanY += step;
  if (dir === 'down')  mpPanY -= step;
  if (dir === 'left')  mpPanX += step;
  if (dir === 'right') mpPanX -= step;
  mpClamp(); mpApply(true);
});

function isLineMode() {
  return LINEAR_TYPES.includes(fTypology.value);
}

function renderPickerPoints() {
  // Remove old point markers
  mapPickerInner.querySelectorAll('.map-picker-polypoint').forEach(el => el.remove());
  // Remove old SVG line
  mapPickerInner.querySelector('.map-picker-svg')?.remove();

  if (pickerPoints.length < 1) {
    mapPickerLine.classList.remove('is-placed');
    return;
  }

  // Draw point markers
  pickerPoints.forEach((pt, i) => {
    const el = document.createElement('div');
    el.className = 'map-picker-polypoint';
    el.style.cssText = `position:absolute;width:6px;height:6px;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;left:${pt[0]}%;top:${pt[1]}%;background:${i === 0 ? 'var(--accent)' : '#4a9eff'};border:1.5px solid #fff;z-index:5;`;
    mapPickerInner.appendChild(el);
  });

  // Draw SVG polyline if 2+ points
  if (pickerPoints.length >= 2) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'map-picker-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
    const pts = pickerPoints.map(p => `${p[0]},${p[1]}`).join(' ');
    svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="rgba(255,115,30,0.7)" stroke-width="0.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    mapPickerInner.appendChild(svg);
  }

  // Update legacy fields for backward compat (first and last points)
  if (pickerPoints.length >= 1) {
    pickerX = pickerPoints[0][0];
    pickerY = pickerPoints[0][1];
    mapPickerDot.style.left = pickerX + '%';
    mapPickerDot.style.top = pickerY + '%';
    mapPickerDot.classList.add('is-placed');
  }
  if (pickerPoints.length >= 2) {
    const last = pickerPoints[pickerPoints.length - 1];
    pickerX2 = last[0]; pickerY2 = last[1];
    mapPickerDot2.style.left = last[0] + '%';
    mapPickerDot2.style.top = last[1] + '%';
    mapPickerDot2.classList.add('is-placed');
  }
}

function updatePickerHint() {
  if (!mapPickerHint) return;
  if (!isLineMode()) {
    mapPickerHint.textContent = '';
    return;
  }
  if (pickerPoints.length === 0) mapPickerHint.textContent = 'Κλικ για αρχή γραμμής';
  else mapPickerHint.textContent = `${pickerPoints.length} σημεία — Κλικ για προσθήκη, Διπλό-κλικ για τέλος`;
}

// When typology changes, update hint and reset points if switching modes
fTypology.addEventListener('change', () => {
  if (!isLineMode()) {
    pickerX2 = null; pickerY2 = null;
    pickerPoints = [];
    mapPickerDot2.classList.remove('is-placed');
    renderPickerPoints();
  }
  updatePickerHint();
});

function screenToMap(e) {
  const rect = mapPickerContainer.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  const offsetX = rect.width * (1 - mpScale) / 2 + mpPanX;
  const offsetY = rect.height * (1 - mpScale) / 2 + mpPanY;
  return {
    x: Math.round(((rawX - offsetX) / mpScale) / rect.width * 1000) / 10,
    y: Math.round(((rawY - offsetY) / mpScale) / rect.height * 1000) / 10,
  };
}

mapPickerContainer.addEventListener('click', (e) => {
  if (e.target.closest('.mp-btn')) return;
  const { x: cx, y: cy } = screenToMap(e);

  if (isLineMode()) {
    // Multi-point line mode: each click adds a point
    pickerPoints.push([cx, cy]);
    renderPickerPoints();
    mapPickerCoords.textContent = `${pickerPoints.length} σημεία — Τελευταίο: ${cx.toFixed(1)}%, ${cy.toFixed(1)}%`;
  } else {
    // Point mode: single click places dot
    pickerX = cx; pickerY = cy;
    pickerX2 = null; pickerY2 = null;
    pickerPoints = [];
    mapPickerDot.style.left = cx + '%'; mapPickerDot.style.top = cy + '%';
    mapPickerDot.classList.add('is-placed');
    mapPickerDot2.classList.remove('is-placed');
    renderPickerPoints();
    mapPickerCoords.textContent = `X: ${cx.toFixed(1)}%  Y: ${cy.toFixed(1)}%`;
  }
  updatePickerHint();
});

// Double-click in line mode: finish and reset (ready for new line)
mapPickerContainer.addEventListener('dblclick', (e) => {
  if (!isLineMode() || pickerPoints.length < 2) return;
  e.preventDefault();
  // Line is done — coordinates already saved via renderPickerPoints
  mapPickerCoords.textContent = `Γραμμή ολοκληρώθηκε — ${pickerPoints.length} σημεία`;
  mapPickerHint.textContent = 'Κλικ για επαναφορά';
});

// Reset line on next click after finishing
mapPickerContainer.addEventListener('click', (e) => {
  if (!isLineMode()) return;
  if (mapPickerHint && mapPickerHint.textContent.includes('επαναφορά') && !e.target.closest('.mp-btn')) {
    // This fires on the NEXT click after double-click finish
    // But dblclick already added a point — remove last duplicate
    if (pickerPoints.length >= 2) {
      // Don't reset — the dblclick handler already set the "done" state
      // The admin must explicitly reset by switching typology or clicking "clear"
    }
  }
}, { capture: true });

// ========== IMAGE UPLOAD ==========
function setImagePreview(imgValue) {
  fImage.value = imgValue || '';
  fImagePreview.style.backgroundImage = imgValue ? `url('${imgValue}')` : '';
  fImageDropzone.classList.toggle('has-image', !!imgValue);
  fImageRemove.style.display = imgValue ? '' : 'none';
}

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  pendingImageFile = file;
  // Show local preview
  const url = URL.createObjectURL(file);
  fImage.value = '__pending__';
  fImagePreview.style.backgroundImage = `url('${url}')`;
  fImageDropzone.classList.add('has-image');
  fImageRemove.style.display = '';
}

// Click to upload
fImageDropzone.addEventListener('click', () => fImageFile.click());
fImageFile.addEventListener('change', (e) => {
  if (e.target.files[0]) handleImageFile(e.target.files[0]);
  fImageFile.value = '';
});

// Drag and drop
fImageDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  fImageDropzone.classList.add('is-dragover');
});
fImageDropzone.addEventListener('dragleave', () => {
  fImageDropzone.classList.remove('is-dragover');
});
fImageDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  fImageDropzone.classList.remove('is-dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleImageFile(file);
});

// Remove image
fImageRemove.addEventListener('click', () => {
  pendingImageFile = null;
  setImagePreview('');
});

// ========== GALLERY UPLOAD ==========
function renderGalleryThumbs() {
  fGalleryThumbs.innerHTML = '';
  galleryImages.forEach((url, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-thumb';
    div.style.backgroundImage = `url('${url}')`;
    const btn = document.createElement('button');
    btn.className = 'gallery-thumb-remove';
    btn.textContent = '×';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      galleryImages.splice(i, 1);
      renderGalleryThumbs();
    });
    div.appendChild(btn);
    fGalleryThumbs.appendChild(div);
  });
  // Show pending files as local previews
  pendingGalleryFiles.forEach((file, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-thumb';
    div.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
    const btn = document.createElement('button');
    btn.className = 'gallery-thumb-remove';
    btn.textContent = '×';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pendingGalleryFiles.splice(i, 1);
      renderGalleryThumbs();
    });
    div.appendChild(btn);
    fGalleryThumbs.appendChild(div);
  });
  fGalleryPrompt.style.display = (galleryImages.length || pendingGalleryFiles.length) ? 'none' : '';
}

fGalleryDropzone.addEventListener('click', () => fGalleryFile.click());
fGalleryFile.addEventListener('change', (e) => {
  for (const file of e.target.files) {
    if (file.type.startsWith('image/')) pendingGalleryFiles.push(file);
  }
  renderGalleryThumbs();
  fGalleryFile.value = '';
});
fGalleryDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  fGalleryDropzone.classList.add('is-dragover');
});
fGalleryDropzone.addEventListener('dragleave', () => {
  fGalleryDropzone.classList.remove('is-dragover');
});
fGalleryDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  fGalleryDropzone.classList.remove('is-dragover');
  for (const file of e.dataTransfer.files) {
    if (file.type.startsWith('image/')) pendingGalleryFiles.push(file);
  }
  renderGalleryThumbs();
});

// ========== SAVE PROJECT ==========
modalSave.addEventListener('click', async () => {
  const name = fName.value.trim();
  const yearVal = fYear.value.trim();
  const yearStartVal = fYearStart.value.trim();
  const year = yearVal ? parseInt(yearVal, 10) : 0;
  const yearStart = yearStartVal ? parseInt(yearStartVal, 10) : null;

  if (!name) { fName.focus(); return; }
  // Need at least one year (start or end)
  if (!year && !yearStart) { fYearStart.focus(); return; }

  // Disable button while saving
  modalSave.disabled = true;
  modalSave.textContent = 'Αποθήκευση...';

  // Upload image if a new file was selected
  let imageUrl = fImage.value;
  if (pendingImageFile) {
    imageUrl = await uploadImage(pendingImageFile);
  }
  if (imageUrl === '__pending__') imageUrl = '';

  // Upload pending gallery files
  const uploadedGallery = [...galleryImages];
  for (const file of pendingGalleryFiles) {
    const url = await uploadImage(file);
    if (url) uploadedGallery.push(url);
  }

  const data = {
    name,
    nameEn: fNameEn.value.trim(),
    description: fDesc.value.trim(),
    descriptionEn: fDescEn.value.trim(),
    year: year || (yearStart || 0),
    typology: fTypology.value,
    location: fLocation.value.trim(),
    region: fRegion.value,
    architect: fArchitect.value.trim(),
    size: fSize.value.trim(),
    status: fStatus.value,
    dateCompleted: '',
    image: imageUrl,
    images: uploadedGallery,
    mapX: pickerX,
    mapY: pickerY,
    mapX2: pickerX2,
    mapY2: pickerY2,
    mapPoints: pickerPoints.length >= 2 ? pickerPoints : null,
    client: fClient.value.trim(),
    contractor: fContractor.value.trim(),
    participation: fParticipation.value.trim(),
    yearStart: yearStart,
    budget: fBudget.value ? parseFloat(fBudget.value) : null
  };

  const dbData = toDb(data);
  let res;

  try {
    if (editingId !== null) {
      dbData.id = editingId;
      res = await fetch('../api/projects.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbData)
      });
    } else {
      res = await fetch('../api/projects.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbData)
      });
    }

    if (!res.ok) {
      const err = await res.json();
      alert('Αποτυχία αποθήκευσης: ' + (err.error || 'Άγνωστο σφάλμα'));
      modalSave.disabled = false;
      modalSave.textContent = 'Αποθήκευση';
      return;
    }
  } catch (e) {
    alert('Αποτυχία αποθήκευσης: ' + e.message);
    modalSave.disabled = false;
    modalSave.textContent = 'Αποθήκευση';
    return;
  }

  // Reload from DB
  projects = await loadProjects();
  modalSave.disabled = false;
  modalSave.textContent = 'Αποθήκευση';
  closeModal();
  renderTable();
  updateStatus();
});

// ========== EDIT / DELETE ==========
tableBody.addEventListener('click', async (e) => {
  // Delete button takes priority
  const deleteBtn = e.target.closest('[data-delete]');
  if (deleteBtn) {
    e.stopPropagation();
    const id = parseInt(deleteBtn.getAttribute('data-delete'), 10);
    const project = projects.find(p => p.id === id);
    if (project && confirm(`Διαγραφή "${project.name}";`)) {
      try {
        const res = await fetch(`../api/projects.php?id=${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json();
          alert('Αποτυχία διαγραφής: ' + (err.error || 'Άγνωστο σφάλμα'));
          return;
        }
      } catch (e) {
        alert('Αποτυχία διαγραφής: ' + e.message);
        return;
      }
      projects = await loadProjects();
      renderTable();
      updateStatus();
    }
    return;
  }

  // Click on row or edit button opens modal
  const row = e.target.closest('.proj-row[data-edit]');
  if (row) {
    const id = parseInt(row.getAttribute('data-edit'), 10);
    const project = projects.find(p => p.id === id);
    if (project) openModal(project);
  }
});

// ========== PUBLISH TO SITE ==========
if (publishBtn) {
  publishBtn.addEventListener('click', async () => {
    publishBtn.disabled = true;
    publishBtn.textContent = 'Δημοσίευση...';
    try {
      const res = await fetch('../api/export.php');
      if (res.ok) {
        const data = await res.json();
        alert(`Δημοσιεύτηκαν ${data.count} έργα στη σελίδα.`);
      } else {
        const err = await res.json();
        alert('Αποτυχία δημοσίευσης: ' + (err.error || 'Άγνωστο σφάλμα'));
      }
    } catch (e) {
      alert('Αποτυχία δημοσίευσης: ' + e.message);
    }
    publishBtn.disabled = false;
    publishBtn.textContent = 'Δημοσίευση';
  });
}

// ========== EXPORT FILE ==========
exportBtn.addEventListener('click', () => {
  let output = '/**\n * THEMELI \u2014 Projects Data\n * Edit via admin panel or directly in this file.\n */\nconst PROJECTS = [\n';

  projects.forEach((p, i) => {
    output += '  {\n';
    output += `    id: ${p.id},\n`;
    output += `    name: ${JSON.stringify(p.name)},\n`;
    output += `    name_en: ${JSON.stringify(p.nameEn || '')},\n`;
    output += `    description: ${JSON.stringify(p.description || '')},\n`;
    output += `    description_en: ${JSON.stringify(p.descriptionEn || '')},\n`;
    output += `    year: ${p.year},\n`;
    output += `    typology: ${JSON.stringify(p.typology)},\n`;
    output += `    location: ${JSON.stringify(p.location || '')},\n`;
    output += `    region: ${JSON.stringify(p.region || '')},\n`;
    output += `    architect: ${JSON.stringify(p.architect || '')},\n`;
    output += `    size: ${JSON.stringify(p.size || '')},\n`;
    output += `    status: ${JSON.stringify(p.status || '')},\n`;
    output += `    dateCompleted: ${JSON.stringify(p.dateCompleted || '')},\n`;
    output += `    image: ${JSON.stringify(p.image || '')},\n`;
    output += `    images: ${JSON.stringify(p.images || [])},\n`;
    output += `    mapX: ${p.mapX != null ? p.mapX : 'null'},\n`;
    output += `    mapY: ${p.mapY != null ? p.mapY : 'null'},\n`;
    output += `    mapX2: ${p.mapX2 != null ? p.mapX2 : 'null'},\n`;
    output += `    mapY2: ${p.mapY2 != null ? p.mapY2 : 'null'},\n`;
    output += `    mapPoints: ${p.mapPoints ? JSON.stringify(p.mapPoints) : 'null'},\n`;
    output += `    client: ${JSON.stringify(p.client || '')},\n`;
    output += `    contractor: ${JSON.stringify(p.contractor || '')},\n`;
    output += `    participation: ${JSON.stringify(p.participation || '')},\n`;
    output += `    yearStart: ${p.yearStart != null ? p.yearStart : 'null'},\n`;
    output += `    budget: ${p.budget != null ? p.budget : 'null'}\n`;
    output += '  }' + (i < projects.length - 1 ? ',' : '') + '\n';
  });

  output += '];\n';

  const blob = new Blob([output], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects-data.js';
  a.click();
  URL.revokeObjectURL(url);
});

// ========== IMPORT FILE ==========
importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const code = evt.target.result.trim();
      let imported;
      const jsonMatch = code.match(/(?:const|var|let)\s+PROJECTS\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
      if (jsonMatch) {
        // Convert JS object syntax to JSON (unquoted keys → quoted keys)
        const jsonStr = jsonMatch[1]
          .replace(/\/\*[\s\S]*?\*\//g, '')        // remove block comments
          .replace(/\/\/.*/g, '')                   // remove line comments
          .replace(/,\s*([}\]])/g, '$1')            // remove trailing commas
          .replace(/(\s)(\w+)\s*:/g, '$1"$2":');    // quote unquoted keys
        imported = JSON.parse(jsonStr);
      } else {
        imported = JSON.parse(code);
      }

      if (!Array.isArray(imported) || imported.length === 0) {
        alert('Δεν βρέθηκε έγκυρος πίνακας PROJECTS στο αρχείο.');
        return;
      }

      // Insert each project via API
      const dbRows = imported.map(p => toDb(p));
      const res = await fetch('../api/projects.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbRows)
      });

      if (!res.ok) {
        const err = await res.json();
        alert('Αποτυχία εισαγωγής: ' + (err.error || 'Άγνωστο σφάλμα'));
        return;
      }

      projects = await loadProjects();
      renderTable();
      updateStatus();
      alert(`Εισήχθησαν ${imported.length} έργα επιτυχώς.`);
    } catch (err) {
      alert('Αποτυχία ανάγνωσης αρχείου: ' + err.message);
    }
    importFile.value = '';
  };
  reader.readAsText(file);
});

// ========== EVENTS ==========
addProjectBtn.addEventListener('click', () => openModal(null));
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
});

// ========== INIT ==========
(async function init() {
  projects = await loadProjects();
  renderTable();
  updateStatus();
})();
