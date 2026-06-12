// data-model.js
export const MEDIA_KEY = 'media_catalog_items_v1';
export const LISTS_KEY = 'media_catalog_lists_v1';
export const HISTORY_KEY = 'media_catalog_history_v1';

/**
 * Exemplo de objeto de mídia
 * {
 *   id: 'uuid',
 *   title: 'Nome',
 *   category: 'filme'|'serie'|'anime'|'jogo'|'livro',
 *   description: '...',
 *   image: 'https://...',
 *   tags: ['ação','drama'],
 *   ratings: [{user:'local',score:4,when:ts}],
 *   comments: [{user:'Você',text:'gostei',when:ts}],
 *   createdAt: ts
 * }
 */
export function createMedia({id,title,category,description,image,tags}){
  return {
    id,
    title,
    category,
    description: description||'',
    image: image||'assets/placeholder.png',
    tags: tags||[],
    ratings: [],
    comments: [],
    createdAt: Date.now()
  };
}
