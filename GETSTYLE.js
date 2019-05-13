function dumpComputedStyles(elem) {

    let css = window.getComputedStyle(elem,null);

    let len = css.length;
    console.log(len);

    for (let i=0;i<len;i++) {
      let styleName = css[i];
      console.log(styleName+" : "+css.getPropertyValue(styleName));
    }
  
  }

  let dd = document.body.querySelectorAll('.rouble.GroupAdvertsItem_price__1AyUy') // let dd = document.body.querySelectorAll('.item-price-price-2Ac62')

  let tt = dumpComputedStyles(dd[0])