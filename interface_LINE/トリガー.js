///////////////////////////////
// 毎時深夜1~2時などにトリガー設定必要
///////////////////////////////
function deleteRows() {
  
    const numColumn = SHEET_DATA.getLastColumn(); // 最後列の列番号を取得
    const numRow    = SHEET_DATA.getLastRow()-1;  // 最後行の行番号を取得
    if (numRow == 0) {
      // 誰も出勤していなかった場合、何もしない
      return;
    }
    SHEET_DATA.getRange(2, 1, numRow, numColumn).clear();
    
  }
  