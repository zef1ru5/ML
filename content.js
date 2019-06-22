/* eslint-disable no-undef */
console.log('content');



// --- Protector: encrypt and decrypt ---
class Protector {
  constructor() {
    this.secret = 'nameTag';
  }

  getEncryptMessage(message, password) {
    let algorithm = {
      'name': 'GOST R 34.12',
      'version': 2015,
      'length': 128,
      'mode': 'ES'
    };
    let chiper = new GostCipher(algorithm);

    let bytePass = gostCrypto.coding.Chars.decode(password, 'utf8');
    let byteMess = gostCrypto.coding.Chars.decode(message, 'utf8');
    let encryptMess = chiper.encrypt(bytePass, byteMess);
    let encodeMess = gostCrypto.coding.Base64.encode(encryptMess);
    return encodeMess
  }

  getDecryptMessage(encodeMess, password) {
    let algorithm = {
      'name': 'GOST R 34.12',
      'version': 2015,
      'length': 128,
      'mode': 'ES'
    };
    let chiper = new GostCipher(algorithm);

    let bytePass = gostCrypto.coding.Chars.decode(password, 'utf8')
    let source = gostCrypto.coding.Base64.decode(encodeMess);
    let decryptMess = chiper.decrypt(bytePass, source);
    let message = gostCrypto.coding.Chars.encode(decryptMess, 'utf8');
    return message
  }


  // for Save
  getEncryptSecretAndText(message, password) {
    let secretAndMessage = `${this.secret}${message}`;
    let encryptText = this.getEncryptMessage(secretAndMessage, password);
    return encryptText;
  }

  // for Down
  checkSecretAndGetDecryptText( encryptText, password) {   
    let decryptText = this.getDecryptMessage(encryptText, password);
    let regExp = new RegExp(this.secret, 'g');
    let secretObj = decryptText.match(regExp, 'i');
    if (secretObj == null) return false; // целостность
    if ((secretObj[0] != this.secret) & (secretObj.index != 0)) return false; // целостность

    let messageDec = decryptText.replace(regExp, "");
    regExp = new RegExp(String.fromCharCode(0), 'g');
    let message = messageDec.replace(regExp, "");

    return message;
  }


}


// --- Manager: save and download and logs---
class Manager {
  constructor () {
    this.protector = new Protector();
  }

  getText(selectedElements, predictedElements) {
    if (predictedElements.length == 0) return false
    let message = "";
    for (let elem of predictedElements) message += elem.textContent +"\n";
    for (let elem of selectedElements) message += elem.textContent +"\n";
    return message
  }

  Save(request, selectedElements, predictedElements) {
    let message = this.getText(selectedElements, predictedElements);
    if (message == false) { alert('Данные не анализированы'); return }

    let login = request.login;
    let password = request.password;        
    
    // Protector
    let encryptText = this.protector.getEncryptSecretAndText(message, password);

    let encryptData = {
      'encryptText': encryptText
    };

    let jsonEncryptData = JSON.stringify(encryptData);
    localStorage.setItem(login, jsonEncryptData);    
    alert('Данные сохранены успешно.');
  }

