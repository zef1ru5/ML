console.log('content');

// -----------------------------Data Set Сollector---------------------------
class DataSetСollector {
  constructor() {
    this.nodeRoot = document.body.querySelectorAll('*'); // все элементв в body по порядку
    this.illegalTags = ['SCRIPT', 'STYLE'];

    this.labels = [
      'nameTag' ,
      'countChildren' ,
      'level' ,
      'nameClass1' , 'nameClass2' ,
      'nameParent1' , 'nameParent2' ,
      'nameParent3' , 'nameParent4' ,
      'nameParent5' , 'nameParent6' ,
      'nameParent7' , 'nameParent8' ,
      'nameParent9' , 'nameParent10',
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

  // h2 GroupAdvertsWrapper_title__63YNe
  // h2 Transport_h2__3m9cL
  nameClass(element) {
    let countClass = 2;
    let result = [];

    let strClass = element.className;
    let arrClass = strClass.split(' ');

    for (let i=0; i < countClass; i++) {
      let nameCls = '';
      if (arrClass[i] == undefined) { // если второго класса нет, либо нет классов совсем -> -1
        result.push("-1");
      } else {
        nameCls = arrClass[i];
        result.push(nameCls)
      }
    }

    return result
  }

  nameParent(element) {
    let countParent = 10;
    let result = [];
    
    for (let i=1; i <= countParent; i++) {
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
    
    let css =  this.anyCss;
    let styleLen = css.length;
    let result = []; 
    
    for (let i=0; i < styleLen; i++) {
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
  getTarget(element) {
    let target = element.dataset.target;
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

  collectDataSet() {
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
      let nameParent = this.nameParent(element);
      let style = this.style(element);
      let target = this.getTarget(element);

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
    this.countParam = {}; // общее число(кол-во) появления элемента в столбце
  }

  train(trainSet, targets, labels) {
    this.total = trainSet.length;

    let classes = {}; // кол-во каждого класса
    let counts = {};

    for (let idx=0; idx < this.total; idx++) {
      let vector = trainSet[idx];
      let category = targets[idx];

      if (!classes.hasOwnProperty(category)) {
        classes[category] = 0;
        counts[category] = {};
      }

      classes[category] += 1;

      // частота появления элемента в каждои параметре для каждого класса
      let vectorLen = vector.length;
      for(let index=0; index < vectorLen; index++) {
        let colName = labels[index];
        let columnValue = vector[index];

        if (!counts[category].hasOwnProperty(colName)) counts[category][colName] = {};
        if (!counts[category][colName].hasOwnProperty(columnValue)) counts[category][colName][columnValue] = 0;

        counts[category][colName][columnValue] += 1;
      }      
    }


    // prior probabilities p(class) / априорная вер-сть для класса
    for (let category in classes) {
      if( classes.hasOwnProperty(category) ) {
        let countForClass = classes[category];
        this.prior[category] = countForClass / this.total;
      } 
    }

    // общее количетво параметра (аттрибута) в столбце
    for (let category in counts) {
      if( classes.hasOwnProperty(category) ) {
        let columns = counts[category];        

        for (let colName in columns) {
          if( columns.hasOwnProperty(colName) ) {
            let valueCounts = columns[colName];

            if (!this.countParam.hasOwnProperty(colName)) this.countParam[colName] = {};

            for (let attrValue in valueCounts) {
              if( valueCounts.hasOwnProperty(attrValue) ) {
                let count = valueCounts[attrValue];

                if (!this.countParam[colName].hasOwnProperty(attrValue)) this.countParam[colName][attrValue] = 0;

                this.countParam[colName][attrValue] += count;
              }
            }
          }
        }
      } 
    }


    // conditional probabilities p(param|class) / Условная вероятность
    for (let category in counts) {
      if( classes.hasOwnProperty(category) ) {
        let columns = counts[category];

        if (!this.likelihood.hasOwnProperty(category)) this.likelihood[category] = {};

        for (let colName in columns) {
          if( columns.hasOwnProperty(colName) ) {
            let valueCounts = columns[colName];

            if (!this.likelihood[category].hasOwnProperty(colName)) this.likelihood[category][colName] = {};

            for (let attrValue in valueCounts) {
              if( valueCounts.hasOwnProperty(attrValue) ) {
                let count = valueCounts[attrValue];
                let countForClass = classes[category];
                this.likelihood[category][colName][attrValue] = count / countForClass;
              }
            }
          }
        }
      } 
    }
    
    this.frequency =  counts
  }

  classify(testVector, labels) {
    let posteriorForVector = [] // апостериорная вер-сть

    for (let category in this.prior) {
      if( this.prior.hasOwnProperty(category) ) {
        let prob = this.prior[category];
        let evedence = 1; // new

        let notIncluded = 0;

        let colIndex = 0;
        for (let attrValue of testVector) {
          let colName = labels[colIndex];

          //----------числитель------------ P(param1|class)*P(param2|class)*...*P(paramN|class) * P(class)
          // параметра нет для данного класса (в столбце)
          if (!this.likelihood[category][colName].hasOwnProperty(attrValue)) 
          { 
            notIncluded++;
            prob = prob * (1 /  this.total)
          }
          else 
          { prob = prob * this.likelihood[category][colName][attrValue] }

          // new
          //----------знаменатель------------ P(param1)*P(param2)*...*P(paramN)
          // параметра нет ни в одном классе (в столбце)
          if (!this.countParam[colName].hasOwnProperty(attrValue)) 
          { evedence = evedence * (1 /  this.total) }
          else 
          {             
            let countParam = this.countParam[colName][attrValue];
            let priorParam = countParam / this.total // P(Xi) - априорная вер-ть параметра
            evedence = evedence * priorParam;
           }

          colIndex += 1;          
        }

        if (notIncluded == testVector.length) { prob = 0 }
        
        // new
        // P(param1|class)*P(param2|class)*...*P(paramN|class) * P(class)
        //______________________________________________________________
        //              P(param1)*P(param2)*...*P(paramN)
        let posterior = prob / evedence;

        // let res = {
        //   'prob':prob,
        //   'category':category
        // };

        // new
        let res = {
          'prob':posterior,
          'category':category
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
      { onEvent: 'mouseover', method: this.MouseOverOutEffect.bind(this) },
      { onEvent: 'mouseout', method: this.MouseOverOutEffect.bind(this) },
      { onEvent: 'click', method: this.ClickEffect.bind(this) }
    ];
    
    this.dataTargetTrue = "Yes";    
    this.dataTargetPredict = 'Predict';
    this.selectedElements = [];
    this.predictedElements = [];

    this.probabilityRate = 0.8;
  }

  init() {
    // определения вкл|выкл или Show/Save (from PopUp)
    chrome.runtime.onMessage.addListener(this.DetectMessage.bind(this));
    // при обновлении сбросить иконку (to Bacground)
    let message = { 'state': false };
    chrome.runtime.sendMessage(message);
    // сбросить свичер в PopUp
    chrome.storage.sync.set(message);
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
    return true;
  }

  MouseOverOutEffect(event) {
    event.target.classList.toggle("MouseOverOut");
  }

  // выделить как "хороший" элемент и добавить dataset=1
  // или отменить выбранный и удалить dataset
  ClickEffect(event) {
    event.preventDefault();
    let element = event.target
    if (event.ctrlKey) {
      delete element.dataset.target;
      this.DelElement(element);
    } else {
      element.dataset.target = this.dataTargetTrue;
      this.PushUniqueElement(element);
    }
  }

  // вкл|выкл
  ToggleEventListeners({state}) {
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
        delete element.dataset.target;        
      }
      this.selectedElements = [] // обнулить selected

      for (let element of this.predictedElements) {
        delete element.dataset.predict;
      }
      this.predictedElements = [] // обнулить predicted
    }

  }

  Show() {
    let dataSetCollector = new DataSetСollector();
    let dataSet = dataSetCollector.collectDataSet();
    
    let trainSet = dataSet['trainSet'],
        testSet = dataSet['testSet'],
        targets = dataSet['targets'],
        labels = dataSet['labels'],
        testSetId = dataSet['testSetId'],
        pageElements = dataSet['pageElements'];

    
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
    //   ['Sunny', 'Mild', 'High', 'True'] ];
    // targets = ['No','No','Yes','Yes','Yes','No','Yes','No','Yes','Yes','Yes','Yes','Yes','No'];
    // testSet= [['Rainy', 'Cool', 'High', 'True'],
    //             ['Overcast', 'Cool', 'High', 'True'] ]; // prob=0
    // labels = ['Outlook','Temp','Humldity','Windy']
    
    trainSet = [
      ['div','q1', '-1', '150px', '150px', 'rgb(255, 0, 0)'],
      ['div','q1', '-1', '150px', '150px', 'rgb(0, 255, 0)']
    ];
    targets = ['Yes','Yes'];
    testSet= [
      ['div', 'wrapper_for_', '-1', '500px', '500px', 'rgb(0, 0, 0)'],
      ['div', 'main', 'bbb', '300px', '300px', 'rgb(0, 0, 0)'],      
      ['div', 'main', 'bbb', '300px', '300px', 'rgb(0, 0, 0)'],
      ['div', 'main', 'bbb', '300px', '300px', 'rgb(0, 0, 0)'],
      ['spam', '-1', '-1', 'auto', 'auto', 'rgb(0, 0, 0)'],
      ['div', 'wrapper_for_', '-1', '500px', '500px', 'rgb(0, 0, 0)'],
      ['div', 'q1', '-1', '150px', '150px', 'rgb(255, 0, 0)'],
      ['div', 'q1', '-1', '150px', '150px', 'rgb(0, 255, 0)'],
      ['div', 'q1', '-1', '155px', '155px', 'rgb(0, 0, 255)'] 
    ];
    labels = ['tagName', 'class1','class2','height','width', 'color']

    if (trainSet.length == 0) { // если нет тренировочных данных -> выход
      console.log('no train set');
      return
    }
    // ---------------------------------------
    let nb = new NB();
    nb.train(trainSet, targets, labels);
      console.log('frequency table');
      console.log(nb.frequency);
      console.log('likelihood table');
      console.log(nb.likelihood);
    let predicted = nb.predict(testSet, labels);
      console.log('predicted');
      console.log(predicted);
    // ---------------------------------------
    this.ClearPredictedElements();

    let numVector = 0;
    for (let vectorPred of predicted) {
      let lenVectorPred = vectorPred.length;

      console.log(`-- vector ${numVector++} --`)

      for (let idx=0; idx < lenVectorPred; idx++) {
        let category = vectorPred[idx]['category'];
        let prob = vectorPred[idx]['prob'];
          console.log(`${category} , ${prob}`)
      }
    }

    // for (let index = 0; index < predictLength; index++) {
    //   let elem = predicted[index];
    //   if ((elem['target'] == this.dataTargetTrue) && (elem['probability'] > this.probabilityRate)) {
    //     let id = testSetId[index];
    //     let pageElem = pageElements[id];

    //     pageElem.dataset.predict = this.dataTargetPredict;
    //     this.predictedElements.push( pageElem );
    //   }
    // }
    // console.log(testSetId);
    // console.log(this.predictedElements);
  }

  ClearPredictedElements() {
    for (let pageElem of this.predictedElements) {
      delete pageElem.dataset.predict;
    }
    this.predictedElements = [];
  }


  // Save(request, sender, sendResponse) { // ? request, sender, sendResponse for Popup SaveData/ShowData
  //   console.log('save pass')
  // }


}
// --------------------------------------------------------
const selector = new Selector();
selector.init();