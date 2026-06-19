export const AuthService = {
  getCurrentUser() {
    const user = localStorage.getItem("app_user");
    return user ? JSON.parse(user) : null;
  },

  login(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { email, uid: `user_${btoa(email).substring(0, 8)}` };
        localStorage.setItem("app_user", JSON.stringify(user));
        
        // Garante espaço para a coleção privada remota desse usuário
        if(!localStorage.getItem(`collection_${user.uid}`)) {
          localStorage.setItem(`collection_${user.uid}`, JSON.stringify([]));
        }
        
        resolve(user);
      }, 600);
    });
  },

  logout() {
    localStorage.removeItem("app_user");
    return Promise.resolve();
  },

  getUserCollection(uid) {
    const data = localStorage.getItem(`collection_${uid}`);
    return data ? JSON.parse(data) : [];
  },

  addToUserCollection(uid, mediaItem) {
    const collection = this.getUserCollection(uid);
    if (!collection.some(item => item.id === mediaItem.id)) {
      collection.push(mediaItem);
      localStorage.setItem(`collection_${uid}`, JSON.stringify(collection));
    }
    return Promise.resolve(collection);
  }
};