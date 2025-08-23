
function cleanText(text) {
 return text
  .replace(/\u0640\u0654/g, 'ئ')
        .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u06DD-\u06DE\u06E9-\u06ECﰀ-ﰆ]/g, '')
        // Normalize "ءا" at the beginning of a word to "أ"
.replace(/(^|[\s.,!?؛،])ءا/g, '$1أ')

        // Normalize different forms of alif to 'ا'
        .replace(/[آأإ]/g, 'ا')
        // Normalize hamza on waw and ya
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        // Normalize final ya and alif maqsoora
        .replace(/[ىے]/g, 'ي')
        // Remove repeated spaces
        .replace(/\s+/g, ' ')
      /*  .replace(/ة/g, 'ه') // توحيد التاء المربوطة
        .replace(/ؤ/g, 'و') // همزة على واو
        .replace(/ئ/g, 'ي') // همزة على ياء
       */
        .replace(/\u0670/g, 'ا') // ألف خنجرية

        .normalize("NFKD")
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

// clean text
const preprocessedQuran = quranData.map(aya => ({
    ...aya,
    cleanedText: cleanText(aya.aya_text)
}));

function buildIndex(preprocessed) {
    const index = {};
    preprocessed.forEach(aya => {
        const words = aya.cleanedText.split(' ');
        words.forEach(word => {
            if (!index[word]) index[word] = [];
            index[word].push(aya);
        });
    });
    return index;
}

const quranIndex = buildIndex(preprocessedQuran);

/*function searchIndex(query, index) {
    const cleanQuery = cleanText(query).split(' ').filter(Boolean);
    if (!cleanQuery.length) return [];

    const results = [];

    preprocessedQuran.forEach(aya => {
        const words = aya.cleanedText.split(' ');

        let match = false;

        // Sliding window approach
        for (let i = 0; i <= words.length - cleanQuery.length; i++) {
            let allMatch = true;
            for (let j = 0; j < cleanQuery.length; j++) {
                if (!words[i + j].startsWith(cleanQuery[j])) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                match = true;
                break;
            }
        }

        if (match) results.push(aya);
    });

    return results;
}

*/
function searchIndex(query, index) {
    const cleanQuery = cleanText(query).split(' ').filter(Boolean);
    if (!cleanQuery.length) return [];

    const results = [];

    preprocessedQuran.forEach(aya => {
        const words = aya.cleanedText.split(' ');

        let match = false;

        // Sliding window approach
        for (let i = 0; i <= words.length - cleanQuery.length; i++) {
            let allMatch = true;
            for (let j = 0; j < cleanQuery.length; j++) {

                if (cleanQuery[j].length === 1) {
                   
                    if (words[i + j] !== cleanQuery[j]) {
                        allMatch = false;
                        break;
                    }
                } else {
                    
                    if (!words[i + j].startsWith(cleanQuery[j])) {
                        allMatch = false;
                        break;
                    }
                }

            }
            if (allMatch) {
                match = true;
                break;
            }
        }

        if (match) results.push(aya);
    });

    return results;
}


// red lighhhhhtttttttttt
function highlightMatchPartial(ayaText, query) {
    const queryWords = cleanText(query).split(' ').filter(Boolean);
    if (!queryWords.length) return ayaText;

    const originalWords = ayaText.split(/\s+/);
    const cleanWords = originalWords.map(cleanText);

    let result = '';
    let qIndex = 0;

    for (let i = 0; i < originalWords.length; i++) {
        if (qIndex < queryWords.length && cleanWords[i].startsWith(queryWords[qIndex])) {
            const matchLength = queryWords[qIndex].length;
            const originalWord = originalWords[i];
            let highlighted = '';
            let charCount = 0;
            for (const char of originalWord) {
                if (cleanText(char).length + charCount <= matchLength) {
                    highlighted += char;
                    charCount += cleanText(char).length;
                } else break;
            }
            result += `<span class="match">${highlighted}</span>${originalWord.slice(highlighted.length)} `;
            qIndex++;
        } else result += originalWords[i] + ' ';
    }
    return result.trim();
}