  Down(request) {    
    let login = request.login;
    let password = request.password;

    let jsonEncryptData = localStorage.getItem(login); // проверка ЛОГИНА
    if (jsonEncryptData == null) { alert('Нет данных для загрузки'); return }

    let encryptData = JSON.parse(jsonEncryptData);
    let encryptText = encryptData['encryptText'];

    let message = this.protector.checkSecretAndGetDecryptText(encryptText, password);

    if (message == false) { // LOGS
      let jsoninfo = localStorage.getItem('logs');
      if (jsoninfo == null) {
        let log = {
          'login': login,
          'times': [Date.now()]
        };
        let info = [];
        info.push(log);
        jsoninfo = JSON.stringify(info);
        localStorage.setItem('logs', jsoninfo); 
      } else {
          let info = JSON.parse(jsoninfo);
          let findLogin = false;
          for (let idx = 0; idx <info.length; idx++) {

            let obj = info[idx];
            if (obj['login'] == login) {
              findLogin = true;

              let minTime = obj['times'][0];
              let index = 0;
              let writeTime = false;
              for (let tt=0; tt < 5; tt++) {
                let tme = obj['times'][tt];
                if (tme == undefined) { info[idx]['times'][tt] = Date.now(); writeTime = true; break; } // [1, 2]
                if (tme < minTime) { minTime = tme ;index = tt }
              }
              if (writeTime == false) { info[idx]['times'][index] = Date.now(); break; } // [1, 2, 3, 4, 5]
            }
            if (findLogin == true) break;
          }

          if (findLogin == false) {
            let log = { 
              'login': login,
              'times': [Date.now()]
            };
            info.push(log);            
          }
          jsoninfo = JSON.stringify(info);
          localStorage.setItem('logs', jsoninfo);
      }
      

      alert('Неверный пароль'); 
      return 
    } // проверка целостность/пароль

    // download message
    let downLink = document.createElement("a");
    downLink.setAttribute("type", "hidden");
    downLink.setAttribute("download", "data.csv");
    downLink.setAttribute("href", "");
    document.querySelector("body").appendChild(downLink);

    let data = new Blob([message], {type: 'text/csv; charset=UTF-8'});
    let url = window.URL.createObjectURL(data);
    downLink.href = url;
    downLink.click();      
    window.URL.revokeObjectURL(url);
    downLink.remove();
  }

  Logs(request) {
    let login = request.login;
    let jsoninfo = localStorage.getItem('logs');
    if (jsoninfo == null) {alert('Нет логов'); return}
    let info = JSON.parse(jsoninfo);

    let message = '';
    let findLogin = false;
    for (let idx = 0; idx < info.length; idx++) {
      let obj = info[idx];
      if (obj['login'] == login) {
        findLogin = true;        
        for (let tt=0; tt < obj['times'].length; tt++) message += new Date(obj['times'][tt]).toString()  +"\n";
      }
      if (findLogin == true) {alert(message); return}
    }

    if (findLogin == false) {alert('У вас небыло ошибок'); return}

  }


}


// --- ML: training and classification ---
class ML {
  constructor() {
    this.predictedElements = [];

    this.prior = {}; // априорная вер-сть для класса
    this.likelihood = {}; //Условная вероятность / таблица правдоподобия
    this.frequency = {}; // частота появления элементов / табл частот
    this.total = 0;
  }

  train(trainSet, targets, labels) {
    this.total = trainSet.length;

    let classes = {}; // кол-во каждого класса
    let counts = {};

    for (let idx = 0; idx < this.total; idx++) {
      let vector = trainSet[idx];
      let category = targets[idx]; // category - class

      if (!classes.hasOwnProperty(category)) {
        classes[category] = 0;
        counts[category] = {};
      }

      classes[category] += 1;

      // частота появления элемента в каждом параметре для каждого класса
      let vectorLen = vector.length;
      for (let index = 0; index < vectorLen; index++) {
        let colName = labels[index];
        let columnValue = vector[index];

        if (!counts[category].hasOwnProperty(colName)) counts[category][colName] = {};
        if (!counts[category][colName].hasOwnProperty(columnValue)) counts[category][colName][columnValue] = 0;

        counts[category][colName][columnValue] += 1;
      }
    }


    // prior probabilities p(class) / априорная вер-сть для класса
    for (let category in classes) {
      if (classes.hasOwnProperty(category)) {
        let countForClass = classes[category];
        this.prior[category] = countForClass / this.total;
      }
    }

    // conditional probabilities p(param|class) / Условная вероятность
    for (let category in counts) {
      if (classes.hasOwnProperty(category)) {
        let columns = counts[category];

        if (!this.likelihood.hasOwnProperty(category)) this.likelihood[category] = {};

        for (let colName in columns) {
          if (columns.hasOwnProperty(colName)) {
            let valueCounts = columns[colName];

            if (!this.likelihood[category].hasOwnProperty(colName)) this.likelihood[category][colName] = {};

            for (let attrValue in valueCounts) {
              if (valueCounts.hasOwnProperty(attrValue)) {
                let count = valueCounts[attrValue];
                let countForClass = classes[category];
                // this.likelihood[category][colName][attrValue] = (count / countForClass);
                this.likelihood[category][colName][attrValue] = (count / countForClass) * this.total;
              }
            }
          }
        }
      }
    }

    this.frequency = counts
  }

