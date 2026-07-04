document.getElementById('processBtn').addEventListener('click', function() {
    const file = document.getElementById('srtFile').files[0];
    const lyricsText = document.getElementById('lyricsInput').value;
    if (!file || !lyricsText.trim()) { alert('請選擇檔案並貼上歌詞！'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const blocks = content.replace(/\r\n/g, '\n').split('\n\n');
        const lyricsLines = lyricsText.split('\n').filter(l => l.trim().length > 0);
        let assLines = [];

        blocks.forEach((block, index) => {
            const lines = block.split('\n');
            if (lines.length < 3) return;

            const time = lines[1];
            const originalSrtText = lines.slice(2).join(' ');

            // 邏輯：檢查 SRT 是否包含中文字，若是，則嘗試使用對應的歌詞行
            // 如果歌詞沒了就留空，避免亂碼
            const hasChinese = /[\u4e00-\u9fa5]/.test(originalSrtText);
            const text = hasChinese ? (lyricsLines[index] || "") : originalSrtText;

            // 確保時間軸格式轉為 ASS 格式 (HH:MM:SS.ms)
            const startTime = time.split(' --> ')[0].replace(',', '.');
            const endTime = time.split(' --> ')[1].replace(',', '.');

            assLines.push(`Dialogue: 0,${startTime.substring(0, 11)},${endTime.substring(0, 11)},Default,,0,0,0,,${text}`);
        });

        // 產生檔案下載
        const fontName = document.getElementById('fontName').value;
        const fontSize = document.getElementById('fontSize').value;
        const htmlColor = document.getElementById('fontColor').value.toUpperCase();
        const assColor = `&H00${htmlColor.substring(5,7)}${htmlColor.substring(3,5)}${htmlColor.substring(1,3)}&`;

        const header = `[Script Info]\nTitle: MV Subtitle\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,${fontName},${fontSize},${assColor},&H000000FF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,2,0,2,10,10,20,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

        const blob = new Blob(["\ufeff" + header + assLines.join('\n')], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "final_subtitles.ass";
        a.click();
        URL.revokeObjectURL(url);
    };
    reader.readAsText(file);
});