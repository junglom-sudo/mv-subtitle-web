// app.js - 穩定版 (修復檔案讀取與事件監聽)
document.getElementById('srtFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : "尚未選擇檔案";
    document.getElementById('fileName').innerText = fileName;
});

function getSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    let longer = s1; let shorter = s2;
    if (s1.length < s2.length) { longer = s2; shorter = s1; }
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    // 使用簡單的字串比對，避免複雜計算導致瀏覽器卡住
    let count = 0;
    for (let char of shorter) {
        if (longer.includes(char)) count++;
    }
    return count / longerLength;
}

document.getElementById('processBtn').addEventListener('click', function() {
    const srtFile = document.getElementById('srtFile').files[0];
    const lyricsText = document.getElementById('lyricsInput').value;

    if (!srtFile) { alert('請先選擇 SRT 檔案！'); return; }
    if (!lyricsText.trim()) { alert('請貼上歌詞！'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            processSubtitles(e.target.result, lyricsText);
        } catch (err) {
            console.error(err);
            alert('處理過程發生錯誤，請檢查 SRT 格式是否正確。');
        }
    };
    reader.readAsText(srtFile);
});

function processSubtitles(srtContent, lyricsText) {
    const lyricsLines = lyricsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const srtBlocks = srtContent.replace(/\r\n/g, '\n').split('\n\n');
    let assDialogues = [];

    srtBlocks.forEach(block => {
        let lines = block.split('\n');
        if (lines.length < 3) return;

        let times = lines[1].replace(/,/g, '.').split(' --> ');
        let startTime = times[0].substring(0, 10);
        let endTime = times[1].substring(0, 10);
        let originalText = lines.slice(2).join(' ');

        let bestMatch = originalText;
        let maxSim = 0;

        lyricsLines.forEach(line => {
            let sim = getSimilarity(originalText, line);
            if (sim > maxSim) {
                maxSim = sim;
                bestMatch = line;
            }
        });

        if (maxSim > 0.3) { // 門檻設低一點，確保總能對上
            assDialogues.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${bestMatch}`);
        } else {
            assDialogues.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${originalText}`);
        }
    });

    // Header 模組
    const fontName = document.getElementById('fontName').value;
    const fontSize = document.getElementById('fontSize').value;
    const htmlColor = document.getElementById('fontColor').value.toUpperCase();
    const assColor = `&H00${htmlColor.substring(5,7)}${htmlColor.substring(3,5)}${htmlColor.substring(1,3)}&`;

    const assHeader = `[Script Info]\nTitle: MV Subtitle Helper Output\nScriptType: v4.00+\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,${fontName},${fontSize},${assColor},&H000000FF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,2,0,2,10,10,20,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    const blob = new Blob(["\ufeff" + assHeader + assDialogues.join('\n')], { type: "text/plain;charset=utf-8" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "optimized.ass";
    a.click();
}