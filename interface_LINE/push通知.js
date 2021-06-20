// プッシュメッセージURL
const push = 'https://api.line.me/v2/bot/message/broadcast';

///////////////////////////////
// 給与申請のリマインド
///////////////////////////////
function salaryRemind() {
  const message = '【※重要】給与申請ご提出ください！\n明日15日 23:59まで';

  // 結果の出力
  broadcast(message);
}

///////////////////////////////
// テキストpushメッセージ
///////////////////////////////
function broadcast(message) {

  UrlFetchApp.fetch(push, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    payload: JSON.stringify({
      messages: [
        {
            type: 'text',
            text: message
        },
      ]
    }),
  });
  
}