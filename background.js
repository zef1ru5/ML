console.log('background');

class Background {
  constructor() {
    chrome.runtime.onMessage.addListener( this.DetectMessage.bind(this) );
  }

  DetectMessage(request, sender, sendResponse) {
    if (request.state == false)  this.ChangeIcon(request);       
  }


  // from Popup and Content смена иконки
  ChangeIcon(request, sender, sendResponse) {
    let icon = request.state ? 'icons/icon-16-on.png' : 'icons/icon-16-off.png';
    chrome.browserAction.setIcon({path: icon});
  }

}

const background = new Background();
