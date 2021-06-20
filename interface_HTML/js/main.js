//今日の日付データを変数に格納
var today = new Date(); 

//年・月・日・曜日を取得
var year = today.getFullYear();
var month = today.getMonth();
var week = today.getDay();
var day = today.getDate();

var week_ja= new Array("日","月","火","水","木","金","土");

//時・分を取得
var hour = today.getHours();
var minute = today.getMinutes();

//年・月・日・曜日を書き出す
$("#today").html(year+"年"+month+"月"+day+"日 "+"("+week_ja[week]+") "+hour+"時"+minute+"分");