  classify(testVector, labels) {
    let posteriorForVector = [] // апостериорная вер-сть

    for (let category in this.prior) {
      if (this.prior.hasOwnProperty(category)) {
        let prob = this.prior[category];

        let notIncluded = 0;

        let colIndex = 0;
        for (let attrValue of testVector) {
          let colName = labels[colIndex];

          // нет параметра для данного класса (в столбце)
          if (!this.likelihood[category][colName].hasOwnProperty(attrValue)) {
            notIncluded++; // for comment
            // prob = prob * (1 / this.total)
            prob = prob * 1             
          }
          else { prob = prob * this.likelihood[category][colName][attrValue] }

          colIndex += 1;
        }

        if (notIncluded == testVector.length) { prob = 0 }

        let res = {
          'prob': prob,
          'category': category
        };
        posteriorForVector.push(res)

      }
    }

    return posteriorForVector

  }

  predict(testSet, labels) {
    let posteriorAll = [];

    for (let vector of testSet) {
      let posteriorForVector = this.classify(vector, labels);
      posteriorAll.push(posteriorForVector);
    }

    return posteriorAll
  }


  
  newPredictedElements(trainSet, targets, labels, testSet, testSetId, pageElements) {
    this.predictedElements = [];

    this.train( trainSet, targets,  labels);
    let predicted = this.predict(testSet, labels);

    let maxPred = 0;
    for (let vectorPred of predicted) {
      for (let obj of vectorPred) {
        if (obj['prob'] > maxPred) maxPred = obj['prob']
      }
    }

    let predictLength = predicted.length;
    for (let index = 0; index < predictLength; index++) {
      let vectorPred = predicted[index];
      for (let obj of vectorPred) {
        if (obj['prob'] == maxPred) {
          let id = testSetId[index];
          let pageElem = pageElements[id];
          this.predictedElements.push( pageElem );
        }
      }      
    }
    return this.predictedElements;
  }

getPredictedElements() {
  return this.predictedElements;
}

clearPredictedElements() {
  this.predictedElements = [];
}


}


// --- collect ---
class Сollector {
  constructor() {
    this.dataSet = {};
    this.nodeRoot = document.body.querySelectorAll('*'); // все элементв в body по порядку
    this.illegalTags = ['SCRIPT', 'STYLE'];
    this.labels = [
      'nameTag',
      'countChildren',
      'level',
      'nameClass1', 'nameClass2',
      'nameParent1', 'nameParent2',
      'nameParent3', 'nameParent4',
      'nameParent5', 'nameParent6',
      'nameParent7', 'nameParent8',
      'nameParent9', 'nameParent10',
      'color', 'height', 'width', 'font-size', 'inline-size', 'font-weight', 'block-size', 'line-height', 'perspective-origin', 'font-family'
    ];

    this.anyCss = ['color', 'height', 'width', 'font-size', 'inline-size', 'font-weight', 'block-size', 'line-height', 'perspective-origin', 'font-family'];
  }

  nameTag(element) {
    return element.nodeName
  }

  countChildren(element) {
    let count = element.querySelectorAll('*').length;
    return count.toString()
  }

  level(element, num) {
    let level = 0;
        console.log(num);//test
    while (element.nodeName != 'BODY') {
      element = element.parentNode;
      level++;
    }
    return level.toString()

    // try {
    //   while (element.nodeName != 'BODY') {
    //     element = element.parentNode;
    //     level++;
    //   }
  
    //   return level.toString()
    // } catch (err) {
    //   console.log(element, num);
    // }
    
  }

