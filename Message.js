                                                  // Content -> Bacground
// [Content send]
msg = { title: 'contentScriptMessage' }
chrome.extension.sendRequest( msg );                                                          // chrome.extension.sendRequest

// or
chrome.runtime.sendMessage({greeting: "hello"}, (response) => { // !!!
  console.log(response.farewell);
});


// [Bacground received]
chrome.extension.onRequest.addListener( (request, sender) => {                                // chrome.extension.onRequest.addListener
  MyFunction(request.message);
});

// or
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => { // !!!
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    if (request.greeting == "hello") sendResponse({farewell: "goodbye"});
  });






                                                  // Bacground -> Content
// [Bacground send]
chrome.browserAction.onClicked.addListener(buttonClick);

let buttonClick = (tab) => {
  let msg = { title: 'joinedMessage' };
  
  chrome.tabs.sendMessage(tab.id, msg, (response) => {                                          // chrome.tabs.sendMessage
    var resp = JSON.parse(response.farewell);
  });
  //  или chrome.tabs.sendMessage(tab.id, msg);
}

// or
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, (response) => {
    console.log(response.farewell);
  });
});


// [Content received]
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {                     // chrome.runtime.onMessage.addListener
  //  To do something
});

// or
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    if (request.greeting == "hello") sendResponse({farewell: "goodbye"});
  });


// ------------------------------------------------------------------------------------------------------------------------

                                                  // Content -> Popup
// [Content send]
// .......


// [Popup received]
// .......









                                                  // Popup -> Content
// [Popup send]
msg = {counter: 1};
let params = {active: true, currentWindow: true};

chrome.tabs.query( params, MyFunction);                                                           // + chrome.tabs.sendMessage

let MyFunction = (tabs) => {
  var timer = new chrome.Interval();
  timer.start();
  var tab = tabs[0];
  
  chrome.tabs.sendMessage(tab.id, msg, handler = (response) => {   // NEED TEST for =>              // chrome.tabs.sendMessage
    if (response.counter < 1000) {
      chrome.tabs.sendMessage(tab.id, {counter: response.counter}, handler);
    } else {
      timer.stop();
      var usec = Math.round(timer.microseconds() / response.counter);
      setChildTextNode("resultsRequest", usec + "usec");
    }
  });
  // или chrome.tabs.sendMessage(tab.id, msg)
};


// [Content received]
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {                        // chrome.runtime.onMessage.addListener
    // sendResponse({counter: request.counter+1}); // как в примере выше (не нужно)
    console.log(request.title);
    //  To do something
  });




// ------------------------------------------------------------------------------------------------------------------------

                                                  // Popup -> Bacground  (двусторонняя связь)
// [Popup send]
chrome.runtime.sendMessage({greeting: "GetURL"}, (response) => {
  tabURL = response.navURL
});

// [Bacground received]
chrome.runtime.onMessage.addListener(messageReceived);
let  messageReceived = (msg) => {
  // Do your work here
}




                                                  // Bacground -> Popup  (двусторонняя связь)
// [Bacground send]
msg = {
  title: 'something_completed', 
  data: {
      subject: 'Loading',
      content: 'Just completed!'
  }
}
chrome.runtime.sendMessage(msg);                                                    // chrome.runtime.sendMessage


// [Popup received]
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {       // chrome.runtime.onMessage.addListener
      if (request.msg === 'something_completed') {
          //  To do something
          console.log(request.data.subject)
          console.log(request.data.content)
      }
  }
);

