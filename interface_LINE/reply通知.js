// 応答メッセージURL
const REPLY = "https://api.line.me/v2/bot/message/reply";

// アクセストークン
const ACCESS_TOKEN = "++45gcv6xxu+5cgAVZLMq76e7mQUU7XkJYAoib0oJvbcFZPMBJNVoJ/i6WM0htn5rvmEIuoluYdZDoUJJFHmOhFUYD/nkw2ztruH0mx02Rety0P/YuKZIZnppkBcR5e4SY8uJjBpsv+/eyj494RgswdB04t89/1O/w1cDnyilFU=";

// スプレッドシート情報
const SHEET_ID   = '10SHH-TAWTVnHm5OMz_kFSaHmuucAEYhlUuuqrJTCG_U';
const SHEET_URL  = 'https://docs.google.com/spreadsheets/d/10SHH-TAWTVnHm5OMz_kFSaHmuucAEYhlUuuqrJTCG_U/edit#gid=0';
const SHEET_DATA = SpreadsheetApp.openById(SHEET_ID).getSheetByName('現在の出勤状況');
const SHEET_LOG  = SpreadsheetApp.openById(SHEET_ID).getSheetByName('ログ');

function doGet(e) {
  
  let result = {};

  if (e.parameter == undefined) {
    // 受信に失敗した場合
    result['result'] = 'NG';
  } else {
    // 受信に成功した場合
    const val = e.parameter['val'];
    SHEET_DATA.appendRow([val]);
    result['result'] = 'OK';
  }
  
  return ContentService.createTextOutput(JSON.stringify(result));  
  
}

function doPost(e) {

  //メッセージ受信
  const data = JSON.parse(e.postData.contents).events[0];
  //ユーザーID取得
  const lineUserId = data.source.userId;
  // リプレイトークン取得
  const replyToken = data.replyToken;
  // 送信されたメッセージ取得
  const postMsg = data.message.text;
  // 出勤しているかの確認
  const UserData = findUser(lineUserId);

  // ログにポスト内容とユーザー情報を記載
  debugLog(postMsg, lineUserId);
  
  // 交通費精算の処理の為のフラッグ
  let transportationFlag = 0;
  transportationFlag = postMsg.indexOf("から");
  
  if (transportationFlag > 0) {
    // 交通費精算の処理
    ekisupa(replyToken, postMsg, lineUserId);
  } else if (typeof UserData === "undefined") {
    // 「現在の出勤状況」のシートにデータがなかった場合の処理
    if ('オフィス出勤' === postMsg || 'テレワーク' === postMsg ) {
      flexMessage(replyToken, postMsg, lineUserId);
      userlog(postMsg, lineUserId);
    } else {
      sendMessage(replyToken, '「オフィス出勤」もしくは「テレワーク」と送信ください。');
    }
  } else {
  
    // 出勤があった場合の処理
    if ('退勤' === postMsg) {
      sendMessage(replyToken, '本日もお疲れ様でした！');
      userLeave(lineUserId);
    } else if ('離着席' === postMsg) {
      userTemporarilyLeave(replyToken, lineUserId);
    } else {
      sendMessage(replyToken, `${UserData}さんはすでに出勤済みです。\n「退勤」と送信すると退勤できます。`);
    }
  }
  
}

///////////////////////////////
// 出勤しているかのユーザー検索
///////////////////////////////
function findUser(uid) {
  return getUserData().reduce(function(uuid, row) { return uuid || (row.key === uid && row.value); }, false) || undefined;
}

///////////////////////////////
// 出勤していた場合のユーザー情報取得
///////////////////////////////
function getUserData() {
  const data = SHEET_DATA.getDataRange().getValues();
  return data.map(function(row) { return {key: row[0], value: row[1]}; });
}

///////////////////////////////
// テキストreplyメッセージ
///////////////////////////////
function sendMessage(replyToken, replyText) {
  const postData = {
    "replyToken" : replyToken,
    "messages" : [
      {
        "type" : "text",
        "text" : replyText
      }
    ]
  };
  return postMessage(postData);
}


///////////////////////////////
// JSON形式データをPOST
///////////////////////////////
function postMessage(postData) {
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    "Authorization" : "Bearer " + ACCESS_TOKEN
  };
  const options = {
    "method" : "POST",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  };
  return UrlFetchApp.fetch(REPLY, options);
}

///////////////////////////////
// ユーザーのプロフィール名取得
///////////////////////////////
function getUserDisplayName(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const userProfile = UrlFetchApp.fetch(url,{
    'headers': {
      'Authorization' :  'Bearer ' + ACCESS_TOKEN,
    },
  })
  return JSON.parse(userProfile).displayName;
}