function showResults(results, query, batchSize = 20) {
    const resultsDiv = document.getElementById('results');
    const resultCount = document.getElementById('resultCount');

    resultCount.textContent = `عدد النتائج: ${results.length}`;

    if (!results.length) {
        resultsDiv.innerHTML = '<p>لا توجد نتائج</p>';
        return;
    }


    window.currentResults = results;
    window.currentQuery = query;
    window.displayedCount = 0;

    resultsDiv.innerHTML = '';
    showMore(batchSize); // أول دفعة
}
function showMore(batchSize = 20) {
    const resultsDiv = document.getElementById('results');

    const nextBatch = window.currentResults.slice(window.displayedCount, window.displayedCount + batchSize);
    const html = nextBatch.map(aya => `
        <p>
            <span class="copy-icon" onclick="copySingleAya('${aya.sura_name_ar}', '${aya.aya_no}', \`${aya.aya_text}\`)">📋</span>
            ${highlightMatchPartial('﴿'+aya.aya_text+'﴾', window.currentQuery)}
            <span class="surah">${aya.sura_name_ar} ${aya.aya_no}</span>
        </p>
    `).join('');

    resultsDiv.insertAdjacentHTML('beforeend', html);
    window.displayedCount += nextBatch.length;

    // زر عرض المزيد
    let moreBtn = document.getElementById('showMoreBtn');
    if (moreBtn) moreBtn.remove(); // نحذف القديم

    if (window.displayedCount < window.currentResults.length) {
        moreBtn = document.createElement('button');
        moreBtn.id = 'showMoreBtn';
        moreBtn.textContent = 'عرض المزيد';
        moreBtn.onclick = () => showMore(batchSize);
        resultsDiv.appendChild(moreBtn);
    }
}

/*
let debounceTimeout;
document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(debounceTimeout);
    const query = this.value.trim();
    debounceTimeout = setTimeout(() => {
        if (!query) {
            document.getElementById('results').innerHTML = '';
            document.getElementById('resultCount').textContent = '';
            return;
        }
        const results = searchIndex(query, quranIndex);
        showResults(results, query);
    }, 300);
});
/// --- your other functions (cleanText, searchIndex, showResults, etc.) above ---

*/
const suraSelect = document.getElementById('suraRange');
suraSelect.addEventListener('change', handleSearch);

const searchInput = document.getElementById('searchInput');
let debounceTimeout;
function handleSearch() {
    const query = searchInput.value.trim();
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        if (!query) {
            document.getElementById('results').innerHTML = '';
            document.getElementById('resultCount').textContent = '';
            return;
        }

        let results = searchIndex(query, quranIndex);

    
        const suraSelect = document.getElementById('suraRange');
        const selectedOptions = Array.from(suraSelect.selectedOptions).map(opt => opt.value);

        if (selectedOptions.length > 0) {
            results = results.filter(aya => {
              
                return selectedOptions.some(range => {
                    const [start, end] = range.split('-').map(Number);
                    return aya.sura_no >= start && aya.sura_no <= end;
                });
            });
        }

        showResults(results, query);
    }, 300);
}

/*
function handleSearch() {
    const query = searchInput.value.trim();
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        if (!query) {
            document.getElementById('results').innerHTML = '';
            document.getElementById('resultCount').textContent = '';
            return;
        }
        const results = searchIndex(query, quranIndex);
        showResults(results, query);
    }, 300);
}*/

// Use input and keyup for mobile responsiveness
searchInput.addEventListener('input', handleSearch);
searchInput.addEventListener('keyup', handleSearch);

// Also compositionend for safety (finalizing Arabic letters)
searchInput.addEventListener('compositionend', handleSearch);


// 🟢 نسخ جميع النتائج
document.getElementById('copyBtn').addEventListener('click', () => {
    if (!window.currentResults || !window.currentResults.length) {
        alert('لا توجد نتائج لنسخها');
        return;
    }
    let textToCopy = window.currentQuery + "\n";
    window.currentResults.forEach(aya => {
        textToCopy += `(${ayaText}) [${aya.sura_name_ar} ${aya.aya_no}]\n`;
    });
    const temp = document.createElement('textarea');
    temp.value = textToCopy.trim();
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    alert('تم نسخ جميع النتائج');
});

// 🟢 نسخ آية واحدة
function copySingleAya(surah, ayaNo, ayaText) {
  const textToCopy = `(${ayaText}) [${surah} ${ayaNo}]`;

    const temp = document.createElement('textarea');
    temp.value = textToCopy;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    alert(`تم نسخ: ${surah} ${ayaNo}`);
} 