/**
 * THEMELI — Admin Panel Logic
 * Saves to localStorage so the live site updates instantly.
 */

const STORAGE_KEY = 'themeli_projects';

// Load from localStorage first, fall back to the JS file
function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(PROJECTS));
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  updateStatus();
}

let projects = loadProjects();
let editingId = null;

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
const fLocation = document.getElementById('fLocation');
const fDesc = document.getElementById('fDesc');
const fArchitect = document.getElementById('fArchitect');
const fSize = document.getElementById('fSize');
const fStatus = document.getElementById('fStatus');
const fDateCompleted = document.getElementById('fDateCompleted');
const fImage = document.getElementById('fImage');
const fImagePreview = document.getElementById('fImagePreview');
const fImageFile = document.getElementById('fImageFile');
const fImageDropzone = document.getElementById('fImageDropzone');
const fImagePrompt = document.getElementById('fImagePrompt');
const fImageRemove = document.getElementById('fImageRemove');

// Map picker
const mapPickerContainer = document.getElementById('mapPickerContainer');
const mapPickerDot = document.getElementById('mapPickerDot');
const mapPickerCoords = document.getElementById('mapPickerCoords');
let pickerX = null;
let pickerY = null;

// Asset paths are relative to root; admin is in /admin subfolder
function assetUrl(path) {
  return path ? `../${path}` : '';
}

// ========== STATUS ==========
function updateStatus() {
  if (!statusEl) return;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    statusEl.textContent = 'Published — live on site';
    statusEl.className = 'admin-status is-published';
  } else {
    statusEl.textContent = 'Using default data';
    statusEl.className = 'admin-status';
  }
}