  nameClass(element) {
    let countClass = 2;
    let result = [];

    try {
      let strClass = element.className;
      let arrClass = strClass.split(' ');
      for (let i = 0; i < countClass; i++) {
        let nameCls = '';
        if ((arrClass[i] == undefined) || (arrClass[i] == "")) { // если второго класса нет, либо нет классов совсем -> -1
          result.push("-1");
        } else {
          nameCls = arrClass[i];
          result.push(nameCls)
        }
      }
    } catch (err) {
      this.illegalTags.push(element.nodeName);
      return false;
    }

    return result
  }

  nameParent(element) {
    let countParent = 10;
    let result = [];

    for (let i = 1; i <= countParent; i++) {
      let countPar = '';
      if (element.parentNode == null) { // если нет родителя -> вставить родителя последнего элемента (для элементов рядом с body)
        result.push("-1");
      } else {
        element = element.parentNode;
        countPar = element.nodeName;
        result.push(countPar);
      }
    }

    return result
  }

  style(element) {
    let styles = window.getComputedStyle(element, null); // CSSStyleDeclaration - стили, их значения

    let css = this.anyCss;
    let styleLen = css.length;
    let result = [];

    for (let i = 0; i < styleLen; i++) {
      let prop = css[i]; // style Name
      let value = styles.getPropertyValue(prop);

      if (prop == 'font-family') {            // value = ""Fira Sans", "Open Sans", Helvetica
        let arr = value.split(', ', 1);       // взять перый шрифт
        let font = arr[0].replace(/"/g, '');  // убрать лишние кавычки
        value = font;                         // "Fira Sans"
      }

      result.push(value);
    }

    return result
  }

  // возвращает target: при отсутствии NaN, либо сроку
  getTarget(element, datasetClassName) {
    let target = element.dataset[datasetClassName];
    if (target == undefined) { return 'NaN' }
    else { return target }
  }

  isIllegalTag(element) {
    let state = false;
    for (let name of this.illegalTags) {
      if (element.nodeName == name) {
        state = true;
        break;
      }
    }
    return state
  }

  collectDataSet(datasetClassName) {
    // let TESTING_ELEMENTS = []; //test

    let trainSet = [];
    let testSet = [];
    let targets = [];

    let testSetId = [];
    let nodeLength = this.nodeRoot.length;

    // обход в глубину
    for (let i = 0; i < nodeLength; i++) {
              // if (i == 5839) {
              //   console.log(12);
              // }
      let vector = [];
      let element = this.nodeRoot[i];

      let noLegal = this.isIllegalTag(element);
      if (noLegal == true) { continue };

      let nameTag = this.nameTag(element);
      let countChildren = this.countChildren(element); 
            // if (countChildren != 0) { continue }; //test
            // TESTING_ELEMENTS.push(element);

            // this.Ssleep(5);
            // if (element == null) {
            //   console.log('ELEMENT NULL' , element, i);
            // }
      
      let level = this.level(element, i); // i - test
      let nameClass = this.nameClass(element);
      if (nameClass == false) { continue };
      let nameParent = this.nameParent(element);
      let style = this.style(element);
      let target = this.getTarget(element, datasetClassName);

      vector.push(nameTag, countChildren, level, ...nameClass, ...nameParent, ...style);

      if (target == 'NaN') {   // testSet
        testSet.push(vector);
        testSetId.push(i);  // для последующего нахождения элемента по id
      } else {              // trainSet 
        trainSet.push(vector);
        targets.push(target);
      }
    }

    this.dataSet = {
      'trainSet': trainSet,
      'testSet': testSet,
      'targets': targets,
      'labels': this.labels,
      'testSetId': testSetId,
      'pageElements': this.nodeRoot,
      // 'TESTING_ELEMENTS': TESTING_ELEMENTS //test
    };
  }

  // Ssleep(milliseconds) { //test
  //   let start = new Date().getTime();
  //   for (let i = 0; i < 1e7; i++) {
  //     if ((new Date().getTime() - start) > milliseconds){
  //       break;
  //     }
  //   }
  //   console.log('Sseep');
  // }

  getDataSet() {
    return this.dataSet;
  }

}


// --- select ---
class Selector {
  constructor() {
    this.selectedElements = [];

    // Event
    this.eventMethod = [
      { onEvent: 'mouseover', method: this.MouseOver.bind(this) },
      { onEvent: 'mouseout', method: this.MouseOut.bind(this) },
      { onEvent: 'click', method: this.ClickEffect.bind(this) }
    ];

    // Name dataset
    this.datasetClassName = `class${Date.now().toString()}`;
    this.dataClass = "Yes";
    this.datasetPredictName = `predict${Date.now().toString()}`;
    this.dataPredict = "Predict";
    this.datasetMoseName = `mouse${Date.now().toString()}`;
    this.dataMouseOverOut = "mouse";
    // Style CSS
    let style = document.createElement ( "style" ), styleSheet;    
    style.appendChild ( document.createTextNode ( "" ) );
    document.head.appendChild ( style );
    styleSheet = style.sheet;
    let rules = [
      `[data-${this.datasetPredictName}=${this.dataPredict}]{box-shadow: inset 0 0 4px 4px #8DB87C;}`,
      `[data-${this.datasetMoseName}=${this.dataMouseOverOut}]{box-shadow: 0 0 4px 4px #0c98cf;}`,
      `[data-${this.datasetClassName}=${this.dataClass}]{background-color: rgba(101, 206, 247, 0.5)}`
    ];
    for ( let st=0; st < rules.length; st++ ) {
      styleSheet.insertRule ( rules [st], st );
    }

  }

