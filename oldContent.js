/* eslint-disable no-undef */
console.log('content');
// -----------------------------Data Set Сollector---------------------------
class DataSetСollector {
  constructor() {
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

  level(element) {
    let level = 0;
    while (element.nodeName != 'BODY') {
      element = element.parentNode;
      level++;
    }

    return level.toString()
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
      if (element.nodeName == name) state = true;
    }
    return state
  }

  collectDataSet(datasetClassName) {
    let trainSet = [];
    let testSet = [];
    let targets = [];

    let testSetId = [];
    let nodeLength = this.nodeRoot.length;

    // обход в глубину
    for (let i = 0; i < nodeLength; i++) {
      let vector = [];
      let element = this.nodeRoot[i];
      if (this.isIllegalTag(element)) continue

      let nameTag = this.nameTag(element);
      let countChildren = this.countChildren(element);
      let level = this.level(element);
      let nameClass = this.nameClass(element);
      if (nameClass == false) continue
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

    let dataSet = {
      'trainSet': trainSet,
      'testSet': testSet,
      'targets': targets,
      'labels': this.labels,
      'testSetId': testSetId,
      'pageElements': this.nodeRoot
    };

    return dataSet;
  }
}
// -----------------------------Naive Bayesian Classifier---------------------------
class NB {
  constructor() {
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
      let category = targets[idx];

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

}

// -----------------------------Selector---------------------------
class Selector {
  constructor() {
    this.eventMethod = [
      { onEvent: 'mouseover', method: this.MouseOver.bind(this) },
      { onEvent: 'mouseout', method: this.MouseOut.bind(this) },
      { onEvent: 'click', method: this.ClickEffect.bind(this) }
    ];
    this.datasetClassName = `class${Date.now().toString()}`;
    this.dataClass = "Yes";

    this.datasetPredictName = `predict${Date.now().toString()}`;
    this.dataPredict = "Predict";

    this.datasetMoseName = `mouse${Date.now().toString()}`;
    this.dataMouseOverOut = "mouse";

    this.selectedElements = [];
    this.predictedElements = [];

    this.secret = 'nameTag';
  }

  init() {
    // определения вкл|выкл или Show/Save (from PopUp)
    chrome.runtime.onMessage.addListener(this.DetectMessage.bind(this));
    // при обновлении сбросить иконку (to Bacground)
    let message = { 'state': false };
    chrome.runtime.sendMessage(message);
    // сбросить свичер в PopUp
    chrome.storage.sync.set(message);

    // STYLE
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

  // добавляет только новые элементы в selectedElements
  PushUniqueElement(element) {
    if (!this.selectedElements.includes(element)) {
      this.selectedElements.push(element);
    }
  }

  // удоляет элемент в selectedElements
  DelElement(element) {
    let index = this.selectedElements.indexOf(element);
    if (index > -1) {
      this.selectedElements.splice(index, 1);
    }
  }

  // Действия в зависимости от сообщения
  DetectMessage(request, sender, sendResponse) {
    // для SendState (from Content)
    if (typeof request.state === 'boolean') this.ToggleEventListeners(request);
    // для ShowData/SaveData (from Content)
    if (request.operation === 'save') this.Save(request, sender, sendResponse);
    if (request.operation === 'show') this.Show(request, sender, sendResponse);
    if (request.operation === 'down') this.Down(request, sender, sendResponse);
    return true;
  }

  MouseOver(event) {
    event.target.dataset[this.datasetMoseName] = this.dataMouseOverOut;
  }
  MouseOut(event) {
    delete event.target.dataset[this.datasetMoseName];
  }

  // выделить как "хороший" элемент и добавить dataset
  // или отменить выбранный и удалить dataset
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

  // вкл|выкл
  ToggleEventListeners({ state }) {
    // Добвымть | Убрать EventListener
    for (const item of this.eventMethod) {
      let onEvent = item['onEvent'],
        method = item['method'];
      if (state) {
        document.addEventListener(onEvent, method);
      } else {
        document.removeEventListener(onEvent, method);
      }
    }
    // При выкл 
    if (!state) {
      // Убрать dataset
      for (let element of this.selectedElements) {
        delete element.dataset[this.datasetClassName];
      }
      this.selectedElements = [] // обнулить selected

      for (let element of this.predictedElements) {
        delete element.dataset[this.datasetPredictName];
      }
      this.predictedElements = [] // обнулить predicted
    }

  }

  Show() { 
    // ?? меняется ли параметры придобавлении стиля box-shadow для css target Yes
    let dataSetCollector = new DataSetСollector();
    let dataSet = dataSetCollector.collectDataSet(this.datasetClassName);

    let trainSet = dataSet['trainSet'],
      testSet = dataSet['testSet'],
      targets = dataSet['targets'],
      labels = dataSet['labels'],
      testSetId = dataSet['testSetId'],
      pageElements = dataSet['pageElements'];


      // trainSet = [
      //   ['DIV' ,'0' ,'13' ,'c6e8ba5398--header--1dF9r' ,'-1' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'rgb(18, 18, 18)' ,'33px' ,'157.359px' ,'22px' ,'157.359px' ,'700' ,'33px' ,'27.94px' ,'78.6719px 16.5px' ,'Lato'],
      //   ['DIV' ,'0' ,'14' ,'c6e8ba5398--header--1df-X' ,'-1' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'rgb(18, 18, 18)' ,'28px' ,'109.531px' ,'16px' ,'109.531px' ,'700' ,'28px' ,'22px' ,'54.7656px 14px' ,'Lato'],
      //   ['DIV' ,'0' ,'14' ,'c6e8ba5398--header--1df-X' ,'-1' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'rgb(18, 18, 18)' ,'28px' ,'118.813px' ,'16px' ,'118.813px' ,'700' ,'28px' ,'22px' ,'59.4063px 14px' ,'Lato']
      // ];
      // targets = ['Yes','Yes','Yes'];
      // testSet= [
      //   ['DIV' ,'4' ,'13' ,'-1' ,'-1' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'rgb(18, 18, 18)' ,'92px' ,'270.125px' ,'14px' ,'270.125px' ,'400' ,'92px' ,'20px' ,'135.063px 46px' ,'Lato'],
      //   ['DIV' ,'0' ,'14' ,'c6e8ba5398--header--1df-X' ,'-1' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'rgb(18, 18, 18)' ,'28px' ,'118.813px' ,'16px' ,'118.813px' ,'700' ,'28px' ,'22px' ,'59.4063px 14px' ,'Lato'],      
      //   ['DIV' ,'0' ,'14' ,'c6e8ba5398--term--3kvtJ' ,'-1' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'DIV' ,'rgb(122, 122, 122)' ,'22px' ,'270.125px' ,'14px' ,'270.125px' ,'400' ,'22px' ,'20.02px' ,'135.063px 11px' ,'Lato']
      // ];

      // trainSet = [
      //   ['Rainy', 'Hot', 'High', 'False'],
      //   ['Rainy', 'Hot', 'High', 'True'],
      //   ['Overcast', 'Hot', 'High', 'False'],
      //   ['Sunny', 'Mild', 'High', 'False'],
      //   ['Sunny', 'Cool', 'Normal', 'False'],
      //   ['Sunny', 'Cool', 'Normal', 'True'],
      //   ['Overcast', 'Cool', 'Normal', 'True'],
      //   ['Rainy', 'Mild', 'High', 'False'],
      //   ['Rainy', 'Cool', 'Normal', 'False'],
      //   ['Sunny', 'Mild', 'Normal', 'False'],
      //   ['Rainy', 'Mild', 'Normal', 'True'],
      //   ['Overcast', 'Mild', 'High', 'True'],
      //   ['Overcast', 'Hot', 'Normal', 'False'],
      //   ['Sunny', 'Mild', 'High', 'True']];
      // targets = ['No', 'No', 'Yes', 'Yes', 'Yes', 'No', 'Yes', 'No', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'No'];
      // testSet = [['Rainy', 'Cool', 'High', 'True'],
      // ['Overcast', 'Cool', 'High', 'True']]; // prob=0
      // labels = ['Outlook', 'Temp', 'Humldity', 'Windy']
    
    if (trainSet.length == 0) {
      alert('Элементы не выбраны');
      return
    }
    // ---------------------------------------
    let nb = new NB();
    nb.train(trainSet, targets, labels);
    let predicted = nb.predict(testSet, labels);
    // ---------------------------------------
    this.ClearPredictedElements();
    //-----------------
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
          pageElem.dataset[this.datasetPredictName] = this.dataPredict;
          this.predictedElements.push( pageElem );
        }
      }      
    }
    //-----------------
  }

