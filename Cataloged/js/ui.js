// ui.js
import { createMedia } from './data-model.js';
import { Storage } from './storage.js';
import { recommend } from './suggestions.js';

const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

export function initUI(app){
  const template = qs('#media-card-template');
  const listEl = qs('#media-list');
  const modal = qs('#modal');
  const form = qs('#media-form');
  const modalTitle = qs('#modal-title');
  const searchInput = qs('#search');
  const filterCategory = qs('#filter-category');
  const recList = qs('#rec-list');

  function openModal(editItem){
    modal.setAttribute('aria-hidden','false');
    modalTitle.textContent = editItem ? 'Editar obra' : 'Cadastrar obra';
    form.dataset.editId = editItem?.id || '';
    form.title.value = editItem?.title || '';
    form.category.value = editItem?.category || 'filme';
    form.description.value = editItem?.description || '';
    form.image.value = editItem?.image || '';
    form.tags.value = (editItem?.tags || []).join(', ');
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    form.reset();
    delete form.dataset.editId;
  }

  qs('#btn-new-media').addEventListener('click', ()=> openModal());
  qs('#modal-close').addEventListener('click', closeModal);
  qs('#btn-cancel').addEventListener('click', closeModal);

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const id = form.dataset.editId || crypto.randomUUID();
    const item = createMedia({
      id,
      title: form.title.value.trim(),
      category: form.category.value,
      description: form.description.value.trim(),
      image: form.image.value.trim() || 'assets/placeholder.png',
      tags: form.tags.value.split(',').map(t=>t.trim()).filter(Boolean)
    });
    app.saveOrUpdate(item);
    closeModal();
    render();
  });

  qs('#btn-clear').addEventListener('click', ()=>{
    if(confirm('Limpar todos os dados locais?')) {
      Storage.clearAll();
      app.reloadData();
      render();
    }
  });

  qs('#btn-random').addEventListener('click', ()=>{
    const items = app.getAll();
    if(items.length===0) return alert('Nenhuma obra cadastrada');
    const pick = items[Math.floor(Math.random()*items.length)];
    alert(`Sugerido: ${pick.title} (${pick.category})`);
  });

  searchInput.addEventListener('input', render);
  filterCategory.addEventListener('change', render);

  function render(){
    const items = app.getAll();
    const q = searchInput.value.trim().toLowerCase();
    const cat = filterCategory.value;
    const filtered = items.filter(it=>{
      if(cat && it.category !== cat) return false;
      if(!q) return true;
      return it.title.toLowerCase().includes(q) ||
             it.description.toLowerCase().includes(q) ||
             (it.tags||[]).join(' ').toLowerCase().includes(q);
    });

    listEl.innerHTML = '';
    filtered.forEach(it => {
      const node = template.content.cloneNode(true);
      const article = node.querySelector('.media-card');
      node.querySelector('.media-img').src = it.image || 'assets/placeholder.png';
      node.querySelector('.media-img').alt = `${it.title} capa`;
      node.querySelector('.media-title').textContent = it.title;
      node.querySelector('.media-meta').textContent = `${it.category} • ${new Date(it.createdAt).toLocaleDateString()}`;
      node.querySelector('.media-desc').textContent = it.description;
      node.querySelector('.media-tags').textContent = (it.tags||[]).join(', ');
      const ratingSelect = node.querySelector('.rating-select');
      ratingSelect.value = '';
      ratingSelect.addEventListener('change', e=>{
        const score = Number(e.target.value);
        app.addRating(it.id, {user:'Você',score,when:Date.now()});
        render();
      });

      node.querySelector('.btn-comment').addEventListener('click', ()=>{
        const text = prompt('Seu comentário:');
        if(text) {
          app.addComment(it.id, {user:'Você',text,when:Date.now()});
          render();
        }
      });

      node.querySelector('.btn-add-list').addEventListener('click', ()=>{
        const name = prompt('Nome da lista para adicionar (ex: Meus favoritos):');
        if(!name) return;
        app.addToList(name, it.id);
        alert(`Adicionado à lista "${name}"`);
      });

      node.querySelector('.btn-edit').addEventListener('click', ()=> openModal(it));
      node.querySelector('.btn-delete').addEventListener('click', ()=>{
        if(confirm('Excluir esta obra?')) {
          app.deleteMedia(it.id);
          render();
        }
      });

      // render comments
      const commentsEl = node.querySelector('.comments');
      commentsEl.innerHTML = '';
      (it.comments || []).slice().reverse().forEach(c=>{
        const p = document.createElement('p');
        p.textContent = `${c.user}: ${c.text}`;
        commentsEl.appendChild(p);
      });

      listEl.appendChild(node);
    });

    // recomendações
    const recs = recommend(items, app.getHistory(), 6);
    recList.innerHTML = '';
    recs.forEach(r=>{
      const li = document.createElement('li');
      li.textContent = `${r.title} • ${r.category}`;
      recList.appendChild(li);
    });
  }

  // expose render for app to call
  return { render, openModal };
}
