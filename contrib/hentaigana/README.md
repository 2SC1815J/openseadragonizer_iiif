# OpenSeadragonizer_iiif_hentaigana

[OpenSeadragonizer]改造版（IIIF manifest簡易対応＋変体仮名の画像認識システム）

[OpenSeadragonizer]: http://openseadragon.github.io/openseadragonizer/

## 使い方

表示したいIIIF manifestのURLを入力してください。

- 国文研データセット『[源氏物語]』の[IIIF manifest]を指定して表示する例
  - http://2sc1815j.github.io/openseadragonizer_iiif/contrib/hentaigana/?manifest=http://www2.dhii.jp/nijl/NIJL0001/SA4-0026/manifest.json&page=2

[源氏物語]: http://www2.dhii.jp/nijl_opendata/NIJL0001/SA4-0026/

[IIIF manifest]: http://www2.dhii.jp/nijl/NIJL0001/SA4-0026/manifest.json

### 「変体仮名の画像認識システム」の利用

領域選択モード（「c」キーの押下で切り替え）では、「[変体仮名の画像認識システム]」のAPIを利用して、選択された範囲の文字認識結果を表示します。変体仮名1文字分の範囲を選択してください。

[変体仮名の画像認識システム]: https://hentaigana.herokuapp.com/

### キーボードショートカット (keyboard shortcuts)

- [ n, >, . ] - 次のコマへ移動 (next page)
- [ p, <, , ] - 前のコマへ移動 (previous page)
- [ c ] - 領域選択モード切り替え (toggle selection)
- [ f ] - フルスクリーン切り替え (toggle full page)
