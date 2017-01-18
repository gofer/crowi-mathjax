# Crowi + MathJax

## なにこれ
[Crowi](https://github.com/crowi/crowi) with MathJax

![image](./screenshot.gif)

## 使い方
### `layout.html`を修正
以下のコードを `lib/views/layout/layout.html` のそれっぽいところへ挿入
```html
<script type="text/x-mathjax-config">
  MathJax.Hub.Config({
    tex2jax: {
      inlineMath: [ ['$','$'] ],
      displayMath: [ ['$$','$$'] ],
      processEscapes: true
    }
  });
</script>
<script type="text/javascript" async src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML"></script>
<script>
  $(document).ready(function(){
    if($('div#preview-body').size() > 0) {
      var observer = new MutationObserver(function(){
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'preview-body']);
      });
      observer.observe($('div#preview-body')[0], { childList: true, subtree: false });
    }
  });
</script>
```

### スクリプトファイルの差し替え
以下のスクリプトを差し替える
- `/usr/src/app/resource/js/util/PreProcessor/MathJaxFormula.js`
- `/usr/src/app/resource/js/util/CrowiRenderer.js`

### Docker([Bakudankun/docker-crowi](https://github.com/Bakudankun/docker-crowi))を使うとき
```shell
docker cp layout.html       $(docker ps -q -f 'ancestor=bakudankun/crowi:latest'):/usr/src/app/lib/views/layout/layout.html
docker cp MathJaxFormula.js $(docker ps -q -f 'ancestor=bakudankun/crowi:latest'):/usr/src/app/resource/js/util/PreProcessor/MathJaxFormula.js
docker cp CrowiRenderer.js  $(docker ps -q -f 'ancestor=bakudankun/crowi:latest'):/usr/src/app/resource/js/util/CrowiRenderer.js
```

