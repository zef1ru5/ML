console.log('content');

// -----------------------------Data Set Сollector---------------------------
class DataSetСollector {
  constructor(mlMethod = 1) {
    this.nodeRoot = document.body.querySelectorAll('*'); // все элементв в body по порядку
    this.illegalTags = ['SCRIPT', 'STYLE'];

    this.dataPoint = {
      'nameTag' : [],
      'countChildren' : [],
      'level' : [],
      'nameClass' : [],
      'nameParent1' : [],
      'nameParent2' : [],
      'nameParent3' : [],
      'nameParent4' : [],
      'nameParent5' : [],
      'nameParent6' : [],
      'nameParent7' : [],
      'nameParent8' : [],
      'nameParent9' : [],
      'nameParent10' : []
    }; 

    this.isAllStyles = false;
    this.anyCss = ['color', 'height', 'width', 'font-size', 'inline-size', 'font-weight', 'block-size', 'line-height', 'perspective-origin', 'font-family'];
    this.initDataPointStyle();

    this.mlMethod = mlMethod;
  }

  initDataPointStyle() {
    let css = [];
    if (this.isAllStyles) {
      css = window.getComputedStyle(this.nodeRoot[0], null);
    } else {
      css =  this.anyCss;     
    }

    let countStyle = css.length;
      for (let i=0; i < countStyle; i++) {
        let style = css[i];
        this.dataPoint[style] = [];
      }
    
  }

  helperPushElGetIdx(prop, value) {
    if (!this.dataPoint[prop].includes(value)) {
      this.dataPoint[prop].push(value);
    }
    let idx = this.dataPoint[prop].indexOf(value);
    return idx
  }

  nameTag(element) {
    let prop = 'nameTag',
        value = element.nodeName;
    
    if (this.mlMethod == 1) {
      return value
    } else if (this.mlMethod == 2) {
      let idx = this.helperPushElGetIdx(prop, value);
      return idx
    } // else mlMethod Apripri
    
  }

  countChildren(element) {
    let prop = 'countChildren',
        value = element.querySelectorAll('*').length;
    
    if (this.mlMethod == 1) {
      return value
    } else if (this.mlMethod == 2) {
      let idx = this.helperPushElGetIdx(prop, value);
      return idx
    } // else mlMethod Apripri

    
  }

  level(element) {
    let prop = 'level',
        value = 0;
    while (element.nodeName != 'BODY') {
      element = element.parentNode;
      value++;
    }

    if (this.mlMethod == 1) {
      return value
    } else if (this.mlMethod == 2) {
      let idx = this.helperPushElGetIdx(prop, value);
      return idx
    } // else mlMethod Apripri

  }

  // h2 GroupAdvertsWrapper_title__63YNe
  // h2 Transport_h2__3m9cL
  nameClass(element) {
    let countClass = 2;
    let prop = 'nameClass';
    let result = [];

    let strClass = element.className;
    let arrClass = strClass.split(' ');

    for (let i=0; i < countClass; i++) {
      let value = '';

      if (arrClass[i] == undefined) { // если второго класса нет, либо нет классов совсем -> -1

        if (this.mlMethod == 1) {
          result.push("-1");
        } else if (this.mlMethod == 2) {
          result.push(-1);
        } // else mlMethod Apripri
        

      } else {

        value = arrClass[i];
        if (this.mlMethod == 1) {
          result.push(value)
        } else if (this.mlMethod == 2) {
          let idx = this.helperPushElGetIdx(prop, value);
          result.push(idx);
        } // else mlMethod Apripri

      }
    }

    return result
  }

