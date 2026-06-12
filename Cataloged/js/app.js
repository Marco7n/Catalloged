// app.js
import { Storage } from './storage.js';
import { initUI } from './ui.js';

class App {
  constructor(){
    this.media = Storage.loadMedia();
    this.lists = Storage.loadLists();
    this.history = Storage.loadHistory();
  }

  reloadData(){
    this.media = Storage.loadMedia();
    this.lists = Storage.loadLists();
    this.history = Storage.loadHistory();
  }

  getAll(){ return this.media.slice().sort((a,b)=>b.createdAt - a.createdAt) }

  saveOrUpdate(item){
    const idx = this.media.findIndex(m=>m.id===item.id);
    if(idx>=0) this.media[idx] = {...this.media[idx], ...item};
    else this.media.push(item);
    Storage.saveMedia(this.media);
    this.pushHistory(item.id);
  }

  deleteMedia(id){
    this.media = this.media.filter(m=>m.id!==id);
    Storage.saveMedia(this.media);
  }

  addRating(id, rating){
    const m = this.media.find(x=>x.id===id);
    if(!m) return;
    m.ratings = m.ratings || [];
    m.ratings.push(rating);
    Storage.saveMedia(this.media);
    this.pushHistory(id);
  }

  addComment(id, comment){
    const m = this.media.find(x=>x.id===id);
    if(!m) return;
    m.comments = m.comments || [];
    m.comments.push(comment);
    Storage.saveMedia(this.media);
    this.pushHistory(id);
  }

  addToList(listName, id){
    let list = this.lists.find(l=>l.name===listName);
    if(!list){
      list = { name: listName, items: [id], createdAt: Date.now() };
      this.lists.push(list);
    } else {
      if(!list.items.includes(id)) list.items.push(id);
    }
    Storage.saveLists(this.lists);
  }

  pushHistory(id){
    this.history = this.history || [];
    this.history.push({id, when: Date.now()});
    // keep last 200 actions
    if(this.history.length > 200) this.history = this.history.slice(-200);
    Storage.saveHistory(this.history);
  }

  getHistory(){ return this.history || [] }
}

const app = new App();
const ui = initUI(app);
ui.render();

// expose for debugging
window._mediaApp = app;
