console.log('poup');

class Popup {

  constructor() {
    this.state = false;
    document.querySelector('#switcher').addEventListener('click', this.SendState.bind(this)); // вкл|выкл
    document.querySelector('#show-data').addEventListener('click', this.ShowData.bind(this)); //  показать найденные данные
    document.querySelector('#save-data').addEventListener('click', this.SaveData.bind(this)); //  сохранить выделенные данные
    document.querySelector('#down-data').addEventListener('click', this.DownData.bind(this)); //  сохранить выделенные данные
  }

  // Проверка работы программы и индикатора checker (при закрытии окна checker сбрасывается)
  init() {
    chrome.storage.sync.get('state', (storage) => {
      if (Object.keys(storage).length == 0) return; // если в хранилище нет объекта
      document.querySelector('#switcher').checked = storage.state ? true : false;
    });
  }

  // смена состояния работы программы и иконки
  SendState({target}) {
    this.state = target.checked;

    let message = { 'state': this.state };
    // для смены иконки (to Background)
    chrome.runtime.sendMessage( message ); 
    // для Активации/выключения выделения (to Content)
    chrome.tabs.query( {active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });

    chrome.storage.sync.set(message); // для Init
  }

  // показать найденные данные (to Content)
  ShowData() {
    let message = {'operation': 'show'};
    let params = {active: true, currentWindow: true};
    chrome.tabs.query( params, function(tabs) {
      if (tabs.length > 0) { // If there is an active tab
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

  // сохранить выделенные данные (to Content)
  SaveData() {
    let login = document.querySelector('#login').value;
    let password = document.querySelector('#password').value;
    if (login == "") {alert('Введите логин'); return}
    if (password == "") {alert('Введите пароль'); return}

    let message = {
      'operation': 'save',
      'login': login,
      'password': password
    };
    let params = {active: true, currentWindow: true};
    chrome.tabs.query( params, function(tabs) {
      if (tabs.length > 0) {
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

  // загрузить данные (to Content)
  DownData() {
    let login = document.querySelector('#login').value;
    let password = document.querySelector('#password').value;
    if (login == "") {alert('Введите логин'); return}
    if (password == "") {alert('Введите пароль'); return}
     
    let message = {
      'operation': 'down',
      'login': login,
      'password': password
    };
    let params = {active: true, currentWindow: true};
    chrome.tabs.query( params, function(tabs) {
      if (tabs.length > 0) {
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

}

const popup = new Popup();
popup.init();