  nameParent(element) {
    let countParent = 10;
    let propBase = 'nameParent';
    let result = [];
    
    for (let i=1; i <= countParent; i++) {
      let prop = `${propBase}${i}`;
      let value = '';

      if (element.parentNode == null) { // если нет родителя -> вставить родителя последнего элемента (для элементов рядом с body)

        if (this.mlMethod == 1) {
          result.push("-1");
        } else if (this.mlMethod == 2) {
          result.push(-1);
        } // else mlMethod Apripri
        

      } else {

        element = element.parentNode;
        value = element.nodeName;

        if (this.mlMethod == 1) {
          result.push(value);
        } else if (this.mlMethod == 2) {
          let idx = this.helperPushElGetIdx(prop, value);
          result.push(idx);
        } // else mlMethod Apripri
        

      }
    }

    return result
  }

  style(element) {
    let styles = window.getComputedStyle(element, null); // CSSStyleDeclaration - стили, их значения
    
    let css = [];
    if (this.isAllStyles) {
      css = styles;
    } else {
      css =  this.anyCss;
    }

    let styleLen = css.length;
    let result = []; 
    

    for (let i=0; i < styleLen; i++) {
      let prop = css[i], // style Name
          value = styles.getPropertyValue(prop);
      
      if (prop == 'font-family') { // value = ""Fira Sans", "Open Sans", Helvetica, Arial, sans-serif"
        let arr = value.split(', ', 1); // взять перый шрифт
        let font = arr[0].replace(/"/g, ''); // убрать лишние кавычки
        value = font; // "Fira Sans"
      }

      if (this.mlMethod == 1) {
        result.push(value);
      } else if (this.mlMethod == 2) {
        let idx = this.helperPushElGetIdx(prop, value);
        result.push(idx);
      } // else mlMethod Apripri

      
    }

    return result
  }

  // возвращает target: при отсутствии NaN, либо число, либо сроку
  getTarget(element) {
    let target = element.dataset.target;
    if (target == undefined) {
      return NaN;
    } else {
      let targetNumber = parseInt(target, 10);
      if (isNaN(targetNumber)) {
        return target;
      } else {
        return targetNumber;
      }
    }

  }

  isIllegalTag(element) {
    let state = false;
    for (let name of this.illegalTags) {
      if (element.nodeName == name) state = true;
    }
    return state
  }

  collectDataSet() {
    let trainSet = [],
        testSet = [];
    let testSetId = [];
    let nodeLength = this.nodeRoot.length;

    // обход в глубину
    for (let i = 0; i < nodeLength; i++) {
      let vector = [];
      let element = this.nodeRoot[i];
      if (this.isIllegalTag(element)) continue
      let nameTag = this.nameTag(element),
          countChildren = this.countChildren(element),
          level = this.level(element),
          nameClass = this.nameClass(element),
          nameParent = this.nameParent(element),
          style = this.style(element),
          target = this.getTarget(element);

      if (isNaN(target)) {
        vector.push(nameTag, countChildren, level, ...nameClass, ...nameParent, ...style);
        testSet.push(vector);
        testSetId.push(i); // для последующего нахождения элемента по id
      } else {
        vector.push(nameTag, countChildren, level, ...nameClass, ...nameParent, ...style, target)
        trainSet.push(vector);
      }
    }

    let dataSet = {
      'trainSet': trainSet,
      'testSet': testSet,
      'testSetId': testSetId,
      'pageElements': this.nodeRoot
    };

    return dataSet;
  }
}
// -----------------------------Gaussian Naive Bayesian Classifier---------------------------
class GaussNB {
  constructor() {
    this.model = {};

    this.percentTest = 0.67;
  }

