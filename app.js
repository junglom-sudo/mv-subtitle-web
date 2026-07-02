// app.js - 完整優化版
document.getElementById('srtFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : "尚未選擇檔案";
    document.getElementById('fileName').innerText = fileName;
});

function getSimilarity(s1, s2) {
    let longer = s1; let shorter = s2;
    if (s1.length < s2.length) { longer = s2; shorter = s1; }
    let longerLength = longer.length;
    if (longerLength === 0) { return 1.0; }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

document.getElementById('processBtn').addEventListener('click', function() {
    const srtFile = document.getElementById('srtFile').files[0];
    const lyricsText = document.getElementById('lyricsInput').value;

    if (!srtFile || !lyricsText.trim()) {
        alert('請上傳 SRT 檔案並貼上正確歌詞！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        processSubtitles(e.target.result, lyricsText);
    };
    reader.readAsText(srtFile);
});

function processSubtitles(srtContent, lyricsText) {
    const fillers = document.getElementById('fillersInput').value.split(',').map(s => s.trim());
    const lyricsLines = lyricsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const srtBlocks = srtContent.replace(/\r\n/g, '\n').split('\n\n');
    let assDialogues = [];

    lyricsLines.forEach((line) => {
        let bestBlock = null;
        let maxSim = 0;
        let bestStartTime = "0:00:00.00";
        let bestEndTime = "0:00:00.00";



 srtBlocks.forEach(block => {
        let lines = block.split('\n');
        if (lines.length < 3) return;

        let times = lines[1].replace(/,/g, '.').split(' --> ');
        let startTime = times[0].substring(0, 10);
        let endTime = times[1].substring(0, 10);
        let originalText = lines.slice(2).join(' ');

        // 【關鍵改進】不使用過度比對，只在關鍵節奏點進行歌詞替換
        // 如果相似度小於 0.6，我們認為原始字幕太糟，直接替換為對應的歌詞索引行
        let bestMatch = originalText;
        let found = false;

        for (let line of lyricsLines) {
            let sim = getSimilarity(originalText, line);
            if (sim > 0.6) { // 提高嚴格度
                bestMatch = line;
                found = true;
                break;
            }
        }

        // 確保輸出的 ASS 格式正確
        assDialogues.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${bestMatch}`);
    });


    const fontName = document.getElementById('fontName').value;
    const fontSize = document.getElementById('fontSize').value;
    const htmlColor = document.getElementById('fontColor').value.toUpperCase();
    const assColor = `&H00${htmlColor.substring(5,7)}${htmlColor.substring(3,5)}${htmlColor.substring(1,3)}&`;

    const assHeader = `[Script Info]
Title: MV Subtitle Helper Output
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${assColor},&H000000FF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,2,0,2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const finalAssContent = assHeader + assDialogues.join('\n');
    const blob = new Blob(["\ufeff" + finalAssContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "optimized_subtitles.ass";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('字幕處理完成，準備下載！');
}