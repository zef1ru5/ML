console.log('poup');

class Popup {
  constructor() {
    this.state = false;
    document.querySelector('#switcher').addEventListener('click', this.SendState.bind(this));
    document.querySelector('#show-data').addEventListener('click', this.ShowData.bind(this));
    document.querySelector('#save-data').addEventListener('click', this.SaveData.bind(this));
    document.querySelector('#down-data').addEventListener('click', this.DownData.bind(this));
    // document.querySelector('#logs').addEventListener('click', this.Logs.bind(this));
    // document.querySelector('#TEST').addEventListener('click', this.TEST.bind(this));

    // Проверка работы программы и индикатора checker (при закрытии окна checker сбрасывается)
    chrome.storage.sync.get('state', (storage) => {
      if (Object.keys(storage).length == 0) return; // если в хранилище нет объекта
      document.querySelector('#switcher').checked = storage.state ? true : false;
    });
  }

TEST(){
  let message = {'class': 'test'};
  let params = { active: true, currentWindow: true };
  chrome.tabs.query(params, function (tabs) {
    if (tabs.length > 0) {
      let tab = tabs[0];
      chrome.tabs.sendMessage(tab.id, message);
    }
  });
}

  escape(string) {
    let htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return string.replace(/[&<>"'`=\/]/g, function(match) {
        return htmlEscapes[match];
    });
  };
  chechPassword(password) {
    let message = '';
    if (password.length < 8) message += 'Пароль менее 8 символов \n';
    if ( !(password.match(/[a-z]/)) & !(password.match(/[а-я]/)) ) message += 'Пароль не содержит строчные буквы \n';
    if ( !(password.match(/[A-Z]/)) & !(password.match(/[А-Я]/)) ) message += 'Пароль не содержит прописные буквы \n';
    if ( ! password.match(/[0-9]/) ) message += 'Пароль не содержит цифры \n';
    return message
  }

  Logs() {
    let login = this.escape(document.querySelector('#login').value);
    if (login == "") { alert('Введите логин'); return }

    let message = {
      'class': 'manager',
      'operation': 'logs',
      'login': login
    };

    let params = { active: true, currentWindow: true };
    chrome.tabs.query(params, function (tabs) {
      if (tabs.length > 0) {
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }


  // смена состояния работы программы и иконки (Selector)
  SendState({ target }) {
    this.state = target.checked;
    let message = {
      'class': 'selector',
      'state': this.state
    };
    chrome.runtime.sendMessage(message); // для смены иконки (to Background)    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => { // для Активации/выключения выделения (to Content)
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
    chrome.storage.sync.set(message); // для Init
  }

  // показать найденные данные (to Content)
  ShowData() {
    let message = {
      'class': 'main',
      'operation': 'show'
    };
    let params = { active: true, currentWindow: true };
    chrome.tabs.query(params, function (tabs) {
      if (tabs.length > 0) { // If there is an active tab
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

  // сохранить выделенные данные (to Content)
  SaveData() {
    let login = this.escape(document.querySelector('#login').value);
    let password = this.escape(document.querySelector('#password').value);

    let chech = this.chechPassword(password);
    if (chech  != '' ) { alert(chech); return}

    if (login == "") { alert('Введите логин'); return }
    if (password == "") { alert('Введите пароль'); return }

    let message = {
      'class': 'manager',
      'operation': 'save',
      'login': login,
      'password': password
    };
    let params = { active: true, currentWindow: true };
    chrome.tabs.query(params, function (tabs) {
      if (tabs.length > 0) {
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

  // загрузить данные (to Content)
  DownData() {
    let login = this.escape(document.querySelector('#login').value);
    let password = this.escape(document.querySelector('#password').value);
    if (login == "") { alert('Введите логин'); return }
    if (password == "") { alert('Введите пароль'); return }

    let message = {
      'class': 'manager',
      'operation': 'down',
      'login': login,
      'password': password
    };
    let params = { active: true, currentWindow: true };
    chrome.tabs.query(params, function (tabs) {
      if (tabs.length > 0) {
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

}

const popup = new Popup();