  test(trainSet) {
    let newDataSet = this.splitDataForTest(trainSet),
        newTrainSet = newDataSet['trainSet'],
        newTestSet = newDataSet['testSet'];
      
    this.train(newTrainSet);
      
    let predicted = this.predict(newTestSet),
        accuracy = this.accuracy(newTestSet, predicted);
    return accuracy
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  splitDataForTest(data) {
    let trainSize = Math.round(data.length * this.percentTest);
    let trainSet = [];
    for (let i = 0; i < trainSize; i++) {
      let index = this.getRandomInt(0, data.length);
      trainSet.push(data[index]);
      data.splice(index, 1);
    }
    let dataSet = {
      'trainSet': trainSet,
      'testSet': data
    }
    return dataSet;
  }

  accuracy(testSet, predicted) {
    let correct = 0;
    let actual = [];
    for (let testVector of testSet) {
      let targetIndex = testVector.length - 1;
      actual.push(testVector[targetIndex]);
    }
    let actualLength = actual.length;
    for (let index = 0; index < actualLength; index++) {
      if (actual[index] == predicted[index]['target']) {
        correct += 1;
      }
    }
    let countVectors = parseFloat(testSet.length);
    let  result = correct / countVectors;
    return result;
  }

  sumInArray(arr) {
    let result = 0;
    let arrLength = arr.length
    for (let i = 0; i < arrLength; i++) {
      result += arr[i];
    }
    return result;
  }

  mean(featureColumn) {
    let sumElements = this.sumInArray(featureColumn),
      countElements = parseFloat(featureColumn.length),
      result = sumElements / countElements;
    return result;
  }

  standardDeviation(featureColumn) {
    let mean = this.mean(featureColumn);
    let squaredDifferenceArr = [];

    for (let number of featureColumn) {
      let difference = number - mean,
        squaredDifference = Math.pow(difference, 2);
      squaredDifferenceArr.push(squaredDifference);
    }

    let squaredDifferenceSum = this.sumInArray(squaredDifferenceArr);
    let countElementsN = parseFloat(featureColumn.length - 1);

    if (countElementsN == 0) return 0;                      // ???
    let variance = squaredDifferenceSum / countElementsN;
    let standardDeviation = Math.sqrt(variance);
    
    return standardDeviation;
  }

  groupByTarget(trainSet, targetIndex) {
    let targetMap = {},
      trainSetLength = trainSet.length;
    for (let vectorIndex = 0; vectorIndex < trainSetLength; vectorIndex++) {
      let vector = trainSet[vectorIndex],
        target = vector[targetIndex];
      let features = [];
      if (!(targetMap.hasOwnProperty(target))) {
        targetMap[target] = [];
      }
      let featuresLength = vector.length - 1;
      for (let elIndex = 0; elIndex < featuresLength; elIndex++) {
        features.push(vector[elIndex]);
      }
      targetMap[target].push(features);
    }
    console.log(`Identified ${Object.keys(targetMap).length} classes: ${Object.keys(targetMap)}`);
    return targetMap;
  }

  summarize(vectorsOfTarget) {
    let summary = [],
      meanStdev = {};
    let featuresLength = vectorsOfTarget[0].length;
    for (let elIndex = 0; elIndex < featuresLength; elIndex++) {
      let featureCol = [],
        countVectors = vectorsOfTarget.length;
      for (let featureIndex = 0; featureIndex < countVectors; featureIndex++) {
        featureCol.push(vectorsOfTarget[featureIndex][elIndex]);
      }
      meanStdev = {
        'stdev': this.standardDeviation(featureCol),
        'mean': this.mean(featureCol)
      };
      summary.push(meanStdev);
    }
    return summary;
  }

  prior(targetMap, target, trainSet) {
    let totalVectors = parseFloat(trainSet.length),
      vectorsTargetCount = targetMap[target].length,
      prior = vectorsTargetCount / totalVectors;
    return prior;
  }

  train(trainSet, targetIndex = trainSet[0].length - 1) {
    let targetMap = this.groupByTarget(trainSet, targetIndex);
    this.model = {};
    for (let target in targetMap) {
      if (targetMap.hasOwnProperty(target)) {
        let vectors = targetMap[target];
        this.model[target] = {
          'prior': this.prior(targetMap, target, trainSet),
          'meanStdev': this.summarize(vectors)
        }
      }
    }

  }



  probabilityDensityFunction(element, mean, stdev) {    
    if (stdev == 0) { // ???
      if (element == mean) {
        return 1
      } else {
        return 0
      }
    }

    let variance = Math.pow(stdev, 2),
        difference = element - mean,
        squaredDifference = Math.pow(difference, 2),
        expPower = (-1 / 2) * (squaredDifference / variance),
        exponent = Math.exp(expPower),
        denominator = Math.sqrt(2 * Math.PI) * stdev,
        pdf = exponent / denominator;
    
    return pdf;
  }

  likelihood(testVector, priorMeanStdev) {
    let likelihood = 1;
    let totalFeatures = priorMeanStdev['meanStdev'].length;  // ! проходится только по длине features, не включая target (для теста)

    for (let index = 0; index < totalFeatures; index++) {
      let feature = testVector[index],
          mean = priorMeanStdev['meanStdev'][index]['mean'],
          stdev = priorMeanStdev['meanStdev'][index]['stdev'],
          pdf = this.probabilityDensityFunction(feature, mean, stdev);
      
      likelihood *= pdf;
    }

    return likelihood;
  }

  jointProbabilities(testVector) {
    let jointProbs = {};
    for (let target in this.model) {
      if (this.model.hasOwnProperty(target)) {
        let priorMeanStdev = this.model[target],
            prior = priorMeanStdev['prior'],
            likelihood = this.likelihood(testVector, priorMeanStdev);
        
        jointProbs[target] = prior * likelihood;
      }
    }

    return jointProbs;
  }

  marginal(jointProbabilities) {
    let numbers = Object.values(jointProbabilities);
    let marginal = this.sumInArray(numbers);
    return marginal;
  }

  posterior(testVector) {
    let posterior = {};
    let jointProbabilities = this.jointProbabilities(testVector),
      marginal = this.marginal(jointProbabilities);
    for (let target in jointProbabilities) {
      if (jointProbabilities.hasOwnProperty(target)) {
        let jointProb = jointProbabilities[target];
        posterior[target] = jointProb / marginal;
      }
    }
    return posterior;
  }

  getPrediction(testVector) {
    let prediction = {};
    let bestProb = 0,
        bestTarget;
    
    let posterior = this.posterior(testVector);

    for (let target in posterior) {
      if (posterior.hasOwnProperty(target)) {
        let targetProb = posterior[target];
        if (targetProb > bestProb) {
          bestProb = targetProb;
          bestTarget = target;
        }
      }
    }

    prediction = {
      'target': bestTarget,
      'probability': bestProb
    };

    return prediction;
  }

  predict(testSet) {
    let predictions = [];

    for (let testVector of testSet) {
      let result = this.getPrediction(testVector);
      predictions.push(result);
    }

    return predictions;
  }
}
// -----------------------------Logistic Regression---------------------------
class LogisticRegression {
  constructor() {
    this.weights = [];
    this.bias = 0;
    this.nIters = 600;
    this.learningRate = 0.01;

    this.percentTest = 0.67;
    this.probabilityRateTest = 0.5;
  }