///////////////////////////////
// ユーザーのプロフィール画像取得 
///////////////////////////////
function getUserDisplayIMG(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const userProfile = UrlFetchApp.fetch(url,{
    'headers': {
      'Authorization' :  'Bearer ' + ACCESS_TOKEN,
    },
  })
  return JSON.parse(userProfile).pictureUrl;
}

///////////////////////////////
//デバック記録
///////////////////////////////
function debugLog(text, userId) {
  const date = new Date();
  const userName = getUserDisplayName(userId);
  SHEET_LOG.appendRow([userId, `=IFERROR(VLOOKUP("${userId}",'メンバー'!A:B, 2, FALSE), "${userName}")`, text, Utilities.formatDate( date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')]);
}

///////////////////////////////
// ユーザー登録（出勤登録）
///////////////////////////////
function userlog(postMsg, userId) {
  const date = new Date();
  const userName = getUserDisplayName(userId);
  const userIMG = getUserDisplayIMG(userId);
  SHEET_DATA.appendRow([userId, `=IFERROR(VLOOKUP("${userId}",'メンバー'!A:B, 2, FALSE), "${userName}")`, userIMG, Utilities.formatDate( date, 'Asia/Tokyo', 'HH:mm'), "出勤中", postMsg]);
}

///////////////////////////////
// ユーザー退勤（シートから削除）
///////////////////////////////
function userLeave(userId) {

  // 送信したユーザー先のユーザーを検索
  const textFinder = SHEET_DATA.createTextFinder(userId);
  const ranges = textFinder.findAll();

  // 出勤していなければ何もしない
  if(!ranges[0]){
    return;
  }

  // 送信ユーザーを現在の出勤状況のシートから削除
  SHEET_DATA.deleteRows(ranges[0].getRow());
}

///////////////////////////////
// 出勤中のユーザーをグレーアウトして、ステータスを「離席中」に変更（離席中の場合は、元に戻す。）
///////////////////////////////
function userTemporarilyLeave(replyToken, userId) {

  // 送信したユーザー先のユーザーを検索
  const textFinder = SHEET_DATA.createTextFinder(userId);
  const ranges = textFinder.findAll();

  // 出勤していなければ削除
  if(!ranges[0]){
    return;
  }
  
  // ステータスを出勤中から離席中に変更
  const statusFinder = SHEET_DATA.createTextFinder('ステータス');
  const statusRanges = statusFinder.findAll();
  const row    = ranges[0].getRow();
  const column = statusRanges[0].getColumn();
  
  const status = SHEET_DATA.getRange(row, column).getValue();
  
  if ('出勤中' === status) {
    // ユーザーのステータスを「離席中」に変更
    sendMessage(replyToken, '離席しました。行ってらっしゃい！');
    SHEET_DATA.getRange(row, column).setValue('離席中');
    
    // ユーザーをグレーアウト
    SHEET_DATA.getRange(row+":"+row).setBackground('#CCCCCC');
  } else {  
    // ユーザーのステータスを「出勤中」に変更
    sendMessage(replyToken, '着席しました。お帰りなさい！');
    SHEET_DATA.getRange(row, column).setValue('出勤中');

    // ユーザーをグレーアウト解除
    SHEET_DATA.getRange(row+":"+row).setBackground(null);
  }    
  
}

///////////////////////////////
// 出勤した時のメッセージ
///////////////////////////////
function flexMessage(replyToken, postMsg, userId) {
  const userName = getUserDisplayName(userId);
  const userIMG  = getUserDisplayIMG(userId);
  
  // replyするメッセージの定義
  const postData = {
    
    "replyToken" : replyToken,
    "messages" : [
      {
        "type": "flex",
        "altText": "Flex Message",
        "contents": {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": userIMG,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover",
            "action": {
              "type": "uri",
              "label": "Line",
              "uri": SHEET_URL
            }
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": `${userName}さん`,
                "size": "xl",
                "weight": "bold"
              },
              {
                "type": "box",
                "layout": "baseline",
                "margin": "md",
                "contents": [
                  {
                    "type": "text",
                    "text": "出勤完了。今日も1日頑張ろう！",
                    "flex": 0,
                    "margin": "md",
                    "size": "md",
                    "color": "#000000"
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "flex": 0,
            "spacing": "sm",
            "contents": [
              {
                "type": "button",
                "action": {
                  "type": "message",
                  "label": "離席・着席",
                  "text": "離着席"
                },
                "height": "sm",
                "style": "link"
              }, {
                "type": "button",
                "action": {
                  "type": "message",
                  "label": "退勤",
                  "text": "退勤"
                },
                "height": "sm",
                "style": "link"
              }
            ]
          }
        }
      }
    ]
  };
  return postMessage(postData);

}