// ========== RENDER TABLE ==========
function renderTable() {
  tableBody.innerHTML = '';
  emptyState.style.display = projects.length === 0 ? '' : 'none';

  projects.forEach(p => {
    const tr = document.createElement('tr');
    const imgSrc = p.image && p.image.startsWith('data:') ? p.image : assetUrl(p.image);
    const imgStyle = p.image ? `background-image:url('${imgSrc}')` : '';
    const mapStr = (p.mapX != null && p.mapY != null)
      ? `${p.mapX.toFixed(1)}%, ${p.mapY.toFixed(1)}%`
      : '\u2014';

    tr.innerHTML = `
      <td><div class="thumb" style="${imgStyle}"></div></td>
      <td class="cell-name">${esc(p.name)}</td>
      <td>${p.year}</td>
      <td>${esc(p.typology)}</td>
      <td>${esc(p.location)}</td>
      <td class="cell-map-pos">${mapStr}</td>
      <td>
        <div class="cell-actions">
          <button class="btn btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-delete="${p.id}">Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ========== MODAL ==========
function openModal(project) {
  if (project) {
    editingId = project.id;
    modalTitle.textContent = 'Edit Project';
    fName.value = project.name;
    fYear.value = project.year;
    fTypology.value = project.typology;
    fLocation.value = project.location;
    fDesc.value = project.description || '';
    fArchitect.value = project.architect || '';
    fSize.value = project.size || '';
    fStatus.value = project.status || 'Completed';
    fDateCompleted.value = project.dateCompleted || '';
    setImagePreview(project.image || '');
    if (project.mapX != null && project.mapY != null) {
      pickerX = project.mapX;
      pickerY = project.mapY;
      mapPickerDot.style.left = pickerX + '%';
      mapPickerDot.style.top = pickerY + '%';
      mapPickerDot.classList.add('is-placed');
      mapPickerCoords.textContent = `X: ${pickerX.toFixed(1)}%  Y: ${pickerY.toFixed(1)}%`;
    } else {
      pickerX = null;
      pickerY = null;
      mapPickerDot.classList.remove('is-placed');
      mapPickerCoords.textContent = 'X: \u2014 Y: \u2014';
    }
  } else {
    editingId = null;
    modalTitle.textContent = 'Add Project';
    fName.value = '';
    fYear.value = '';
    fTypology.value = 'Buildings';
    fLocation.value = '';
    fDesc.value = '';
    fArchitect.value = '';
    fSize.value = '';
    fStatus.value = 'Completed';
    fDateCompleted.value = '';
    setImagePreview('');
    pickerX = null;
    pickerY = null;
    mapPickerDot.classList.remove('is-placed');
    mapPickerCoords.textContent = 'X: \u2014 Y: \u2014';
  }
  modalOverlay.classList.add('is-open');
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  editingId = null;
}

// ========== MAP PICKER ==========
mapPickerContainer.addEventListener('click', (e) => {
  const rect = mapPickerContainer.getBoundingClientRect();
  pickerX = ((e.clientX - rect.left) / rect.width) * 100;
  pickerY = ((e.clientY - rect.top) / rect.height) * 100;
  pickerX = Math.round(pickerX * 10) / 10;
  pickerY = Math.round(pickerY * 10) / 10;

  mapPickerDot.style.left = pickerX + '%';
  mapPickerDot.style.top = pickerY + '%';
  mapPickerDot.classList.add('is-placed');
  mapPickerCoords.textContent = `X: ${pickerX.toFixed(1)}%  Y: ${pickerY.toFixed(1)}%`;
});

// ========== IMAGE UPLOAD ==========
function setImagePreview(imgValue) {
  fImage.value = imgValue || '';
  const src = imgValue && !imgValue.startsWith('data:') ? assetUrl(imgValue) : imgValue;
  fImagePreview.style.backgroundImage = imgValue ? `url('${src}')` : '';
  fImageDropzone.classList.toggle('has-image', !!imgValue);
  fImageRemove.style.display = imgValue ? '' : 'none';
}

function processImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  // Resize to max 800px wide to keep localStorage manageable
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 800;
      const maxH = 600;
      let w = img.width;
      let h = img.height;
      if (w > maxW) { h = h * (maxW / w); w = maxW; }
      if (h > maxH) { w = w * (maxH / h); h = maxH; }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      setImagePreview(dataUrl);
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// Click to upload
fImageDropzone.addEventListener('click', () => fImageFile.click());
fImageFile.addEventListener('change', (e) => {
  if (e.target.files[0]) processImageFile(e.target.files[0]);
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
  if (file) processImageFile(file);
});

// Remove image
fImageRemove.addEventListener('click', () => setImagePreview(''));

// ========== SAVE PROJECT ==========
modalSave.addEventListener('click', () => {
  const name = fName.value.trim();
  const year = parseInt(fYear.value, 10);

  if (!name) { fName.focus(); return; }
  if (!year || year < 1900) { fYear.focus(); return; }

  const data = {
    name,
    description: fDesc.value.trim(),
    year,
    typology: fTypology.value,
    location: fLocation.value.trim(),
    architect: fArchitect.value.trim(),
    size: fSize.value.trim(),
    status: fStatus.value,
    dateCompleted: fDateCompleted.value.trim(),
    image: fImage.value.trim(),
    mapX: pickerX,
    mapY: pickerY
  };

  if (editingId !== null) {
    const idx = projects.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], ...data };
    }
  } else {
    const maxId = projects.reduce((max, p) => Math.max(max, p.id), 0);
    projects.push({ id: maxId + 1, ...data });
  }

  saveProjects();
  closeModal();
  renderTable();
});

// ========== EDIT / DELETE ==========
tableBody.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const deleteBtn = e.target.closest('[data-delete]');

  if (editBtn) {
    const id = parseInt(editBtn.getAttribute('data-edit'), 10);
    const project = projects.find(p => p.id === id);
    if (project) openModal(project);
  }

  if (deleteBtn) {
    const id = parseInt(deleteBtn.getAttribute('data-delete'), 10);
    const project = projects.find(p => p.id === id);
    if (project && confirm(`Delete "${project.name}"?`)) {
      projects = projects.filter(p => p.id !== id);
      saveProjects();
      renderTable();
    }
  }
});

// ========== PUBLISH (save & confirm) ==========
publishBtn.addEventListener('click', () => {
  saveProjects();
  publishBtn.textContent = 'Published!';
  publishBtn.style.borderColor = '#6abf69';
  publishBtn.style.color = '#6abf69';
  setTimeout(() => {
    publishBtn.textContent = 'Save & Publish';
    publishBtn.style.borderColor = '';
    publishBtn.style.color = '';
  }, 2000);
});

// ========== IMPORT FILE ==========
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      // Execute the JS to extract the PROJECTS array
      const code = evt.target.result;
      const fn = new Function(code + '\nreturn PROJECTS;');
      const imported = fn();

      if (!Array.isArray(imported) || imported.length === 0) {
        alert('No valid PROJECTS array found in this file.');
        return;
      }

      projects = imported;
      saveProjects();
      renderTable();
      alert(`Imported ${projects.length} projects successfully.`);
    } catch (err) {
      alert('Failed to parse file: ' + err.message);
    }
    // Reset input so the same file can be re-imported
    importFile.value = '';
  };
  reader.readAsText(file);
});

// ========== EXPORT FILE ==========
exportBtn.addEventListener('click', () => {
  let output = '/**\n * THEMELI \u2014 Projects Data\n * Edit via admin panel or directly in this file.\n */\nconst PROJECTS = [\n';

  projects.forEach((p, i) => {
    output += '  {\n';
    output += `    id: ${p.id},\n`;
    output += `    name: ${JSON.stringify(p.name)},\n`;
    output += `    description: ${JSON.stringify(p.description || '')},\n`;
    output += `    year: ${p.year},\n`;
    output += `    typology: ${JSON.stringify(p.typology)},\n`;
    output += `    location: ${JSON.stringify(p.location || '')},\n`;
    output += `    architect: ${JSON.stringify(p.architect || '')},\n`;
    output += `    size: ${JSON.stringify(p.size || '')},\n`;
    output += `    status: ${JSON.stringify(p.status || '')},\n`;
    output += `    dateCompleted: ${JSON.stringify(p.dateCompleted || '')},\n`;
    output += `    image: ${JSON.stringify(p.image || '')},\n`;
    output += `    mapX: ${p.mapX != null ? p.mapX : 'null'},\n`;
    output += `    mapY: ${p.mapY != null ? p.mapY : 'null'}\n`;
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

// ========== EVENTS ==========
addProjectBtn.addEventListener('click', () => openModal(null));
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
});

// Init
renderTable();
updateStatus();
