document.getElementById('processBtn').addEventListener('click', function() {
    const file = document.getElementById('srtFile').files[0];
    const lyricsText = document.getElementById('lyricsInput').value;
    if (!file || !lyricsText.trim()) { alert('請選擇檔案並貼上歌詞！'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const blocks = content.split('\n\n');
        const lyricsLines = lyricsText.split('\n').filter(l => l.trim().length > 0);
        let assLines = [];

        // 核心：直接用時間軸輸出，並將歌詞依序填入
        blocks.forEach((block, index) => {
            const lines = block.split('\n');
            if (lines.length < 3) return;
            const time = lines[1];
            // 取對應行數的歌詞，如果歌詞沒了就留空
            const text = lyricsLines[index] || lines.slice(2).join(' ');
            assLines.push(`Dialogue: 0,${time.replace(/ --> /g, ',').substring(0, 21).replace(/,/g,'.')},Default,,0,0,0,,${text}`);
        });

        // 產生檔案下載
        const header = `[Script Info]\nTitle: MV Subtitle\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,微軟正黑體,24,&H00FFFFFF&,&H000000FF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,2,0,2,10,10,20,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
        const blob = new Blob(["\ufeff" + header + assLines.join('\n')], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "result.ass";
        a.click();
    };
    reader.readAsText(file);
});