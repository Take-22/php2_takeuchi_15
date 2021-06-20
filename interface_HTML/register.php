<?php
// 1. POSTデータ取得
//$name = filter_input( INPUT_GET, ","name" ); //こういうのもあるよ
//$email = filter_input( INPUT_POST, "email" ); //こういうのもあるよ
$dept = $_POST["dept"];
$team = $_POST["team"];
$name = $_POST["name"];
$status = $_POST["status"];

// 2. DB接続します
try {
  //Password:MAMP='root',XAMPP=''
  $pdo = new PDO('mysql:dbname=gs_db; charset=utf8; host=localhost','root','root');
} catch (PDOException $e) {
  exit('DBConnectError:'.$e->getMessage());
}


// ３．SQL文を用意(データ登録：INSERT)
$stmt = $pdo->prepare(
  "INSERT INTO `gs_bm_table`(`id`, `dept`, `team`, `name`, `status`, `indate`)
  VALUES( NULL, :dept, :team, :name, :status, sysdate() )"
);

// 4. バインド変数を用意
$stmt->bindValue(':dept', $dept, PDO::PARAM_STR);  //Integer（数値の場合 PDO::PARAM_INT) *** 文字の場合が PDO::PARAM_STR
$stmt->bindValue(':team', $team, PDO::PARAM_STR);  //Integer（数値の場合 PDO::PARAM_INT) *** 文字の場合が PDO::PARAM_STR
$stmt->bindValue(':name', $name, PDO::PARAM_STR);  //Integer（数値の場合 PDO::PARAM_INT) *** 文字の場合が PDO::PARAM_STR
$stmt->bindValue(':status', $status, PDO::PARAM_STR);  //Integer（数値の場合 PDO::PARAM_INT) *** 文字の場合が PDO::PARAM_STR

// 5. 実行
$status = $stmt->execute();

// 6．データ登録処理後
if($status==false){
  //SQL実行時にエラーがある場合（エラーオブジェクト取得して表示）
  $error = $stmt->errorInfo();
  exit("ErrorMassage:".$error[2]);
}else{
  //５．index.phpへリダイレクト
  header('Location: index.php'); //ヘッダーロケーション
}
?>
