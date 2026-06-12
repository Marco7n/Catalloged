// suggestions.js
// algoritmo simples: recomenda itens que compartilham tags com histórico e que não foram vistos
export function recommend(mediaItems, history, limit = 6){
  const seenIds = new Set(history.map(h => h.id));
  const tagCounts = {};
  history.forEach(h => {
    const item = mediaItems.find(m => m.id === h.id);
    if(!item) return;
    (item.tags || []).forEach(t => tagCounts[t] = (tagCounts[t]||0)+1);
  });

  // score by tag overlap and popularity (comments+ratings)
  const scored = mediaItems.map(m => {
    if(seenIds.has(m.id)) return {...m, score:-1};
    const tagScore = (m.tags || []).reduce((s,t) => s + (tagCounts[t]||0), 0);
    const pop = (m.comments?.length||0) + (m.ratings?.length||0);
    return {...m, score: tagScore * 3 + pop};
  }).filter(m => m.score >= 0);

  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0, limit);
}
