// Endpoint Base Simulado de um Backend NoSQL/JSON em nuvem
const BASE_JSON_API = "https://jsonplaceholder.typicode.com"; 

/* --- MOTOR ADVANCED TANSTACK QUERY (CACHE, ESTADOS & MUTATION) --- */
class TanStackQueryEngine {
  constructor() {
    this.cache = new Map();
    this.listeners = [];
  }

  fetchQuery(queryKey, fetchFn, onStateChange) {
    const cacheKey = JSON.stringify(queryKey);
    if (this.cache.has(cacheKey)) {
      onStateChange({ data: this.cache.get(cacheKey), isLoading: false, isError: false, isFetching: true });
    } else {
      onStateChange({ data: null, isLoading: true, isError: false, isFetching: true });
    }

    fetchFn()
      .then(data => {
        this.cache.set(cacheKey, data);
        onStateChange({ data, isLoading: false, isError: false, isFetching: false });
        this._notify(cacheKey);
      })
      .catch(err => {
        onStateChange({ data: null, isLoading: false, isError: true, isFetching: false, error: err });
      });
  }

  mutate(mutationFn, options = {}) {
    if (options.onMutate) options.onMutate();
    mutationFn()
      .then(data => {
        if (options.onSuccess) options.onSuccess(data);
      })
      .catch(err => {
        if (options.onError) options.onError(err);
      });
  }

  invalidateQueries(queryKey) {
    const cacheKey = JSON.stringify(queryKey);
    this.cache.delete(cacheKey);
    this.listeners.forEach(l => {
      if (l.key === cacheKey) l.refetch();
    });
  }

  _notify(cacheKey) {
    this.listeners.forEach(l => {
      if (l.key === cacheKey) l.refetch();
    });
  }
}

const queryClient = new TanStackQueryEngine();