  // on/off
  ToggleEventListeners({ state }) {
    for (const item of this.eventMethod) {
      let onEvent = item['onEvent'], method = item['method'];
      if (state) document.addEventListener(onEvent, method);
      else document.removeEventListener(onEvent, method);
    }


  }

  MouseOver(event) {
    event.target.dataset[this.datasetMoseName] = this.dataMouseOverOut;
  }
  MouseOut(event) {
    delete event.target.dataset[this.datasetMoseName];
  }
  // добавить/удалить dataset
  ClickEffect(event) {
    event.preventDefault();
    let element = event.target
    if (event.ctrlKey) {
      delete element.dataset[this.datasetClassName];
      this.DelElement(element);
    } else {
      element.dataset[this.datasetClassName] = this.dataClass;
      this.PushUniqueElement(element);
    }
  }

  // добавляет только новые элементы в selected_Elements
  PushUniqueElement(element) {
    if (!this.selectedElements.includes(element)) {
      this.selectedElements.push(element);
    }
  }
  // удоляет элемент в selected_Elements
  DelElement(element) {
    let index = this.selectedElements.indexOf(element);
    if (index > -1) {
      this.selectedElements.splice(index, 1);
    }
  }
  

  getDatasetClassName() {
    return this.datasetClassName;
  }
  getDatasetPredictName() {
    return this.datasetPredictName;
  }
  getDataPredict() {
    return this.dataPredict;
  }
  getSelectedElements() {
    return this.selectedElements;
  }

  clearSelectedElements() {
    this.selectedElements = [];
  }

}


// -----------
class Main {
  constructor() {
    // Selector:on/off или Manager:Show/Save (from PopUp)
    chrome.runtime.onMessage.addListener(this.DetectMessage.bind(this));
    // при обновлении сбросить иконку (to Bacground)
    let message = { 'state': false };
    chrome.runtime.sendMessage(message);
    // сбросить свичер в PopUp
    chrome.storage.sync.set(message);

    this.selector = new Selector();
    this.collector = new Сollector();
    this.manager = new Manager();
    this.ml = new ML();    
  }

  DetectMessage(request) {
    switch (request.class) {
      case 'selector': this.selector.ToggleEventListeners(request);
                      if (request.state == false) this.clearDatasetsOnPage();
                      break;
      case 'manager': if (request.operation == 'save') {
                          this.manager.Save(request, this.selector.getSelectedElements(), this.ml.getPredictedElements() );
                          // отклдчение свичера и выделения
                          let swch = {'state': false};
                          chrome.runtime.sendMessage(swch); chrome.storage.sync.set(swch);
                          this.selector.ToggleEventListeners(swch);
                          this.clearDatasetsOnPage();
                        };
                        if (request.operation == 'down') this.manager.Down(request);
                        if (request.operation == 'logs') this.manager.Logs(request);
                       break;
      case 'main': this.Show(); break;

      case 'test': this.TEST(); break;
    }
    return true;
  }

