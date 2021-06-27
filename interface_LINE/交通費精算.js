///////////////////////////////
// スクレイピングの解説用 //
///////////////////////////////
function scraping() {
    /////①URLの指定/////
    const url = "https://www.i-kasa.com/";
    /////②HTMLテキストの取得/////
    const response = UrlFetchApp.fetch(url);
    const html = response.getContentText('UTF-8');
    /////③タイトルタグの抽出/////
    //開始文字列の指定
    const start_str = "<title>";
    const start_num = html.indexOf(start_str)+start_str.length;
    //終了文字列の指定
    const end_str = "</title>";
    const end_num = html.indexOf(end_str);
    //タイトルタグをスクレイピング
    const title = html.substring(start_num, end_num);
    //結果の出力
    Logger.log(title);
  }
  
  ///////////////////////////////
  // 交通費精算
  ///////////////////////////////
  function ekisupa(replyToken, postMsg, lineUserId) {
    let msgData = {};
    let msg = '';
    
    // 「〇〇から〇〇」の〇〇に入っている前後の駅名を、fromとtoに格納
    let indexOfKara = postMsg.indexOf("から")
    let from = postMsg.substr( 0, indexOfKara );
    let to   = postMsg.substr( indexOfKara + 2 );
    
    // 駅すぱのAPIを使用（keyは、サイトのURLから取得必要） フリープラン（無料） → https://ekiworld.net/free_provision/index.php
    const ekisupaAPI = "https://api.ekispert.jp/v1/json/search/course/light"
    const key        = "***********"; // ***********部分に発行したKeyを入力
    const plane          = "false"; // 飛行機を利用するか（false で利用しない）
    const shinkansen     = "false"; // 新幹線（のぞみ含む）を利用するか（false で利用しない）
    const limitedExpress = "false"; // 特急を利用するか（false で利用しない）
    const response = UrlFetchApp.fetch(`${ekisupaAPI}?key=${key}&from=${from}&to=${to}&plane=${plane}&shinkansen=${shinkansen}&limitedExpress=${limitedExpress}`);
    // 取得例 -> https://api.ekispert.jp/v1/json/search/course/light?key=LE_XR7GXGZqZEjhd&from=東村山&to=御茶ノ水&plane=false&shinkansen=false&limitedExpress=false
      
    // jsonに変換
    const json = JSON.parse(response.getContentText());
    
    // 交通費が確認できるURLの部分を取得
    let url = json["ResultSet"]["ResourceURI"];
    const content = UrlFetchApp.fetch(url).getContentText();
    const $ = Cheerio.load(content);
    const title = $("title").first().text();
    
    msgData["title"] = title.replace("経路検索 | 駅すぱあと for web","")
    msgData["orange_txt"] = [];
    $(".orange_txt").each((index, element) => {
                                             msgData["orange_txt"][index] = $(element).text();
    });
    msg = `${msgData["title"]}${msgData["orange_txt"][2]}\n${url}`;
    
    // 結果の出力
    sendMessage(replyToken, msg);
    debugLog(msg, lineUserId);
  }