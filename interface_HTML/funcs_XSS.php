<?php
//XSS対応
function h($str){
    return htmlspecialchars($str, ENT_QUOTES);
}
?>


