const socket = io();
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
  socket.emit('create-window', config);
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
  const currentConfig = windows.get(id) || {};
  const newConfig = { ...currentConfig };
  newConfig[property] = value;
  
  // Actualizar el mapa local antes de enviar
  windows.set(id, newConfig);
  
  // Enviar la configuración completa, no solo la propiedad actualizada
  socket.emit('update-window', { id, config: newConfig });
};

window.closeWindow = (id) => {
  socket.emit('close-window', id);
};

socket.on('window-created', ({ id, config }) => {
  windows.set(id, config);
  const card = createWindowCard(id, config);
  card.setAttribute('data-window-id', id);
  windowsList.appendChild(card);
});

socket.on('window-closed', (id) => {
  windows.delete(id);
  const card = document.querySelector(`[data-window-id="${id}"]`);
  if (card) {
    card.remove();
  }
});

socket.on('window-updated', ({ id, config }) => {
  const idnumber = typeof id === 'number' ? id : Number(id);
  // Actualizar el mapa con la nueva configuración
  windows.set(idnumber, config);
  // Reemplazar la tarjeta existente con la nueva
  const existingCard = document.querySelector(`[data-window-id="${id}"]`);
  const newCard = createWindowCard(idnumber, config);
  newCard.setAttribute('data-window-id', idnumber);
  console.log("window-updated",idnumber, config, typeof idnumber, typeof config);
  if(!existingCard)windowsList.appendChild(newCard);
  if (existingCard)existingCard.replaceWith(newCard);
});
socket.on('window-list', (windowList) => {
  windowList.forEach(({ id, ...config }) => {
    console.log("window-list",id, config);
    windows.set(id, config);
    const card = createWindowCard(id, config);
    card.setAttribute('data-window-id', id);
    windowsList.appendChild(card);
  });
});
// Cargar ventanas existentes al iniciar
/* fetch('/api/windows')
.then(response => response.json())
.then(windowslist => {
  windowslist.forEach(({ id, ...config }) => {
    console.log("windowsList",id, config);
    windows.set(id, config);
    const card = createWindowCard(id, config);
    card.setAttribute('data-window-id', id);
    windowsList.appendChild(card);
  });
});
 */