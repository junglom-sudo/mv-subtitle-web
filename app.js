document.getElementById('processBtn').addEventListener('click', function() {
    const file = document.getElementById('srtFile').files[0];
    if (!file) { alert('沒抓到檔案！'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const blocks = content.split('\n\n');
        alert('檔案讀取成功！總共抓到 ' + blocks.length + ' 個字幕塊。');
    };
    reader.readAsText(file);
});