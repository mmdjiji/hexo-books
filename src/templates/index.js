/* eslint-disable no-plusplus */
(function () {
  Element.prototype.siblings = function () {
    const siblingElement = [];
    const sibs = this.parentNode.children;
    for (let i = 0; i < sibs.length; i++) {
      if (sibs[i] !== this) {
        siblingElement.push(sibs[i]);
      }
    }
    return siblingElement;
  };
  // eslint-disable-next-line func-style
  function tabClick() {
    // 修改标签样式
    this.classList.add('book-active');
    let sibs = this.siblings();
    for (let j = 0; j < sibs.length; j++) {
      sibs[j].classList.remove('book-active');
    }
    // 显示对应板块
    const itemId = this.id.replace('tab', 'item');
    const target = document.getElementById(itemId);
    target.classList.remove('book-hide');
    target.classList.add('book-show');
    sibs = document.getElementById(itemId).siblings();
    for (let k = 0; k < sibs.length; k++) {
      sibs[k].classList.remove('book-show');
      sibs[k].classList.add('book-hide');
    }
  }
  const tabs = document.getElementsByClassName('book-tab');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].onclick = tabClick;
    tabs[i].onclick.apply(tabs[i]);
  }
}());
