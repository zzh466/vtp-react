import Store from 'electron-store';

const store = new Store({
  defaults: {
    width: 0,
    height: 0,
    topCheck: true,
    colorCheck: false,
  },
});

export default store;