  ClearPredictedElements() {
    for (let pageElem of this.predictedElements) {
      delete pageElem.dataset[this.datasetPredictName];
    }
    this.predictedElements = [];
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

  getText() {
    if (this.predictedElements.length == 0) return false
    let message = "";
    for (let elem of this.predictedElements) {
      message += elem.textContent +"\n";
    }
    for (let elem of this.selectedElements) {
      message += elem.textContent +"\n";
    }
    return message
  }

  Save(request) {
    let message = this.getText();
    if (message == false) {
      alert('Данные не анализированы');
      return
    }

    let login = request.login;
    let password = request.password;
    
    //-----------------
    let encryptSecret = this.getEncryptMessage(this.secret, password);
    let secretAndMessage = `${this.secret}${message}`;
    let encryptText = this.getEncryptMessage(secretAndMessage, password);
    //----------
    
    let encryptData = {
      'encryptSecret':encryptSecret,
      'encryptText':encryptText
    };

    let jsonEncryptData = JSON.stringify(encryptData);

    localStorage.setItem(login, jsonEncryptData);

    // отклдчение выделения и свичера
    let swch = { 'state': false };
    chrome.runtime.sendMessage(swch);
    chrome.storage.sync.set(swch);
    this.ToggleEventListeners(swch)

    alert('Данные сохранены успешно.');
  }

  Down(request) {    
    let login = request.login;
    let password = request.password;

    let jsonEncryptData = localStorage.getItem(login); // проверка ЛОГИНА
    if (jsonEncryptData == null) {
      alert('Нет данных для загрузки');
      return
    }

    let encryptData = JSON.parse(jsonEncryptData);
    let encryptSecret = encryptData['encryptSecret'];

    //----
    let decryptSecret = this.getDecryptMessage(encryptSecret, password);
    //----

    let regExp = new RegExp(String.fromCharCode(0), 'g');
    let secret = decryptSecret.replace(regExp, "");
    
    if (secret == this.secret) { // проверка ПАРОЛЯ
      let encryptText = encryptData['encryptText'];
      //----
      let decryptText = this.getDecryptMessage(encryptText, password);
      //----

      regExp = new RegExp(this.secret, 'g');
      let messageDec = decryptText.replace(regExp, "");
      regExp = new RegExp(String.fromCharCode(0), 'g');
      let message = messageDec.replace(regExp, "");
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
    else {
      alert('Неверный пароль');
    }
  }


}
// --------------------------------------------------------
const selector = new Selector();
selector.init();