  TEST(){
    this.collector.collectDataSet(this.selector.getDatasetClassName());
    let dataSet = this.collector.getDataSet(); 
    // let TESTING_ELEMENTS = dataSet['TESTING_ELEMENTS'] // del
    // console.log(TESTING_ELEMENTS);
    let testSet = dataSet['testSet']

    var ep=new ExcelPlus();
    ep.createFile("Book1")
      .write({ "content": testSet })
      // .write({ "sheet":"Book1", "cell":"D1", "content":new Date() })
      .saveAs("demo.xlsx");
  }







  Show() {
    // Collector (full)
    this.collector.collectDataSet(this.selector.getDatasetClassName());
    let dataSet = this.collector.getDataSet();    
    if ( dataSet['trainSet'].length == 0) { alert('Элементы не выбраны'); return }

    // Selector (part for show)
    let datasetPredictName = this.selector.getDatasetPredictName();
    let dataPredict = this.selector.getDataPredict();

    // clear dataset predicted elem
    let predictedElements = this.ml.getPredictedElements();
    for (let pageElem of predictedElements) delete pageElem.dataset[datasetPredictName];

    // ML (full)
    // trainSet = [
    //   ['DIV', '0', '13', 'header-1dF9r', '-1', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', '18, 18, 18', '33', '157.359', '22', '157.359', '700', '33', '27.94', '78.6719 16.5', 'Lato'],
    //   ['DIV', '0', '14', 'header-1df-X', '-1', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', '18, 18, 18', '28', '109.531', '16', '109.531', '700', '28', '22', '54.7656 14', 'Lato'],
    //   ['DIV', '0', '14', 'header-1df-X', '-1', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', 'DIV', '18, 18, 18', '28', '118.813', '16', '118.813', '700', '28', '22', '59.4063 14', 'Lato']
    // ];
    // targets = ['Yes','Yes','Yes'];
    // testSet= [
    //   ['div', 'wrapper_for_', '-1', '500px', '500px', 'rgb(0, 0, 0)'],
    //   ['div', 'main', 'bbb', '300px', '300px', 'rgb(0, 0, 0)'],      
    //   ['div', 'main', 'bbb', '300px', '300px', 'rgb(0, 0, 0)'],
    //   ['div', 'main', 'bbb', '300px', '300px', 'rgb(0, 0, 0)'],
    //   ['spam', '-1', '-1', 'auto', 'auto', 'rgb(0, 0, 0)'],
    //   ['div', 'wrapper_for_', '-1', '500px', '500px', 'rgb(0, 0, 0)'],
    //   ['div', 'q1', '-1', '150px', '150px', 'rgb(255, 0, 0)'],
    //   ['div', 'q1', '-1', '150px', '150px', 'rgb(0, 255, 0)'],
    //   ['div', 'q1', '-1', '155px', '155px', 'rgb(0, 0, 255)'] 
    // ];
    // labels = ['tagName', 'class1','class2','height','width', 'color']


    predictedElements = this.ml.newPredictedElements(dataSet['trainSet'], dataSet['targets'], dataSet['labels'], dataSet['testSet'], dataSet['testSetId'], dataSet['pageElements']);
    
    // set dataset prdected elem
    for (let pageElem of predictedElements) pageElem.dataset[datasetPredictName] = dataPredict;
  }


  clearDatasetsOnPage() {
    // При выкл 
    let selectedElements = this.selector.getSelectedElements();
    let datasetClassName = this.selector.getDatasetClassName();
    let datasetPredictName = this.selector.getDatasetPredictName();
    let predictedElements = this.ml.getPredictedElements();

    for (let element of selectedElements) delete element.dataset[datasetClassName];
    this.selector.clearSelectedElements(); // обнулить selected
    for (let element of predictedElements) delete element.dataset[datasetPredictName];
    this.ml.clearPredictedElements(); // обнулить predicted
  }

}

const main = new Main();