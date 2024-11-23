const { ipcRenderer } = require('electron');

const windowsList = document.getElementById('windowsList');
const newWindowBtn = document.getElementById('newWindowBtn');
const windowModal = document.getElementById('windowModal');
const windowForm = document.getElementById('windowForm');
const cancelBtn = document.getElementById('cancelBtn');

const windows = new Map();

newWindowBtn.addEventListener('click', () => {
  windowModal.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  windowModal.classList.add('hidden');
  windowForm.reset();
});

windowForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(windowForm);
  
  const config = {
    url: formData.get('url'),
    width: parseInt(formData.get('width')),
    height: parseInt(formData.get('height')),
    alwaysOnTop: formData.get('alwaysOnTop') === 'on',
    transparent: formData.get('transparent') === 'on',
    ignoreMouseEvents: formData.get('ignoreMouseEvents') === 'on'
  };

  ipcRenderer.send('create-window', config);
  windowModal.classList.add('hidden');
  windowForm.reset();
});

function createWindowCard(id, config) {
  const card = document.createElement('div');
  card.className = 'bg-gray-800 p-4 rounded-lg';
  card.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">${config.url}</h3>
      <button class="text-red-500 hover:text-red-600" onclick="closeWindow('${id}')">
        Cerrar
      </button>
    </div>
    <div class="space-y-2">
      <label class="flex items-center">
        <input type="checkbox" ${config.alwaysOnTop ? 'checked' : ''} 
               onchange="updateWindow('${id}', 'alwaysOnTop', this.checked)"
               class="mr-2">
        Siempre Visible
      </label>
      <label class="flex items-center">
        <input type="checkbox" ${config.transparent ? 'checked' : ''} 
               onchange="updateWindow('${id}', 'transparent', this.checked)"
               class="mr-2">
        Transparente
      </label>
      <label class="flex items-center">
        <input type="checkbox" ${config.ignoreMouseEvents ? 'checked' : ''} 
               onchange="updateWindow('${id}', 'ignoreMouseEvents', this.checked)"
               class="mr-2">
        Ignorar Mouse
      </label>
    </div>
  `;
  return card;
}

window.updateWindow = (id, property, value) => {
  const config = windows.get(id);
  config[property] = value;
  windows.set(id, config);
  ipcRenderer.send('update-window', { id, config });
};

window.closeWindow = (id) => {
  const window = windows.get(id);
  if (window) {
    ipcRenderer.send('close-window', id);
    windows.delete(id);
    const card = document.querySelector(`[data-window-id="${id}"]`);
    if (card) {
      card.remove();
    }
  }
};

ipcRenderer.on('window-created', (event, { id, config }) => {
  windows.set(id, config);
  const card = createWindowCard(id, config);
  card.setAttribute('data-window-id', id);
  windowsList.appendChild(card);
});

ipcRenderer.on('window-closed', (event, id) => {
  windows.delete(id);
  const card = document.querySelector(`[data-window-id="${id}"]`);
  if (card) {
    card.remove();
  }
});