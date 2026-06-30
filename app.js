// 檔案選取更換名稱
document.getElementById('srtFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : "尚未選擇檔案";
    document.getElementById('fileName').innerText = fileName;
});

// 核心比對演算法：最小編輯距離 (Levenshtein Distance) 算相似度
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

// 點擊處理主邏輯
document.getElementById('processBtn').addEventListener('click', function() {
    const srtFile = document.getElementById('srtFile').files[0];
    const lyricsText = document.getElementById('lyricsInput').value;
    
    if (!srtFile || !lyricsText.trim()) {
        alert('請上傳 SRT 檔案並貼上正確歌詞！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const srtContent = e.target.result;
        processSubtitles(srtContent, lyricsText);
    };
    reader.readAsText(srtFile);
});

function processSubtitles(srtContent, lyricsText) {
    const fillers = document.getElementById('fillersInput').value.split(',').map(s => s.trim());
    const fontName = document.getElementById('fontName').value;
    const fontSize = document.getElementById('fontSize').value;
    // 將 #FFFFFF 轉成 ASS 格式的 &HFFFFFF&
    const htmlColor = document.getElementById('fontColor').value.toUpperCase();
    const assColor = `&H00${htmlColor.substring(5,7)}${htmlColor.substring(3,5)}${htmlColor.substring(1,3)}&`;

    // 解析歌詞庫
    const lyricsLines = lyricsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // 解析 SRT 檔
    const srtBlocks = srtContent.replace(/\r\n/g, '\n').split('\n\n');
    let assDialogues = [];
    let lyricsIdx = 0;

    srtBlocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
            const timeLine = lines[1];
            // 轉換時間格式 00:00:01,200 -> 0:00:01.20
            const assTime = timeLine.replace(/,/g, '.').replace(/00:/g, '0:').substring(0, 22);
            const times = assTime.split(' --> ');
            const startTime = times[0].substring(0, 10);
            const endTime = times[1].substring(0, 10);

            let originalText = lines.slice(2).join(' ');
            
            // 清理填充詞做比對
            let cleanText = originalText;
            fillers.forEach(f => { if(f) cleanText = cleanText.split(f).join(''); });
            cleanText = cleanText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()？，。！「」]/g, "");

            let bestMatch = originalText;
            let maxSim = 0;
            let chosenIdx = lyricsIdx;

            // 在目前歌詞指標後 5 句內找尋最佳匹配
            const searchWindow = 5;
            for (let i = 0; i < searchWindow; i++) {
                let currentCheckIdx = lyricsIdx + i;
                if (currentCheckIdx >= lyricsLines.length) break;

                let targetLyrics = lyricsLines[currentCheckIdx];
                let cleanTarget = targetLyrics.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()？，。！「」]/g, "");
                
                let sim = getSimilarity(cleanText, cleanTarget);
                if (sim > maxSim) {
                    maxSim = sim;
                    bestMatch = targetLyrics;
                    chosenIdx = currentCheckIdx;
                }
            }

            // 相似度大於 0.45 則進行取代並推進歌詞指標
            if (maxSim > 0.45) {
                originalText = bestMatch;
                lyricsIdx = chosenIdx + 1;
            }

            assDialogues.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${originalText}`);
        }
    });

    // 組裝 ASS 檔案標頭與樣式
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
    
    // 讓瀏覽器下載檔案
    const blob = new Blob(["\ufeff" + finalAssContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "optimized_subtitles.ass";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}