  test(trainSet) {
    let newDataSet = this.splitDataForTest(trainSet),
        newTrainSet = newDataSet['trainSet'],
        newTestSet = newDataSet['testSet'];
      
    this.train(newTrainSet);
      
    let predicted = this.predict(newTestSet);

    let accuracy = this.accuracy(newTestSet, predicted);

    return accuracy
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  splitDataForTest(data) {
    let trainSize = Math.round(data.length * this.percentTest);
    let trainSet = [];
    for (let i = 0; i < trainSize; i++) {
      let index = this.getRandomInt(0, data.length);
      trainSet.push(data[index]);
      data.splice(index, 1);
    }
    let dataSet = {
      'trainSet': trainSet,
      'testSet': data
    }
    return dataSet;
  }

  accuracy(testSet, predicted) {
    let correct = 0;
    let actual = [];
    let countVectors = testSet.length;

    for (let testVector of testSet) {
      let targetIndex = testVector.length - 1;
      actual.push(testVector[targetIndex]);
    }

    let targetPredicted = [];
    for (let elem of predicted) {
      if (elem[0] > this.probabilityRateTest) {
        targetPredicted.push(1);
      } else {
        targetPredicted.push(0);
      }
    }

    for (let index = 0; index < countVectors; index++) {
      if (actual[index] == predicted[index]) {
        correct += 1;
      }
    }
  
    let result = correct / countVectors;
    
    return result;
  }

  splitVectorsTargets(trainSet) {
    let targets = [];    
    let targetIndex = trainSet[0].length - 1;
    let vectorTarget = {};

    for (let vector of trainSet) {
      let target = [];
      target.push(vector[targetIndex]);
      targets.push(target);
      vector.pop();
  }
  vectorTarget = {
    'trainVectors': trainSet,
    'targets': targets
  };

  return vectorTarget
}

  multiplyMatrix(matrix1, matrix2) {
    let m1Rows = matrix1.length,
        m1Cols = matrix1[0].length,
        m2Cols = matrix2[0].length;
      
    let result = new Array(m1Rows);

    if (m1Cols == 1) {
      for (let row=0; row < m1Rows; row++) {
        result[row] = new Array(m2Cols);
        for (let col=0; col < m2Cols; col++) {
          result[row][col] = matrix1[row][col] * matrix2[row][col]
        }
      }
    } else {
      for (let row=0; row < m1Rows; row++) {
        result[row] = new Array(m2Cols);
        for (let col=0; col < m2Cols; col++) {
          result[row][col] = 0;
          for (let i=0; i < m1Cols; i++) {
            result[row][col] += matrix1[row][i] * matrix2[i][col];
          }
        }
      }
    }

    return result
  }

  transposeMatrix(matrix) {
    let rows = matrix.length,
        cols = matrix[0].length;
    let result = new Array(cols);

    for (let col=0; col < cols; col++) result[col] = new Array(rows);

    for (let row=0; row < rows; row++) {
      for (let col=0; col < cols; col++) {
        result[col][row] = matrix[row][col];
      }
    }

    return result
  }

  differenceMatrix(matrix1, matrix2) {
    let rows = matrix1.length,
        cols = matrix1[0].length;
    let result = new Array(rows);

    for (let row=0; row < rows; row++) {
      result[row] = new Array(cols);
      for (let col=0; col < cols; col++) {
        result[row][col] = matrix1[row][col] - matrix2[row][col];
      }
    }

    return result
  }

  summarizeMatrix(matrix1, matrix2) {
    let rows = matrix1.length,
        cols = matrix1[0].length;
    let result = new Array(rows);

    for (let row=0; row < rows; row++) {
      result[row] = new Array(cols);
      for (let col=0; col < cols; col++) {
        result[row][col] = matrix1[row][col] + matrix2[row][col];
      }
    }

    return result
  }

  multiplayNumberOnMatrix(number, matrix) {
    let rows = matrix.length,
        cols = matrix[0].length;
    let result = new Array(rows);

    for (let row=0; row < rows; row++) {
      result[row] = new Array(cols);
      for (let col=0; col < cols; col++) {
        result[row][col] = number * matrix[row][col];
      }
    }

    return result
  }

  summNumberOnMatrix(number, matrix) {
    let rows = matrix.length,
        cols = matrix[0].length;
    let result = new Array(rows);

    for (let row=0; row < rows; row++) {
      result[row] = new Array(cols);
      for (let col=0; col < cols; col++) {
        result[row][col] = number + matrix[row][col];
      }
    }

    return result
  }

  logMatrix(matrix) {
    let rows = matrix.length,
        cols = matrix[0].length;
    let result = new Array(rows);

    for (let row=0; row < rows; row++) {
      result[row] = new Array(cols);
      for (let col=0; col < cols; col++) {
        let number = matrix[row][col];
        result[row][col] = Math.log(number);
      }
    }

    return result
  }

  sumElementsMatrix(matrix) {
    let rows = matrix.length,
        cols = matrix[0].length;
    let result = 0.0;

    for (let row=0; row < rows; row++) {
      for (let col=0; col < cols; col++) {
        result += matrix[row][col];
      }
    }

    return result
  }

  sigmaod(logit) {
    // 1 / (1 + exp(logit))
    let rows = logit.length,
        cols = logit[0].length;
    let logistic = new Array(rows);
    
    for (let row=0; row < rows; row++) {
      logistic[row] = new Array(cols);
      for (let col=0; col < cols; col++) {
        let invElement = -logit[row][col],
            exponent = Math.exp(invElement);
        logistic[row][col] = 1 / (1 + exponent);
      }
    }

    return logistic
  }

  train(trainSet) {
    let data = this.splitVectorsTargets(trainSet),
        trainVectors = data['trainVectors'],
        targets = data['targets'];

    // step 0: инициализация параметров
    let countVecotrs = trainVectors.length,
        countFeatures = trainVectors[0].length;
    
    for (let i=0; i < countFeatures; i++) this.weights.push([0]);
    this.bias = 0;

    let costs = [];    

    for (let iter=0; iter < this.nIters; iter++) {
      // step 1,2: линейная комбинация features и wights, применение функции активации - sigmoid
      let fx = this.multiplyMatrix(trainVectors, this.weights),
          logit = this.summNumberOnMatrix(this.bias, fx),
          targetPredict = this.sigmaod(logit); // y_predict = sigmoid(np.dot(X, self.weights) + self.bias)
      
      // step 3: вычисление cost
      let oneMatrix = new Array(targetPredict.length).fill([1]);

      let coeff = 1 / countVecotrs;
      let logsTP = this.logMatrix(targetPredict);
      let mulTargetLogsTP = this.multiplyMatrix(targets, logsTP);

      let diffTargetPredict = this.differenceMatrix(oneMatrix, targetPredict);
      let logsDiffTP = this.logMatrix(diffTargetPredict);

      let diffTargetTrue = this.differenceMatrix(oneMatrix, targets);
      let mulDiffTTlogsDiffTP = this.multiplyMatrix(diffTargetTrue, logsDiffTP);
      let sum = this.summarizeMatrix(mulTargetLogsTP, mulDiffTTlogsDiffTP);
      
      let sumElements = this.sumElementsMatrix(sum);

      let cost = -coeff * sumElements; // cost = (- 1 / countVecotrs) * np.sum(y_true * np.log(y_predict) + (1 - y_true) * (np.log(1 - y_predict)))

      // step 4: вычисление gradients
      let trainVectorsT = this.transposeMatrix(trainVectors);
      let error = this.differenceMatrix(targetPredict, targets);
      let mulTvtErr = this.multiplyMatrix(trainVectorsT, error);
      let deltaWeights = this.multiplayNumberOnMatrix(coeff, mulTvtErr); // dw = (1 / countVecotrs) * np.dot(X.T, (y_predict - y_true))

      let sumError = this.sumElementsMatrix(error);
      let deltaBias = coeff * sumError; // db = (1 / countVecotrs) * np.sum(y_predict - y_true)

      // step 5: обновление рараметров
      let mullW = this.multiplayNumberOnMatrix(this.learningRate, deltaWeights);
      this.weights = this.differenceMatrix(this.weights, mullW); // self.weights = self.weights - learning_rate * dw

      let mullB = this.learningRate * deltaBias;
      this.bias = this.bias - mullB; // self.bias = self.bias - learning_rate * db

      costs.push(cost);
      if (iter % 100 == 0) console.log(`Cost after iteration ${iter}: ${cost}  bias: ${self.bias}`)
    }
  }

  getPrediction(percentTarget) {
    let predictions = [];
    let prediction = {};
    
    let targetPredicted;
    for (let elem of percentTarget) {
      if (elem[0] > this.probabilityRateTest) {
        targetPredicted = 1;
      } else {
        targetPredicted = 0;
      }

      prediction = {
        'target': targetPredicted,
        'probability': elem[0]
      };

      predictions.push(prediction);
    }

    return predictions
  }

  predict(testSet) {
    let fx = this.multiplyMatrix(testSet, this.weights);
    let logit = this.summNumberOnMatrix(this.bias, fx);
    let percentTarget = this.sigmaod(logit);

    let predictions = this.getPrediction(percentTarget);

    return predictions
  }

}
// -----------------------------Selector---------------------------
class Selector {
  constructor() {
    this.selectedElements = [];
    this.eventMethod = [
      { onEvent: 'mouseover', method: this.MouseOverOutEffect.bind(this) },
      { onEvent: 'mouseout', method: this.MouseOverOutEffect.bind(this) },
      { onEvent: 'click', method: this.ClickEffect.bind(this) },
      { onEvent: 'dblclick', method: this.DoubleClickEffect.bind(this) }
    ];
    
    this.dataTargetFalse = 0;
    this.dataTargetTrue = 1;    
    this.dataTargetPredict = 2;
    this.predictedElements = [];

    this.probabilityRate = 0.8;
    this.mlMethod = 1;
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
    if (request.mlMethod) this.mlMethod = parseInt(request.mlMethod, 10);
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

  // выделить как "плохой" элемент и добавить dataset=0
  DoubleClickEffect(event) {
    event.preventDefault();
    let element = event.target
    element.dataset.target = this.dataTargetFalse;
    this.PushUniqueElement(element);
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

  PredictedOnMethod(trainSet, testSet) {
    let ML;
    if (this.mlMethod == 1) {
      ML = new GaussNB();
    } else if (this.mlMethod == 2) {
      ML = new LogisticRegression();
    } else {
      console.log('Apriori mlMethod')
    }

    if (testSet.length == 0) { // test  
      let  accuracy = ML.test(trainSet);
      console.log(`Accuracy: ${accuracy}`);
      return false
    } else {
        ML.train(trainSet);
        let predicted = ML.predict(testSet);
        return predicted
    }
  }

  Show() {
    let dataSetCollector = new DataSetСollector(this.mlMethod);
    let dataSet = dataSetCollector.collectDataSet();
    console.log(dataSet);
    
    // let trainSet = dataSet['trainSet'];
    // let testSet = dataSet['testSet'];
    let trainSet = [[-3,7,3],[1,5,3], [1,2,3], [-2,0,3], [2,3,4], [-4,0,3], [-1,1,3], [1,1,4], [-2,2,3], [2,7,4], [-4,1,4], [-2,7,4]];
    let testSet = [[1,2],[3,4]];
    
    if (trainSet.length == 0) { // если нет тренировочных данных -> выход
      console.log('no train set error');
      return
    }

    let predicted = this.PredictedOnMethod(trainSet, testSet);
    console.log(predicted);
    
    // show predicted
    if (predicted == false) return // если тест -> выход

    this.ClearPredictedElements();
    let predictLength = predicted.length;    
    let testSetId = dataSet['testSetId'];
    let pageElements = dataSet['pageElements'];

    for (let index = 0; index < predictLength; index++) {
      let elem = predicted[index];
      if ((elem['target'] == this.dataTargetTrue) && (elem['probability'] > this.probabilityRate)) {
        let id = testSetId[index],
            pageElem = pageElements[id];
        pageElem.dataset.predict = this.dataTargetPredict;
        this.predictedElements.push( pageElem );
      }
    }
    console.log(testSetId);
    console.log(this.predictedElements);
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