/* --- COMPACT BASE DE DADOS GLOBAL REMOTA (Armazenamento Simulado Cloud JSON) --- */
// Simulador Cloud JSON Multi-dispositivo via Network Store (Evitando SQL por completo)
const CloudJSONStorage = {
  async getGlobalCatalog() {
    let local = localStorage.getItem('cloud_global_catalog');
    if (!local) {
      const initial = [
        { id: "1", type: "filmes", title: "Interestelar", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600", meta_data: { director: "Christopher Nolan", duration: "169 min" } },
        { id: "2", type: "musicas", title: "Bohemian Rhapsody", poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600", meta_data: { artist: "Queen", album: "A Night at the Opera" } }
      ];
      localStorage.setItem('cloud_global_catalog', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(local);
  },

  async saveGlobalMedia(mediaItem) {
    // Simulação de POST HTTP em API Restful NoSQL externa
    await fetch(`${BASE_JSON_API}/posts`, { method: 'POST', body: JSON.stringify(mediaItem) });
    const catalog = await this.getGlobalCatalog();
    mediaItem.id = String(catalog.length + 1);
    catalog.push(mediaItem);
    localStorage.setItem('cloud_global_catalog', JSON.stringify(catalog));
    return mediaItem;
  },

  async getUserCollection(emailBase64) {
    const data = localStorage.getItem(`cloud_user_${emailBase64}`);
    return data ? JSON.parse(data) : [];
  },

  async saveUserCollection(emailBase64, collection) {
    // Sincroniza via PUT na nuvem NoSQL JSON
    await fetch(`${BASE_JSON_API}/posts/1`, { method: 'PUT', body: JSON.stringify(collection) });
    localStorage.setItem(`cloud_user_${emailBase64}`, JSON.stringify(collection));
  }
};

/* --- CORE APPLICATION CONTROLLER --- */
class App {
  constructor() {
    this.user = null;
    this.currentRoute = 'all';
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.setupRouter();
    this.checkActiveSession();
  }

  cacheElements() {
    this.grid = document.getElementById('global-catalog-grid');
    this.authWidget = document.getElementById('auth-widget-container');
    this.profileView = document.getElementById('profile-view');
    this.btnOpenCreate = document.getElementById('btn-open-create-media');
    this.createModal = document.getElementById('create-media-modal');
    this.createForm = document.getElementById('create-media-form');
    this.mediaTypeSelect = document.getElementById('media-type-select');
    this.dynamicFields = document.getElementById('dynamic-fields-container');
    this.errorBanner = document.getElementById('error-banner');
    this.statusIndicator = document.getElementById('query-status-indicator');
  }

  bindEvents() {
    this.mediaTypeSelect.addEventListener('change', () => this.renderDynamicFields());
    this.btnOpenCreate.addEventListener('click', () => this.createModal.classList.remove('hidden'));
    document.getElementById('btn-close-create').addEventListener('click', () => this.createModal.classList.add('hidden'));
    document.getElementById('btn-close-auth').addEventListener('click', () => document.getElementById('auth-modal').classList.add('hidden'));
    
    this.createForm.addEventListener('submit', (e) => this.handleCreateMediaSubmit(e));
    document.getElementById('auth-form').addEventListener('submit', (e) => this.handleAuthSubmit(e));
    document.getElementById('btn-retry-fetch').addEventListener('click', () => this.fetchCatalog());

    this.grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-add-to-list');
      if (btn) this.handleAddItemMutation(btn.dataset.id);
    });

    this.profileView.addEventListener('change', (e) => {
      if (e.target.classList.contains('md3-inline-input')) this.handleUpdateProgressMutation(e.target);
    });
  }

  checkActiveSession() {
    const session = localStorage.getItem('active_user_session');
    if (session) {
      this.user = JSON.parse(session);
      this.btnOpenCreate.classList.remove('hidden');
    }
    this.syncAuthUI();
  }

  handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const emailBase64 = btoa(email).replace(/=/g, ""); // Token NoSQL universal limpo

    this.user = { email, token: emailBase64 };
    localStorage.setItem('active_user_session', JSON.stringify(this.user));
    document.getElementById('auth-modal').classList.add('hidden');
    this.btnOpenCreate.classList.remove('hidden');
    
    this.syncAuthUI();
    queryClient.invalidateQueries(['profile-list']);
  }

  renderDynamicFields() {
    const type = this.mediaTypeSelect.value;
    const labels = {
      filmes: ['Diretor', 'Duração (Ex: 130 min)'],
      livros: ['Autor', 'Número de Páginas'],
      musicas: ['Artista / Banda', 'Álbum'],
      jogos: ['Desenvolvedora', 'Tempo Estimado']
    };

    if (labels[type]) {
      this.dynamicFields.innerHTML = `
        <div class="md3-text-field"><input type="text" id="meta-1" required placeholder=" "><label>${labels[type][0]}</label></div>
        <div class="md3-text-field"><input type="text" id="meta-2" required placeholder=" "><label>${labels[type][1]}</label></div>
      `;
    }
  }

  handleCreateMediaSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('media-title').value;
    const poster = document.getElementById('media-poster').value;
    const type = this.mediaTypeSelect.value;

    const meta_data = {};
    const m1 = document.getElementById('meta-1').value;
    const m2 = document.getElementById('meta-2').value;

    if (type === 'filmes') { meta_data.director = m1; meta_data.duration = m2; }
    else if (type === 'livros') { meta_data.author = m1; meta_data.pages = m2; }
    else if (type === 'musicas') { meta_data.artist = m1; meta_data.album = m2; }
    else if (type === 'jogos') { meta_data.developer = m1; meta_data.time = m2; }

    queryClient.mutate(async () => {
      return await CloudJSONStorage.saveGlobalMedia({ title, poster, type, meta_data });
    }, {
      onSuccess: () => {
        this.createModal.classList.add('hidden');
        this.createForm.reset();
        this.dynamicFields.innerHTML = '';
        queryClient.invalidateQueries(['catalog', this.currentRoute]);
      }
    });
  }

  handleAddItemMutation(mediaId) {
    if (!this.user) {
      document.getElementById('auth-modal').classList.remove('hidden');
      return;
    }

    queryClient.mutate(async () => {
      const catalog = await CloudJSONStorage.getGlobalCatalog();
      const item = catalog.find(m => m.id === mediaId);
      const userList = await CloudJSONStorage.getUserCollection(this.user.token);
      
      if (!userList.some(m => m.id === mediaId)) {
        userList.push({ ...item, user_status: 'Não iniciado', user_rating: '5', user_time: '' });
        await CloudJSONStorage.saveUserCollection(this.user.token, userList);
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile-list']);
        this.fetchProfileList();
      }
    });
  }

  handleUpdateProgressMutation(inputElement) {
    const id = inputElement.dataset.id;
    const field = inputElement.dataset.field;
    const value = inputElement.value;

    queryClient.mutate(async () => {
      const userList = await CloudJSONStorage.getUserCollection(this.user.token);
      const item = userList.find(m => m.id === id);
      if (item) {
        item[field] = value;
        await CloudJSONStorage.saveUserCollection(this.user.token, userList);
      }
    }, {
      onSuccess: () => queryClient.invalidateQueries(['profile-list'])
    });
  }

  setupRouter() {
    const handle = () => {
      const hash = window.location.hash || '#/';
      this.currentRoute = hash === '#/' ? 'all' : hash.replace('#/', '');
      document.querySelectorAll('.md3-tab-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === hash));
      this.fetchCatalog();
    };
    window.addEventListener('hashchange', handle);
    window.addEventListener('load', handle);
  }

  fetchCatalog() {
    this.statusIndicator.textContent = "A ler Nuvem...";
    this.errorBanner.classList.add('hidden');

    queryClient.fetchQuery(['catalog', this.currentRoute], async () => {
      const data = await CloudJSONStorage.getGlobalCatalog();
      return this.currentRoute === 'all' ? data : data.filter(m => m.type === this.currentRoute);
    }, (state) => {
      if (state.isLoading) this.grid.innerHTML = '<p>Buscando repositório JSON dinâmico...</p>';
      if (state.isError) this.errorBanner.classList.remove('hidden');
      if (state.data) {
        this.grid.innerHTML = state.data.map(m => `
          <article class="md3-media-card">
            <div class="md3-card-poster-wrapper"><img src="${m.poster}" class="md3-card-poster" /></div>
            <div class="md3-card-body">
              <h3 class="md3-card-title">${m.title}</h3>
              <p style="font-size:12px; color:var(--md-sys-color-on-surface-variant);">
                ${m.type === 'filmes' ? `Realizador: ${m.meta_data.director}` : m.type === 'livros' ? `Autor: ${m.meta_data.author}` : `Editor/Artista: ${m.meta_data.artist || m.meta_data.developer}`}
              </p>
              <div class="md3-card-actions">
                <button class="md3-btn md3-btn-filled btn-add-to-list" data-id="${m.id}">
                  <span class="material-symbols-outlined">playlist_add</span> Adicionar
                </button>
              </div>
            </div>
          </article>
        `).join('');
      }
      if (!state.isFetching) this.statusIndicator.textContent = "Sincronizado";
    });
  }

  fetchProfileList() {
    if (!this.user) return;
    queryClient.fetchQuery(['profile-list'], async () => {
      return await CloudJSONStorage.getUserCollection(this.user.token);
    }, (state) => {
      if (state.data) this.renderProfile(state.data);
    });
  }

  renderProfile(list) {
    this.profileView.innerHTML = `
      <h2 class="md3-headline">Coleção de Perfil Protegida</h2>
      <p style="color:var(--md-sys-color-primary); font-size:13px;">Conta vinculada em nuvem: ${this.user.email}</p>
      <div class="md3-cards-grid">
        ${list.length === 0 ? '<p>Nenhum item guardado na sua conta.</p>' : list.map(m => `
          <div class="md3-media-card" style="padding:16px; background:var(--md-sys-color-surface);">
            <h4 class="md3-card-title">${m.title}</h4>
            <div class="md3-progress-row">
              <div>
                <label style="font-size:9px;">STATUS</label>
                <select data-id="${m.id}" data-field="user_status" class="md3-inline-input">
                  <option value="Não iniciado" ${m.user_status === 'Não iniciado' ? 'selected' : ''}>Não Iniciado</option>
                  <option value="Consumindo" ${m.user_status === 'Consumindo' ? 'selected' : ''}>Consumindo</option>
                  <option value="Concluído" ${m.user_status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
              </div>
              <div>
                <label style="font-size:9px;">AVALIAÇÃO</label>
                <input type="number" min="1" max="5" data-id="${m.id}" data-field="user_rating" value="${m.user_rating}" class="md3-inline-input" />
              </div>
              <div>
                <label style="font-size:9px;">INVESTIDO</label>
                <input type="text" data-id="${m.id}" data-field="user_time" value="${m.user_time || ''}" placeholder="Ex: 12h" class="md3-inline-input" />
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  syncAuthUI() {
    if (this.user) {
      this.authWidget.innerHTML = `<button id="btn-logout" class="md3-btn md3-btn-text">Sair (${this.user.email})</button>`;
      document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('active_user_session');
        this.user = null;
        this.btnOpenCreate.classList.add('hidden');
        this.syncAuthUI();
      });
      this.profileView.classList.remove('hidden');
      this.fetchProfileList();
    } else {
      this.authWidget.innerHTML = `<button id="btn-login" class="md3-btn md3-btn-filled">Entrar</button>`;
      document.getElementById('btn-login').addEventListener('click', () => document.getElementById('auth-modal').classList.remove('hidden'));
      this.profileView.classList.add('hidden');
    }
  }
}

new App();