# OpenSeadragonizer_iiif

[OpenSeadragonizer]改造版（IIIF manifest簡易対応）

[OpenSeadragonizer]: http://openseadragon.github.io/openseadragonizer/

## 使い方

表示したいIIIF manifestのURLを入力してください。Annotation表示に簡易対応しています。

- “Bibliothèque nationale de France, NAF 6221”の[IIIF manifest]を指定して表示する例
  - http://2sc1815j.github.io/openseadragonizer_iiif/?manifest=http://dms-data.stanford.edu/data/manifests/BnF/jr903ng8662/manifest.json&page=6

[IIIF manifest]: http://dms-data.stanford.edu/data/manifests/BnF/jr903ng8662/manifest.json

ユーザが外部に用意したアノテーションファイルの内容をオーバーレイ表示することができます。URLの末尾に「&extannots=外部アノテーションファイルのURL」を追加してください。

- 国文研データセット『[絵本松の調]』に対して、ユーザが作成した[アノテーション]を重ねて表示する例
  - http://2sc1815j.github.io/openseadragonizer_iiif/?manifest=http://www2.dhii.jp/nijl/NIJL0008/NA4-0644/manifestt.json&page=3&extannots=https://gist.githubusercontent.com/2SC1815J/c5bd8f1fbe14aa62ae762d5e7073da3d/raw/8bc60d815a737f8c75bef91706634972c386323c/nijl0008_na4-0644_annots.json

[アノテーション]: https://gist.github.com/2SC1815J/c5bd8f1fbe14aa62ae762d5e7073da3d

[絵本松の調]: http://www2.dhii.jp/nijl_opendata/NIJL0008/NA4-0644/

指定するアノテーションファイルは、[IIIF Presentation API 2.0]のotherContentプロパティでリンクされるJSONファイルと同等の内容、もしくはそれらの配列としてください。

- 外部アノテーションファイルの例：https://gist.github.com/2SC1815J/c5bd8f1fbe14aa62ae762d5e7073da3d

[IIIF Presentation API 2.0]:http://iiif.io/api/presentation/2.0/

### キーボードショートカット (keyboard shortcuts)

- [ n, >, . ] - 次のコマへ移動 (next page)
- [ p, <, , ] - 前のコマへ移動 (previous page)
- [ f ] - フルスクリーン切り替え (toggle full page)
