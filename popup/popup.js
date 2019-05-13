console.log('poup');

class Popup {

  constructor() {
    this.state = false;
    document.querySelector('#switcher').addEventListener('click', this.SendState.bind(this)); // вкл|выкл
    document.querySelector('#show-data').addEventListener('click', this.ShowData.bind(this)); //  показать найденные данные
    document.querySelector('#save-data').addEventListener('click', this.SaveData.bind(this)); //  сохранить выделенные данные
  }

  // Проверка работы программы и индикатора checker (при закрытии окна checker сбрасывается)
  init() {
    chrome.storage.sync.get('state', (storage) => {
      if (Object.keys(storage).length == 0) return; // если в хранилище нет объекта
      document.querySelector('#switcher').checked = storage.state ? true : false;
    });

    let radios = document.querySelectorAll('input[type=radio][name="mlMethod"]');
    let radioLength = radios.length;
    for (let i=0; i < radioLength; i++) {
      radios[i].addEventListener('change', this.ChangeMLmethod.bind(this));
    }
  }

  // смена метода ML (to Content)
  ChangeMLmethod({target}) {
    let message = {'mlMethod': target.value};
    let params = {active: true, currentWindow: true};
    chrome.tabs.query( params, function(tabs) {
      if (tabs.length > 0) {
        let tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, message);
      }
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
  SaveData(event) {
    // Add class Processing !
    let message = {'operation': 'save'};
    chrome.tabs.query( {active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) { // If there is an active tab

        chrome.tabs.sendMessage(tabs[0].id, message, function handler (response) { // Get the active tab
          if (chrome.runtime.lastError) {// An error occurred
            console.log("ERROR: ", chrome.runtime.lastError);
          } else {
            console.log(response); // REMOVE
            if (response.done) {
              alert(response.answer['answ']); // Success popup  !
            } else {   
              alert(response.reason); // Error popup  !
              // Remove class Processing
            }
          }
        });

      }
    });
    // Remove class Processing !
  }

}

const popup = new Popup();
popup.init();