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
const fLocation = document.getElementById('fLocation');
const fRegion = document.getElementById('fRegion');
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

// ========== API HELPERS ==========

// Map DB snake_case → JS camelCase
function fromDb(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    year: row.year,
    typology: row.typology,
    location: row.location || '',
    region: row.region || '',
    architect: row.architect || '',
    size: row.size || '',
    status: row.status || 'Completed',
    dateCompleted: row.date_completed || '',
    image: row.image_url || '',
    mapX: row.map_x,
    mapY: row.map_y
  };
}

// Map JS camelCase → DB snake_case
function toDb(data) {
  return {
    name: data.name,
    description: data.description || '',
    year: data.year,
    typology: data.typology,
    location: data.location || '',
    region: data.region || '',
    architect: data.architect || '',
    size: data.size || '',
    status: data.status || 'Completed',
    date_completed: data.dateCompleted || '',
    image_url: data.image || '',
    map_x: data.mapX,
    map_y: data.mapY
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
  statusEl.textContent = `${projects.length} projects in database`;
  statusEl.className = 'admin-status is-published';
}

// ========== RENDER TABLE ==========
function renderTable() {
  tableBody.innerHTML = '';
  emptyState.style.display = projects.length === 0 ? '' : 'none';

  projects.forEach(p => {
    const tr = document.createElement('tr');
    const imgStyle = p.image ? `background-image:url('${p.image}')` : '';
    const mapStr = (p.mapX != null && p.mapY != null)
      ? `${p.mapX.toFixed(1)}%, ${p.mapY.toFixed(1)}%`
      : '\u2014';

    tr.innerHTML = `
      <td><div class="thumb" style="${imgStyle}"></div></td>
      <td class="cell-name">${esc(p.name)}</td>
      <td>${p.year}</td>
      <td>${esc(p.typology)}</td>
      <td>${esc(p.location)}</td>
      <td>${esc(p.region)}</td>
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
  pendingImageFile = null;
  if (project) {
    editingId = project.id;
    modalTitle.textContent = 'Edit Project';
    fName.value = project.name;
    fYear.value = project.year;
    fTypology.value = project.typology;
    fLocation.value = project.location;
    fRegion.value = project.region || '';
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
    fRegion.value = '';
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
  pendingImageFile = null;
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

// ========== SAVE PROJECT ==========
modalSave.addEventListener('click', async () => {
  const name = fName.value.trim();
  const year = parseInt(fYear.value, 10);

  if (!name) { fName.focus(); return; }
  if (!year || year < 1900) { fYear.focus(); return; }

  // Disable button while saving
  modalSave.disabled = true;
  modalSave.textContent = 'Saving...';

  // Upload image if a new file was selected
  let imageUrl = fImage.value;
  if (pendingImageFile) {
    imageUrl = await uploadImage(pendingImageFile);
  }
  if (imageUrl === '__pending__') imageUrl = '';

  const data = {
    name,
    description: fDesc.value.trim(),
    year,
    typology: fTypology.value,
    location: fLocation.value.trim(),
    region: fRegion.value,
    architect: fArchitect.value.trim(),
    size: fSize.value.trim(),
    status: fStatus.value,
    dateCompleted: fDateCompleted.value.trim(),
    image: imageUrl,
    mapX: pickerX,
    mapY: pickerY
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
      alert('Save failed: ' + (err.error || 'Unknown error'));
      modalSave.disabled = false;
      modalSave.textContent = 'Save Project';
      return;
    }
  } catch (e) {
    alert('Save failed: ' + e.message);
    modalSave.disabled = false;
    modalSave.textContent = 'Save Project';
    return;
  }

  // Reload from DB
  projects = await loadProjects();
  modalSave.disabled = false;
  modalSave.textContent = 'Save Project';
  closeModal();
  renderTable();
  updateStatus();
});

// ========== EDIT / DELETE ==========
tableBody.addEventListener('click', async (e) => {
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
      try {
        const res = await fetch(`../api/projects.php?id=${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json();
          alert('Delete failed: ' + (err.error || 'Unknown error'));
          return;
        }
      } catch (e) {
        alert('Delete failed: ' + e.message);
        return;
      }
      projects = await loadProjects();
      renderTable();
      updateStatus();
    }
  }
});

// ========== PUBLISH TO SITE ==========
if (publishBtn) {
  publishBtn.addEventListener('click', async () => {
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing...';
    try {
      const res = await fetch('../api/export.php');
      if (res.ok) {
        const data = await res.json();
        alert(`Published ${data.count} projects to site.`);
      } else {
        const err = await res.json();
        alert('Publish failed: ' + (err.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Publish failed: ' + e.message);
    }
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publish to Site';
  });
}

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
    output += `    region: ${JSON.stringify(p.region || '')},\n`;
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
        alert('No valid PROJECTS array found in this file.');
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
        alert('Import failed: ' + (err.error || 'Unknown error'));
        return;
      }

      projects = await loadProjects();
      renderTable();
      updateStatus();
      alert(`Imported ${imported.length} projects successfully.`);
    } catch (err) {
      alert('Failed to parse file: ' + err.message);
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
