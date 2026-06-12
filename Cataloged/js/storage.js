// storage.js
import { MEDIA_KEY, LISTS_KEY, HISTORY_KEY } from './data-model.js';

const json = v => JSON.stringify(v);
const parse = s => {
  try { return JSON.parse(s) } catch(e){ return null }
};

export const Storage = {
  loadMedia(){
    return parse(localStorage.getItem(MEDIA_KEY)) || [];
  },
  saveMedia(items){
    localStorage.setItem(MEDIA_KEY, json(items));
  },
  loadLists(){
    return parse(localStorage.getItem(LISTS_KEY)) || [];
  },
  saveLists(lists){
    localStorage.setItem(LISTS_KEY, json(lists));
  },
  loadHistory(){
    return parse(localStorage.getItem(HISTORY_KEY)) || [];
  },
  saveHistory(history){
    localStorage.setItem(HISTORY_KEY, json(history));
  },
  clearAll(){
    localStorage.removeItem(MEDIA_KEY);
    localStorage.removeItem(LISTS_KEY);
    localStorage.removeItem(HISTORY_KEY);
  }
};
